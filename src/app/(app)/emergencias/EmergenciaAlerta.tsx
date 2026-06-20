"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AlertaActiva {
  descripcion: string;
  lote_numero: string | null;
  residente_nombre: string | null;
}

function playAlarm() {
  try {
    const ctx = new AudioContext();
    [0, 0.35, 0.7].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.28);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.28);
    });
  } catch {
    // El browser puede bloquear audio sin interacción previa del usuario
  }
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

        const perfil = emergencia?.reportado_por_profile as
          | { nombre: string | null; apellido: string | null }
          | null;
        const nombreDB = perfil
          ? `${perfil.nombre ?? ""} ${perfil.apellido ?? ""}`.trim()
          : null;

        setAlerta({
          descripcion: emergencia?.descripcion ?? "Emergencia reportada desde el portal",
          lote_numero,
          residente_nombre: nombrePayload ?? nombreDB ?? null,
        });
        playAlarm();
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
        @keyframes em-in {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          alignItems: "center",
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
            maxWidth: 420,
            padding: "36px 28px",
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
              marginBottom: 20,
              textTransform: "uppercase",
            }}
          >
            EMERGENCIA
          </div>

          <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
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
