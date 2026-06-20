-- Residentes pueden desactivar sus propios pases QR
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
