"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toEmail } from "@/lib/utils/auth";

export async function login(formData: FormData) {
  const usuario = formData.get("usuario") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(usuario),
    password,
  });

  if (error) {
    redirect(`/login?error=Usuario+o+contraseña+incorrectos`);
  }

  redirect(redirectTo || "/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
