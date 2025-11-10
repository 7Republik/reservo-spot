-- Añadir columna para tamaño de botones (en píxeles) a parking_groups
ALTER TABLE parking_groups 
ADD COLUMN button_size INTEGER DEFAULT 32 CHECK (button_size >= 16 AND button_size <= 64);

-- Comentario para documentación
COMMENT ON COLUMN parking_groups.button_size IS 'Tamaño de los botones de plaza en el mapa visual (16-64 píxeles)';