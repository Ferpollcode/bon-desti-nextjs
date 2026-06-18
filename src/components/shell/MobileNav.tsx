import Link from "next/link";
import { getMobileNavItems, isNavActive } from "@/lib/nav";
import { logout } from "@/app/(auth)/login/actions";
import type { Rol } from "@/lib/types/database";

interface MobileNavProps {
  rol: Rol;
  nombre: string | null;
  pathname: string;
}

export default function MobileNav({ rol, nombre, pathname }: MobileNavProps) {
  const items = getMobileNavItems(rol);

  return (
    <nav
      className="mobile-nav"
      style={{
        background: "linear-gradient(180deg, rgba(9,22,40,0.98), rgba(7,17,31,0.98))",
        borderTop: "1px solid var(--border)",
        bottom: 0,
        display: "none",
        left: 0,
        paddingBottom: "env(safe-area-inset-bottom)",
        position: "fixed",
        right: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", height: 60, alignItems: "stretch" }}>
        {items.map((item) => {
          const active = isNavActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                alignItems: "center",
                color: active ? "var(--accent-text)" : "var(--text3)",
                display: "flex",
                flex: 1,
                flexDirection: "column",
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                gap: 3,
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 22 }} />
              {item.mobileLabel ?? item.label}
            </Link>
          );
        })}

        {/* Logout */}
        <form
          action={logout}
          style={{ display: "flex", flex: 1 }}
          title={nombre ?? undefined}
        >
          <button
            type="submit"
            style={{
              alignItems: "center",
              background: "none",
              border: "none",
              color: "var(--text3)",
              cursor: "pointer",
              display: "flex",
              flex: 1,
              flexDirection: "column",
              fontSize: 10,
              gap: 3,
              justifyContent: "center",
            }}
          >
            <i className="ti ti-logout" style={{ fontSize: 22 }} />
            Salir
          </button>
        </form>
      </div>
    </nav>
  );
}
