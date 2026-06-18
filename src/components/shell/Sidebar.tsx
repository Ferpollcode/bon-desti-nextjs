import Link from "next/link";
import { getNavItems } from "@/lib/nav";
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
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        left: 0,
        position: "fixed",
        top: 0,
        width: 220,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          display: "grid",
          justifyItems: "center",
          padding: "20px 16px 16px",
          textAlign: "center",
        }}
      >
        <img
          src="/legacy/assets/bon-desti-logo.png"
          alt="Bon Desti"
          style={{ height: 40, marginBottom: 8, width: "auto" }}
        />
        <h1
          style={{
            color: "var(--accent)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Bon Desti
        </h1>
        <p style={{ color: "var(--text3)", fontSize: 11, marginTop: 2 }}>
          Control de accesos
        </p>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "8px 0" }}>
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                alignItems: "center",
                background: active ? "var(--accent-bg)" : "transparent",
                color: active ? "var(--accent-text)" : "var(--text2)",
                display: "flex",
                fontWeight: active ? 500 : 400,
                fontSize: 13,
                gap: 10,
                padding: "9px 16px",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 16, opacity: 0.8 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px" }}>
        <div style={{ color: "var(--text2)", fontSize: 12, marginBottom: 2 }}>
          {nombre ?? "—"}
        </div>
        <div
          style={{
            color: "var(--text3)",
            fontSize: 11,
            marginBottom: 10,
            textTransform: "capitalize",
          }}
        >
          {rolLabel[rol]}
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
          <form action={logout} style={{ flex: 1 }}>
            <button
              type="submit"
              style={{
                background: "none",
                border: "1px solid var(--border2)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text2)",
                cursor: "pointer",
                fontSize: 12,
                padding: "5px 10px",
                width: "100%",
              }}
            >
              Salir
            </button>
          </form>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
