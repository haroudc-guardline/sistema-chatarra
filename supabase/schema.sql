-- ============================================
-- Sistema de Administración de Residuos y Chatarra - Panamá
-- Database Schema
-- ============================================

-- 1. CUSTOM TYPES
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'operador', 'viewer');
CREATE TYPE IF NOT EXISTS audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'BULK_CREATE', 'LOGIN', 'LOGOUT');

-- ============================================
-- 2. TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol user_role NOT NULL DEFAULT 'viewer',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  nombre_institucion TEXT NOT NULL,
  direccion TEXT NOT NULL,
  latitud DECIMAL(10,8) NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud DECIMAL(11,8) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  ciudad TEXT NOT NULL,
  municipio TEXT NOT NULL,
  corregimiento TEXT,
  volumen DECIMAL(12,2) NOT NULL CHECK (volumen >= 0),
  peso_estimado DECIMAL(12,2) NOT NULL CHECK (peso_estimado >= 0),
  costo_valor DECIMAL(12,2) NOT NULL CHECK (costo_valor >= 0),
  contacto_responsable TEXT NOT NULL,
  nombre_responsable TEXT NOT NULL,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Waste types catalog
CREATE TABLE IF NOT EXISTS waste_types (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  categoria TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location-Waste types junction table
CREATE TABLE IF NOT EXISTS location_waste_types (
  id BIGSERIAL PRIMARY KEY,
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  waste_type_id BIGINT NOT NULL REFERENCES waste_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, waste_type_id)
);

-- Location documents
CREATE TABLE IF NOT EXISTS location_documents (
  id BIGSERIAL PRIMARY KEY,
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES
-- ============================================

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_ciudad ON locations(ciudad);
CREATE INDEX IF NOT EXISTS idx_locations_municipio ON locations(municipio);
CREATE INDEX IF NOT EXISTS idx_locations_created_by ON locations(created_by);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations USING gist(point(longitud, latitud));

-- Location waste types indexes
CREATE INDEX IF NOT EXISTS idx_lwt_location ON location_waste_types(location_id);
CREATE INDEX IF NOT EXISTS idx_lwt_waste ON location_waste_types(waste_type_id);

-- Documents index
CREATE INDEX IF NOT EXISTS idx_docs_location ON location_documents(location_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_waste_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users" 
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Only admins can insert profiles" 
  ON profiles FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Only admins can delete profiles" 
  ON profiles FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'));

-- Locations policies
CREATE POLICY "Locations are viewable by authenticated users" 
  ON locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and operadores can create locations" 
  ON locations FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));

CREATE POLICY "Admins and operadores can update locations" 
  ON locations FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));

CREATE POLICY "Only admins can delete locations" 
  ON locations FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'));

-- Waste types policies (read-only catalog for most users)
CREATE POLICY "Waste types are viewable by authenticated users" 
  ON waste_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage waste types" 
  ON waste_types FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'));

-- Location waste types policies
CREATE POLICY "Location waste types are viewable by authenticated users" 
  ON location_waste_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and operadores can manage location waste types" 
  ON location_waste_types FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));

-- Documents policies
CREATE POLICY "Documents are viewable by authenticated users" 
  ON location_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and operadores can manage documents" 
  ON location_documents FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));

-- Audit logs policies (admin only)
CREATE POLICY "Only admins can view audit logs" 
  ON audit_logs FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "System can insert audit logs" 
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- 5. TRIGGERS & FUNCTIONS
-- ============================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to locations
CREATE TRIGGER update_locations_updated_at 
  BEFORE UPDATE ON locations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_old_data := null;
    v_new_data := to_jsonb(NEW);
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (auth.uid(), 'CREATE', TG_TABLE_NAME, NEW.id, v_old_data, v_new_data);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, v_old_data, v_new_data);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := null;
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, v_old_data, v_new_data);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to locations
CREATE TRIGGER audit_locations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON locations
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Apply audit trigger to profiles
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ============================================
-- 6. SEED DATA
-- ============================================

INSERT INTO waste_types (nombre, descripcion, categoria) VALUES
('Chatarra metálica ferrosa', 'Metales con hierro: acero, hierro fundido', 'Metales'),
('Chatarra metálica no ferrosa', 'Aluminio, cobre, latón, bronce, zinc', 'Metales'),
('Residuos electrónicos', 'Computadoras, celulares, equipos electrónicos', 'Electrónicos'),
('Electrodomésticos', 'Refrigeradores, lavadoras, aires acondicionados', 'Electrónicos'),
('Baterías', 'Baterías de vehículos, industriales, portátiles', 'Peligrosos'),
('Aceites usados', 'Aceites lubricantes, hidráulicos', 'Peligrosos'),
('Plásticos industriales', 'Plásticos de desecho industrial', 'Plásticos'),
('Madera y pallets', 'Madera de construcción, pallets, muebles', 'Orgánicos'),
('Papel y cartón', 'Papel de oficina, cartón, periódicos', 'Papel'),
('Vidrio', 'Botellas, ventanas, vidrio industrial', 'Vidrio'),
('Neumáticos', 'Llantas y caucho usado', 'Caucho'),
('Residuos de construcción', 'Escombros, concreto, ladrillos', 'Construcción')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- 7. STORAGE BUCKET
-- ============================================

-- Create documents bucket (run this in Storage section or SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies (run these in Storage SQL editor)
-- CREATE POLICY "Authenticated users can view documents" 
--   ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');

-- CREATE POLICY "Admins and operadores can upload documents" 
--   ON storage.objects FOR INSERT TO authenticated 
--   WITH CHECK (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));

-- CREATE POLICY "Admins and operadores can delete documents" 
--   ON storage.objects FOR DELETE TO authenticated 
--   USING (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));
