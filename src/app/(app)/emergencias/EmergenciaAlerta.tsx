"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EmergencyAlarm from "./EmergencyAlarm";

interface AlertaActiva {
  descripcion: string;
  lote_numero: string | null;
  residente_nombre: string | null;
}

function showBrowserNotification(alerta: AlertaActiva) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const body = [
    alerta.descripcion,
    alerta.lote_numero ? `Lote ${alerta.lote_numero}` : null,
    alerta.residente_nombre ? `Reportado por ${alerta.residente_nombre}` : null,
  ]
    .filter(Boolean)
    .join(" - ");

  new Notification("Emergencia recibida", {
    body,
    icon: "/legacy/assets/sirena-emergencia.png",
    requireInteraction: true,
  });
}

export default function EmergenciaAlerta() {
  const [alerta, setAlerta] = useState<AlertaActiva | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("emergencias-garita")
      .on("broadcast", { event: "nueva_emergencia" }, async (msg) => {
        const lote_id = msg.payload?.lote_id as string | null | undefined;
        const nombrePayload = msg.payload?.residente_nombre as string | null | undefined;
        let lote_numero: string | null = null;

        if (lote_id) {
          const { data } = await supabase
            .from("lotes")
            .select("numero")
            .eq("id", lote_id)
            .single();
          lote_numero = data?.numero ?? null;
        }

        const { data: emergencia } = await supabase
          .from("emergencias")
          .select("descripcion, reportado_por_profile:profiles(nombre, apellido)")
          .eq("estado", "activa")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const perfil = (emergencia?.reportado_por_profile as unknown) as
          | { nombre: string | null; apellido: string | null }
          | null;
        const nombreDB = perfil
          ? `${perfil.nombre ?? ""} ${perfil.apellido ?? ""}`.trim()
          : null;

        const nuevaAlerta = {
          descripcion: emergencia?.descripcion ?? "Emergencia reportada desde el portal",
          lote_numero,
          residente_nombre: nombrePayload ?? nombreDB ?? null,
        };

        setAlerta(nuevaAlerta);
        showBrowserNotification(nuevaAlerta);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!alerta) return null;

  function handleAtender() {
    setAlerta(null);
    router.push("/emergencias");
    router.refresh();
  }

  function handleCerrar() {
    setAlerta(null);
    router.refresh();
  }

  return (
    <>
      <style>{`
        @keyframes em-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          70%  { box-shadow: 0 0 0 24px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes em-strobe {
          0%, 100% { background: rgba(0,0,0,0.88); }
          50% { background: rgba(127, 0, 0, 0.82); }
        }
        @keyframes em-in {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          alignItems: "center",
          animation: "em-strobe 0.65s infinite",
          background: "rgba(0,0,0,0.82)",
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          left: 0,
          position: "fixed",
          right: 0,
          top: 0,
          zIndex: 9999,
        }}
      >
        <div
          style={{
            animation: "em-in 0.2s ease-out, em-pulse 1.4s ease-out 0.2s infinite",
            background: "#1a0505",
            border: "2px solid var(--danger)",
            borderRadius: 16,
            maxWidth: 480,
            padding: "32px 24px",
            textAlign: "center",
            width: "90%",
          }}
        >
          <i
            className="ti ti-alert-triangle"
            style={{ color: "var(--danger)", fontSize: 52, display: "block", marginBottom: 12 }}
          />

          <div
            style={{
              color: "var(--danger)",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            EMERGENCIA RECIBIDA
          </div>

          <EmergencyAlarm active={Boolean(alerta)} />

          <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: "18px 0 8px" }}>
            {alerta.descripcion}
          </p>

          {alerta.lote_numero && (
            <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 4 }}>
              Lote {alerta.lote_numero}
            </p>
          )}

          {alerta.residente_nombre && (
            <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 0 }}>
              Reportado por:{" "}
              <strong style={{ color: "#fff" }}>{alerta.residente_nombre}</strong>
            </p>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
            <button className="btn btn-danger" onClick={handleAtender} style={{ gap: 6 }}>
              <i className="ti ti-eye" /> Atender
            </button>
            <button className="btn" onClick={handleCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
