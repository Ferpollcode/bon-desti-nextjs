# Layout Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el iframe legacy con un layout real en Next.js — sidebar, mobile nav, tema claro/oscuro y páginas placeholder por módulo.

**Architecture:** Route group `(app)` con layout Server Component que autentica y lee el perfil de Supabase. Shell renderizado por `AppShell` (Client Component) que compone sidebar + contenido centrado + mobile nav. Nav items filtrados por rol.

**Tech Stack:** Next.js 16 App Router, Supabase SSR, TypeScript, CSS variables (sin Tailwind en el shell para respetar el estilo del legacy), Tabler Icons (CSS font ya en `/public/legacy/assets/vendor/tabler-icons/`).

---

## Mapa de archivos

| Acción | Archivo |
|---|---|
| Crear | `src/lib/nav.ts` |
| Crear | `src/components/shell/AppShell.tsx` |
| Crear | `src/components/shell/Sidebar.tsx` |
| Crear | `src/components/shell/MobileNav.tsx` |
| Crear | `src/components/shell/ThemeToggle.tsx` |
| Crear | `src/app/(app)/layout.tsx` |
| Crear | `src/app/(app)/page.tsx` |
| Crear | `src/app/(app)/seguridad/page.tsx` |
| Crear | `src/app/(app)/residentes/page.tsx` |
| Crear | `src/app/(app)/lotes/page.tsx` |
| Crear | `src/app/(app)/visitantes/page.tsx` |
| Crear | `src/app/(app)/emergencias/page.tsx` |
| Crear | `src/app/(app)/qr/page.tsx` |
| Crear | `src/app/(app)/obras/page.tsx` |
| Crear | `src/app/(app)/auditoria/page.tsx` |
| Modificar | `src/app/globals.css` |
| Modificar | `src/app/layout.tsx` |
| Eliminar | `src/app/page.tsx` |
| Eliminar | `src/app/LegacyApp.tsx` |
| Eliminar | `src/app/(protected)/` (carpeta completa) |

---

## Task 1: CSS variables y tema

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Reemplazar `src/app/globals.css` completo:**

```css
@import "tailwindcss";

/* ── Variables: tema claro (default) ── */
:root {
  --bg: #f7f6f3;
  --surface: #ffffff;
  --surface2: #f0efe9;
  --border: #dddbd4;
  --border2: #c8c5bc;
  --text: #1a1917;
  --text2: #5a5955;
  --text3: #8a8882;
  --accent: #0f6e56;
  --accent-bg: #e1f5ee;
  --accent-text: #085041;
  --danger: #a32d2d;
  --danger-bg: #fcebeb;
  --warn: #854f0b;
  --warn-bg: #faeeda;
  --info: #185fa5;
  --info-bg: #e6f1fb;
  --radius: 10px;
  --radius-sm: 6px;
}

/* ── Variables: tema oscuro ── */
.dark {
  --bg: #07111f;
  --surface: rgba(22, 43, 70, 0.96);
  --surface2: rgba(15, 30, 55, 0.8);
  --border: rgba(255, 255, 255, 0.08);
  --border2: rgba(255, 255, 255, 0.15);
  --text: #e2eaf5;
  --text2: #94a3b8;
  --text3: #64748b;
  --accent-bg: rgba(15, 110, 86, 0.18);
  --accent-text: #6ee7b7;
  --danger-bg: rgba(163, 45, 45, 0.2);
  --warn-bg: rgba(133, 79, 11, 0.2);
  --info-bg: rgba(24, 95, 165, 0.2);
}

@theme inline {
  --font-sans: var(--font-inter);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { background: var(--bg); }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  min-height: 100vh;
}

/* ── Layout del shell ── */
.app-main {
  margin-left: 220px;
  padding: 24px;
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .sidebar { display: none !important; }
  .mobile-nav { display: block !important; }
  .app-main {
    margin-left: 0 !important;
    padding: 16px 16px calc(58px + env(safe-area-inset-bottom));
  }
}
```

- [ ] **Actualizar `src/app/layout.tsx` — agregar script de tema y Tabler Icons:**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bon Desti Access",
  description: "Sistema de accesos, seguridad y administracion para Bon Desti.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="stylesheet" href="/legacy/assets/vendor/tabler-icons/tabler-icons.min.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('gd_theme')==='dark')document.documentElement.classList.add('dark')}catch{}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Verificar TypeScript:**
```
npx tsc --noEmit
```
Sin errores.

- [ ] **Commit:**
```
git add src/app/globals.css src/app/layout.tsx
git commit -m "Agrega CSS variables y sistema de tema claro/oscuro"
```

---

## Task 2: Config de navegación

**Files:**
- Create: `src/lib/nav.ts`

- [ ] **Crear `src/lib/nav.ts`:**

