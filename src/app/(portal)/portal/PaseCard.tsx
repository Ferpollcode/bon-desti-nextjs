"use client";

import { useState } from "react";
import QRDisplay from "@/components/QRDisplay";
import { desactivarPase } from "./actions";
import type { PaseQR } from "@/lib/types/database";

function formatFecha(ts: string) {
  return new Date(ts).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function PaseCard({ pase }: { pase: PaseQR }) {
  const [verQR, setVerQR] = useState(false);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "12px",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{pase.visitante_nombre ?? "—"}</div>
          <div style={{ color: "var(--text2)", fontSize: 12 }}>
            {pase.motivo && `${pase.motivo} · `}
            {pase.valido_desde && `Desde ${formatFecha(pase.valido_desde)} `}
            {pase.vence_at && `hasta ${formatFecha(pase.vence_at)}`}
          </div>
          {pase.hora_desde && pase.hora_hasta && (
            <div style={{ color: "var(--text3)", fontSize: 11 }}>
              {pase.hora_desde} – {pase.hora_hasta}
              {pase.dias_habilitados?.length > 0 &&
                ` · ${pase.dias_habilitados.join(", ")}`}
            </div>
          )}
        </div>
        <form action={desactivarPase} style={{ flexShrink: 0 }}>
          <input type="hidden" name="id" value={pase.id} />
          <button
            type="submit"
            className="btn btn-sm"
            style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
          >
            <i className="ti ti-trash" /> Desactivar
          </button>
        </form>
      </div>

      <button
        type="button"
        className="btn btn-sm"
        onClick={() => setVerQR((v) => !v)}
        style={{ marginTop: 10, gap: 4, width: "100%" }}
      >
        <i className={`ti ${verQR ? "ti-eye-off" : "ti-qrcode"}`} />
        {verQR ? "Ocultar QR" : "Ver QR"}
      </button>

      {verQR && (
        <div style={{ marginTop: 12 }}>
          <QRDisplay
            value={pase.token}
            filename={`pase-${pase.visitante_nombre ?? pase.id}`}
            size={160}
          />
        </div>
      )}
    </div>
  );
}
