import type { Lote } from "@/lib/types/database";

export function compareLotes(a: Pick<Lote, "numero">, b: Pick<Lote, "numero">) {
  const parse = (numero: string) => {
    const match = numero.match(/^([A-Za-z]+)-?(\d+)$/);
    if (!match) return { letra: numero, numero: Number.MAX_SAFE_INTEGER };
    return { letra: match[1].toUpperCase(), numero: Number(match[2]) };
  };

  const loteA = parse(a.numero);
  const loteB = parse(b.numero);
  return (
    loteA.letra.localeCompare(loteB.letra, "es") ||
    loteA.numero - loteB.numero ||
    a.numero.localeCompare(b.numero, "es")
  );
}
