-- ============================================================
-- Migration: inmuebles_radiografia
-- Date: 2026-06-03
-- Description: "Radiografía" del patrimonio inmobiliario.
--   - stock_inmuebles: titular registral, ministerio, desglose de valores,
--     cache del avalúo vigente.
--   - inmueble_avaluos: historial de avalúos (no se borra; solo el vigente suma).
--   - inmueble_document_types + inmueble_documents: documentos con checklist.
--   - inmueble_media: fotos por categoría + video.
--   - VIEW inmueble_completitud + funciones inmueble_incidencias / search_inmuebles
--     para completitud, filtro multi-selección y radiografía.
-- NOTE: Apply via Supabase MCP / SQL editor. Idempotent (IF NOT EXISTS / DROP-CREATE).
-- ============================================================

-- ------------------------------------------------------------
-- 1.1 Columnas nuevas en stock_inmuebles
-- ------------------------------------------------------------
ALTER TABLE stock_inmuebles ADD COLUMN IF NOT EXISTS titular_nombre TEXT;
ALTER TABLE stock_inmuebles ADD COLUMN IF NOT EXISTS titular_tipo TEXT;
ALTER TABLE stock_inmuebles ADD COLUMN IF NOT EXISTS ministerio TEXT;
ALTER TABLE stock_inmuebles ADD COLUMN IF NOT EXISTS valor_terreno NUMERIC(14,2);
ALTER TABLE stock_inmuebles ADD COLUMN IF NOT EXISTS valor_catastral NUMERIC(14,2);
ALTER TABLE stock_inmuebles ADD COLUMN IF NOT EXISTS valor_mejoras NUMERIC(14,2);
ALTER TABLE stock_inmuebles ADD COLUMN IF NOT EXISTS avaluo_vigente_monto NUMERIC(14,2);
ALTER TABLE stock_inmuebles ADD COLUMN IF NOT EXISTS avaluo_vigente_fecha DATE;

