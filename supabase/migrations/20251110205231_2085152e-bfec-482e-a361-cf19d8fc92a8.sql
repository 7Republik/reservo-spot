-- 1. Agregar columnas para soft delete
ALTER TABLE public.license_plates 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_by_user BOOLEAN DEFAULT FALSE;

-- 2. Índice para mejorar queries de matrículas activas
CREATE INDEX idx_license_plates_deleted_at ON public.license_plates(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- 3. Modificar el índice único para excluir matrículas eliminadas
DROP INDEX IF EXISTS idx_unique_active_plate;
CREATE UNIQUE INDEX idx_unique_active_plate 
ON public.license_plates(plate_number) 
WHERE is_approved = TRUE AND deleted_at IS NULL;

-- 4. Política RLS: Permitir UPDATE para soft delete
CREATE POLICY "Users can soft delete their own license plates" 
ON public.license_plates
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND public.is_user_active(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_user_active(auth.uid())
);