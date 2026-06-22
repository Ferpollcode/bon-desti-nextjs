import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Lote, Residente } from "@/lib/types/database";
import LoteSelector from "../LoteSelector";
import PaseTemporalForm from "../PaseTemporalForm";
import TokenUnicoVisita from "../TokenUnicoVisita";

async function getResidentesDelUsuario(
  userId: string,
): Promise<(Residente & { lote: Lote | null })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("residentes")
    .select("*, lote:lotes(*)")
    .eq("profile_id", userId)
    .eq("activo", true);
  return (data ?? []) as (Residente & { lote: Lote | null })[];
}

export default async function AutorizarVisitaPage({
  searchParams,
}: {
  searchParams: Promise<{ lote?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { lote: loteParam } = await searchParams;

  const residentes = user ? await getResidentesDelUsuario(user.id) : [];
  const selectedLoteId =
    loteParam ??
    (residentes.length === 1 ? (residentes[0].lote_id ?? undefined) : undefined);
  const selectedResidente = residentes.find(
    (residente) => residente.lote_id === selectedLoteId,
  );

  return (
    <>
      <div className="owner-card portal-full owner-auth-header">
        <Link className="btn btn-sm owner-auth-back" href="/portal">
          <i className="ti ti-arrow-left" /> Volver al portal
        </Link>
        <div className="card-title">Autorizar visita</div>
        <p className="owner-card-subtitle">
          Generá un token de ingreso o un QR temporal para una visita.
        </p>
        <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
          <label>Mi casa / lote</label>
          <LoteSelector
            key={selectedLoteId ?? "none"}
            residentes={residentes}
            selectedLoteId={selectedLoteId}
            basePath="/portal/autorizar-visita"
          />
        </div>
        {selectedResidente && (
          <p className="owner-card-subtitle" style={{ marginTop: 8, marginBottom: 0 }}>
            {selectedResidente.nombre} {selectedResidente.apellido} ·{" "}
            {selectedResidente.tipo === "propietario" ? "Propietario" : "Inquilino"}
          </p>
        )}
      </div>

      <div className="owner-card visitor-pass-card portal-full owner-auth-card">
        <div className="owner-auth-grid">
          <div className="owner-auth-panel">
            <TokenUnicoVisita residenteId={selectedResidente?.id ?? null} />
          </div>
          <div className="divider owner-auth-divider" />
          <div className="owner-auth-panel">
            <div className="owner-section-title">Pase QR temporal</div>
            <p className="owner-card-subtitle">
              Para visitas recurrentes: el visitante muestra el QR en la garita.
            </p>
            <PaseTemporalForm residenteId={selectedResidente?.id ?? null} />
          </div>
        </div>
      </div>
    </>
  );
}