DO $$ BEGIN
  ALTER TABLE stock_inmuebles
    ADD CONSTRAINT chk_inmueble_titular_tipo
    CHECK (titular_tipo IS NULL OR titular_tipo IN ('Estado','Persona natural','Persona jurídica','Ministerio'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_inmuebles_titular_tipo ON stock_inmuebles(titular_tipo);
CREATE INDEX IF NOT EXISTS idx_inmuebles_ministerio ON stock_inmuebles(ministerio);

-- ------------------------------------------------------------
-- 1.2 inmueble_avaluos (historial de avalúos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inmueble_avaluos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inmueble_id BIGINT NOT NULL REFERENCES stock_inmuebles(id) ON DELETE CASCADE,
  monto NUMERIC(14,2) NOT NULL CHECK (monto >= 0),
  fecha_avaluo DATE NOT NULL,
  anio INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM fecha_avaluo)::int) STORED,
  entidad_avaluadora TEXT,
  documento_path TEXT,
  documento_nombre TEXT,
  notas TEXT,
  es_actual BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Máximo un avalúo vigente por inmueble (garantía dura a nivel DB)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_inmueble_avaluo_actual
  ON inmueble_avaluos(inmueble_id) WHERE es_actual = true;
CREATE INDEX IF NOT EXISTS idx_inmueble_avaluos_inmueble ON inmueble_avaluos(inmueble_id);
CREATE INDEX IF NOT EXISTS idx_inmueble_avaluos_fecha ON inmueble_avaluos(inmueble_id, fecha_avaluo DESC);

-- Al marcar uno como vigente, desmarca los demás del mismo inmueble
CREATE OR REPLACE FUNCTION fn_inmueble_avaluo_set_actual()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_actual THEN
    UPDATE inmueble_avaluos
      SET es_actual = false
      WHERE inmueble_id = NEW.inmueble_id AND id <> NEW.id AND es_actual = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sincroniza el cache del avalúo vigente en stock_inmuebles
CREATE OR REPLACE FUNCTION fn_sync_inmueble_avaluo_vigente()
RETURNS TRIGGER AS $$
DECLARE
  v_inmueble_id BIGINT;
  v_monto NUMERIC(14,2);
  v_fecha DATE;
BEGIN
  v_inmueble_id := COALESCE(NEW.inmueble_id, OLD.inmueble_id);
  SELECT monto, fecha_avaluo INTO v_monto, v_fecha
    FROM inmueble_avaluos
    WHERE inmueble_id = v_inmueble_id AND es_actual = true
    LIMIT 1;
  UPDATE stock_inmuebles SET
    avaluo_vigente_monto = v_monto,
    avaluo_vigente_fecha = v_fecha,
    avaluo = CASE WHEN v_monto IS NOT NULL THEN 'Si' ELSE avaluo END
    WHERE id = v_inmueble_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inmueble_avaluo_set_actual ON inmueble_avaluos;
CREATE TRIGGER trg_inmueble_avaluo_set_actual
  BEFORE INSERT OR UPDATE OF es_actual ON inmueble_avaluos
  FOR EACH ROW EXECUTE FUNCTION fn_inmueble_avaluo_set_actual();

DROP TRIGGER IF EXISTS trg_inmueble_avaluo_sync ON inmueble_avaluos;
CREATE TRIGGER trg_inmueble_avaluo_sync
  AFTER INSERT OR UPDATE OR DELETE ON inmueble_avaluos
  FOR EACH ROW EXECUTE FUNCTION fn_sync_inmueble_avaluo_vigente();

DROP TRIGGER IF EXISTS update_inmueble_avaluos_updated_at ON inmueble_avaluos;
CREATE TRIGGER update_inmueble_avaluos_updated_at
  BEFORE UPDATE ON inmueble_avaluos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS audit_inmueble_avaluos_trigger ON inmueble_avaluos;
CREATE TRIGGER audit_inmueble_avaluos_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inmueble_avaluos
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ------------------------------------------------------------
-- 1.3 Documentos + checklist
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inmueble_document_types (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_by_user BOOLEAN NOT NULL DEFAULT false,
  is_required BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO inmueble_document_types (nombre, created_by_user, is_required, orden) VALUES
  ('Avalúo', false, true, 1),
  ('Escritura pública', false, true, 2),
  ('Plano catastral', false, true, 3),
  ('Planos arquitectónicos', false, true, 4),
  ('Documentación ANATI', false, true, 5),
  ('Documentación municipio', false, true, 6),
  ('Permiso de ocupación', false, true, 7),
  ('Documento de representante legal', false, false, 8)
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS inmueble_documents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inmueble_id BIGINT NOT NULL REFERENCES stock_inmuebles(id) ON DELETE CASCADE,
  document_type_id BIGINT NOT NULL REFERENCES inmueble_document_types(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inmueble_documents_inmueble ON inmueble_documents(inmueble_id);
CREATE INDEX IF NOT EXISTS idx_inmueble_documents_type ON inmueble_documents(inmueble_id, document_type_id);

DROP TRIGGER IF EXISTS audit_inmueble_documents_trigger ON inmueble_documents;
CREATE TRIGGER audit_inmueble_documents_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inmueble_documents
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ------------------------------------------------------------
-- 1.4 Fotos por categoría + video
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inmueble_media (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inmueble_id BIGINT NOT NULL REFERENCES stock_inmuebles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  categoria TEXT NOT NULL DEFAULT 'Otra'
    CHECK (categoria IN ('Fachada','Interiores','Áreas comunes','Pasillos','Elevadores','Vista aérea','Otra')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inmueble_media_inmueble ON inmueble_media(inmueble_id);
CREATE INDEX IF NOT EXISTS idx_inmueble_media_categoria ON inmueble_media(inmueble_id, categoria);

DROP TRIGGER IF EXISTS audit_inmueble_media_trigger ON inmueble_media;
CREATE TRIGGER audit_inmueble_media_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inmueble_media
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Migrar fotos de inmueble existentes (stock_item_photos) a inmueble_media
INSERT INTO inmueble_media (inmueble_id, media_type, categoria, file_name, file_path, file_size, mime_type, uploaded_by, created_at)
SELECT p.item_id, 'image', 'Otra', p.file_name, p.file_path, p.file_size, 'image/*', p.uploaded_by, p.created_at
FROM stock_item_photos p
WHERE p.item_type = 'inmueble'
  AND NOT EXISTS (SELECT 1 FROM inmueble_media m WHERE m.file_path = p.file_path);

-- ------------------------------------------------------------
-- 1.5 Vista de completitud
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW inmueble_completitud AS
SELECT
  i.id AS inmueble_id,
  EXISTS (SELECT 1 FROM inmueble_avaluos a WHERE a.inmueble_id = i.id AND a.es_actual) AS tiene_avaluo_vigente,
  (SELECT a.fecha_avaluo FROM inmueble_avaluos a WHERE a.inmueble_id = i.id AND a.es_actual LIMIT 1) AS fecha_avaluo_vigente,
  EXISTS (SELECT 1 FROM inmueble_documents d JOIN inmueble_document_types t ON t.id = d.document_type_id
          WHERE d.inmueble_id = i.id AND t.nombre = 'Plano catastral') AS tiene_plano_catastral,
  EXISTS (SELECT 1 FROM inmueble_documents d JOIN inmueble_document_types t ON t.id = d.document_type_id
          WHERE d.inmueble_id = i.id AND t.nombre = 'Escritura pública') AS tiene_escritura,
  EXISTS (SELECT 1 FROM inmueble_documents d JOIN inmueble_document_types t ON t.id = d.document_type_id
          WHERE d.inmueble_id = i.id AND t.nombre = 'Planos arquitectónicos') AS tiene_planos_arq,
  (i.titular_nombre IS NOT NULL AND btrim(i.titular_nombre) <> '') AS tiene_titular,
  (i.titular_tipo = 'Persona natural') AS titular_es_persona_natural,
  (i.valor_mejoras IS NOT NULL) AS tiene_valor_mejoras
FROM stock_inmuebles i;

-- ------------------------------------------------------------
-- 1.6 Incidencias por inmueble (lista de claves de incidencia)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION inmueble_incidencias(p_inmueble_id BIGINT, p_anios INT DEFAULT 3)
RETURNS text[] AS $$
  SELECT array_remove(ARRAY[
    CASE WHEN NOT c.tiene_avaluo_vigente THEN 'sin_avaluo_vigente' END,
    CASE WHEN c.tiene_avaluo_vigente AND c.fecha_avaluo_vigente < (CURRENT_DATE - make_interval(years => p_anios)) THEN 'avaluo_desactualizado' END,
    CASE WHEN NOT c.tiene_plano_catastral THEN 'sin_plano_catastral' END,
    CASE WHEN NOT c.tiene_escritura THEN 'sin_escritura' END,
    CASE WHEN NOT c.tiene_planos_arq THEN 'sin_planos_arquitectonicos' END,
    CASE WHEN NOT c.tiene_titular THEN 'sin_titular_registral' END,
    CASE WHEN c.titular_es_persona_natural THEN 'titular_persona_natural' END,
    CASE WHEN NOT c.tiene_valor_mejoras THEN 'sin_valor_mejoras' END
  ], NULL)
  FROM inmueble_completitud c WHERE c.inmueble_id = p_inmueble_id;
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------
-- 1.6b RPC de búsqueda con completitud + filtro multi-selección
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_inmuebles(
  p_inmueble_type_id BIGINT DEFAULT NULL,
  p_activo_type_id BIGINT DEFAULT NULL,
  p_avaluo TEXT DEFAULT NULL,
  p_registro TEXT DEFAULT NULL,
  p_planos TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_ciudad TEXT DEFAULT NULL,
  p_municipio TEXT DEFAULT NULL,
  p_nombre_institucion TEXT DEFAULT NULL,
  p_pendientes TEXT[] DEFAULT NULL,
  p_anios_avaluo INT DEFAULT 3,
  p_limit INT DEFAULT 25,
  p_offset INT DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT i.id, i.created_at, inmueble_incidencias(i.id, p_anios_avaluo) AS incidencias
    FROM stock_inmuebles i
    LEFT JOIN locations l ON l.id = i.location_id
    WHERE (p_inmueble_type_id IS NULL OR i.inmueble_type_id = p_inmueble_type_id)
      AND (p_activo_type_id IS NULL OR i.activo_type_id = p_activo_type_id)
      AND (p_avaluo IS NULL OR i.avaluo = p_avaluo)
      AND (p_registro IS NULL OR i.registro = p_registro)
      AND (p_planos IS NULL OR i.planos_actualizados = p_planos)
      AND (p_search IS NULL OR i.nombre ILIKE '%' || p_search || '%')
      AND (p_ciudad IS NULL OR l.ciudad ILIKE '%' || p_ciudad || '%')
      AND (p_municipio IS NULL OR l.municipio = p_municipio)
      AND (p_nombre_institucion IS NULL OR l.nombre_institucion ILIKE '%' || p_nombre_institucion || '%')
  ),
  filtered AS (
    SELECT * FROM base
    WHERE p_pendientes IS NULL
       OR array_length(p_pendientes, 1) IS NULL
       OR (incidencias && p_pendientes)
  ),
  page AS (
    SELECT f.id, f.incidencias
    FROM filtered f
    ORDER BY f.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'count', (SELECT count(*) FROM filtered),
    'data', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'nombre', i.nombre,
          'inmueble_type_id', i.inmueble_type_id,
          'activo_type_id', i.activo_type_id,
          'valor', i.valor,
          'valor_terreno', i.valor_terreno,
          'valor_catastral', i.valor_catastral,
          'valor_mejoras', i.valor_mejoras,
          'avaluo_vigente_monto', i.avaluo_vigente_monto,
          'avaluo_vigente_fecha', i.avaluo_vigente_fecha,
          'metros_cuadrados', i.metros_cuadrados,
          'avaluo', i.avaluo,
          'registro', i.registro,
          'planos_actualizados', i.planos_actualizados,
          'estado', i.estado,
          'titular_nombre', i.titular_nombre,
          'titular_tipo', i.titular_tipo,
          'ministerio', i.ministerio,
          'codigo_marbete', i.codigo_marbete,
          'created_at', i.created_at,
          'updated_at', i.updated_at,
          'inmueble_type', CASE WHEN it.id IS NOT NULL THEN jsonb_build_object('id', it.id, 'nombre', it.nombre) END,
          'activo_type', CASE WHEN av.id IS NOT NULL THEN jsonb_build_object('id', av.id, 'nombre', av.nombre) END,
          'location', CASE WHEN l.id IS NOT NULL THEN jsonb_build_object('id', l.id, 'nombre_institucion', l.nombre_institucion, 'ciudad', l.ciudad, 'municipio', l.municipio) END,
          'incidencias', to_jsonb(p.incidencias),
          'completitud', jsonb_build_object(
            'tiene_avaluo_vigente', c.tiene_avaluo_vigente,
            'fecha_avaluo_vigente', c.fecha_avaluo_vigente,
            'tiene_plano_catastral', c.tiene_plano_catastral,
            'tiene_escritura', c.tiene_escritura,
            'tiene_planos_arq', c.tiene_planos_arq,
            'tiene_titular', c.tiene_titular,
            'titular_es_persona_natural', c.titular_es_persona_natural,
            'tiene_valor_mejoras', c.tiene_valor_mejoras
          )
        )
        ORDER BY i.created_at DESC
      )
      FROM page p
      JOIN stock_inmuebles i ON i.id = p.id
      LEFT JOIN inmueble_types it ON it.id = i.inmueble_type_id
      LEFT JOIN inmueble_activo_types av ON av.id = i.activo_type_id
      LEFT JOIN locations l ON l.id = i.location_id
      LEFT JOIN inmueble_completitud c ON c.inmueble_id = i.id
    ), '[]'::jsonb)
  );
$$;

-- ------------------------------------------------------------
-- 1.6c RPC de radiografía (conteos agregados de incidencias)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION inmuebles_radiografia(
  p_inmueble_type_id BIGINT DEFAULT NULL,
  p_ciudad TEXT DEFAULT NULL,
  p_municipio TEXT DEFAULT NULL,
  p_nombre_institucion TEXT DEFAULT NULL,
  p_anios_avaluo INT DEFAULT 3
)
RETURNS jsonb
LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT i.id, i.nombre, it.nombre AS tipo, l.nombre_institucion,
           inmueble_incidencias(i.id, p_anios_avaluo) AS incidencias
    FROM stock_inmuebles i
    LEFT JOIN inmueble_types it ON it.id = i.inmueble_type_id
    LEFT JOIN locations l ON l.id = i.location_id
    WHERE (p_inmueble_type_id IS NULL OR i.inmueble_type_id = p_inmueble_type_id)
      AND (p_ciudad IS NULL OR l.ciudad ILIKE '%' || p_ciudad || '%')
      AND (p_municipio IS NULL OR l.municipio = p_municipio)
      AND (p_nombre_institucion IS NULL OR l.nombre_institucion ILIKE '%' || p_nombre_institucion || '%')
  ),
  exploded AS (
    SELECT unnest(incidencias) AS tipo_incidencia FROM base
  )
  SELECT jsonb_build_object(
    'scope', jsonb_build_object('total_inmuebles', (SELECT count(*) FROM base)),
    'incidencias_por_tipo', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('tipo', tipo_incidencia, 'count', cnt) ORDER BY cnt DESC)
      FROM (SELECT tipo_incidencia, count(*) AS cnt FROM exploded GROUP BY tipo_incidencia) g
    ), '[]'::jsonb),
    'inmuebles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', b.id, 'nombre', b.nombre, 'tipo', b.tipo,
        'nombre_institucion', b.nombre_institucion,
        'incidencias', to_jsonb(b.incidencias)
      ))
      FROM base b WHERE array_length(b.incidencias, 1) > 0
    ), '[]'::jsonb)
  );
