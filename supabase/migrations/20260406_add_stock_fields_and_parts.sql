-- Migration 1: Add new fields to stock tables
ALTER TABLE stock_vehicles
  ADD COLUMN IF NOT EXISTS tipo_activo TEXT CHECK (tipo_activo IN ('Activo nuevo','Activo usado','Activo por Permuta y Donación')),
  ADD COLUMN IF NOT EXISTS valor NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS tiene_avaluo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS precio_avaluo NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS responsable_nombre TEXT,
  ADD COLUMN IF NOT EXISTS responsable_telefono TEXT,
  ADD COLUMN IF NOT EXISTS responsable_email TEXT;

ALTER TABLE stock_ac_units
  ADD COLUMN IF NOT EXISTS tipo_activo TEXT CHECK (tipo_activo IN ('Activo nuevo','Activo usado','Activo por Permuta y Donación')),
  ADD COLUMN IF NOT EXISTS valor NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS tiene_avaluo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS precio_avaluo NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS responsable_nombre TEXT,
  ADD COLUMN IF NOT EXISTS responsable_telefono TEXT,
  ADD COLUMN IF NOT EXISTS responsable_email TEXT;

ALTER TABLE stock_tools
  ADD COLUMN IF NOT EXISTS tipo_activo TEXT CHECK (tipo_activo IN ('Activo nuevo','Activo usado','Activo por Permuta y Donación')),
  ADD COLUMN IF NOT EXISTS valor NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS tiene_avaluo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS precio_avaluo NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS responsable_nombre TEXT,
  ADD COLUMN IF NOT EXISTS responsable_telefono TEXT,
  ADD COLUMN IF NOT EXISTS responsable_email TEXT;

CREATE INDEX IF NOT EXISTS idx_stock_vehicles_tipo_activo ON stock_vehicles(tipo_activo);
CREATE INDEX IF NOT EXISTS idx_stock_ac_units_tipo_activo ON stock_ac_units(tipo_activo);
CREATE INDEX IF NOT EXISTS idx_stock_tools_tipo_activo ON stock_tools(tipo_activo);

-- Migration 2: Part types catalog
CREATE TABLE part_types (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('vehicle','ac_unit','tool')),
  nombre TEXT NOT NULL,
  created_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (category, nombre)
);

ALTER TABLE part_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Part types viewable by authenticated" ON part_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and operadores can manage part types" ON part_types FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));

INSERT INTO part_types (category, nombre, created_by_user) VALUES
  ('vehicle','Chasis',false),('vehicle','Condensador',false),('vehicle','Puertas',false),
  ('vehicle','Partes eléctricas',false),('vehicle','Motor',false),('vehicle','Transmisión',false),
  ('vehicle','Radiador',false),('vehicle','Alternador',false),('vehicle','Batería',false),
  ('vehicle','Sistema de frenos',false),('vehicle','Suspensión',false),('vehicle','Sistema de escape',false),
  ('ac_unit','Compresor',false),('ac_unit','Evaporador',false),('ac_unit','Condensador',false),
  ('ac_unit','Válvula de expansión',false),('ac_unit','Motor ventilador',false),
  ('ac_unit','Tarjeta electrónica',false),('ac_unit','Filtro',false),('ac_unit','Termostato',false),
  ('tool','Motor',false),('tool','Cable',false),('tool','Carcasa',false),
  ('tool','Interruptor',false),('tool','Escobillas',false),('tool','Mandril',false),('tool','Engranajes',false);

-- Migration 3: Parts tables (Banco de Piezas)
CREATE TABLE vehicle_parts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  part_type_id BIGINT NOT NULL REFERENCES part_types(id),
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  marca TEXT, modelo TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible','En uso','Dañada','Dado de baja')),
  responsable_nombre TEXT, responsable_telefono TEXT, responsable_email TEXT,
  ubicacion_nombre TEXT, ubicacion_direccion TEXT, ubicacion_municipio TEXT,
  notas TEXT, created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ
);

CREATE TABLE ac_unit_parts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  part_type_id BIGINT NOT NULL REFERENCES part_types(id),
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  marca TEXT, modelo TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible','En uso','Dañada','Dado de baja')),
  responsable_nombre TEXT, responsable_telefono TEXT, responsable_email TEXT,
  ubicacion_nombre TEXT, ubicacion_direccion TEXT, ubicacion_municipio TEXT,
  notas TEXT, created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ
);

CREATE TABLE tool_parts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  part_type_id BIGINT NOT NULL REFERENCES part_types(id),
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  marca TEXT, modelo TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible','En uso','Dañada','Dado de baja')),
  responsable_nombre TEXT, responsable_telefono TEXT, responsable_email TEXT,
  ubicacion_nombre TEXT, ubicacion_direccion TEXT, ubicacion_municipio TEXT,
  notas TEXT, created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ
);

CREATE INDEX idx_vehicle_parts_location ON vehicle_parts(location_id);
CREATE INDEX idx_vehicle_parts_type ON vehicle_parts(part_type_id);
CREATE INDEX idx_ac_unit_parts_location ON ac_unit_parts(location_id);
CREATE INDEX idx_ac_unit_parts_type ON ac_unit_parts(part_type_id);
CREATE INDEX idx_tool_parts_location ON tool_parts(location_id);
CREATE INDEX idx_tool_parts_type ON tool_parts(part_type_id);

CREATE TRIGGER update_vehicle_parts_updated_at BEFORE UPDATE ON vehicle_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ac_unit_parts_updated_at BEFORE UPDATE ON ac_unit_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tool_parts_updated_at BEFORE UPDATE ON tool_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_vehicle_parts_trigger AFTER INSERT OR UPDATE OR DELETE ON vehicle_parts FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_ac_unit_parts_trigger AFTER INSERT OR UPDATE OR DELETE ON ac_unit_parts FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_tool_parts_trigger AFTER INSERT OR UPDATE OR DELETE ON tool_parts FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Migration 4: RLS for parts tables
ALTER TABLE vehicle_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicle_parts viewable by authenticated" ON vehicle_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicle_parts writable by admin/operador" ON vehicle_parts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));

ALTER TABLE ac_unit_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ac_unit_parts viewable by authenticated" ON ac_unit_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "ac_unit_parts writable by admin/operador" ON ac_unit_parts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));

ALTER TABLE tool_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tool_parts viewable by authenticated" ON tool_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "tool_parts writable by admin/operador" ON tool_parts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));
