-- La política "Staff ve emergencias" usa get_user_rol() (query a profiles),
-- que el servidor de Realtime no puede evaluar correctamente.
-- Esta política alternativa usa JWT claims directamente y habilita los eventos Realtime.
-- Las políticas SELECT se evalúan con OR, así que ambas coexisten sin problema.
CREATE POLICY "Staff ve emergencias (jwt)"
  ON emergencias FOR SELECT
  TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'rol'), '')
    IN ('admin', 'superadmin', 'seguridad')
  );
