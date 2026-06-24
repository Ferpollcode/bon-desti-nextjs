"use client";

import Link from "next/link";
import type { Lote, Residente } from "@/lib/types/database";

interface LoteConResidentes extends Lote {
  residentes: Residente[];
}

interface Props {
  lotes: LoteConResidentes[];
}

export default function LotesManager({ lotes }: Props) {
  function titularDelLote(lote: LoteConResidentes) {
    return lote.residentes.find((residente) => residente.activo) ?? lote.residentes[0];
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Lotes</div>
        </div>
      </div>

      <div className="card lotes-card">
        <div className="table-wrap">
          <table className="lotes-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Titular</th>
              </tr>
            </thead>
            <tbody>
              {lotes.length === 0 ? (
                <tr>
                  <td colSpan={2}>
                    <div className="empty">
                      <div className="empty-icon">
                        <i className="ti ti-home-shield" />
                      </div>
                      Sin lotes registrados
                    </div>
                  </td>
                </tr>
              ) : (
                lotes.map((lote) => {
                  const titular = titularDelLote(lote);

                  return (
                    <tr key={lote.id}>
                      <td>
                        <strong>Lote {lote.numero}</strong>
                      </td>
                      <td>
                        {titular ? (
                          <Link
                            href={`/residentes?residente=${titular.id}`}
                            className="resident-link"
                          >
                            {titular.nombre} {titular.apellido}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--text3)" }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
