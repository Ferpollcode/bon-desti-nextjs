"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Residente, Lote } from "@/lib/types/database";

interface Props {
  residentes: (Residente & { lote: Lote | null })[];
  selectedLoteId: string | undefined;
}

export default function LoteSelector({ residentes, selectedLoteId }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(selectedLoteId ?? "");

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setValue(v);
    if (v) {
      router.push(`/portal?lote=${v}`);
    } else {
      router.push("/portal");
    }
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      style={{ cursor: "pointer" }}
    >
      <option value="">-- Seleccionar casa --</option>
      {residentes.map((r) => (
        <option key={r.id} value={r.lote_id ?? ""}>
          {r.lote ? `Lote ${r.lote.numero}` : `${r.nombre} ${r.apellido}`}
          {r.tipo === "inquilino" ? " (inquilino)" : ""}
        </option>
      ))}
    </select>
  );
}
