-- Decouple locations from waste data
-- volumen, peso_estimado, costo_valor are now derived by aggregation from waste_items
ALTER TABLE locations DROP COLUMN IF EXISTS volumen;
ALTER TABLE locations DROP COLUMN IF EXISTS peso_estimado;
ALTER TABLE locations DROP COLUMN IF EXISTS costo_valor;
