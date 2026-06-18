import Link from "next/link";
import { getNavItems, isNavActive } from "@/lib/nav";
import { logout } from "@/app/(auth)/login/actions";
import ThemeToggle from "./ThemeToggle";
import type { Rol } from "@/lib/types/database";

const rolLabel: Record<Rol, string> = {
  admin: "Administradora",
  superadmin: "Superadmin",
  seguridad: "Seguridad",
  residente: "Residente",
};

interface SidebarProps {
  rol: Rol;
  nombre: string | null;
  pathname: string;
}

export default function Sidebar({ rol, nombre, pathname }: SidebarProps) {
  const items = getNavItems(rol);

  return (
    <aside
      className="sidebar"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        left: 0,
        position: "fixed",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <img
          src="/legacy/assets/bon-desti-logo.png"
          alt="Bon Desti"
          className="sidebar-logo-img"
        />
        <h1>Bon Desti</h1>
        <p>Control de accesos</p>
      </div>

      {/* Nav items */}
      <nav className="nav" style={{ flex: 1 }}>
        {items.map((item) => {
          const active = isNavActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? " active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              <span className="nav-icon"><i className={`ti ${item.icon}`} /></span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ color: "var(--text2)", fontSize: 12, marginBottom: 2 }}>
          {nombre ?? "—"}
        </div>
        <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 10, textTransform: "capitalize" }}>
          {rolLabel[rol]}
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
          <form action={logout} style={{ flex: 1 }}>
            <button type="submit" className="btn btn-sm" style={{ width: "100%" }}>
              Salir
            </button>
          </form>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
