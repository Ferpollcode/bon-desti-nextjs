const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "propuesta_bon_desti_final.pdf");
const headerImagePath = path.join(__dirname, "ferpoll-code-header.jpeg");
const headerImage = fs.readFileSync(headerImagePath);
const headerImageSize = jpegSize(headerImage);

const W = 595.28;
const H = 841.89;
const M = 42;
const CW = W - M * 2;

const colors = {
  navy: [9, 27, 45],
  cyan: [24, 177, 212],
  ink: [18, 32, 50],
  text: [55, 68, 88],
  muted: [116, 129, 146],
  line: [218, 226, 236],
  panel: [246, 249, 252],
  white: [255, 255, 255],
};

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

function text(s, x, y, size = 9, color = colors.text, font = "F1") {
  add(`BT /${font} ${size} Tf ${rgb(color)} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${esc(s)}) Tj ET`);
}

function approxWidth(s, size) {
  return String(s).length * size * 0.48;
}

function centerText(s, y, size = 9, color = colors.text, font = "F1", x = M, width = CW) {
  text(s, x + (width - approxWidth(s, size)) / 2, y, size, color, font);
}

function rightText(s, xRight, y, size = 9, color = colors.text, font = "F1") {
  text(s, xRight - approxWidth(s, size), y, size, color, font);
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

function section(title, y) {
  text(title, M, y, 10.2, colors.ink, "F2");
  rect(M, y - 9, CW, 1.1, colors.cyan);
  return y - 22;
}

function bullet(label, body, y) {
  text("-", M + 2, y, 8.2, colors.cyan, "F2");
  text(`${label}:`, M + 13, y, 7.9, colors.ink, "F2");
  const startX = M + 13 + approxWidth(`${label}:`, 7.9) + 5;
  const lines = wrap(body, 88);
  text(lines[0], startX, y, 7.9, colors.text);
  let yy = y - 11;
  for (const line of lines.slice(1)) {
    text(line, M + 13, yy, 7.9, colors.text);
    yy -= 11;
  }
  return yy - 2;
}

function tableHeader(y) {
  rect(M, y - 22, CW, 22, colors.navy);
  text("Concepto", M + 8, y - 14, 7.3, colors.white, "F2");
  text("Detalle operativo", M + 116, y - 14, 7.3, colors.white, "F2");
  rightText("Inversion", W - M - 8, y - 14, 7.3, colors.white, "F2");
  return y - 22;
}

function tableRow(y, concepto, detalle, importe) {
  const h = 36;
  rect(M, y - h, CW, h, colors.white, colors.line);
  text(concepto, M + 8, y - 14, 7.4, colors.ink, "F2");
  wrap(detalle, 72).slice(0, 2).forEach((line, i) => {
    text(line, M + 116, y - 14 - i * 10, 7.2, colors.text);
  });
  rightText(importe, W - M - 8, y - 14, 7.4, colors.ink, "F2");
  return y - h;
}

function paymentCell(x, y, title, amount) {
  const w = 76;
  const h = 42;
  rect(x, y - h, w, h, colors.panel, colors.line);
  centerText(title, y - 15, 6.2, colors.muted, "F2", x, w);
  centerText(amount, y - 31, 8, colors.ink, "F2", x, w);
}

function writePdfContent() {
  rect(0, 0, W, H, colors.white);

  const logoW = 330;
  const logoH = logoW * (headerImageSize.height / headerImageSize.width);
  image((W - logoW) / 2, H - 178, logoW, logoH);

  let y = H - 205;
  centerText("PROPUESTA COMERCIAL ACCESS", y, 12, colors.ink, "F2");
  y -= 19;
  centerText("Preparado para: Bon Desti Complejo Residencial | Fecha: 24/06/2026 | Validez: 15 dias", y, 7.4, colors.muted, "F2");
  y -= 21;
  centerText("Optimizacion tecnologica para la gestion de accesos y seguridad integral en entornos residenciales.", y, 8, colors.text);

  y -= 29;
  y = section("01. Alcance Tecnico", y);
  y = bullet("Sistema central", "Gestion de residentes, unidades funcionales y personal operativo.", y);
  y = bullet("Accesos inteligentes", "Invitaciones mediante codigos QR de uso unico o temporal.", y);
  y = bullet("Seguridad operativa", "Panel de guardia con registro en tiempo real de ingresos y egresos.", y);
  y = bullet("Emergencias", "Modulo de alerta sonora y visual con seguimiento de incidentes.", y);
  y = bullet("Capacitacion", "Formacion integral para seguridad, administracion y referentes.", y);

  y -= 9;
  y = section("02. Inversion del Proyecto", y);
  y = tableHeader(y);
  y = tableRow(y, "Desarrollo Web", "Arquitectura, interfaz, roles, flujos de seguridad y portal de residentes.", "ARS 1.440.000");
  y = tableRow(y, "Implementacion", "Despliegue cloud, configuracion de base de datos y puesta en marcha.", "ARS 405.000");
  y = tableRow(y, "Setup Inicial", "Carga de datos base, usuarios y parametrizacion de lotes.", "ARS 180.000");
  y = tableRow(y, "Capacitacion", "Entrenamiento tecnico al personal de seguridad y referentes.", "ARS 135.000");

  rect(M, y - 28, CW, 28, colors.panel, colors.line);
  text("INVERSION TOTAL INICIAL", M + 10, y - 18, 8.2, colors.ink, "F2");
  rightText("ARS 2.160.000", W - M - 10, y - 18, 8.6, colors.ink, "F2");
  y -= 49;

  y = section("03. Forma de Pago", y);
  text("La inversion inicial se abona en 6 cuotas mensuales consecutivas. El acceso operativo queda habilitado con la primera cuota.", M, y, 7.7, colors.text);
  y -= 15;
  const gap = 11;
  const x0 = M;
  for (let i = 0; i < 6; i++) {
    paymentCell(x0 + i * (76 + gap), y, `CUOTA ${i + 1}`, "ARS 360.000");
  }
  y -= 62;

  y = section("04. Mantenimiento y Soporte", y);
  rect(M, y - 48, CW, 48, colors.panel, colors.line);
  centerText("Abono mensual: ARS 112.500", y - 18, 10.2, colors.ink, "F2");
  centerText("Continuidad operativa, soporte digital en horario laboral, actualizaciones de seguridad y mejoras menores.", y - 34, 7.4, colors.text);
  centerText("Incluye hasta 5 horas mensuales.", y - 44, 7.4, colors.text);
  y -= 70;

  y = section("05. Terminos Generales", y);
  text("La propiedad de la informacion cargada pertenece exclusivamente al cliente. Desarrollos adicionales,", M, y, 7.1, colors.muted);
  text("hardware externo o integraciones no previstas se cotizan por separado. Alcance final sujeto a relevamiento tecnico formal.", M, y - 10, 7.1, colors.muted);

  centerText("BON DESTI ACCESS - Propuesta Comercial", 24, 6.8, [180, 190, 204], "F1", 0, W);
}

writePdfContent();
const content = ops.join("\n");

const objects = [];
function obj(v) {
  objects.push(v);
  return objects.length;
}

const f1 = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const f2 = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
const imageRef = obj(`<< /Type /XObject /Subtype /Image /Width ${headerImageSize.width} /Height ${headerImageSize.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${headerImage.length} >>\nstream\n${headerImage.toString("latin1")}\nendstream`);
const contentRef = obj(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
const pageRef = obj(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> /XObject << /Im1 ${imageRef} 0 R >> >> /Contents ${contentRef} 0 R >>`);
const pagesRef = obj(`<< /Type /Pages /Kids [${pageRef} 0 R] /Count 1 >>`);
objects[pageRef - 1] = objects[pageRef - 1].replace("/Parent 0 0 R", `/Parent ${pagesRef} 0 R`);
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