$$;

-- ------------------------------------------------------------
-- RLS para las tablas nuevas
-- ------------------------------------------------------------
ALTER TABLE inmueble_avaluos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inmueble_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE inmueble_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inmueble_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inmueble avaluos viewable by authenticated" ON inmueble_avaluos;
CREATE POLICY "Inmueble avaluos viewable by authenticated" ON inmueble_avaluos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins and operadores can manage inmueble avaluos" ON inmueble_avaluos;
CREATE POLICY "Admins and operadores can manage inmueble avaluos" ON inmueble_avaluos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')));

DROP POLICY IF EXISTS "Inmueble document types viewable by authenticated" ON inmueble_document_types;
CREATE POLICY "Inmueble document types viewable by authenticated" ON inmueble_document_types FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins and operadores can manage inmueble document types" ON inmueble_document_types;
CREATE POLICY "Admins and operadores can manage inmueble document types" ON inmueble_document_types FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')));

DROP POLICY IF EXISTS "Inmueble documents viewable by authenticated" ON inmueble_documents;
CREATE POLICY "Inmueble documents viewable by authenticated" ON inmueble_documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins and operadores can manage inmueble documents" ON inmueble_documents;
CREATE POLICY "Admins and operadores can manage inmueble documents" ON inmueble_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')));

