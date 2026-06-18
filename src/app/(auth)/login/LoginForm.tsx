"use client";

import { useState } from "react";
import { login } from "./actions";

const roles = [
  {
    key: "seguridad",
    label: "SEGURIDAD",
    icon: "ti ti-shield-lock",
    hint: "Ingreso para personal de garita.",
    title: "Seguridad",
    style: {
      background: "linear-gradient(135deg, rgba(29,78,216,0.16), rgba(37,99,235,0.28))",
      borderColor: "rgba(96,165,250,0.44)",
      color: "#dbeafe",
    },
    activeStyle: { borderColor: "#93c5fd", color: "#ffffff" },
  },
  {
    key: "residentes",
    label: "RESIDENTES",
    icon: "ti ti-users",
    hint: "Ingreso para residentes del barrio.",
    title: "Residentes",
    style: {
      background: "linear-gradient(135deg, rgba(0,143,95,0.18), rgba(0,199,129,0.30))",
      borderColor: "rgba(118,247,194,0.44)",
      color: "#dcfce7",
    },
    activeStyle: { borderColor: "#76f7c2", color: "#ffffff" },
  },
  {
    key: "administradora",
    label: "ADMINISTRADORA",
    icon: "ti ti-building-community",
    hint: "Ingreso para administración.",
    title: "Administradora",
    style: {
      background: "linear-gradient(135deg, rgba(234,88,12,0.18), rgba(249,115,22,0.32))",
      borderColor: "rgba(251,146,60,0.48)",
      color: "#ffedd5",
    },
    activeStyle: { borderColor: "#fdba74", color: "#ffffff" },
  },
];

export default function LoginForm({
  error,
  redirect,
}: {
  error?: string;
  redirect?: string;
}) {
  const [activeRole, setActiveRole] = useState("seguridad");
  const current = roles.find((r) => r.key === activeRole)!;

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
          padding: 32,
        }}
      >
        <h2 style={{ fontSize: 28, marginBottom: 8, color: "#e2eaf5" }}>
          {current.title}
        </h2>
        <p style={{ color: "#667085", marginBottom: 24, fontSize: 14 }}>{current.hint}</p>

        {/* Role buttons */}
        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          {roles.map((role) => {
            const isActive = activeRole === role.key;
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => setActiveRole(role.key)}
                style={{
                  alignItems: "center",
                  borderRadius: 12,
                  border: `1px solid ${isActive ? role.activeStyle.borderColor : role.style.borderColor}`,
                  cursor: "pointer",
                  display: "flex",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  gap: 10,
                  letterSpacing: "0.8px",
                  padding: "13px 16px",
                  position: "relative",
                  textAlign: "left",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  width: "100%",
                  ...role.style,
                  ...(isActive ? role.activeStyle : {}),
                  ...(isActive
                    ? {
                        boxShadow:
                          "0 0 0 3px rgba(255,255,255,0.22), 0 0 0 6px rgba(118,247,194,0.20), 0 16px 34px rgba(0,0,0,0.24)",
                        transform: "translateY(-1px)",
                      }
                    : {}),
                }}
              >
                <i className={role.icon} style={{ fontSize: 19 }} />
                {role.label}
                {isActive && (
                  <span
                    style={{
                      alignItems: "center",
                      background: "rgba(255,255,255,0.94)",
                      borderRadius: 999,
                      color: "#1a1917",
                      display: "flex",
                      fontSize: 15,
                      fontWeight: 700,
                      height: 26,
                      justifyContent: "center",
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 26,
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <input type="hidden" name="rol" value={activeRole} />

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>Usuario</label>
          <input
            name="usuario"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Usuario"
            style={{
              background: "rgba(255,253,248,0.06)",
              border: "1px solid rgba(83,77,63,0.36)",
              borderRadius: 6,
              color: "#e2eaf5",
              fontSize: 13,
              outline: "none",
              padding: "8px 10px",
              width: "100%",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>Contraseña</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Contraseña"
            style={{
              background: "rgba(255,253,248,0.06)",
              border: "1px solid rgba(83,77,63,0.36)",
              borderRadius: 6,
              color: "#e2eaf5",
              fontSize: 13,
              outline: "none",
              padding: "8px 10px",
              width: "100%",
            }}
          />
        </div>

        {error && (
          <div style={{ color: "#b42318", fontSize: 13, minHeight: 18, margin: "8px 0 12px" }}>
            {decodeURIComponent(error)}
          </div>
        )}

        <button
          type="submit"
          style={{
            alignItems: "center",
            background: "#0f6e56",
            border: "1px solid #0f6e56",
            borderRadius: 6,
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            fontSize: 13,
            fontWeight: 500,
            gap: 6,
            justifyContent: "center",
            minHeight: 42,
            padding: "8px 14px",
            transition: "background 0.15s",
            width: "100%",
          }}
        >
          <i className="ti ti-login-2" />
          Ingresar
        </button>

        <div style={{ color: "#667085", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          BON DESTI - Pueyrredon 633, Rodeo del Medio
        </div>
      </div>
    </form>
  );
}
