-- Comunicaciones de administracion para residentes.

create table if not exists comunicaciones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensaje text not null,
  destinatario_tipo text not null check (destinatario_tipo in ('todos', 'residente')) default 'todos',
  residente_id uuid references residentes(id) on delete set null,
  creado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table comunicaciones enable row level security;

create policy "Admin ve comunicaciones"
  on comunicaciones for select to authenticated
  using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

create policy "Admin crea comunicaciones"
  on comunicaciones for insert to authenticated
  with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

create policy "Residente ve comunicaciones propias"
  on comunicaciones for select to authenticated
  using (
    destinatario_tipo = 'todos'
    or exists (
      select 1
      from residentes r
      where r.id = comunicaciones.residente_id
        and r.profile_id = (select auth.uid())
        and r.activo = true
    )
  );