DROP POLICY IF EXISTS "Inmueble media viewable by authenticated" ON inmueble_media;
CREATE POLICY "Inmueble media viewable by authenticated" ON inmueble_media FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins and operadores can manage inmueble media" ON inmueble_media;
CREATE POLICY "Admins and operadores can manage inmueble media" ON inmueble_media FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')));

-- ------------------------------------------------------------
-- Storage buckets + policies
-- Buckets públicos (como waste-item-photos) para que getPublicUrl sirva los
-- archivos en el cliente. Los paths usan UUID aleatorio. Si se requiere blindar
-- documentos legales, migrar a URLs firmadas (createSignedUrl) en las rutas API.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('inmueble-documents','inmueble-documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('inmueble-media','inmueble-media', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "inmueble-docs read authenticated" ON storage.objects;
CREATE POLICY "inmueble-docs read authenticated" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('inmueble-documents','inmueble-media'));
DROP POLICY IF EXISTS "inmueble-docs manage admin operador" ON storage.objects;
CREATE POLICY "inmueble-docs manage admin operador" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('inmueble-documents','inmueble-media')
         AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')))
  WITH CHECK (bucket_id IN ('inmueble-documents','inmueble-media')
         AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('admin','operador')));

-- ------------------------------------------------------------
-- Hardening (advisors): la vista respeta el RLS del usuario que consulta,
-- y las funciones nuevas fijan search_path explícito.
-- ------------------------------------------------------------
ALTER VIEW inmueble_completitud SET (security_invoker = true);
ALTER FUNCTION fn_inmueble_avaluo_set_actual() SET search_path = public, pg_temp;
ALTER FUNCTION fn_sync_inmueble_avaluo_vigente() SET search_path = public, pg_temp;
ALTER FUNCTION inmueble_incidencias(BIGINT, INT) SET search_path = public, pg_temp;
ALTER FUNCTION search_inmuebles(BIGINT, BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], INT, INT, INT) SET search_path = public, pg_temp;
ALTER FUNCTION inmuebles_radiografia(BIGINT, TEXT, TEXT, TEXT, INT) SET search_path = public, pg_temp;
