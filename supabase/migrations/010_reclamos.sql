CREATE TABLE IF NOT EXISTS reclamos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  residente_id uuid REFERENCES residentes(id) ON DELETE SET NULL,
  destinatario text NOT NULL CHECK (destinatario IN ('administracion', 'seguridad')),
  tipo text NOT NULL CHECK (tipo IN ('denuncia', 'reclamo', 'sugerencia', 'consulta')),
  asunto text NOT NULL,
  mensaje text NOT NULL,
  estado text NOT NULL CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto')) DEFAULT 'pendiente',
  respuesta text,
  atendido_por uuid REFERENCES profiles(id) ON DELETE SET NULL,
  atendido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reclamos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_reclamos_updated_at
  BEFORE UPDATE ON reclamos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE POLICY "Residente ve sus reclamos"
  ON reclamos FOR SELECT TO authenticated
  USING (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = (select auth.uid())
    )
  );

CREATE POLICY "Residente crea reclamos"
  ON reclamos FOR INSERT TO authenticated
  WITH CHECK (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = (select auth.uid())
    )
  );

CREATE POLICY "Admin ve todos los reclamos"
  ON reclamos FOR SELECT TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'rol'), '') IN ('admin', 'superadmin')
  );

CREATE POLICY "Admin actualiza reclamos"
  ON reclamos FOR UPDATE TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'rol'), '') IN ('admin', 'superadmin')
  )
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'rol'), '') IN ('admin', 'superadmin')
  );
