import { logout } from "@/app/(auth)/login/actions";
import ThemeToggle from "@/components/shell/ThemeToggle";

interface PortalShellProps {
  nombre: string | null;
  notificaciones: number;
  children: React.ReactNode;
}

export default function PortalShell({
  nombre,
  notificaciones,
  children,
}: PortalShellProps) {
  const hasNotifications = notificaciones > 0;

  return (
    <div className="owner-app">
      <div className="owner-shell">
        <div className="owner-top">
          <div className="owner-brand">
            <strong>Bon Desti</strong>
            <span>{nombre ? `Hola, ${nombre}` : "Portal de habitantes"}</span>
          </div>
          <div className="owner-top-actions">
            <a
              className={`notification-bell${hasNotifications ? " has-alert" : ""}`}
              href="#notificaciones"
              aria-label={
                hasNotifications
                  ? `${notificaciones} notificaciones`
                  : "Sin notificaciones"
              }
              title={
                hasNotifications
                  ? `${notificaciones} notificaciones`
                  : "Sin notificaciones"
              }
            >
              <i className="ti ti-bell" />
              {hasNotifications && (
                <span>{notificaciones > 9 ? "9+" : notificaciones}</span>
              )}
            </a>
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className="btn btn-sm">Salir</button>
            </form>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
