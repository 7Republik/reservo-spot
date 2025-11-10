-- FASE 1: Agregar columnas a la tabla profiles para gestión de usuarios
ALTER TABLE public.profiles 
ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN is_deactivated BOOLEAN DEFAULT FALSE,
ADD COLUMN blocked_reason TEXT,
ADD COLUMN blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN blocked_by UUID REFERENCES public.profiles(id),
ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deactivated_by UUID REFERENCES public.profiles(id);

-- Índices para mejorar performance
CREATE INDEX idx_profiles_is_blocked ON public.profiles(is_blocked);
CREATE INDEX idx_profiles_is_deactivated ON public.profiles(is_deactivated);

-- FASE 2: Función para validar estado del usuario
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT COALESCE(is_blocked, FALSE) 
    AND NOT COALESCE(is_deactivated, FALSE)
  FROM public.profiles
  WHERE id = _user_id;
$$;

-- FASE 3: Función para dar de baja un usuario
CREATE OR REPLACE FUNCTION public.deactivate_user(
  _user_id uuid,
  _admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el admin tiene permiso
  IF NOT public.is_admin(_admin_id) THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
  END IF;

  -- Marcar usuario como desactivado
  UPDATE public.profiles
  SET 
    is_deactivated = TRUE,
    deactivated_at = NOW(),
    deactivated_by = _admin_id
  WHERE id = _user_id;

  -- Desactivar todas las matrículas del usuario
  UPDATE public.license_plates
  SET is_approved = FALSE
  WHERE user_id = _user_id;
END;
$$;

-- FASE 4: Función para reactivar un usuario
CREATE OR REPLACE FUNCTION public.reactivate_user(
  _user_id uuid,
  _admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el admin tiene permiso
  IF NOT public.is_admin(_admin_id) THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
  END IF;

  -- Reactivar usuario
  UPDATE public.profiles
  SET 
    is_deactivated = FALSE,
    deactivated_at = NULL,
    deactivated_by = NULL
  WHERE id = _user_id;
END;
$$;

-- FASE 5: Función para borrar completamente un usuario
CREATE OR REPLACE FUNCTION public.permanently_delete_user(
  _user_id uuid,
  _admin_id uuid,
  _password_confirmation text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el admin tiene permiso
  IF NOT public.is_admin(_admin_id) THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
  END IF;

  -- Verificar contraseña de confirmación
  IF _password_confirmation != '12345678' THEN
    RAISE EXCEPTION 'Contraseña de confirmación incorrecta';
  END IF;

  -- Borrar en orden para evitar errores de foreign key
  
  -- 1. Borrar asignaciones de grupos
  DELETE FROM public.user_group_assignments WHERE user_id = _user_id;
  
  -- 2. Borrar reportes de incidentes
  DELETE FROM public.incident_reports WHERE reporter_id = _user_id;
  DELETE FROM public.incident_reports WHERE reservation_id IN (
    SELECT id FROM public.reservations WHERE user_id = _user_id
  );
  
  -- 3. Borrar reservas
  DELETE FROM public.reservations WHERE user_id = _user_id;
  
  -- 4. Borrar matrículas
  DELETE FROM public.license_plates WHERE user_id = _user_id;
  
  -- 5. Borrar roles
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- 6. Borrar perfil
  DELETE FROM public.profiles WHERE id = _user_id;
  
  -- 7. Borrar del auth.users (Supabase Auth)
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- FASE 6: Actualizar RLS policies para bloquear usuarios inactivos

-- Reservations: Solo usuarios activos pueden crear
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
CREATE POLICY "Users can create reservations" ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_user_active(auth.uid())
);

-- Reservations: Solo usuarios activos pueden cancelar
DROP POLICY IF EXISTS "Users can cancel their own reservations" ON public.reservations;
CREATE POLICY "Users can cancel their own reservations" ON public.reservations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status = 'active'
  AND public.is_user_active(auth.uid())
);

-- License Plates: Solo usuarios activos pueden insertar
DROP POLICY IF EXISTS "Users can insert their own license plates" ON public.license_plates;
CREATE POLICY "Users can insert their own license plates" ON public.license_plates
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND is_approved = false
  AND public.is_user_active(auth.uid())
);

-- Incident Reports: Solo usuarios activos pueden crear
DROP POLICY IF EXISTS "Users can create incident reports" ON public.incident_reports;
CREATE POLICY "Users can create incident reports" ON public.incident_reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reporter_id
  AND public.is_user_active(auth.uid())
);

-- FASE 7: Constraint para matrículas únicas activas
CREATE UNIQUE INDEX idx_unique_active_plate 
ON public.license_plates(plate_number) 
WHERE is_approved = TRUE;