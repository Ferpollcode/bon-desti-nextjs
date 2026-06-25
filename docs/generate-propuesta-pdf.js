const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "propuesta_bon_desti_final.pdf");

const W = 595.28;
const H = 841.89;
const M = 72;
const CW = W - M * 2;

const colors = {
  navy: [38, 56, 78],
  text: [45, 55, 72],
  muted: [105, 118, 138],
  green: [91, 157, 133],
  greenLight: [226, 241, 235],
  lavender: [232, 229, 248],
  peach: [250, 232, 222],
  blueLight: [224, 237, 248],
  page: [244, 246, 248],
  border: [218, 226, 235],
  white: [255, 255, 255],
  warning: [250, 242, 222],
  warningText: [92, 74, 45],
};

let pages = [];
let ops = [];
let y = H - M;

function rgb(c) {
  return `${(c[0] / 255).toFixed(3)} ${(c[1] / 255).toFixed(3)} ${(c[2] / 255).toFixed(3)}`;
}

function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function add(op) {
  ops.push(op);
}

function text(s, x, yy, size = 10, color = colors.text, font = "F1") {
  add(`BT /${font} ${size} Tf ${rgb(color)} rg ${x.toFixed(2)} ${yy.toFixed(2)} Td (${esc(s)}) Tj ET`);
}

function estimatedWidth(s, size) {
  return String(s).length * size * 0.48;
}

function justifiedText(s, x, yy, availableWidth, size = 10, color = colors.text, font = "F1") {
  const spaces = (String(s).match(/ /g) || []).length;
  const extra = availableWidth - estimatedWidth(s, size);
  const wordSpacing = spaces > 0 && extra > 0 && extra < 36 ? extra / spaces : 0;
  add(`BT /${font} ${size} Tf ${wordSpacing.toFixed(3)} Tw ${rgb(color)} rg ${x.toFixed(2)} ${yy.toFixed(2)} Td (${esc(s)}) Tj ET`);
}

function rect(x, yy, w, h, fill = null, stroke = colors.border, lw = 1) {
  if (fill) add(`${rgb(fill)} rg`);
  if (stroke) add(`${rgb(stroke)} RG ${lw} w`);
  add(`${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${fill && stroke ? "B" : fill ? "f" : "S"}`);
}

