import { login } from "./actions";

export default function LoginForm({
  error,
  redirect,
}: {
  error?: string;
  redirect?: string;
}) {
  return (
    <form action={login} style={{ display: "contents" }}>
      {redirect && <input type="hidden" name="redirect" value={redirect} />}

      <div
        className="login-panel"
        style={{
          background: "linear-gradient(180deg, rgba(22,43,70,0.96), rgba(12,29,51,0.96))",
          border: "1px solid rgba(118,247,194,0.20)",
          borderRadius: 22,
          boxShadow: "0 28px 70px rgba(0,0,0,0.32)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 38,
        }}
      >
        <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8, color: "#ffffff" }}>
          Ingresar
        </h2>
        <p style={{ color: "#b8c6d9", marginBottom: 28, fontSize: 14 }}>
          Ingresá con tu usuario y contraseña.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#b8c6d9" }}>Usuario</label>
          <input
            name="usuario"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Usuario"
            style={{
              background: "rgba(4,12,24,0.54)",
              border: "1px solid rgba(148,163,184,0.30)",
              borderRadius: 6,
              color: "#e8f1ff",
              fontSize: 13,
              minHeight: 48,
              outline: "none",
              padding: "8px 10px",
              width: "100%",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#b8c6d9" }}>Contraseña</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Contraseña"
            style={{
              background: "rgba(4,12,24,0.54)",
              border: "1px solid rgba(148,163,184,0.30)",
              borderRadius: 6,
              color: "#e8f1ff",
              fontSize: 13,
              minHeight: 48,
              outline: "none",
              padding: "8px 10px",
              width: "100%",
            }}
          />
        </div>

        {error && (
          <div style={{ color: "#ff9aa3", fontSize: 13, minHeight: 18, margin: "8px 0 12px" }}>
            {decodeURIComponent(error)}
          </div>
        )}

        <button
          type="submit"
          style={{
            alignItems: "center",
            background: "linear-gradient(135deg, #00c781, #00a86f)",
            border: "1px solid rgba(118,247,194,0.38)",
            borderRadius: 12,
            color: "#04160f",
            cursor: "pointer",
            display: "inline-flex",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 700,
            gap: 6,
            justifyContent: "center",
            marginTop: 8,
            minHeight: 50,
            padding: "8px 14px",
            transition: "background 0.15s",
            width: "100%",
          }}
        >
          <i className="ti ti-login-2" />
          Ingresar
        </button>

        <div style={{ color: "#b8c6d9", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          BON DESTI - Pueyrredon 633, Rodeo del Medio
        </div>
      </div>
    </form>
  );
}
