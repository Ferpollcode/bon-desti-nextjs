"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import type { Rol } from "@/lib/types/database";

interface AppShellProps {
  rol: Rol;
  nombre: string | null;
  children: React.ReactNode;
}

export default function AppShell({ rol, nombre, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Sidebar rol={rol} nombre={nombre} pathname={pathname} />
      <main className="app-main">
        <div style={{ margin: "0 auto", maxWidth: 1100 }}>
          {children}
        </div>
      </main>
      <MobileNav rol={rol} nombre={nombre} pathname={pathname} />
    </div>
  );
}