function line(x1, y1, x2, y2, color = colors.border, lw = 1) {
  add(`${rgb(color)} RG ${lw} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
}

function wrap(s, maxChars) {
  const words = String(s).trim().split(/\s+/);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && next.length > maxChars) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function pushPage() {
  pages.push(pageBackground().concat(ops).join("\n"));
  ops = [];
  y = H - M;
}

function pageBackground() {
  return [
    `${rgb(colors.page)} rg 0 0 ${W.toFixed(2)} ${H.toFixed(2)} re f`,
    `${rgb(colors.white)} rg ${M - 18} ${M - 20} ${(CW + 36).toFixed(2)} ${(H - M * 2 + 34).toFixed(2)} re f`,
  ];
}

function ensure(h) {
  if (y - h < M + 36) pushPage();
}

function paragraph(s, opts = {}) {
  const {
    x = M,
    widthChars = 92,
    size = 10,
    leading = 14,
    color = colors.text,
    font = "F1",
    gap = 5,
    justify = true,
    widthPt = CW,
  } = opts;
  const lines = wrap(s, widthChars);
  ensure(lines.length * leading + gap);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (justify && i < lines.length - 1) {
      justifiedText(l, x, y, widthPt, size, color, font);
    } else {
      text(l, x, y, size, color, font);
    }
    y -= leading;
  }
  y -= gap;
}

function title(lines) {
  rect(M - 4, y - 142, CW + 8, 158, colors.blueLight, null);
  rect(M + 8, y - 132, CW - 16, 138, colors.white, colors.border);
  text("PROPUESTA COMERCIAL", M + 18, y - 24, 10, colors.green, "F2");
  y -= 52;
  for (const l of lines) {
    text(l, M + 18, y, 22, colors.navy, "F2");
    y -= 28;
  }
  y -= 22;
}

function heading(s) {
  ensure(44);
  y -= 10;
  rect(M, y - 24, CW, 30, colors.lavender, null);
  text(s, M + 12, y - 14, 14, colors.navy, "F2");
  y -= 38;
}

function bullets(items) {
  for (const item of items) {
    const lines = wrap(item, 86);
    ensure(lines.length * 13 + 5);
    text("-", M + 8, y, 10, colors.green, "F2");
    text(lines[0], M + 22, y, 10, colors.text);
    y -= 13;
    for (const l of lines.slice(1)) {
      text(l, M + 22, y, 10, colors.text);
      y -= 13;
    }
  }
  y -= 6;
}

function metaCards(items) {
  const gap = 12;
  const w = (CW - gap * 2) / 3;
  ensure(66);
  items.forEach(([label, value], i) => {
    const x = M + i * (w + gap);
    rect(x, y - 54, w, 54, colors.white, colors.border);
    text(label.toUpperCase(), x + 10, y - 20, 8, colors.muted, "F2");
    text(value, x + 10, y - 38, 12, colors.navy, "F2");
  });
  y -= 74;
}

function priceTable(rows, total) {
  const widths = [122, 205, CW - 327];
  const headerH = 26;
  ensure(headerH + rows.length * 58 + 38);
  rect(M, y - headerH, CW, headerH, colors.greenLight, null);
  let x = M;
  ["Concepto", "Detalle", "Importe"].forEach((h, i) => {
    text(h.toUpperCase(), x + 8, y - 17, 8, colors.green, "F2");
    x += widths[i];
  });
  y -= headerH;

  for (const row of rows) {
    const h = 58;
    rect(M, y - h, CW, h, colors.white, colors.border);
    text(row.concepto, M + 8, y - 16, 9, colors.navy, "F2");
    wrap(row.detalle, 48).slice(0, 3).forEach((l, i) => {
      text(l, M + widths[0] + 8, y - 16 - i * 12, 9, colors.text);
    });
    text(row.importe, M + widths[0] + widths[1] + 8, y - 16, 9, colors.navy, "F2");
    y -= h;
  }

  rect(M, y - 34, CW, 34, colors.green, colors.green);
  text(`Inversion total inicial - ${total}`, M + 8, y - 21, 11, colors.white, "F2");
  y -= 48;
}

function paymentPlan() {
  ensure(134);
  rect(M, y - 120, CW, 120, colors.peach, null);
  text("Forma de pago propuesta", M + 14, y - 22, 12, colors.navy, "F2");
  text("La inversion inicial puede abonarse en 3 pagos mensuales consecutivos.", M + 14, y - 42, 10, colors.text);
  text("El acceso operativo queda habilitado con el primer pago.", M + 14, y - 56, 10, colors.text);

  const gap = 10;
  const w = (CW - 28 - gap * 2) / 3;
  [["Pago 1", "ARS 720.000", "Inicio"], ["Pago 2", "ARS 720.000", "Mes 2"], ["Pago 3", "ARS 720.000", "Mes 3"]].forEach((p, i) => {
    const x = M + 14 + i * (w + gap);
    rect(x, y - 106, w, 38, colors.white, [200, 230, 216]);
    text(p[0], x + 8, y - 82, 8, colors.muted, "F2");
    text(p[1], x + 8, y - 96, 13, colors.green, "F2");
    text(p[2], x + w - 42, y - 96, 8, colors.muted);
  });
  y -= 138;
}

function supportPlan(name, price, items, recommended = false) {
  const boxH = 210;
  ensure(boxH + 16);
  rect(M, y - boxH, CW, boxH, colors.white, recommended ? colors.green : colors.border, recommended ? 2 : 1);
  if (recommended) {
    rect(M + 14, y - 26, 88, 16, colors.green, null);
    text("RECOMENDADO", M + 20, y - 21, 7, colors.white, "F2");
    text(name, M + 14, y - 50, 14, colors.navy, "F2");
    text(price, M + 14, y - 78, 20, colors.navy, "F2");
    y -= 102;
  } else {
    text(name, M + 14, y - 24, 14, colors.navy, "F2");
    text(price, M + 14, y - 52, 20, colors.navy, "F2");
    y -= 76;
  }
  const startBottom = y;
  bullets(items);
  y = startBottom - (recommended ? 86 : 112);
}

function note(s) {
  const lines = wrap(s, 88);
  const h = lines.length * 13 + 26;
  ensure(h + 10);
  rect(M, y - h, CW, h, colors.warning, [238, 216, 148]);
  let yy = y - 18;
  lines.forEach((l) => {
    justifiedText(l, M + 12, yy, CW - 24, 9, colors.warningText);
    yy -= 13;
  });
  y -= h + 14;
}

function footer(pageNo) {
  line(M, 38, W - M, 38, colors.border);
  text("Propuesta comercial estimativa - Plataforma de gestion de accesos y seguridad", M, 24, 8, colors.muted);
  text(`Pagina ${pageNo}`, W - M - 45, 24, 8, colors.muted);
}

title([
  "Bon desti Accsess",
]);
paragraph("Aplicacion web para barrios privados, consorcios o comunidades cerradas, orientada al control de ingresos, residentes, visitantes, pases QR, emergencias, lotes y operacion diaria de seguridad.", {
  size: 11,
  widthChars: 82,
  color: colors.muted,
  leading: 15,
});
y -= 10;
line(M, y, W - M, y, colors.green, 3);
y -= 26;
metaCards([
  ["Preparado para", "Bon Desti Complejo Residencial"],
  ["Fecha", "24/06/2026"],
  ["Validez", "15 dias corridos"],
]);

heading("1. Alcance incluido");
paragraph("La propuesta contempla desarrollo, adaptacion e implementacion de una aplicacion operativa para centralizar tareas de seguridad, administracion y residentes.");
bullets([
  "Panel de seguridad para registro de ingresos y egresos.",
  "Gestion de residentes, lotes, visitantes y personal autorizado.",
  "Pases QR y tokens de ingreso de uso unico o temporal.",
  "Modulo de emergencias con aviso visual, sonido y seguimiento.",
  "Portal para residentes con autorizacion de visitas.",
  "Configuracion inicial, pruebas de funcionamiento y puesta en marcha.",
  "Capacitacion para seguridad, administracion y referentes del cliente.",
]);

heading("2. Inversion inicial del proyecto");
priceTable(
  [
    { concepto: "Desarrollo de aplicacion", detalle: "Construccion, ajustes funcionales, interfaz, roles, flujos de seguridad, portal de residentes y administracion.", importe: "ARS 1.440.000" },
    { concepto: "Implementacion", detalle: "Configuracion del entorno, despliegue, conexion de base de datos, pruebas y puesta en marcha.", importe: "ARS 405.000" },
    { concepto: "Carga inicial", detalle: "Configuracion de lotes, perfiles, usuarios iniciales, estructura operativa y datos base.", importe: "ARS 180.000" },
    { concepto: "Capacitacion de uso", detalle: "Capacitacion remota o presencial corta para seguridad, administracion y referentes.", importe: "ARS 135.000" },
  ],
  "ARS 2.160.000",
);

paymentPlan();

pushPage();

heading("3. Soporte y mantenimiento mensual");
paragraph("El soporte mensual comienza luego de la puesta en marcha. Cubre continuidad operativa, asistencia y mejoras menores necesarias para mantener la aplicacion estable.", {
  color: colors.muted,
});

supportPlan("Plan de soporte y mantenimiento", "ARS 112.500 / mes", [
  "Soporte por WhatsApp o email en horario laboral.",
  "Correccion de errores funcionales.",
  "Monitoreo basico de funcionamiento.",
  "Ajustes menores de textos, usuarios o configuraciones.",
  "Mejoras funcionales menores continuas.",
  "Revision mensual con administracion o seguridad.",
  "Hasta 5 horas mensuales incluidas.",
]);

heading("4. No incluido");
note("No se incluyen costos de servicios externos, dominios, cuentas cloud, SMS, WhatsApp Business, hardware, camaras, molinetes, lectores QR fisicos, integraciones con terceros no previstas o desarrollos mayores fuera del alcance original. Estos puntos se cotizan por separado.");

heading("5. Condiciones comerciales");
bullets([
  "Valores estimados expresados en pesos argentinos, calculados con dolar de referencia a ARS 1.500, sin impuestos locales incluidos.",
  "El alcance final se confirma luego de una reunion de relevamiento operativo.",
  "Los cambios mayores de alcance se presupuestan aparte antes de ejecutarse.",
  "La capacitacion inicial contempla una instancia principal y una instancia breve de refuerzo.",
  "La propiedad de los datos operativos cargados en la aplicacion corresponde al cliente.",
]);

pages.push(pageBackground().concat(ops).join("\n"));

const objects = [];
function obj(v) {
  objects.push(v);
  return objects.length;
}

const f1 = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const f2 = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
const pageRefs = [];

pages.forEach((content, i) => {
  ops = content.split("\n");
  footer(i + 1);
  const streamText = ops.join("\n");
  const stream = `<< /Length ${Buffer.byteLength(streamText, "latin1")} >>\nstream\n${streamText}\nendstream`;
  const cRef = obj(stream);
  const pRef = obj(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${cRef} 0 R >>`);
  pageRefs.push(pRef);
});

const pagesRef = obj(`<< /Type /Pages /Kids [${pageRefs.map((r) => `${r} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);
pageRefs.forEach((r) => {
  objects[r - 1] = objects[r - 1].replace("/Parent 0 0 R", `/Parent ${pagesRef} 0 R`);
});
const catalogRef = obj(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);

let pdf = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((v, i) => {
  offsets.push(Buffer.byteLength(pdf, "latin1"));
  pdf += `${i + 1} 0 obj\n${v}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf, "latin1");
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i < offsets.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

fs.writeFileSync(out, Buffer.from(pdf, "latin1"));
console.log(out);
