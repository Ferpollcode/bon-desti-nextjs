-- Residentes pueden reportar emergencias desde el portal
-- Solo pueden insertar rows donde reportado_por = su propio uid
CREATE POLICY "Residente reporta emergencia"
  ON emergencias
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_rol() = 'residente'
    AND reportado_por = auth.uid()
  );
