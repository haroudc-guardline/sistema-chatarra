CREATE TABLE stock_exits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('vehicle','ac_unit','tool')),
  item_id BIGINT NOT NULL,
  location_id BIGINT NOT NULL REFERENCES locations(id),
  tipo_salida TEXT NOT NULL CHECK (tipo_salida IN ('Venta','Donación','Traspaso','Permuta','Subasta','Descarte')),
  valor_venta NUMERIC(12,2),
  descripcion TEXT,
  fecha_salida DATE NOT NULL DEFAULT CURRENT_DATE,
  responsable_nombre TEXT,
  responsable_telefono TEXT,
  responsable_email TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_stock_exits_item ON stock_exits(item_type, item_id);
CREATE INDEX idx_stock_exits_location ON stock_exits(location_id);
CREATE INDEX idx_stock_exits_tipo ON stock_exits(tipo_salida);

CREATE TRIGGER update_stock_exits_updated_at BEFORE UPDATE ON stock_exits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER audit_stock_exits_trigger AFTER INSERT OR UPDATE OR DELETE ON stock_exits FOR EACH ROW EXECUTE FUNCTION create_audit_log();

ALTER TABLE stock_exits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_exits viewable by authenticated" ON stock_exits FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_exits writable by admin/operador" ON stock_exits FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin', 'operador')));
