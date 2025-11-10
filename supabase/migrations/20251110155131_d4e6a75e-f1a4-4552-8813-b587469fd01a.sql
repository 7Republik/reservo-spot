-- =====================================================
-- PARTE B - FASE 1: Sistema Visual de Gestión de Plazas
-- =====================================================

-- 1. Crear tabla parking_groups
CREATE TABLE public.parking_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 0,
  floor_plan_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE parking_groups IS 'Grupos de plazas de parking (ej: Planta -1, Zona Norte)';
COMMENT ON COLUMN parking_groups.floor_plan_url IS 'URL de la imagen del plano desde Supabase Storage';
COMMENT ON COLUMN parking_groups.capacity IS 'Número total de plazas en este grupo';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_parking_groups_updated_at
  BEFORE UPDATE ON public.parking_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para parking_groups
ALTER TABLE public.parking_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active parking groups"
  ON public.parking_groups
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage parking groups"
  ON public.parking_groups
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 2. Modificar tabla parking_spots
ALTER TABLE public.parking_spots
ADD COLUMN group_id UUID REFERENCES public.parking_groups(id) ON DELETE SET NULL,
ADD COLUMN position_x NUMERIC(5,2),
ADD COLUMN position_y NUMERIC(5,2),
ADD COLUMN visual_size TEXT DEFAULT 'medium' CHECK (visual_size IN ('small', 'medium', 'large')),
ADD COLUMN is_accessible BOOLEAN DEFAULT FALSE,
ADD COLUMN has_charger BOOLEAN DEFAULT FALSE,
ADD COLUMN is_compact BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN parking_spots.group_id IS 'Grupo al que pertenece la plaza';
COMMENT ON COLUMN parking_spots.position_x IS 'Posición X en el plano (porcentaje 0-100)';
COMMENT ON COLUMN parking_spots.position_y IS 'Posición Y en el plano (porcentaje 0-100)';
COMMENT ON COLUMN parking_spots.is_accessible IS 'Plaza reservada para personas con movilidad reducida';
COMMENT ON COLUMN parking_spots.has_charger IS 'Plaza equipada con cargador eléctrico';
COMMENT ON COLUMN parking_spots.is_compact IS 'Plaza reducida (solo aviso informativo)';

CREATE INDEX idx_parking_spots_group_id ON public.parking_spots(group_id);

-- 3. Migración de datos existentes
INSERT INTO public.parking_groups (name, description, capacity, is_active)
VALUES ('General', 'Grupo por defecto para plazas existentes', 
        (SELECT COUNT(*) FROM public.parking_spots WHERE is_active = TRUE), 
        TRUE);

UPDATE public.parking_spots
SET group_id = (SELECT id FROM public.parking_groups WHERE name = 'General' LIMIT 1)
WHERE group_id IS NULL;

-- 4. Crear tabla user_group_assignments
CREATE TABLE public.user_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.parking_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

COMMENT ON TABLE user_group_assignments IS 'Asignación de usuarios a grupos de parking';

CREATE INDEX idx_user_group_assignments_user ON user_group_assignments(user_id);
CREATE INDEX idx_user_group_assignments_group ON user_group_assignments(group_id);

-- RLS Policies para user_group_assignments
ALTER TABLE public.user_group_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own group assignments"
  ON public.user_group_assignments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage group assignments"
  ON public.user_group_assignments
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 5. Crear Storage Bucket para planos
INSERT INTO storage.buckets (id, name, public)
VALUES ('floor-plans', 'floor-plans', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Admins can upload floor plans"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'floor-plans' AND
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can update floor plans"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'floor-plans' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete floor plans"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'floor-plans' AND is_admin(auth.uid()));

CREATE POLICY "Anyone can view floor plans"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'floor-plans');

