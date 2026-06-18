# Layout Shell — Diseño

**Fecha:** 2026-06-18  
**Proyecto:** Bon Desti Access  
**Scope:** Migración del layout general del legacy a Next.js 16

---

## Contexto

Se elimina el iframe del legacy. Toda la UI se construye en Next.js manteniendo el mismo diseño visual. El cambio central es reemplazar `localStorage` por Supabase como fuente de datos. La migración va módulo por módulo: Layout Shell primero, luego cada sección.

---

## Estructura de rutas

```
src/app/
  (auth)/
    login/               ← login con diseño legacy, ya implementado
  (app)/
    layout.tsx           ← shell: sidebar + mobile nav + theme
    page.tsx             ← panel principal (redirect desde /)
    seguridad/page.tsx
    residentes/page.tsx
    lotes/page.tsx
    visitantes/page.tsx
    emergencias/page.tsx
    qr/page.tsx
    obras/page.tsx
    auditoria/page.tsx
  auth/callback/         ← ya implementado
```

La raíz `/` redirige a `/` dentro de `(app)` — el proxy ya protege la ruta y requiere sesión activa.

El `(app)/layout.tsx` es un Server Component que:
1. Llama `requireAuth()` — redirige a `/login` si no hay sesión
2. Lee el perfil de Supabase para obtener el rol
3. Renderiza `<AppShell rol={...}>{children}</AppShell>`

---

## Componentes del shell

### `AppShell` (Client Component)
Wrapper que compone sidebar + contenido + mobile nav. Recibe `rol` como prop.

### `Sidebar`
- Ancho fijo 220px en desktop
- Logo + nombre del barrio arriba
- Lista de `NavItem` filtrada por rol
- Sección inferior: nombre del usuario, rol, botón logout
- Se oculta en mobile (`display: none` bajo 768px)

### `NavItem`
- Ícono (Tabler Icons) + label
- Detecta ruta activa con `usePathname()`
- Estilos: activo con fondo verde claro + texto verde, hover con fondo gris claro

### `MobileNav`
- Barra fija en la parte inferior, solo visible en mobile
- Muestra 4-5 items más relevantes del rol
- Ícono + label corto
- Item activo resaltado con acento verde

### `ThemeToggle`
- Lee/escribe `localStorage.gd_theme`
- Aplica clase `dark` en `<html>`
- Script inline en `layout.tsx` para evitar flash en el primer render

---

## Navegación por rol

| Item | Seguridad | Administradora | Residente |
|---|---|---|---|
| Principal | ✓ | ✓ | — |
| Ingresos | ✓ | ✓ | — |
| Visitantes | ✓ | ✓ | ✓ (mis visitas) |
| Emergencias | ✓ | ✓ | ✓ |
| Escaner QR | ✓ | ✓ | — |
| Residentes | — | ✓ | — |
| Lotes | — | ✓ | — |
| QR / Pases | — | ✓ | ✓ (mi QR) |
| Obras | — | ✓ | — |
| Auditoría | — | ✓ | — |
| Mi Lote | — | — | ✓ |

---

## Tema

- **Claro (default):** `--bg: #f7f6f3`, `--surface: #ffffff`, `--accent: #0f6e56`
- **Oscuro:** `--bg: #07111f`, `--surface: rgba(22,43,70,0.96)`, mismo acento
- Variables CSS definidas en `globals.css` con selector `:root` y `.dark`
- Persiste en `localStorage` con key `gd_theme` (compatible con el legacy)
- Script inline en `<head>` para aplicar el tema antes del primer paint

---

## Páginas placeholder

Cada `page.tsx` en `(app)/` arranca como placeholder con el título de la sección. Se reemplaza módulo por módulo en iteraciones siguientes.

---

## Lo que NO entra en este scope

- Lógica de negocio de cada módulo (datos, formularios, tablas)
- Gestión de usuarios desde la UI
- Reportes, exportación a Excel
- Multi-barrio
