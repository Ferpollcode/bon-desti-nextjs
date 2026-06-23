import { createClient } from "@/lib/supabase/server";
import { formatDate as formatDateInAppZone } from "@/lib/timezone";
import type { PaseQR } from "@/lib/types/database";
import { desactivarPase } from "./actions";
import PaseCard from "./PaseCard";

interface Props {
  residenteId: string | null;
}

async function getPases(residenteId: string): Promise<PaseQR[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pases_qr")
    .select("*")
    .eq("residente_id", residenteId)
    .eq("activo", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as PaseQR[];
}

function formatFecha(ts: string) {
  return formatDateInAppZone(ts, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default async function PasesGenerados({ residenteId }: Props) {
  if (!residenteId) return null;

  const pases = await getPases(residenteId);
  const unicos = pases.filter((p) => p.tipo === "unico_uso");
  const temporales = pases.filter((p) => p.tipo === "temporal");

  if (pases.length === 0) {
    return (
      <div className="empty" style={{ padding: "16px 0 8px" }}>
        Todavía no hay pases activos.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {unicos.length > 0 && (
        <div>
          <div className="owner-section-title" style={{ marginBottom: 8 }}>
            Tokens de único uso activos
          </div>
          {unicos.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "12px",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: 3 }}>
                  {p.token}
                </div>
                <div style={{ color: "var(--text2)", fontSize: 12 }}>
                  {p.visitante_nombre ?? p.descripcion ?? "—"}
                  {p.vence_at && ` · Vence ${formatFecha(p.vence_at)}`}
                </div>
              </div>
              <form action={desactivarPase}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                >
                  Desactivar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {temporales.length > 0 && (
        <div>
          <div className="owner-section-title" style={{ marginBottom: 8 }}>
            Pases QR temporales activos
          </div>
          {temporales.map((p) => (
            <PaseCard key={p.id} pase={p} />
          ))}
        </div>
      )}
    </div>
  );
}
