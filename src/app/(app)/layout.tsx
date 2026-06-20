import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/shell/AppShell";
import EmergenciaAlerta from "./emergencias/EmergenciaAlerta";
import type { Rol } from "@/lib/types/database";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Rol desde app_metadata (sincronizado por trigger, sin query extra al proxy)
  const rol = ((user.app_metadata?.rol as string) || "seguridad") as Rol;

  // Nombre opcional para mostrar en sidebar
  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", user.id)
    .single();

  return (
    <AppShell rol={rol} nombre={profile?.nombre ?? null}>
      <EmergenciaAlerta />
      {children}
    </AppShell>
  );
}
