const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "propuesta_bon_desti_final.pdf");
const headerImagePath = path.join(__dirname, "ferpoll-code-header.jpeg");
const headerImage = fs.readFileSync(headerImagePath);
const headerImageSize = jpegSize(headerImage);

const W = 595.28;
const H = 841.89;
const M = 46;
const CW = W - M * 2;
const FS = 12;

const colors = {
  navy: [9, 27, 45],
  cyan: [24, 177, 212],
  ink: [18, 32, 50],
  text: [55, 68, 88],
  muted: [105, 119, 138],
  line: [218, 226, 236],
  panel: [246, 249, 252],
  white: [255, 255, 255],
};

let pages = [];
let ops = [];

function jpegSize(buffer) {
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) break;
    const marker = buffer[i + 1];
    const length = buffer.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(i + 5),
        width: buffer.readUInt16BE(i + 7),
      };
    }
    i += 2 + length;
  }
  throw new Error("No se pudo leer el tamano del encabezado JPEG.");
}

function rgb(c) {
  return `${(c[0] / 255).toFixed(3)} ${(c[1] / 255).toFixed(3)} ${(c[2] / 255).toFixed(3)}`;
}

function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function add(op) {
  ops.push(op);
}

function rect(x, y, w, h, fill = null, stroke = null, lw = 1) {
  if (fill) add(`${rgb(fill)} rg`);
  if (stroke) add(`${rgb(stroke)} RG ${lw} w`);
  add(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${fill && stroke ? "B" : fill ? "f" : "S"}`);
}

function text(s, x, y, color = colors.text) {
  add(`BT /F1 ${FS} Tf ${rgb(color)} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${esc(s)}) Tj ET`);
}

function approxWidth(s) {
  return String(s).length * FS * 0.48;
}

function centerText(s, y, color = colors.text, x = M, width = CW) {
  text(s, x + (width - approxWidth(s)) / 2, y, color);
}

function rightText(s, xRight, y, color = colors.text) {
  text(s, xRight - approxWidth(s), y, color);
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

function image(x, y, w, h) {
  add(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im1 Do Q`);
}

function pageBase() {
  rect(0, 0, W, H, colors.white);
}

function pushPage() {
  pages.push(ops.join("\n"));
  ops = [];
}

function section(title, y) {
  text(title, M, y, colors.ink);
  rect(M, y - 9, CW, 1.2, colors.cyan);
  return y - 28;
}

function paragraph(lines, y, color = colors.text) {
  for (const line of lines) {
    text(line, M, y, color);
    y -= 18;
  }
  return y;
}

function bullet(label, body, y) {
  text("-", M + 2, y, colors.cyan);
  text(`${label}:`, M + 18, y, colors.ink);
  const firstX = M + 18 + approxWidth(`${label}: `) + 4;
  const lines = wrap(body, 62);
  text(lines[0], firstX, y, colors.text);
  y -= 18;
  for (const line of lines.slice(1)) {
    text(line, M + 18, y, colors.text);
    y -= 18;
  }
  return y - 3;
}

function tableHeader(y) {
  rect(M, y - 30, CW, 30, colors.navy);
  text("Concepto", M + 9, y - 20, colors.white);
  text("Detalle operativo", M + 136, y - 20, colors.white);
  rightText("Inversion", W - M - 9, y - 20, colors.white);
  return y - 30;
}

function tableRow(y, concepto, detalle, importe) {
  const h = 64;
  rect(M, y - h, CW, h, colors.white, colors.line);
  text(concepto, M + 9, y - 22, colors.ink);
  wrap(detalle, 44).slice(0, 2).forEach((line, i) => {
    text(line, M + 136, y - 22 - i * 18, colors.text);
  });
  rightText(importe, W - M - 9, y - 22, colors.ink);
  return y - h;
}

function paymentCell(x, y, title, amount) {
  const w = 154;
  const h = 58;
  rect(x, y - h, w, h, colors.panel, colors.line);
  centerText(title, y - 23, colors.muted, x, w);
  centerText(amount, y - 43, colors.ink, x, w);
}

function footer(pageNo) {
  centerText(`BON DESTI ACCESS - Propuesta Comercial - Pagina ${pageNo}`, 24, [180, 190, 204], 0, W);
}

