-- Residentes pueden crear visitantes (para autorizar visitas desde el portal)
CREATE POLICY "Residente autoriza visitantes"
  ON visitantes
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_rol() = 'residente');

-- Residentes ven sus propios pases QR
CREATE POLICY "Residente ve sus pases"
  ON pases_qr
  FOR SELECT
  TO authenticated
  USING (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = auth.uid()
    )
  );

-- Residentes crean pases QR para sus residentes
CREATE POLICY "Residente crea pases"
  ON pases_qr
  FOR INSERT
  TO authenticated
  WITH CHECK (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = auth.uid()
    )
  );

-- Residentes desactivan sus propios pases
CREATE POLICY "Residente desactiva sus pases"
  ON pases_qr
  FOR UPDATE
  TO authenticated
  USING (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    residente_id IN (
      SELECT id FROM residentes WHERE profile_id = auth.uid()
    )
  );
