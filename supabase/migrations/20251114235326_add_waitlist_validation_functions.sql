-- =====================================================
-- FUNCIONES DE VALIDACIÓN Y UTILIDADES - LISTA DE ESPERA
-- =====================================================
-- Migración que crea funciones SQL para validación y utilidades
-- del sistema de lista de espera de RESERVEO
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN: get_waitlist_settings()
-- =====================================================
-- Obtiene la configuración actual del sistema de lista de espera
-- Retorna un registro con todos los parámetros configurables

CREATE OR REPLACE FUNCTION public.get_waitlist_settings()
RETURNS TABLE (
  waitlist_enabled BOOLEAN,
  acceptance_time_minutes INTEGER,
  max_simultaneous INTEGER,
  priority_by_role BOOLEAN,
  penalty_enabled BOOLEAN,
  penalty_threshold INTEGER,
  penalty_duration_days INTEGER
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    rs.waitlist_enabled,
    rs.waitlist_acceptance_time_minutes,
    rs.waitlist_max_simultaneous,
    rs.waitlist_priority_by_role,
    rs.waitlist_penalty_enabled,
    rs.waitlist_penalty_threshold,
    rs.waitlist_penalty_duration_days
  FROM public.reservation_settings rs
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_waitlist_settings() IS 
  'Obtiene la configuración actual del sistema de lista de espera';

-- =====================================================
-- 2. FUNCIÓN: check_user_waitlist_limit()
-- =====================================================
-- Verifica si un usuario ha alcanzado el límite de listas simultáneas
-- Retorna TRUE si puede registrarse, FALSE si excede el límite

CREATE OR REPLACE FUNCTION public.check_user_waitlist_limit(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_max_allowed INTEGER;
BEGIN
  -- Obtener límite configurado
  SELECT waitlist_max_simultaneous INTO v_max_allowed
  FROM public.reservation_settings
  LIMIT 1;
  
  -- Contar entradas activas del usuario
  SELECT COUNT(*) INTO v_current_count
  FROM public.waitlist_entries
  WHERE user_id = p_user_id
    AND status IN ('active', 'offer_pending');
  
  -- Retornar TRUE si no excede el límite
  RETURN v_current_count < v_max_allowed;
END;
$$;

COMMENT ON FUNCTION public.check_user_waitlist_limit(UUID) IS 
  'Verifica si un usuario puede registrarse en más listas de espera (no excede límite)';

-- =====================================================
-- 3. FUNCIÓN: check_user_penalty_status()
-- =====================================================
-- Verifica si un usuario está bloqueado por penalización
-- Retorna un registro con información del estado de penalización

CREATE OR REPLACE FUNCTION public.check_user_penalty_status(
  p_user_id UUID
)
RETURNS TABLE (
  is_blocked BOOLEAN,
  blocked_until TIMESTAMPTZ,
  rejection_count INTEGER,
  no_response_count INTEGER,
  can_register BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_penalty_record RECORD;
  v_penalty_enabled BOOLEAN;
BEGIN
  -- Verificar si el sistema de penalización está habilitado
  SELECT rs.waitlist_penalty_enabled INTO v_penalty_enabled
  FROM public.reservation_settings rs
  LIMIT 1;
  
  -- Si no está habilitado, el usuario puede registrarse
  IF NOT v_penalty_enabled THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN as is_blocked,
      NULL::TIMESTAMPTZ as blocked_until,
      0::INTEGER as rejection_count,
      0::INTEGER as no_response_count,
      TRUE::BOOLEAN as can_register;
    RETURN;
  END IF;
  
  -- Buscar registro de penalización del usuario
  SELECT * INTO v_penalty_record
  FROM public.waitlist_penalties
  WHERE user_id = p_user_id;
  
  -- Si no existe registro, el usuario puede registrarse
  IF v_penalty_record IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN as is_blocked,
      NULL::TIMESTAMPTZ as blocked_until,
      0::INTEGER as rejection_count,
      0::INTEGER as no_response_count,
      TRUE::BOOLEAN as can_register;
    RETURN;
  END IF;
  
  -- Si está bloqueado pero el bloqueo ya expiró, actualizar y permitir
  IF v_penalty_record.is_blocked AND v_penalty_record.blocked_until < NOW() THEN
    UPDATE public.waitlist_penalties
    SET is_blocked = FALSE,
        blocked_until = NULL,
        rejection_count = 0,
        no_response_count = 0,
        last_reset_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT 
      FALSE::BOOLEAN as is_blocked,
      NULL::TIMESTAMPTZ as blocked_until,
      0::INTEGER as rejection_count,
      0::INTEGER as no_response_count,
      TRUE::BOOLEAN as can_register;
    RETURN;
  END IF;
  
  -- Retornar estado actual
  RETURN QUERY SELECT 
    v_penalty_record.is_blocked,
    v_penalty_record.blocked_until,
    v_penalty_record.rejection_count,
    v_penalty_record.no_response_count,
    NOT v_penalty_record.is_blocked as can_register;
END;
$$;

COMMENT ON FUNCTION public.check_user_penalty_status(UUID) IS 
  'Verifica el estado de penalización de un usuario y si puede registrarse en lista de espera';

-- =====================================================
-- 4. FUNCIÓN: calculate_waitlist_position()
-- =====================================================
-- Calcula la posición de un usuario en la cola de espera
-- Considera prioridad por roles si está habilitada

CREATE OR REPLACE FUNCTION public.calculate_waitlist_position(
  p_entry_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_priority_enabled BOOLEAN;
  v_position INTEGER;
BEGIN
  -- Obtener información de la entrada
  SELECT we.*, ur.role
  INTO v_entry
  FROM public.waitlist_entries we
  LEFT JOIN public.user_roles ur ON ur.user_id = we.user_id
  WHERE we.id = p_entry_id;
  
  -- Si no existe la entrada, retornar NULL
  IF v_entry IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verificar si la prioridad por roles está habilitada
  SELECT rs.waitlist_priority_by_role INTO v_priority_enabled
  FROM public.reservation_settings rs
  LIMIT 1;
  
  -- Calcular posición según configuración
  IF v_priority_enabled THEN
    -- Con prioridad por roles: ordenar por prioridad de rol y luego por timestamp
    SELECT COUNT(*) + 1 INTO v_position
    FROM public.waitlist_entries we
    LEFT JOIN public.user_roles ur ON ur.user_id = we.user_id
    WHERE we.group_id = v_entry.group_id
      AND we.reservation_date = v_entry.reservation_date
      AND we.status = 'active'
      AND (
        -- Usuarios con mayor prioridad (número más alto)
        public.get_user_role_priority(we.user_id) > public.get_user_role_priority(v_entry.user_id)
        OR (
          -- Misma prioridad pero registrado antes
          public.get_user_role_priority(we.user_id) = public.get_user_role_priority(v_entry.user_id)
          AND we.created_at < v_entry.created_at
        )
      );
  ELSE
    -- Sin prioridad: solo por timestamp (FIFO)
    SELECT COUNT(*) + 1 INTO v_position
    FROM public.waitlist_entries we
    WHERE we.group_id = v_entry.group_id
      AND we.reservation_date = v_entry.reservation_date
      AND we.status = 'active'
      AND we.created_at < v_entry.created_at;
  END IF;
  
  RETURN v_position;
END;
$$;

COMMENT ON FUNCTION public.calculate_waitlist_position(UUID) IS 
  'Calcula la posición de una entrada en la cola de espera (considera prioridad por roles si está habilitada)';

-- =====================================================
-- 5. FUNCIÓN: get_next_in_waitlist()
-- =====================================================
-- Obtiene el siguiente usuario en la cola de espera para un grupo y fecha
-- Considera prioridad por roles si está habilitada
-- Valida que el usuario esté activo y tenga matrícula aprobada

CREATE OR REPLACE FUNCTION public.get_next_in_waitlist(
  p_group_id UUID,
  p_date DATE
)
RETURNS TABLE (
  entry_id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  queue_position INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_priority_enabled BOOLEAN;
  v_next_entry RECORD;
BEGIN
  -- Verificar si la prioridad por roles está habilitada
  SELECT rs.waitlist_priority_by_role INTO v_priority_enabled
  FROM public.reservation_settings rs
  LIMIT 1;
  
  -- Buscar siguiente usuario según configuración
  IF v_priority_enabled THEN
    -- Con prioridad por roles
    SELECT 
      we.id,
      we.user_id,
      au.email,
      p.full_name,
      ROW_NUMBER() OVER (
        ORDER BY 
          public.get_user_role_priority(we.user_id) DESC,
          we.created_at ASC
      ) as queue_position
    INTO v_next_entry
    FROM public.waitlist_entries we
    INNER JOIN auth.users au ON au.id = we.user_id
    INNER JOIN public.profiles p ON p.id = we.user_id
    WHERE we.group_id = p_group_id
      AND we.reservation_date = p_date
      AND we.status = 'active'
      -- Usuario debe estar activo
      AND public.is_user_active(we.user_id)
      -- Usuario debe tener matrícula aprobada
      AND EXISTS (
        SELECT 1 FROM public.license_plates lp
        WHERE lp.user_id = we.user_id
          AND lp.status = 'approved'
          AND lp.deleted_at IS NULL
      )
      -- Usuario debe tener acceso al grupo
      AND EXISTS (
        SELECT 1 FROM public.user_group_assignments uga
        WHERE uga.user_id = we.user_id
          AND uga.group_id = p_group_id
      )
    ORDER BY 
      public.get_user_role_priority(we.user_id) DESC,
      we.created_at ASC
    LIMIT 1;
  ELSE
    -- Sin prioridad: solo FIFO
    SELECT 
      we.id,
      we.user_id,
      au.email,
      p.full_name,
      ROW_NUMBER() OVER (ORDER BY we.created_at ASC) as queue_position
    INTO v_next_entry
    FROM public.waitlist_entries we
    INNER JOIN auth.users au ON au.id = we.user_id
    INNER JOIN public.profiles p ON p.id = we.user_id
    WHERE we.group_id = p_group_id
      AND we.reservation_date = p_date
      AND we.status = 'active'
      -- Usuario debe estar activo
      AND public.is_user_active(we.user_id)
      -- Usuario debe tener matrícula aprobada
      AND EXISTS (
        SELECT 1 FROM public.license_plates lp
        WHERE lp.user_id = we.user_id
          AND lp.status = 'approved'
          AND lp.deleted_at IS NULL
      )
      -- Usuario debe tener acceso al grupo
      AND EXISTS (
        SELECT 1 FROM public.user_group_assignments uga
        WHERE uga.user_id = we.user_id
          AND uga.group_id = p_group_id
      )
    ORDER BY we.created_at ASC
    LIMIT 1;
  END IF;
  
  -- Si se encontró un usuario válido, retornarlo
  IF v_next_entry IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_next_entry.id,
      v_next_entry.user_id,
      v_next_entry.email,
      v_next_entry.full_name,
      v_next_entry.queue_position::INTEGER;
  END IF;
  
  -- Si no hay nadie en la cola, no retornar nada
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.get_next_in_waitlist(UUID, DATE) IS 
  'Obtiene el siguiente usuario válido en la cola de espera para un grupo y fecha específicos';

-- =====================================================
-- 6. GRANTS DE PERMISOS
-- =====================================================
-- Otorgar permisos de ejecución a usuarios autenticados

GRANT EXECUTE ON FUNCTION public.get_waitlist_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_waitlist_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_penalty_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_waitlist_position(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_in_waitlist(UUID, DATE) TO authenticated;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
