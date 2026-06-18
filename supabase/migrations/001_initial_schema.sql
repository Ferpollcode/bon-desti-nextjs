  -- Bon Desti Access - Schema inicial
  -- Ejecutar en Supabase SQL Editor o via CLI

  -- ============================================================
  -- TABLAS
  -- ============================================================

  -- Profiles extiende auth.users (se crea automaticamente al registrarse)
  create table if not exists profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    rol text not null check (rol in ('admin', 'seguridad', 'residente', 'superadmin')) default 'residente',
    nombre text,
    apellido text,
    telefono text,
    activo boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Lotes del barrio
  create table if not exists lotes (
    id uuid primary key default gen_random_uuid(),
    numero text not null unique,
    estado text not null check (estado in ('ocupado', 'disponible', 'en_obra', 'sin_datos')) default 'sin_datos',
    observaciones text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Residentes del barrio
  create table if not exists residentes (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    apellido text not null,
    dni text,
    telefono text,
    email text,
    lote_id uuid references lotes(id) on delete set null,
    tipo text not null check (tipo in ('propietario', 'inquilino')) default 'propietario',
    activo boolean not null default true,
    profile_id uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Vehiculos de residentes
  create table if not exists vehiculos (
    id uuid primary key default gen_random_uuid(),
    residente_id uuid not null references residentes(id) on delete cascade,
    patente text not null,
    marca text,
    modelo text,
    color text,
    activo boolean not null default true,
    created_at timestamptz not null default now()
  );

  -- Visitantes
  create table if not exists visitantes (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    apellido text not null,
    documento text,
    patente text,
    lote_id uuid references lotes(id) on delete set null,
    residente_id uuid references residentes(id) on delete set null,
    observaciones text,
    created_at timestamptz not null default now()
  );

  -- Ingresos y egresos
  create table if not exists ingresos (
    id uuid primary key default gen_random_uuid(),
    tipo text not null check (tipo in ('residente', 'visitante', 'personal_obra', 'qr')),
    residente_id uuid references residentes(id) on delete set null,
    visitante_id uuid references visitantes(id) on delete set null,
    lote_id uuid references lotes(id) on delete set null,
    patente text,
    notas text,
    registrado_por uuid references profiles(id) on delete set null,
    ingresado_at timestamptz not null default now(),
    egresado_at timestamptz,
    created_at timestamptz not null default now()
  );

  -- Emergencias
  create table if not exists emergencias (
    id uuid primary key default gen_random_uuid(),
    descripcion text not null,
    estado text not null check (estado in ('activa', 'en_proceso', 'resuelta', 'eliminada')) default 'activa',
    lote_id uuid references lotes(id) on delete set null,
    reportado_por uuid references profiles(id) on delete set null,
    atendido_por uuid references profiles(id) on delete set null,
    resuelto_at timestamptz,
    deleted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Pases QR
  create table if not exists pases_qr (
    id uuid primary key default gen_random_uuid(),
    residente_id uuid not null references residentes(id) on delete cascade,
    token text not null unique default encode(gen_random_bytes(32), 'hex'),
    tipo text not null check (tipo in ('permanente', 'temporal', 'unico_uso')) default 'temporal',
    descripcion text,
    activo boolean not null default true,
    vence_at timestamptz,
    usado_at timestamptz,
    created_at timestamptz not null default now()
  );

  -- Obras en lotes
  create table if not exists obras (
    id uuid primary key default gen_random_uuid(),
    lote_id uuid not null references lotes(id) on delete cascade,
    descripcion text not null,
    responsable text,
    inicio date,
    fin_estimado date,
    estado text not null check (estado in ('pendiente', 'activa', 'finalizada', 'suspendida')) default 'pendiente',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Personal de obras
  create table if not exists personal_obra (
    id uuid primary key default gen_random_uuid(),
    obra_id uuid not null references obras(id) on delete cascade,
    nombre text not null,
    apellido text not null,
    dni text,
    horario_inicio time,
    horario_fin time,
    activo boolean not null default true,
    created_at timestamptz not null default now()
  );

  -- Audit logs (inmutable)
  create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references profiles(id) on delete set null,
    rol text,
    accion text not null,
    entidad text not null,
    entidad_id text,
    detalle text,
    valores_anteriores jsonb,
    valores_nuevos jsonb,
    ip_address text,
    created_at timestamptz not null default now()
  );

  -- ============================================================
  -- ROW LEVEL SECURITY
  -- ============================================================

  alter table profiles enable row level security;
  alter table lotes enable row level security;
  alter table residentes enable row level security;
  alter table vehiculos enable row level security;
  alter table visitantes enable row level security;
  alter table ingresos enable row level security;
  alter table emergencias enable row level security;
  alter table pases_qr enable row level security;
  alter table obras enable row level security;
  alter table personal_obra enable row level security;
  alter table audit_logs enable row level security;

  -- ============================================================
  -- FUNCIONES AUXILIARES
  -- ============================================================

  -- Retorna el rol del usuario autenticado actual
  create or replace function get_user_rol()
  returns text
  language sql
  security invoker
  stable
  set search_path = ''
  as $$
    select rol from public.profiles where id = (select auth.uid())
  $$;

  -- ============================================================
  -- TRIGGER: crear profile al registrarse
  -- ============================================================

  create or replace function handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
  as $$
  begin
    insert into public.profiles (id, rol)
    values (new.id, 'residente');
    return new;
  end;
  $$;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

  -- ============================================================
  -- TRIGGER: updated_at automatico
  -- ============================================================

  create or replace function update_updated_at()
  returns trigger
  language plpgsql
  security invoker
  set search_path = ''
  as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;

  create trigger update_profiles_updated_at
    before update on profiles
    for each row execute function update_updated_at();

  create trigger update_lotes_updated_at
    before update on lotes
    for each row execute function update_updated_at();

  create trigger update_residentes_updated_at
    before update on residentes
    for each row execute function update_updated_at();

  create trigger update_emergencias_updated_at
    before update on emergencias
    for each row execute function update_updated_at();

  create trigger update_obras_updated_at
    before update on obras
    for each row execute function update_updated_at();

  -- ============================================================
  -- POLITICAS RLS
  -- ============================================================

  -- Profiles
  create policy "Ver propio perfil"
    on profiles for select to authenticated
    using ((select auth.uid()) = id);

  create policy "Admin ve todos los perfiles"
    on profiles for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin'));

  create policy "Usuario actualiza su propio perfil"
    on profiles for update to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

  create policy "Admin actualiza cualquier perfil"
    on profiles for update to authenticated
    using (get_user_rol() in ('admin', 'superadmin'))
    with check (get_user_rol() in ('admin', 'superadmin'));

  -- Lotes
  create policy "Staff ve todos los lotes"
    on lotes for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Residente ve su lote"
    on lotes for select to authenticated
    using (
      exists (
        select 1 from residentes r
        where r.lote_id = lotes.id
          and r.profile_id = (select auth.uid())
          and r.activo = true
      )
    );

  create policy "Admin modifica lotes"
    on lotes for all to authenticated
    using (get_user_rol() in ('admin', 'superadmin'))
    with check (get_user_rol() in ('admin', 'superadmin'));

  -- Residentes
  create policy "Staff ve todos los residentes"
    on residentes for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Residente se ve a si mismo"
    on residentes for select to authenticated
    using (profile_id = (select auth.uid()));

  create policy "Admin modifica residentes"
    on residentes for all to authenticated
    using (get_user_rol() in ('admin', 'superadmin'))
    with check (get_user_rol() in ('admin', 'superadmin'));

  -- Vehiculos
  create policy "Staff ve todos los vehiculos"
    on vehiculos for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Residente ve sus vehiculos"
    on vehiculos for select to authenticated
    using (
      exists (
        select 1 from residentes r
        where r.id = vehiculos.residente_id
          and r.profile_id = (select auth.uid())
      )
    );

  create policy "Admin modifica vehiculos"
    on vehiculos for all to authenticated
    using (get_user_rol() in ('admin', 'superadmin'))
    with check (get_user_rol() in ('admin', 'superadmin'));

  -- Visitantes
  create policy "Staff ve todos los visitantes"
    on visitantes for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Seguridad y admin insertan visitantes"
    on visitantes for insert to authenticated
    with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Admin modifica visitantes"
    on visitantes for update to authenticated
    using (get_user_rol() in ('admin', 'superadmin'))
    with check (get_user_rol() in ('admin', 'superadmin'));

  create policy "Admin elimina visitantes"
    on visitantes for delete to authenticated
    using (get_user_rol() in ('admin', 'superadmin'));

  -- Ingresos
  create policy "Staff ve todos los ingresos"
    on ingresos for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Residente ve sus ingresos"
    on ingresos for select to authenticated
    using (
      residente_id in (
        select id from residentes where profile_id = (select auth.uid())
      )
    );

  create policy "Seguridad y admin registran ingresos"
    on ingresos for insert to authenticated
    with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Seguridad y admin actualizan ingresos"
    on ingresos for update to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
    with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Admin elimina ingresos"
    on ingresos for delete to authenticated
    using (get_user_rol() in ('admin', 'superadmin'));

  -- Emergencias
  create policy "Staff ve emergencias"
    on emergencias for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Seguridad y admin crean emergencias"
    on emergencias for insert to authenticated
    with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Seguridad y admin actualizan emergencias"
    on emergencias for update to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'))
    with check (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Admin elimina emergencias"
    on emergencias for delete to authenticated
    using (get_user_rol() in ('admin', 'superadmin'));

  -- Pases QR
  create policy "Staff ve todos los pases"
    on pases_qr for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Residente ve sus pases"
    on pases_qr for select to authenticated
    using (
      residente_id in (
        select id from residentes where profile_id = (select auth.uid())
      )
    );

  create policy "Admin gestiona pases"
    on pases_qr for all to authenticated
    using (get_user_rol() in ('admin', 'superadmin'))
    with check (get_user_rol() in ('admin', 'superadmin'));

  -- Obras
  create policy "Staff ve obras"
    on obras for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Admin gestiona obras"
    on obras for all to authenticated
    using (get_user_rol() in ('admin', 'superadmin'))
    with check (get_user_rol() in ('admin', 'superadmin'));

  -- Personal de obra
  create policy "Staff ve personal de obra"
    on personal_obra for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin', 'seguridad'));

  create policy "Admin gestiona personal de obra"
    on personal_obra for all to authenticated
    using (get_user_rol() in ('admin', 'superadmin'))
    with check (get_user_rol() in ('admin', 'superadmin'));

  -- Audit logs
  create policy "Admin ve audit logs"
    on audit_logs for select to authenticated
    using (get_user_rol() in ('admin', 'superadmin'));

  create policy "Autenticados insertan audit logs"
    on audit_logs for insert to authenticated
    with check (true);
