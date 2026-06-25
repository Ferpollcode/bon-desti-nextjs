const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "propuesta_bon_desti_final.pdf");

const W = 595.28;
const H = 841.89;
const M = 50;
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
  centerText("BON DESTI", H - 53, 31, colors.white, "F2", 0, W);
  centerText("COMPLEJO RESIDENCIAL", H - 80, 10, [171, 184, 199], "F2", 0, W);
}

function sectionTitle(n, title, y) {
  centerText(`${n}. ${title}`, y, 12.5, colors.ink, "F2");
  return y - 31;
}

function footer() {
  centerText("BON DESTI ACCESS - Propuesta Comercial", 31, 7.2, [180, 190, 204], "F1", 0, W);
}

function bullet(label, body, y) {
  text("-", M + 3, y, 9.7, colors.ink, "F2");
  text(`${label}:`, M + 16, y, 9.4, colors.ink, "F2");
  const labelW = label.length * 9.4 * 0.5 + 8;
  const lines = wrap(body, 92);
  text(lines[0], M + 16 + labelW, y, 9.4, colors.text);
  let yy = y - 15;
  for (const l of lines.slice(1)) {
    text(l, M + 16, yy, 9.4, colors.text);
    yy -= 15;
  }
  return yy - 6;
}

function tableHeader(y) {
  rect(M, y - 29, CW, 29, colors.navy);
  text("Concepto", M + 12, y - 18, 8.6, colors.white, "F2");
  text("Detalle Operativo", M + 122, y - 18, 8.6, colors.white, "F2");
  rightText("Inversion", W - M - 12, y - 18, 8.6, colors.white, "F2");
  return y - 29;
}

function tableRow(y, concepto, detalle, importe, h = 56) {
  rect(M, y - h, CW, h, colors.white, colors.line);
  text(concepto, M + 12, y - 21, 8.5, colors.ink, "F2");
  wrap(detalle, 64).slice(0, 2).forEach((l, i) => {
    text(l, M + 122, y - 21 - i * 13, 8.3, colors.text);
  });
  rightText(importe, W - M - 12, y - 21, 8.5, colors.ink, "F2");
  return y - h;
}

function paymentBox(x, y, title, amount) {
  rect(x, y - 68, 145, 68, colors.panel, colors.line);
  centerText(title, y - 24, 7.4, colors.muted, "F2", x, 145);
  centerText(amount, y - 48, 12.2, colors.ink, "F2", x, 145);
}

function writePageOne() {
  pageBase();
  header();

  let y = H - 148;
  centerText("PROPUESTA COMERCIAL ACCESS", y, 13.5, colors.ink, "F2");
  y -= 29;
  centerText(
    "PREPARADO PARA: BON DESTI COMPLEJO RESIDENCIAL  |  FECHA: 24/06/2026  |  VALIDEZ: 15 DIAS",
    y,
    7.3,
    colors.muted,
    "F2",
  );
  y -= 42;
  centerText(
    "Optimizacion tecnologica para la gestion de accesos y seguridad integral en entornos residenciales de",
    y,
    8.4,
    colors.text,
  );
  centerText("categoria.", y - 14, 8.4, colors.text);

  y -= 58;
  y = sectionTitle("01", "Alcance Tecnico", y);
  y = bullet("Sistema Central", "Gestion de residentes, unidades funcionales y personal operativo.", y);
  y = bullet("Accesos Inteligentes", "Generacion de invitaciones mediante codigos QR de uso unico o temporal.", y);
  y = bullet("Seguridad Operativa", "Panel de control para guardia con registro en tiempo real de ingresos y egresos.", y);
  y = bullet("Emergencias", "Modulo de alerta sonora y visual con protocolo y seguimiento de incidentes.", y);
  y = bullet("Capacitacion", "Formacion profesional integral para el personal operativo y la administracion.", y);

  y -= 20;
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

  rect(M, y - 46, CW, 46, colors.white, colors.line);
  text("INVERSION TOTAL INICIAL", M + 12, y - 29, 9.6, colors.ink, "F2");
  rightText("ARS 2.160.000", W - M - 12, y - 29, 10, colors.ink, "F2");
  y -= 84;

  centerText("Forma de pago: La inversion inicial puede abonarse en 3 pagos mensuales consecutivos. El acceso se", y, 7.9, colors.text);
  centerText("habilita con el primer pago.", y - 13, 7.9, colors.text);
  y -= 42;

  paymentBox(M, y, "PAGO 1 - INICIO", "ARS 720.000");
  paymentBox(M + 175, y, "PAGO 2 - MES 2", "ARS 720.000");
  paymentBox(M + 350, y, "PAGO 3 - MES 3", "ARS 720.000");

  y -= 104;
  y = sectionTitle("03", "Mantenimiento y Soporte", y);
  rect(M, y - 84, CW, 84, colors.panel, colors.line);
  centerText("Abono Mensual: ARS 112.500", y - 31, 12.4, colors.ink, "F2");
  centerText(
    "Garantia de continuidad operativa, soporte por canales digitales en horario laboral, actualizaciones",
    y - 56,
    8,
    colors.text,
  );
  centerText("de seguridad y mejoras menores. Hasta 5 horas mensuales incluidas.", y - 70, 8, colors.text);

  y -= 132;
  y = sectionTitle("04", "Terminos Generales", y);
  centerText(
    "La propiedad de la informacion cargada pertenece exclusivamente al cliente. Desarrollos adicionales o hardware",
    y,
    7.3,
    colors.muted,
  );
  centerText("externo se cotizan por separado. Alcance final sujeto a relevamiento tecnico formal.", y - 13, 7.3, colors.muted);

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