-- 6. Función de validación de reservas
CREATE OR REPLACE FUNCTION public.validate_parking_spot_reservation(
  _user_id UUID,
  _spot_id UUID,
  _reservation_date DATE
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_code TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spot RECORD;
  v_user_plate_id UUID;
BEGIN
  -- Obtener información de la plaza
  SELECT ps.*, pg.name as group_name
  INTO v_spot
  FROM parking_spots ps
  LEFT JOIN parking_groups pg ON ps.group_id = pg.id
  WHERE ps.id = _spot_id;

  -- Validación 1: Plaza existe y está activa
  IF NOT FOUND OR v_spot.is_active = FALSE THEN
    RETURN QUERY SELECT FALSE, 'SPOT_NOT_AVAILABLE', 'Esta plaza no está disponible';
    RETURN;
  END IF;

  -- Validación 2: Plaza no está ya reservada
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE spot_id = _spot_id
    AND reservation_date = _reservation_date
    AND status = 'active'
  ) THEN
    RETURN QUERY SELECT FALSE, 'SPOT_ALREADY_RESERVED', 'Esta plaza ya está reservada para este día';
    RETURN;
  END IF;

  -- Obtener la matrícula activa del usuario
  SELECT id INTO v_user_plate_id
  FROM license_plates
  WHERE user_id = _user_id
  AND is_approved = TRUE
  ORDER BY approved_at DESC
  LIMIT 1;

  -- Validación 3: Usuario tiene matrícula aprobada
  IF v_user_plate_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'NO_APPROVED_PLATE', 'No tienes ninguna matrícula aprobada';
    RETURN;
  END IF;

  -- Validación 4: Plaza accesible requiere permiso vigente
  IF v_spot.is_accessible = TRUE THEN
    IF NOT has_valid_disability_permit(v_user_plate_id) THEN
      RETURN QUERY SELECT FALSE, 'REQUIRES_DISABILITY_PERMIT', 
        'Esta plaza requiere permiso de movilidad reducida vigente';
      RETURN;
    END IF;
  END IF;

  -- Validación 5: Plaza con cargador requiere permiso vigente
  IF v_spot.has_charger = TRUE THEN
    IF NOT has_valid_electric_permit(v_user_plate_id) THEN
      RETURN QUERY SELECT FALSE, 'REQUIRES_ELECTRIC_PERMIT', 
        'Esta plaza requiere permiso de vehículo eléctrico vigente';
      RETURN;
    END IF;
  END IF;

  -- Validación 6: Plaza reducida (advertencia)
  IF v_spot.is_compact = TRUE THEN
    RETURN QUERY SELECT TRUE, 'COMPACT_SPOT_WARNING', 
      '⚠️ Esta plaza es de tamaño reducido';
    RETURN;
  END IF;

  -- Validación 7: Acceso al grupo
  IF v_spot.group_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_group_assignments
      WHERE user_id = _user_id
      AND group_id = v_spot.group_id
    ) AND v_spot.group_name != 'General' THEN
      RETURN QUERY SELECT FALSE, 'NO_GROUP_ACCESS', 
        'No tienes acceso a este grupo de plazas';
      RETURN;
    END IF;
  END IF;

  -- Todo OK
  RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION validate_parking_spot_reservation IS 
  'Valida si un usuario puede reservar una plaza según permisos y atributos';

-- 7. Función auxiliar para obtener plazas disponibles
CREATE OR REPLACE FUNCTION public.get_available_spots_by_group(
  _group_id UUID,
  _date DATE
)
RETURNS TABLE (
  spot_id UUID,
  spot_number TEXT,
  is_accessible BOOLEAN,
  has_charger BOOLEAN,
  is_compact BOOLEAN,
  position_x NUMERIC,
  position_y NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ps.id,
    ps.spot_number,
    ps.is_accessible,
    ps.has_charger,
    ps.is_compact,
    ps.position_x,
    ps.position_y
  FROM parking_spots ps
  WHERE ps.group_id = _group_id
  AND ps.is_active = TRUE
  AND ps.id NOT IN (
    SELECT spot_id FROM reservations
    WHERE reservation_date = _date
    AND status = 'active'
  )
  ORDER BY ps.spot_number;
$$;

-- 8. Actualizar RLS policies de parking_spots
DROP POLICY IF EXISTS "Everyone can view active parking spots" ON public.parking_spots;

CREATE POLICY "Users can view spots from their assigned groups"
  ON public.parking_spots
  FOR SELECT
  USING (
    is_active = TRUE AND (
      group_id IN (SELECT id FROM parking_groups WHERE name = 'General')
      OR
      group_id IN (
        SELECT group_id FROM user_group_assignments WHERE user_id = auth.uid()
      )
    )
  );