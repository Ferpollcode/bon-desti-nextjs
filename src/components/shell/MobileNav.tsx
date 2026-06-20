"use client";

import { useState } from "react";
import Link from "next/link";
import { getNavItems, isNavActive } from "@/lib/nav";
import { logout } from "@/app/(auth)/login/actions";
import type { Rol } from "@/lib/types/database";

interface MobileNavProps {
  rol: Rol;
  nombre: string | null;
  pathname: string;
}

const PRIMARY_COUNT = 4;

export default function MobileNav({ rol, nombre, pathname }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const allItems = getNavItems(rol);
  const primary = allItems.slice(0, PRIMARY_COUNT);
  const secondary = allItems.slice(PRIMARY_COUNT);

  const navItemStyle = (active: boolean) => ({
    alignItems: "center" as const,
    color: active ? "var(--accent-text)" : "var(--text3)",
    display: "flex",
    flex: 1,
    flexDirection: "column" as const,
    fontSize: 10,
    fontWeight: active ? 700 : 400,
    gap: 3,
    justifyContent: "center",
    textDecoration: "none",
  });

  return (
    <>
      {/* Overlay + panel "Más" */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            background: "rgba(0,0,0,0.55)",
            bottom: 0,
            left: 0,
            position: "fixed",
            right: 0,
            top: 0,
            zIndex: 110,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(180deg, rgba(9,22,40,0.99), rgba(7,17,31,0.99))",
              borderTop: "1px solid var(--border)",
              bottom: 61,
              left: 0,
              padding: "16px 16px 8px",
              position: "absolute",
              right: 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gap: 4,
                gridTemplateColumns: "repeat(3, 1fr)",
                marginBottom: 8,
              }}
            >
              {secondary.map((item) => {
                const active = isNavActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={{
                      alignItems: "center",
                      borderRadius: 10,
                      color: active ? "var(--accent-text)" : "var(--text2)",
                      display: "flex",
                      flexDirection: "column",
                      fontSize: 11,
                      fontWeight: active ? 700 : 400,
                      gap: 6,
                      justifyContent: "center",
                      padding: "12px 8px",
                      textDecoration: "none",
                      background: active ? "rgba(118,247,194,0.08)" : "rgba(255,255,255,0.04)",
                    }}
                  >
                    <i className={`ti ${item.icon}`} style={{ fontSize: 22 }} />
                    {item.mobileLabel ?? item.label}
                  </Link>
                );
              })}
            </div>

            <form action={logout} style={{ width: "100%" }}>
              <button
                type="submit"
                style={{
                  alignItems: "center",
                  background: "rgba(255,255,255,0.04)",
                  border: "none",
                  borderRadius: 10,
                  color: "var(--text3)",
                  cursor: "pointer",
                  display: "flex",
                  fontSize: 11,
                  gap: 8,
                  padding: "10px 16px",
                  width: "100%",
                }}
              >
                <i className="ti ti-logout" style={{ fontSize: 18 }} />
                Cerrar sesión {nombre ? `(${nombre})` : ""}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom bar */}
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
          zIndex: 120,
        }}
      >
        <div style={{ display: "flex", height: 60, alignItems: "stretch" }}>
          {primary.map((item) => {
            const active = isNavActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={navItemStyle(active)}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 22 }} />
                {item.mobileLabel ?? item.label}
              </Link>
            );
          })}

          {/* Botón Más */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              ...navItemStyle(open),
              background: "none",
              border: "none",
              color: open ? "var(--accent-text)" : "var(--text3)",
              cursor: "pointer",
              flex: 1,
            }}
          >
            <i className={`ti ${open ? "ti-x" : "ti-grid-dots"}`} style={{ fontSize: 22 }} />
            {open ? "Cerrar" : "Más"}
          </button>
        </div>
      </nav>
    </>
  );
}
