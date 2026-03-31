-- ============================================================
-- Migration: stock_items
-- Date: 2026-03-31
-- Description: Materiales en Stock - Vehículos, Aires Acondicionados,
--              Herramientas Eléctricas + fotos compartidas
-- ============================================================

-- stock_vehicles
CREATE TABLE IF NOT EXISTS stock_vehicles (
  id BIGSERIAL PRIMARY KEY,
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER NOT NULL CHECK (anio BETWEEN 1900 AND 2100),
  placa TEXT NOT NULL,
  numero_motor TEXT,
  numero_chasis TEXT,
  color TEXT,
  tipo_combustible TEXT CHECK (tipo_combustible IN ('Gasolina','Diesel','Eléctrico','Híbrido','GLP')),
  tipo_vehiculo TEXT CHECK (tipo_vehiculo IN ('Sedan','Camioneta','SUV','Bus','Camión','Motocicleta','Van','Otro')),
  numero_poliza TEXT,
  fecha_vencimiento_poliza DATE,
  fecha_revisado DATE,
  frecuencia_mantenimiento TEXT CHECK (frecuencia_mantenimiento IN ('Mensual','Trimestral','Semestral','Anual')),
  ubicacion_nombre TEXT,
  ubicacion_direccion TEXT,
  ubicacion_municipio TEXT,
  ubicacion_parroquia TEXT,
  estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','En reparación','Fuera de servicio','Dado de baja')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- stock_ac_units
CREATE TABLE IF NOT EXISTS stock_ac_units (
  id BIGSERIAL PRIMARY KEY,
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  numero_serie TEXT,
  capacidad_btu INTEGER,
  tipo_ac TEXT CHECK (tipo_ac IN ('Split','Central','Ventana','Portátil','Mini Split','Otro')),
  fecha_instalacion DATE,
  fecha_ultimo_mantenimiento DATE,
  frecuencia_mantenimiento TEXT CHECK (frecuencia_mantenimiento IN ('Mensual','Trimestral','Semestral','Anual')),
  ubicacion_nombre TEXT,
  ubicacion_direccion TEXT,
  ubicacion_municipio TEXT,
  ubicacion_parroquia TEXT,
  estado TEXT NOT NULL DEFAULT 'Operativo' CHECK (estado IN ('Operativo','En reparación','Fuera de servicio','Dado de baja')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- stock_tools
CREATE TABLE IF NOT EXISTS stock_tools (
  id BIGSERIAL PRIMARY KEY,
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  tipo_herramienta TEXT CHECK (tipo_herramienta IN ('Taladro','Sierra','Esmeriladora','Compresor','Soldadora','Lijadora','Generador','Otro')),
  voltaje TEXT,
  potencia_watts INTEGER,
  fecha_adquisicion DATE,
  fecha_ultimo_mantenimiento DATE,
  frecuencia_mantenimiento TEXT CHECK (frecuencia_mantenimiento IN ('Mensual','Trimestral','Semestral','Anual')),
  ubicacion_nombre TEXT,
  ubicacion_direccion TEXT,
  ubicacion_municipio TEXT,
  ubicacion_parroquia TEXT,
  estado TEXT NOT NULL DEFAULT 'Operativo' CHECK (estado IN ('Operativo','En reparación','Fuera de servicio','Dado de baja')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Shared photos table for all stock categories
CREATE TABLE IF NOT EXISTS stock_item_photos (
  id BIGSERIAL PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('vehicle','ac_unit','tool')),
  item_id BIGINT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_vehicles_location ON stock_vehicles(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_vehicles_estado ON stock_vehicles(estado);
CREATE INDEX IF NOT EXISTS idx_stock_vehicles_placa ON stock_vehicles(placa);
CREATE INDEX IF NOT EXISTS idx_stock_ac_location ON stock_ac_units(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_ac_estado ON stock_ac_units(estado);
CREATE INDEX IF NOT EXISTS idx_stock_tools_location ON stock_tools(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_tools_estado ON stock_tools(estado);
CREATE INDEX IF NOT EXISTS idx_stock_photos_item ON stock_item_photos(item_type, item_id);

-- updated_at triggers
CREATE TRIGGER update_stock_vehicles_updated_at BEFORE UPDATE ON stock_vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_ac_units_updated_at BEFORE UPDATE ON stock_ac_units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_tools_updated_at BEFORE UPDATE ON stock_tools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE stock_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ac_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_item_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock vehicles viewable by authenticated" ON stock_vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and operadores can manage stock vehicles" ON stock_vehicles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')));

CREATE POLICY "Stock ac viewable by authenticated" ON stock_ac_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and operadores can manage stock ac" ON stock_ac_units FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')));

CREATE POLICY "Stock tools viewable by authenticated" ON stock_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and operadores can manage stock tools" ON stock_tools FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')));

CREATE POLICY "Stock photos viewable by authenticated" ON stock_item_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and operadores can manage stock photos" ON stock_item_photos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')));

-- Storage bucket: stock-item-photos (run in SQL editor if not already created)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('stock-item-photos', 'stock-item-photos', false) ON CONFLICT (id) DO NOTHING;