```ts
import type { Rol } from "@/lib/types/database";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  mobileLabel?: string;
}

const navByRol: Record<Rol, NavItem[]> = {
  seguridad: [
    { href: "/", label: "Principal", icon: "ti-home", mobileLabel: "Inicio" },
    { href: "/seguridad", label: "Ingresos", icon: "ti-door-enter" },
    { href: "/visitantes", label: "Visitantes", icon: "ti-user-check" },
    { href: "/emergencias", label: "Emergencias", icon: "ti-alert-triangle" },
    { href: "/qr", label: "Escaner QR", icon: "ti-qrcode", mobileLabel: "QR" },
  ],
  admin: [
    { href: "/", label: "Principal", icon: "ti-home", mobileLabel: "Inicio" },
    { href: "/residentes", label: "Residentes", icon: "ti-users" },
    { href: "/lotes", label: "Lotes", icon: "ti-building-community" },
    { href: "/seguridad", label: "Ingresos", icon: "ti-door-enter" },
    { href: "/visitantes", label: "Visitantes", icon: "ti-user-check" },
    { href: "/emergencias", label: "Emergencias", icon: "ti-alert-triangle" },
    { href: "/qr", label: "QR / Pases", icon: "ti-qrcode", mobileLabel: "QR" },
    { href: "/obras", label: "Obras", icon: "ti-tool" },
    { href: "/auditoria", label: "Auditoría", icon: "ti-clipboard-list" },
  ],
  superadmin: [
    { href: "/", label: "Principal", icon: "ti-home", mobileLabel: "Inicio" },
    { href: "/residentes", label: "Residentes", icon: "ti-users" },
    { href: "/lotes", label: "Lotes", icon: "ti-building-community" },
    { href: "/seguridad", label: "Ingresos", icon: "ti-door-enter" },
    { href: "/visitantes", label: "Visitantes", icon: "ti-user-check" },
    { href: "/emergencias", label: "Emergencias", icon: "ti-alert-triangle" },
    { href: "/qr", label: "QR / Pases", icon: "ti-qrcode", mobileLabel: "QR" },
    { href: "/obras", label: "Obras", icon: "ti-tool" },
    { href: "/auditoria", label: "Auditoría", icon: "ti-clipboard-list" },
  ],
  residente: [
    { href: "/", label: "Mi Lote", icon: "ti-home", mobileLabel: "Mi Lote" },
    { href: "/visitantes", label: "Mis Visitas", icon: "ti-user-check", mobileLabel: "Visitas" },
    { href: "/qr", label: "Mi QR", icon: "ti-qrcode", mobileLabel: "QR" },
    { href: "/emergencias", label: "Emergencias", icon: "ti-alert-triangle" },
  ],
};

export function getNavItems(rol: Rol): NavItem[] {
  return navByRol[rol] ?? navByRol.seguridad;
}

export function getMobileNavItems(rol: Rol): NavItem[] {
  return getNavItems(rol).slice(0, 5);
}
```

- [ ] **Verificar TypeScript:**
```
npx tsc --noEmit
```

- [ ] **Commit:**
```
git add src/lib/nav.ts
git commit -m "Agrega config de navegacion por rol"
```

---

## Task 3: Componentes del shell

**Files:**
- Create: `src/components/shell/ThemeToggle.tsx`
- Create: `src/components/shell/Sidebar.tsx`
- Create: `src/components/shell/MobileNav.tsx`
- Create: `src/components/shell/AppShell.tsx`

- [ ] **Crear `src/components/shell/ThemeToggle.tsx`:**

```tsx
"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("gd_theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Tema claro" : "Tema oscuro"}
      style={{
        background: "none",
        border: "1px solid var(--border2)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text2)",
        cursor: "pointer",
        fontSize: 14,
        lineHeight: 1,
        padding: "5px 8px",
      }}
    >
      <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} />
    </button>
  );
}
```

- [ ] **Crear `src/components/shell/Sidebar.tsx`:**

```tsx
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
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
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
```

- [ ] **Crear `src/components/shell/MobileNav.tsx`:**

```tsx
import Link from "next/link";
import { getMobileNavItems } from "@/lib/nav";
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
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
```

- [ ] **Crear `src/components/shell/AppShell.tsx`:**

```tsx
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
      <MobileNav rol={rol} pathname={pathname} />
    </div>
  );
}
```

- [ ] **Verificar TypeScript:**
```
npx tsc --noEmit
```

- [ ] **Commit:**
```
git add src/components/shell/
git commit -m "Agrega componentes del shell: Sidebar, MobileNav, ThemeToggle, AppShell"
```

---

## Task 4: Layout del grupo (app)

**Files:**
- Create: `src/app/(app)/layout.tsx`

- [ ] **Crear `src/app/(app)/layout.tsx`:**

```tsx
import { requireAuth } from "@/lib/dal/auth";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/shell/AppShell";
import type { Profile } from "@/lib/types/database";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data as Profile | null;
  }

  return (
    <AppShell rol={profile?.rol ?? "seguridad"} nombre={profile?.nombre ?? null}>
      {children}
    </AppShell>
  );
}
```

