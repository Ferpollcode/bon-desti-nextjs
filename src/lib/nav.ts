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

export function isNavActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
