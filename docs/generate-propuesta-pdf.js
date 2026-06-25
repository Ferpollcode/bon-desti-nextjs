const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "propuesta_bon_desti_final.pdf");

const W = 595.28;
const H = 841.89;
const M = 60;
const CW = W - M * 2;

const colors = {
  navy: [9, 27, 45],
  ink: [16, 31, 50],
  text: [47, 61, 82],
  muted: [119, 132, 151],
  line: [219, 226, 235],
  panel: [245, 248, 252],
  white: [255, 255, 255],
};

let pages = [];
let ops = [];

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

function line(x1, y1, x2, y2, color = colors.line, lw = 1) {
  add(`${rgb(color)} RG ${lw} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
}

function text(s, x, y, size = 10, color = colors.text, font = "F1") {
  add(`BT /${font} ${size} Tf ${rgb(color)} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${esc(s)}) Tj ET`);
}

function centerText(s, y, size = 10, color = colors.text, font = "F1", x = M, width = CW) {
  const approx = String(s).length * size * 0.48;
  text(s, x + (width - approx) / 2, y, size, color, font);
}

function rightText(s, xRight, y, size = 10, color = colors.text, font = "F1") {
  const approx = String(s).length * size * 0.48;
  text(s, xRight - approx, y, size, color, font);
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

function pageBase() {
  rect(0, 0, W, H, colors.white);
}

function header() {
  rect(0, H - 112, W, 112, colors.navy);
  centerText("BON DESTI", H - 54, 28, colors.white, "F2", 0, W);
  centerText("COMPLEJO RESIDENCIAL", H - 78, 8.5, [171, 184, 199], "F2", 0, W);
}

function sectionTitle(n, title, y) {
  centerText(`${n}. ${title}`, y, 11, colors.ink, "F2");
  return y - 28;
}

function footer() {
  centerText("BON DESTI ACCESS - Propuesta Comercial", 31, 6.5, [180, 190, 204], "F1", 0, W);
}

function bullet(label, body, y) {
  text("-", M + 3, y, 8.5, colors.ink, "F2");
  text(`${label}:`, M + 14, y, 8.3, colors.ink, "F2");
  const labelW = label.length * 8.3 * 0.5 + 7;
  const lines = wrap(body, 104);
  text(lines[0], M + 14 + labelW, y, 8.3, colors.text);
  let yy = y - 13;
  for (const l of lines.slice(1)) {
    text(l, M + 14, yy, 8.3, colors.text);
    yy -= 13;
  }
  return yy - 5;
}

function tableHeader(y) {
  rect(M, y - 25, CW, 25, colors.navy);
  text("Concepto", M + 12, y - 16, 7.5, colors.white, "F2");
  text("Detalle Operativo", M + 112, y - 16, 7.5, colors.white, "F2");
  rightText("Inversion", W - M - 12, y - 16, 7.5, colors.white, "F2");
  return y - 25;
}

function tableRow(y, concepto, detalle, importe, h = 48) {
  rect(M, y - h, CW, h, colors.white, colors.line);
  text(concepto, M + 12, y - 18, 7.5, colors.ink, "F2");
  wrap(detalle, 70).slice(0, 2).forEach((l, i) => {
    text(l, M + 112, y - 18 - i * 11, 7.4, colors.text);
  });
  rightText(importe, W - M - 12, y - 18, 7.5, colors.ink, "F2");
  return y - h;
}

function paymentBox(x, y, title, amount) {
  rect(x, y - 62, 132, 62, colors.panel, colors.line);
  centerText(title, y - 22, 6.7, colors.muted, "F2", x, 132);
  centerText(amount, y - 44, 11, colors.ink, "F2", x, 132);
}

function writePageOne() {
  pageBase();
  header();

  let y = H - 148;
  centerText("PROPUESTA COMERCIAL ACCESS", y, 12, colors.ink, "F2");
  y -= 27;
  centerText(
    "PREPARADO PARA: BON DESTI COMPLEJO RESIDENCIAL  |  FECHA: 24/06/2026  |  VALIDEZ: 15 DIAS",
    y,
    6.5,
    colors.muted,
    "F2",
  );
  y -= 39;
  centerText(
    "Optimizacion tecnologica para la gestion de accesos y seguridad integral en entornos residenciales de",
    y,
    7.3,
    colors.text,
  );
  centerText("categoria.", y - 12, 7.3, colors.text);

  y -= 55;
  y = sectionTitle("01", "Alcance Tecnico", y);
  y = bullet("Sistema Central", "Gestion de residentes, unidades funcionales y personal operativo.", y);
  y = bullet("Accesos Inteligentes", "Generacion de invitaciones mediante codigos QR de uso unico o temporal.", y);
  y = bullet("Seguridad Operativa", "Panel de control para guardia con registro en tiempo real de ingresos y egresos.", y);
  y = bullet("Emergencias", "Modulo de alerta sonora y visual con protocolo y seguimiento de incidentes.", y);
  y = bullet("Capacitacion", "Formacion profesional integral para el personal operativo y la administracion.", y);

  y -= 18;
  y = sectionTitle("02", "Inversion del Proyecto", y);
  y = tableHeader(y);
  y = tableRow(y, "Desarrollo Web", "Arquitectura, interfaz de usuario y portal de residentes.", "ARS 1.440.000");
  y = tableRow(y, "Implementacion", "Despliegue cloud, configuracion de base de datos y puesta en marcha.", "ARS 405.000");
  tableRow(y, "Setup Inicial", "Carga de datos base, usuarios y parametrizacion de lotes.", "ARS 180.000");

  footer();
  pages.push(ops.join("\n"));
  ops = [];
}

function writePageTwo() {
  pageBase();

  let y = H - 70;
  y = tableHeader(y);
  y = tableRow(y, "Capacitacion", "Entrenamiento tecnico al personal de seguridad y referentes.", "ARS 135.000");

  rect(M, y - 40, CW, 40, colors.white, colors.line);
  text("INVERSION TOTAL INICIAL", M + 12, y - 25, 8.5, colors.ink, "F2");
  rightText("ARS 2.160.000", W - M - 12, y - 25, 8.8, colors.ink, "F2");
  y -= 78;

  centerText("Forma de pago: La inversion inicial puede abonarse en 3 pagos mensuales consecutivos. El acceso se", y, 6.9, colors.text);
  centerText("habilita con el primer pago.", y - 11, 6.9, colors.text);
  y -= 39;

  paymentBox(M + 9, y, "PAGO 1 - INICIO", "ARS 720.000");
  paymentBox(M + 171, y, "PAGO 2 - MES 2", "ARS 720.000");
  paymentBox(M + 333, y, "PAGO 3 - MES 3", "ARS 720.000");

  y -= 96;
  y = sectionTitle("03", "Mantenimiento y Soporte", y);
  rect(M, y - 74, CW, 74, colors.panel, colors.line);
  centerText("Abono Mensual: ARS 112.500", y - 28, 11, colors.ink, "F2");
  centerText(
    "Garantia de continuidad operativa, soporte por canales digitales en horario laboral, actualizaciones",
    y - 49,
    7,
    colors.text,
  );
  centerText("de seguridad y mejoras menores. Hasta 5 horas mensuales incluidas.", y - 61, 7, colors.text);

  y -= 120;
  y = sectionTitle("04", "Terminos Generales", y);
  centerText(
    "La propiedad de la informacion cargada pertenece exclusivamente al cliente. Desarrollos adicionales o hardware",
    y,
    6.4,
    colors.muted,
  );
  centerText("externo se cotizan por separado. Alcance final sujeto a relevamiento tecnico formal.", y - 11, 6.4, colors.muted);

  pages.push(ops.join("\n"));
  ops = [];
}

writePageOne();
writePageTwo();

const objects = [];
function obj(v) {
  objects.push(v);
  return objects.length;
}

const f1 = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const f2 = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
const pageRefs = [];

pages.forEach((content) => {
  const stream = `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`;
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
