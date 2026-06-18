-- ============================================================
-- Bon Desti Access — Usuarios de prueba
-- Pegar en Supabase > SQL Editor y ejecutar.
-- Es idempotente: seguro de correr más de una vez.
-- ============================================================
--
-- Credenciales:
--   Usuario: seguridad    Contraseña: seguridad123   Rol: seguridad
--   Usuario: residente    Contraseña: residente123   Rol: residente
--   Usuario: admin        Contraseña: admin123       Rol: admin
--
-- El campo "Usuario" en el login se convierte a email:
--   seguridad  →  seguridad@bondesti.local
--   residente  →  residente@bondesti.local
--   admin      →  admin@bondesti.local
-- ============================================================

-- 1. Insertar en auth.users (solo si no existe ese email)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'seguridad@bondesti.local',
  crypt('seguridad123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}',
  false, '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'seguridad@bondesti.local'
);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated',
  'residente@bondesti.local',
  crypt('residente123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}',
  false, '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'residente@bondesti.local'
);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated', 'authenticated',
  'admin@bondesti.local',
  crypt('admin123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}',
  false, '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@bondesti.local'
);

-- 2. Ajustar roles y nombres en profiles
--    El trigger on_auth_user_created crea los profiles con rol='residente'.
--    Actualizamos al rol correcto para cada uno.
UPDATE public.profiles
SET rol = 'seguridad', nombre = 'Garita'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles
SET rol = 'residente', nombre = 'Residente Demo'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles
SET rol = 'admin', nombre = 'Administradora'
WHERE id = '33333333-3333-3333-3333-333333333333';
