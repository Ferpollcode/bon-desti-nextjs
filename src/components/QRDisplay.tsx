"use client";

import QRCode from "react-qr-code";

interface Props {
  value: string;
  filename?: string;
  size?: number;
  label?: string;
}

export default function QRDisplay({ value, filename = "pase-qr", size = 200, label }: Props) {
  const qrId = `qr-${value.replace(/\W/g, "")}`;

  function descargar() {
    const svgEl = document.getElementById(qrId);
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `${filename}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }

  async function compartir() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: label ?? "Pase QR", text: `Código: ${value}` });
    } catch {
      // usuario canceló
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {label && (
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text2)" }}>{label}</span>
      )}
      <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
        <QRCode id={qrId} value={value} size={size} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn btn-sm" onClick={descargar} style={{ gap: 4 }}>
          <i className="ti ti-download" /> Descargar
        </button>
        {"share" in navigator && (
          <button type="button" className="btn btn-sm" onClick={compartir} style={{ gap: 4 }}>
            <i className="ti ti-share" /> Compartir
          </button>
        )}
      </div>
    </div>
  );
}
