-- =====================================================================================
-- CLEANUP EXPIRED WAITLIST ENTRIES FUNCTION
-- =====================================================================================
-- Description: Limpia automáticamente entradas de lista de espera obsoletas
-- Called by: Cron job (diario a las 00:00)
-- Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 14.4
-- =====================================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_waitlist_entries()
RETURNS TABLE (
  total_deleted INTEGER,
  expired_dates_deleted INTEGER,
  blocked_users_deleted INTEGER,
  no_plate_deleted INTEGER,
  no_access_deleted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_dates_count INTEGER := 0;
  v_blocked_users_count INTEGER := 0;
  v_no_plate_count INTEGER := 0;
  v_no_access_count INTEGER := 0;
  v_total_count INTEGER := 0;
BEGIN
  -- =====================================================================================
  -- 1. ELIMINAR ENTRADAS CON FECHAS PASADAS
  -- =====================================================================================
  -- Requirement 12.1: Eliminar entradas con reservation_date < CURRENT_DATE
  
  WITH deleted_expired AS (
    DELETE FROM public.waitlist_entries
    WHERE reservation_date < CURRENT_DATE
    RETURNING id, user_id, group_id, reservation_date
  )
  SELECT COUNT(*) INTO v_expired_dates_count FROM deleted_expired;
  
  RAISE NOTICE 'Deleted % entries with expired dates', v_expired_dates_count;

  -- =====================================================================================
  -- 2. ELIMINAR ENTRADAS DE USUARIOS BLOQUEADOS O DESACTIVADOS
  -- =====================================================================================
  -- Requirement 12.2: Eliminar entradas de usuarios bloqueados o desactivados
  
  WITH deleted_blocked AS (
    DELETE FROM public.waitlist_entries we
    WHERE EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = we.user_id
      AND (p.is_blocked = true OR p.is_deactivated = true)
    )
    RETURNING id, user_id, group_id, reservation_date
  )
  SELECT COUNT(*) INTO v_blocked_users_count FROM deleted_blocked;
  
  RAISE NOTICE 'Deleted % entries from blocked/deactivated users', v_blocked_users_count;

  -- =====================================================================================
  -- 3. ELIMINAR ENTRADAS DE USUARIOS SIN MATRÍCULA APROBADA
  -- =====================================================================================
  -- Requirement 12.3: Eliminar entradas de usuarios sin matrícula aprobada
  
  WITH deleted_no_plate AS (
    DELETE FROM public.waitlist_entries we
    WHERE NOT EXISTS (
      SELECT 1 FROM public.license_plates lp
      WHERE lp.user_id = we.user_id
      AND lp.status = 'approved'
      AND lp.deleted_at IS NULL
    )
    RETURNING id, user_id, group_id, reservation_date
  )
  SELECT COUNT(*) INTO v_no_plate_count FROM deleted_no_plate;
  
  RAISE NOTICE 'Deleted % entries from users without approved license plate', v_no_plate_count;

  -- =====================================================================================
  -- 4. ELIMINAR ENTRADAS DE USUARIOS SIN ACCESO AL GRUPO
  -- =====================================================================================
  -- Requirement 12.4: Eliminar entradas de usuarios sin acceso al grupo
  
  WITH deleted_no_access AS (
    DELETE FROM public.waitlist_entries we
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_group_assignments uga
      WHERE uga.user_id = we.user_id
      AND uga.group_id = we.group_id
    )
    RETURNING id, user_id, group_id, reservation_date
  )
  SELECT COUNT(*) INTO v_no_access_count FROM deleted_no_access;
  
  RAISE NOTICE 'Deleted % entries from users without group access', v_no_access_count;

  -- =====================================================================================
  -- 5. CALCULAR TOTAL Y REGISTRAR EN LOGS
  -- =====================================================================================
  
  v_total_count := v_expired_dates_count + v_blocked_users_count + 
                   v_no_plate_count + v_no_access_count;

  -- Requirement 12.5, 14.4: Registrar en waitlist_logs
  IF v_total_count > 0 THEN
    INSERT INTO public.waitlist_logs (
      user_id,
      entry_id,
      offer_id,
      action,
      details,
      created_at
    ) VALUES (
      NULL, -- No hay usuario específico para limpieza automática
      NULL,
      NULL,
      'cleanup_executed',
      jsonb_build_object(
        'total_deleted', v_total_count,
        'expired_dates_deleted', v_expired_dates_count,
        'blocked_users_deleted', v_blocked_users_count,
        'no_plate_deleted', v_no_plate_count,
        'no_access_deleted', v_no_access_count,
        'executed_at', NOW()
      ),
      NOW()
    );
  END IF;

  -- =====================================================================================
  -- 6. RETORNAR RESULTADOS
  -- =====================================================================================
  
  RETURN QUERY SELECT 
    v_total_count,
    v_expired_dates_count,
    v_blocked_users_count,
    v_no_plate_count,
    v_no_access_count;

END;
$$;

-- =====================================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================================================

COMMENT ON FUNCTION public.cleanup_expired_waitlist_entries() IS 
'Limpia automáticamente entradas de lista de espera obsoletas.
Elimina:
1. Entradas con fechas pasadas (reservation_date < CURRENT_DATE)
2. Entradas de usuarios bloqueados o desactivados
3. Entradas de usuarios sin matrícula aprobada
4. Entradas de usuarios sin acceso al grupo

Retorna el número de entradas eliminadas por cada categoría.
Debe ser llamada por un cron job diario a las 00:00.

Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 14.4';

-- =====================================================================================
-- PERMISOS
-- =====================================================================================

-- Solo el sistema (via cron) puede ejecutar esta función
REVOKE ALL ON FUNCTION public.cleanup_expired_waitlist_entries() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_waitlist_entries() FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_expired_waitlist_entries() FROM anon;
