-- Seguridad debe tener el mismo acceso operativo que admin.

alter policy "Admin ve todos los perfiles"
  on profiles
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin actualiza cualquier perfil"
  on profiles
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
  with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin modifica lotes"
  on lotes
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
  with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin modifica residentes"
  on residentes
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
  with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin modifica vehiculos"
  on vehiculos
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
  with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin modifica visitantes"
  on visitantes
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
  with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin elimina visitantes"
  on visitantes
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin elimina ingresos"
  on ingresos
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin elimina emergencias"
  on emergencias
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin gestiona pases"
  on pases_qr
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
  with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin gestiona obras"
  on obras
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
  with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin gestiona personal de obra"
  on personal_obra
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
  with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

alter policy "Admin ve audit logs"
  on audit_logs
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));
