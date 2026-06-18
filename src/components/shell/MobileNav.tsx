import Link from "next/link";
import { getMobileNavItems, isNavActive } from "@/lib/nav";
import type { Rol } from "@/lib/types/database";

interface MobileNavProps {
  rol: Rol;
  pathname: string;
}

export default function MobileNav({ rol, pathname }: MobileNavProps) {
  const items = getMobileNavItems(rol);

  return (
    <nav
      className="mobile-nav"
      style={{
        background: "var(--surface)",
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
      <div style={{ display: "flex", height: 58 }}>
        {items.map((item) => {
          const active = isNavActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                alignItems: "center",
                color: active ? "var(--accent)" : "var(--text3)",
                display: "flex",
                flex: 1,
                flexDirection: "column",
                fontSize: 10,
                gap: 2,
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 20 }} />
              {item.mobileLabel ?? item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
