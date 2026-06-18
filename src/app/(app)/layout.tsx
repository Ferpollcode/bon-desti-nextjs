import { requireAuth, getProfile } from "@/lib/dal/auth";
import AppShell from "@/components/shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const profile = await getProfile();

  return (
    <AppShell rol={profile?.rol ?? "seguridad"} nombre={profile?.nombre ?? null}>
      {children}
    </AppShell>
  );
}
