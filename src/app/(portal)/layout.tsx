import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/portal/PortalShell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Nombre opcional — el proxy ya garantizó que solo residentes llegan aquí
  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", user.id)
    .single();

  const { data: residentes } = await supabase
    .from("residentes")
    .select("id")
    .eq("profile_id", user.id)
    .eq("activo", true);
  const residenteIds = (residentes ?? []).map((residente) => residente.id);
  const comunicacionesQuery = supabase
    .from("comunicaciones")
    .select("*", { count: "exact", head: true });

  const { count: notificaciones } =
    residenteIds.length > 0
      ? await comunicacionesQuery.or(
          `destinatario_tipo.eq.todos,residente_id.in.(${residenteIds.join(",")})`,
        )
      : await comunicacionesQuery.eq("destinatario_tipo", "todos");

  return (
    <PortalShell
      nombre={profile?.nombre ?? null}
      notificaciones={notificaciones ?? 0}
    >
      {children}
    </PortalShell>
  );
}
