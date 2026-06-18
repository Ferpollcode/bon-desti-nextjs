import { logout } from "@/app/(auth)/login/actions";

interface PortalShellProps {
  nombre: string | null;
  children: React.ReactNode;
}

export default function PortalShell({ nombre, children }: PortalShellProps) {
  return (
    <div className="owner-app">
      <div className="owner-shell">
        <div className="owner-top">
          <div className="owner-brand">
            <strong>Bon Desti</strong>
            <span>{nombre ? `Hola, ${nombre}` : "Portal de habitantes"}</span>
          </div>
          <form action={logout}>
            <button type="submit" className="btn btn-sm">Salir</button>
          </form>
        </div>
        {children}
      </div>
    </div>
  );
}