- [ ] **Verificar TypeScript:**
```
npx tsc --noEmit
```

- [ ] **Commit:**
```
git add src/app/(app)/layout.tsx
git commit -m "Agrega layout autenticado del grupo (app)"
```

---

## Task 5: Páginas placeholder

**Files:**
- Create: `src/app/(app)/page.tsx`
- Create: `src/app/(app)/seguridad/page.tsx`
- Create: `src/app/(app)/residentes/page.tsx`
- Create: `src/app/(app)/lotes/page.tsx`
- Create: `src/app/(app)/visitantes/page.tsx`
- Create: `src/app/(app)/emergencias/page.tsx`
- Create: `src/app/(app)/qr/page.tsx`
- Create: `src/app/(app)/obras/page.tsx`
- Create: `src/app/(app)/auditoria/page.tsx`

Cada página sigue esta estructura. El `title` y `sub` cambian por página.

- [ ] **Crear `src/app/(app)/page.tsx`:**

```tsx
export default function PrincipalPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 500 }}>
          Panel principal
        </h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>
          Resumen del día
        </p>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14 }}>En construcción.</p>
    </div>
  );
}
```

- [ ] **Crear `src/app/(app)/seguridad/page.tsx`:**

```tsx
export default function SeguridadPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 500 }}>Ingresos</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>
          Registro de ingresos y egresos
        </p>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14 }}>En construcción.</p>
    </div>
  );
}
```

- [ ] **Crear `src/app/(app)/residentes/page.tsx`:**

```tsx
export default function ResidentesPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 500 }}>Residentes</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>
          Gestión de residentes del barrio
        </p>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14 }}>En construcción.</p>
    </div>
  );
}
```

- [ ] **Crear `src/app/(app)/lotes/page.tsx`:**

```tsx
export default function LotesPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 500 }}>Lotes</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>
          Estado y gestión de los 66 lotes
        </p>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14 }}>En construcción.</p>
    </div>
  );
}
```

- [ ] **Crear `src/app/(app)/visitantes/page.tsx`:**

```tsx
export default function VisitantesPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 500 }}>Visitantes</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>
          Registro y control de visitantes
        </p>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14 }}>En construcción.</p>
    </div>
  );
}
```

- [ ] **Crear `src/app/(app)/emergencias/page.tsx`:**

```tsx
export default function EmergenciasPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 500 }}>Emergencias</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>
          Registro y seguimiento de emergencias
        </p>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14 }}>En construcción.</p>
    </div>
  );
}
```

- [ ] **Crear `src/app/(app)/qr/page.tsx`:**

```tsx
export default function QrPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 500 }}>QR / Pases</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>
          Generación y validación de pases QR
        </p>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14 }}>En construcción.</p>
    </div>
  );
}
```

- [ ] **Crear `src/app/(app)/obras/page.tsx`:**

```tsx
export default function ObrasPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 500 }}>Obras</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>
          Obras en curso y personal autorizado
        </p>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14 }}>En construcción.</p>
    </div>
  );
}
```

- [ ] **Crear `src/app/(app)/auditoria/page.tsx`:**

```tsx
export default function AuditoriaPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "var(--text)", fontSize: 20, fontWeight: 500 }}>Auditoría</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>
          Historial de acciones del sistema
        </p>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 14 }}>En construcción.</p>
    </div>
  );
}
```

- [ ] **Verificar TypeScript:**
```
npx tsc --noEmit
```

- [ ] **Commit:**
```
git add src/app/(app)/
git commit -m "Agrega paginas placeholder para todos los modulos"
```

---

## Task 6: Limpieza del legacy

**Files:**
- Delete: `src/app/page.tsx`
- Delete: `src/app/LegacyApp.tsx`
- Delete: `src/app/(protected)/` (carpeta completa)
- Modify: `src/proxy.ts`

- [ ] **Eliminar archivos legacy:**
```
# En PowerShell:
Remove-Item "src\app\page.tsx"
Remove-Item "src\app\LegacyApp.tsx"
Remove-Item -Recurse -Force "src\app\(protected)"
```

- [ ] **Actualizar `src/proxy.ts` — remover `"/"` de PROTECTED_PATHS (lo cubre el layout de `(app)`) y simplificar:**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = ["/dashboard", "/admin", "/seguridad", "/residentes",
  "/lotes", "/visitantes", "/emergencias", "/qr", "/obras", "/auditoria"];
const AUTH_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|legacy|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
  ],
};
```

- [ ] **Verificar TypeScript:**
```
npx tsc --noEmit
```

- [ ] **Verificar build:**
```
npm run build
```
Esperado: build exitoso, rutas listadas: `/`, `/login`, `/seguridad`, `/residentes`, etc.

- [ ] **Commit:**
```
git add -A
git commit -m "Reemplaza iframe legacy con shell Next.js - layout, nav y placeholders"
```
