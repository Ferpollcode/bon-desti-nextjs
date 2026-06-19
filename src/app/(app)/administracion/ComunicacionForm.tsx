"use client";

import { useActionState } from "react";
import { enviarComunicacion, type ComunicacionState } from "./actions";
import type { Lote, Residente } from "@/lib/types/database";

interface ResidenteConLote extends Residente {
  lote: Lote | null;
}

interface ComunicacionFormProps {
  residentes: ResidenteConLote[];
}

export default function ComunicacionForm({ residentes }: ComunicacionFormProps) {
  const [state, formAction, pending] = useActionState<ComunicacionState, FormData>(
    enviarComunicacion,
    null,
  );

  return (
    <form action={formAction} className="admin-message-form">
      <div className="form-row">
        <div className="form-group">
          <label>Destinatario</label>
          <select name="destinatario" defaultValue="todos">
            <option value="todos">Todos los residentes</option>
            {residentes.map((residente) => (
              <option key={residente.id} value={residente.id}>
                {residente.apellido}, {residente.nombre}
                {residente.lote ? ` - Lote ${residente.lote.numero}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Título</label>
          <input name="titulo" type="text" placeholder="Ej: Corte de agua" required />
        </div>
      </div>

      <div className="form-group">
        <label>Mensaje</label>
        <textarea
          name="mensaje"
          rows={5}
          placeholder="Escribí la comunicación para el residente o para todo el barrio"
          required
        />
      </div>

      {state?.error && (
        <div className="validation-card fail" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="validation-card ok" style={{ marginBottom: 12 }}>
          Comunicación enviada.
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={pending} style={{ gap: 8 }}>
        <i className="ti ti-send" />
        {pending ? "Enviando..." : "Enviar comunicación"}
      </button>
    </form>
  );
}
