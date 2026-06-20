ALTER TABLE pases_qr
  ADD COLUMN IF NOT EXISTS visitante_nombre text,
  ADD COLUMN IF NOT EXISTS visitante_documento text,
  ADD COLUMN IF NOT EXISTS visitante_telefono text,
  ADD COLUMN IF NOT EXISTS motivo text,
  ADD COLUMN IF NOT EXISTS valido_desde date,
  ADD COLUMN IF NOT EXISTS hora_desde time,
  ADD COLUMN IF NOT EXISTS hora_hasta time,
  ADD COLUMN IF NOT EXISTS dias_habilitados text[] DEFAULT '{}';

-- Residente puede insertar pases temporales para sus lotes
CREATE POLICY "Residente crea pases temporales"
  ON pases_qr FOR INSERT TO authenticated
  WITH CHECK (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = auth.uid()
    )
  );
