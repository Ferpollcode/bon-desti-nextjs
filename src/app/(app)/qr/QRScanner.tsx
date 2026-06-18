"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { validarToken, registrarIngresoQR, type ValidacionQR } from "./actions";

export default function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camActiva, setCamActiva] = useState(false);
  const [tokenManual, setTokenManual] = useState("");
  const [resultado, setResultado] = useState<ValidacionQR | null>(null);
  const [registrado, setRegistrado] = useState(false);
  const [isPending, startTransition] = useTransition();
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);

  // Limpiar cámara al desmontar
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamActiva(true);

      if (!("BarcodeDetector" in window)) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });

      async function detectar() {
        if (!videoRef.current || !streamRef.current) return;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const codes: any[] = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            detenerCamara();
            await procesarToken(codes[0].rawValue);
            return;
          }
        } catch {
          // frame sin QR, continuar
        }
        animRef.current = requestAnimationFrame(detectar);
      }
      animRef.current = requestAnimationFrame(detectar);
    } catch {
      alert("No se pudo acceder a la cámara. Usa el campo de texto para ingresar el token.");
    }
  }

  function detenerCamara() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(animRef.current);
    setCamActiva(false);
  }

  async function procesarToken(token: string) {
    setResultado(null);
    setRegistrado(false);
    startTransition(async () => {
      const res = await validarToken(token);
      setResultado(res);
    });
  }

  function handleManual(e: React.FormEvent) {
    e.preventDefault();
    if (tokenManual.trim()) procesarToken(tokenManual.trim());
  }

  function handleRegistrar(esEgreso: boolean) {
    if (!resultado?.pase) return;
    startTransition(async () => {
      const fd = new FormData();
      await registrarIngresoQR(resultado.pase!.id, esEgreso, fd);
      setRegistrado(true);
    });
  }

  function reiniciar() {
    setResultado(null);
    setRegistrado(false);
    setTokenManual("");
  }

  const pase = resultado?.pase;
  const residente = pase?.residente;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      {/* Scanner / Cámara */}
      <div className="card" style={{ textAlign: "center" }}>
        <div className="card-title">Escáner de acceso</div>

        {!camActiva ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", padding: "16px 0" }}>
            <i className="ti ti-qrcode" style={{ fontSize: 56, color: "var(--text3)" }} />
            <p style={{ color: "var(--text2)", fontSize: 13, maxWidth: 320 }}>
              Apuntá la cámara al código QR del residente, o ingresá el token manualmente.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={iniciarCamara}
              style={{ gap: 6 }}
            >
              <i className="ti ti-camera" /> Activar cámara
            </button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <video
              ref={videoRef}
              style={{
                borderRadius: 8,
                maxWidth: "100%",
                width: "100%",
                background: "#000",
                display: "block",
              }}
              playsInline
              muted
            />
            {/* Viewfinder overlay */}
            <div style={{
              border: "3px solid var(--accent)",
              borderRadius: 12,
              bottom: "20%",
              left: "20%",
              position: "absolute",
              right: "20%",
              top: "20%",
            }} />
            <button
              type="button"
              className="btn btn-danger"
              onClick={detenerCamara}
              style={{ gap: 6, marginTop: 12 }}
            >
              <i className="ti ti-x" /> Detener cámara
            </button>
          </div>
        )}

        {/* Input manual */}
        <div className="divider" style={{ margin: "16px 0" }} />
        <form onSubmit={handleManual} style={{ display: "flex", gap: 8 }}>
          <input
            value={tokenManual}
            onChange={(e) => setTokenManual(e.target.value)}
            placeholder="Pegar token del QR..."
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending || !tokenManual.trim()}
            style={{ gap: 4 }}
          >
            <i className="ti ti-search" />
          </button>
        </form>
      </div>

      {/* Resultado */}
      {isPending && (
        <div className="card" style={{ textAlign: "center", color: "var(--text2)" }}>
          <i className="ti ti-loader" style={{ fontSize: 32 }} /> Verificando...
        </div>
      )}

      {resultado?.error && !isPending && (
        <div
          className="card"
          style={{
            borderColor: "var(--danger)",
            background: "var(--danger-bg)",
            textAlign: "center",
          }}
        >
          <i className="ti ti-alert-circle" style={{ fontSize: 36, color: "var(--danger)", marginBottom: 8 }} />
          <div style={{ color: "#ff9aa3", fontWeight: 700 }}>{resultado.error}</div>
          <button type="button" className="btn" onClick={reiniciar} style={{ marginTop: 12 }}>
            Intentar de nuevo
          </button>
        </div>
      )}

      {pase && !resultado?.error && !isPending && !registrado && (
        <div
          className="card"
          style={{
            borderColor: resultado.yaAdentro ? "var(--warn)" : "var(--accent)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                alignItems: "center",
                background: resultado.yaAdentro ? "var(--warn-bg)" : "var(--accent-bg)",
                borderRadius: 12,
                display: "flex",
                height: 48,
                justifyContent: "center",
                width: 48,
              }}
            >
              <i
                className={`ti ${resultado.yaAdentro ? "ti-door-exit" : "ti-door-enter"}`}
                style={{
                  color: resultado.yaAdentro ? "var(--warn)" : "var(--accent)",
                  fontSize: 26,
                }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {residente
                  ? `${residente.nombre} ${residente.apellido}`
                  : "Residente"}
              </div>
              {residente?.lote && (
                <div style={{ color: "var(--text2)", fontSize: 13 }}>
                  Lote {residente.lote.numero}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16, fontSize: 13 }}>
            <div>
              <span style={{ color: "var(--text3)" }}>Tipo de pase</span>
              <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{pase.tipo.replace("_", " ")}</div>
            </div>
            <div>
              <span style={{ color: "var(--text3)" }}>Estado</span>
              <div style={{ fontWeight: 600 }}>
                {resultado.yaAdentro ? (
                  <span style={{ color: "var(--warn)" }}>Ya está adentro</span>
                ) : (
                  <span style={{ color: "var(--accent)" }}>Listo para ingresar</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {resultado.yaAdentro ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleRegistrar(true)}
                disabled={isPending}
                style={{ flex: 1, gap: 6 }}
              >
                <i className="ti ti-door-exit" />
                {isPending ? "Registrando..." : "Registrar SALIDA"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleRegistrar(false)}
                disabled={isPending}
                style={{ flex: 1, gap: 6 }}
              >
                <i className="ti ti-door-enter" />
                {isPending ? "Registrando..." : "Registrar ENTRADA"}
              </button>
            )}
            <button type="button" className="btn" onClick={reiniciar}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {registrado && (
        <div
          className="card"
          style={{ borderColor: "var(--accent)", textAlign: "center" }}
        >
          <i
            className="ti ti-circle-check"
            style={{ color: "var(--accent)", fontSize: 48, marginBottom: 8 }}
          />
          <div style={{ fontWeight: 700, fontSize: 18 }}>¡Acceso registrado!</div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={reiniciar}
            style={{ marginTop: 16, gap: 6 }}
          >
            <i className="ti ti-qrcode" /> Escanear otro
          </button>
        </div>
      )}
    </div>
  );
}