function writePageOne() {
  pageBase();

  const logoW = 255;
  const logoH = logoW * (headerImageSize.height / headerImageSize.width);
  image((W - logoW) / 2, H - 145, logoW, logoH);

  let y = H - 185;
  text("PROPUESTA COMERCIAL ACCESS", M, y, colors.ink);
  y -= 24;
  y = paragraph([
    "Preparado para: Bon Desti Complejo Residencial",
    "Fecha: 24/06/2026 | Validez: 15 dias",
    "Optimizacion tecnologica para la gestion de accesos y seguridad integral",
    "en entornos residenciales.",
  ], y, colors.muted);

  y -= 14;
  y = section("01. Alcance Tecnico", y);
  y = bullet("Sistema central", "Gestion de residentes, unidades funcionales y personal operativo.", y);
  y = bullet("Accesos inteligentes", "Invitaciones mediante codigos QR de uso unico o temporal.", y);
  y = bullet("Seguridad operativa", "Panel de guardia con registro en tiempo real de ingresos y egresos.", y);
  y = bullet("Emergencias", "Modulo de alerta sonora y visual con seguimiento de incidentes.", y);
  y = bullet("Capacitacion", "Formacion integral para seguridad, administracion y referentes.", y);

  y -= 12;
  y = section("02. Inversion del Proyecto", y);
  y = tableHeader(y);
  y = tableRow(y, "Desarrollo Web", "Arquitectura, interfaz, roles, flujos de seguridad y portal de residentes.", "ARS 1.440.000");
  y = tableRow(y, "Implementacion", "Despliegue cloud, configuracion de base de datos y puesta en marcha.", "ARS 405.000");
  y = tableRow(y, "Setup Inicial", "Carga de datos base, usuarios y parametrizacion de lotes.", "ARS 180.000");
  y = tableRow(y, "Capacitacion", "Entrenamiento tecnico al personal de seguridad y referentes.", "ARS 135.000");

  rect(M, y - 38, CW, 38, colors.panel, colors.line);
  text("INVERSION TOTAL INICIAL", M + 10, y - 24, colors.ink);
  rightText("ARS 2.160.000", W - M - 10, y - 24, colors.ink);

  footer(1);
  pushPage();
}

function writePageTwo() {
  pageBase();

  let y = H - 70;
  y = section("03. Forma de Pago", y);
  y = paragraph([
    "La inversion inicial se abona en 6 cuotas mensuales consecutivas.",
    "El acceso operativo queda habilitado con la primera cuota.",
  ], y, colors.text);

  y -= 12;
  const gap = 20;
  paymentCell(M, y, "CUOTA 1", "ARS 360.000");
  paymentCell(M + 154 + gap, y, "CUOTA 2", "ARS 360.000");
  paymentCell(M + (154 + gap) * 2, y, "CUOTA 3", "ARS 360.000");
  y -= 78;
  paymentCell(M, y, "CUOTA 4", "ARS 360.000");
  paymentCell(M + 154 + gap, y, "CUOTA 5", "ARS 360.000");
  paymentCell(M + (154 + gap) * 2, y, "CUOTA 6", "ARS 360.000");

  y -= 98;
  y = section("04. Mantenimiento y Soporte", y);
  rect(M, y - 82, CW, 82, colors.panel, colors.line);
  centerText("Abono mensual: ARS 112.500", y - 26, colors.ink);
  centerText("Continuidad operativa, soporte digital en horario laboral,", y - 48, colors.text);
  centerText("actualizaciones de seguridad y mejoras menores.", y - 66, colors.text);

  y -= 112;
  y = section("05. Terminos Generales", y);
  paragraph([
    "La propiedad de la informacion cargada pertenece exclusivamente al cliente.",
    "Desarrollos adicionales, hardware externo o integraciones no previstas se",
    "cotizan por separado. Alcance final sujeto a relevamiento tecnico formal.",
  ], y, colors.muted);

  footer(2);
  pushPage();
}

writePageOne();
writePageTwo();

const objects = [];
function obj(v) {
  objects.push(v);
  return objects.length;
}

const f1 = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Calibri >>");
const imageRef = obj(`<< /Type /XObject /Subtype /Image /Width ${headerImageSize.width} /Height ${headerImageSize.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${headerImage.length} >>\nstream\n${headerImage.toString("latin1")}\nendstream`);
const pageRefs = [];

pages.forEach((content) => {
  const contentRef = obj(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  const pageRef = obj(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R >> /XObject << /Im1 ${imageRef} 0 R >> >> /Contents ${contentRef} 0 R >>`);
  pageRefs.push(pageRef);
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
