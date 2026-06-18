import { createClient } from "@supabase/supabase-js";

// Cliente con service_role — bypasea RLS, solo usar en Server Actions/Routes.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurado");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
