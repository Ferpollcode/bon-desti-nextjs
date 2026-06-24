"use client";

import { useState } from "react";
import type { Lote, PaseQR, Residente } from "@/lib/types/database";

interface PaseConResidente extends PaseQR {
  residente: (Residente & { lote: Lote | null }) | null;
}

interface Props {
  pases: PaseConResidente[];
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

const tipoBadge: Record<string, string> = {
  permanente: "badge-blue",
  temporal: "badge-amber",
  unico_uso: "badge-gray",
};

const tipoLabel: Record<string, string> = {
  permanente: "Permanente",
  temporal: "Temporal",
  unico_uso: "Unico uso",
};

function autorizadoNombre(pase: PaseConResidente) {
  return pase.visitante_nombre || pase.descripcion?.replace(/^Visita:\s*/i, "") || "-";
}

function residenteNombre(pase: PaseConResidente) {
  return pase.residente
    ? `${pase.residente.apellido}, ${pase.residente.nombre}`
    : "-";
}

function destinoIngreso(pase: PaseConResidente) {
  return pase.residente?.lote ? `Lote ${pase.residente.lote.numero}` : "-";
}

export default function PasesRegistrados({ pases }: Props) {
  const [seleccionado, setSeleccionado] = useState<PaseConResidente | null>(null);

  return (
    <>
      <div
        className={`modal-overlay${seleccionado ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSeleccionado(null);
        }}
      >
        <div className="modal">
          {seleccionado && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                  Datos de la persona autorizada
                </h3>
                <button type="button" className="btn btn-sm" onClick={() => setSeleccionado(null)}>
                  <i className="ti ti-x" />
                </button>
              </div>

              <div className="pass-detail-grid">
                <div><span>Nombre</span><strong>{autorizadoNombre(seleccionado)}</strong></div>
                <div><span>DNI / CUIL</span><strong>{seleccionado.visitante_documento ?? "-"}</strong></div>
                <div><span>Telefono / WhatsApp</span><strong>{seleccionado.visitante_telefono ?? "-"}</strong></div>
                <div><span>Motivo</span><strong>{seleccionado.motivo ?? "-"}</strong></div>
                <div><span>Destino de ingreso</span><strong>{destinoIngreso(seleccionado)}</strong></div>
                <div>
                  <span>Residente que autorizo</span>
                  <strong>{residenteNombre(seleccionado)}</strong>
                </div>
                <div><span>Tipo de pase</span><strong>{tipoLabel[seleccionado.tipo] ?? seleccionado.tipo}</strong></div>
                <div><span>Valido desde</span><strong>{seleccionado.valido_desde ?? "-"}</strong></div>
                <div><span>Vence</span><strong>{seleccionado.vence_at ? formatTs(seleccionado.vence_at) : "-"}</strong></div>
                <div><span>Ingreso registrado</span><strong>{seleccionado.usado_at ? formatTs(seleccionado.usado_at) : "-"}</strong></div>
                <div>
                  <span>Horario</span>
                  <strong>
                    {seleccionado.hora_desde && seleccionado.hora_hasta
                      ? `${seleccionado.hora_desde} - ${seleccionado.hora_hasta}`
                      : "-"}
                  </strong>
                </div>
                <div>
                  <span>Dias habilitados</span>
                  <strong>
                    {seleccionado.dias_habilitados?.length
                      ? seleccionado.dias_habilitados.join(", ")
                      : "-"}
                  </strong>
                </div>
                <div><span>Token</span><strong>{seleccionado.token}</strong></div>
                <div><span>Estado</span><strong>{seleccionado.activo ? "Activo" : "Inactivo"}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Pases registrados</div>
        <div className="table-wrap">
          <table className="passes-table">
            <thead>
              <tr>
                <th>Ingresa</th>
                <th>Destino</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Vence</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {pases.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="empty-icon"><i className="ti ti-qrcode" /></div>
                      Sin pases generados
                    </div>
                  </td>
                </tr>
              ) : (
                pases.map((p) => (
                  <tr
                    key={p.id}
                    className="clickable-row pass-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSeleccionado(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSeleccionado(p);
                      }
                    }}
                    style={{ opacity: p.activo ? 1 : 0.5 }}
                  >
                    <td>
                      <strong>{autorizadoNombre(p)}</strong>
                      <span className="pass-row-owner">
                        Propietario: {residenteNombre(p)}
                      </span>
                    </td>
                    <td>{destinoIngreso(p)}</td>
                    <td>
                      <span className={`badge ${tipoBadge[p.tipo] ?? "badge-gray"}`}>
                        {tipoLabel[p.tipo] ?? p.tipo}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.activo ? "badge-green" : "badge-gray"}`}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {p.vence_at ? formatTs(p.vence_at) : "-"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatTs(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
