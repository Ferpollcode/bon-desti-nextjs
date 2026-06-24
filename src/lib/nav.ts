import type { Rol } from "@/lib/types/database";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  mobileLabel?: string;
}

// Primeros 4 = bottom bar fija; el resto va en el panel "Mas"
const navByRol: Record<Rol, NavItem[]> = {
  seguridad: [
    { href: "/", label: "Principal", icon: "ti-home", mobileLabel: "Inicio" },
    { href: "/seguridad", label: "Ingresos", icon: "ti-door-enter" },
    { href: "/lotes", label: "Lotes", icon: "ti-building-community" },
    { href: "/emergencias", label: "Emergencias", icon: "ti-alert-triangle" },
    // panel "Mas"
    { href: "/visitantes", label: "Visitantes", icon: "ti-user-check" },
    { href: "/residentes", label: "Residentes", icon: "ti-users" },
    { href: "/qr", label: "QR / Pases", icon: "ti-qrcode", mobileLabel: "QR" },
    { href: "/obras", label: "Obras", icon: "ti-tool" },
    { href: "/administracion", label: "Administracion", icon: "ti-speakerphone", mobileLabel: "Admin" },
    { href: "/auditoria", label: "Auditoria", icon: "ti-clipboard-list" },
  ],
  admin: [
    { href: "/", label: "Principal", icon: "ti-home", mobileLabel: "Inicio" },
    { href: "/seguridad", label: "Ingresos", icon: "ti-door-enter" },
    { href: "/lotes", label: "Lotes", icon: "ti-building-community" },
    { href: "/emergencias", label: "Emergencias", icon: "ti-alert-triangle" },
    // panel "Mas"
    { href: "/visitantes", label: "Visitantes", icon: "ti-user-check" },
    { href: "/residentes", label: "Residentes", icon: "ti-users" },
    { href: "/qr", label: "QR / Pases", icon: "ti-qrcode", mobileLabel: "QR" },
    { href: "/obras", label: "Obras", icon: "ti-tool" },
    { href: "/administracion", label: "Administracion", icon: "ti-speakerphone", mobileLabel: "Admin" },
    { href: "/auditoria", label: "Auditoria", icon: "ti-clipboard-list" },
  ],
  superadmin: [
    { href: "/", label: "Principal", icon: "ti-home", mobileLabel: "Inicio" },
    { href: "/seguridad", label: "Ingresos", icon: "ti-door-enter" },
    { href: "/lotes", label: "Lotes", icon: "ti-building-community" },
    { href: "/emergencias", label: "Emergencias", icon: "ti-alert-triangle" },
    // panel "Mas"
    { href: "/visitantes", label: "Visitantes", icon: "ti-user-check" },
    { href: "/residentes", label: "Residentes", icon: "ti-users" },
    { href: "/qr", label: "QR / Pases", icon: "ti-qrcode", mobileLabel: "QR" },
    { href: "/obras", label: "Obras", icon: "ti-tool" },
    { href: "/administracion", label: "Administracion", icon: "ti-speakerphone", mobileLabel: "Admin" },
    { href: "/auditoria", label: "Auditoria", icon: "ti-clipboard-list" },
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

export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
