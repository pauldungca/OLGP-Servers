import jsPDF from "jspdf";
import Swal from "sweetalert2";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "../../utils/supabase";
import image from "../../helper/images";

import { getTemplateMassType } from "./fetchSchedule";

/** US Letter page in points */
const PAGE_W = 816;
const PAGE_H = 1056;
const MARGIN = 28;
const HEADER_H = 120;
const FOOTER_H = 32;

/** Fonts */
const FONT_HEADER_TITLE = 26;
const FONT_HEADER_SUB = 14.5;
const FONT_HEADER_CENTER1 = 18;
const FONT_HEADER_CENTER2 = 16;
const FONT_LABEL = 15.5;
const FONT_VALUE = 15.5;

/** Spacing */
const ROW_EXTRA_SPACING = 6;
const PLATES_LINE_GAP = 35;
const MASS_LINE_TO_TITLE_GAP = 30;
const TITLE_TO_ROLES_GAP = 40;
const COLUMN_GAP = -50;

/** Helpers */
const prettyDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const fullName = (m) => {
  const mi = m?.middleName
    ? ` ${String(m.middleName).charAt(0).toUpperCase()}.`
    : "";
  return `${m?.firstName || ""}${mi} ${m?.lastName || ""}`.trim();
};

async function fetchGrouped(dateISO) {
  const { data: rows, error } = await supabase
    .from("altar-server-placeholder")
    .select("*")
    .eq("date", dateISO)
    .order("slot", { ascending: true });
  if (error) throw error;

  if (!rows?.length) return {};
  const ids = [...new Set(rows.map((r) => r.idNumber).filter(Boolean))];

  let map = {};
  if (ids.length) {
    const { data: members, error: memErr } = await supabase
      .from("members-information")
      .select("idNumber, firstName, middleName, lastName")
      .in("idNumber", ids);
    if (memErr) throw memErr;
    map = (members || []).reduce((a, m) => {
      a[String(m.idNumber)] = fullName(m);
      return a;
    }, {});
  }

  const grouped = {};
  for (const r of rows) {
    const mass = r.mass || "Mass";
    const role = r.role === "plates" ? "plate" : r.role;
    const name = map[String(r.idNumber)] || "";
    grouped[mass] ||= {};
    (grouped[mass][role] ||= []).push(name);
  }
  return grouped;
}

function chunk(arr = [], size = 3) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** ---------------------- PDF RENDER HELPERS ---------------------- */
function underlineToText(pdf, text, x, y, maxRight = PAGE_W - MARGIN) {
  const width = pdf.getTextWidth(text || "");
  const endX = Math.min(x + width + 1, maxRight);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.9);
  pdf.line(x, y + 5, endX, y + 5);
}

function roleRow(pdf, { x, y, label, value, labelW }) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(FONT_LABEL);
  pdf.text(label, x, y);

  const textX = x + labelW;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(FONT_VALUE);
  if (value) pdf.text(value, textX, y);

  underlineToText(pdf, value || "", textX, y);
  return y + ROW_EXTRA_SPACING;
}

function platesTwoRows(pdf, { x, y, namesArr, labelW }) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(FONT_LABEL);
  pdf.text("Plates:", x, y);

  const textX = x + labelW;
  const safe = Array.isArray(namesArr) ? namesArr.filter(Boolean) : [];
  const row1 = safe.slice(0, 5).join(" | ");
  const row2 = safe.slice(5, 10).join(" | ");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(FONT_VALUE);

  if (row1) pdf.text(row1, textX, y);
  underlineToText(pdf, row1, textX, y);

  const y2 = y + PLATES_LINE_GAP;
  if (row2) pdf.text(row2, textX, y2);
  underlineToText(pdf, row2, textX, y2);

  return y2;
}

async function drawHeader(pdf, department, dateISO, isSunday, centerLabel) {
  const y0 = MARGIN;

  try {
    await pdf.addImage(image.OLGPlogo, "PNG", MARGIN, y0, 52, 52);
  } catch {}

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(FONT_HEADER_TITLE);
  pdf.text("Our Lady of Guadalupe Parish", MARGIN + 66, y0 + 24);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(FONT_HEADER_SUB);
  pdf.text(department, MARGIN + 66, y0 + 44);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(FONT_HEADER_CENTER1);
  pdf.text(`Schedule for ${prettyDate(dateISO)}`, PAGE_W / 2, y0 + 82, {
    align: "center",
  });

  // Only show centerLabel if it has actual content (not null, undefined, or empty string)
  const label =
    centerLabel && centerLabel.trim()
      ? centerLabel.trim()
      : isSunday
      ? "Sunday Mass"
      : "";

  if (label) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(FONT_HEADER_CENTER2);
    pdf.text(label, PAGE_W / 2, y0 + 104, { align: "center" });
  }

  return y0 + HEADER_H;
}

async function renderSchedulePageHTML({
  grouped,
  masses,
  department,
  dateISO,
  centerLabel = "Sunday Mass",
}) {
  const logoHtml = `<img src="${image.OLGPlogo}" class="logo" alt="OLGP Logo">`;

  // Only show centerLabel if it has actual content (not null, undefined, or empty string)
  const displayLabel =
    centerLabel && centerLabel.trim() ? centerLabel.trim() : "";

  const header = `
    <div class="header">
      <div class="logo-title-section">
        <div class="logo-container">
          ${logoHtml}
        </div>
        <div class="title-container">
          <h1 class="main-title">Our Lady of Guadalupe Parish</h1>
          <h2 class="subtitle">${department}</h2>
        </div>
      </div>
      <div class="center-heading">
        <h3 class="schedule-title">Schedule for ${prettyDate(dateISO)}</h3>
        ${displayLabel ? `<h4 class="mass-type">${displayLabel}</h4>` : ""}
      </div>
    </div>
  `;

  const sections = masses
    .map((mass) => renderMassSectionHTML(mass, grouped[mass] || {}))
    .join("");

  const footer = `
    <div class="footer">
      <span class="footer-date">Generated: ${new Date().toLocaleDateString()}</span>
    </div>
  `;

  return `
    <div class="page">
      ${header}
      <div class="content">${sections}</div>
      ${footer}
    </div>
  `;
}
function drawFooter(pdf) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    MARGIN,
    PAGE_H - MARGIN + 7
  );
}

function drawMassSection(
  pdf,
  { massLabel, roles, sectionTop, sectionHeight, compact = false }
) {
  let y = sectionTop;

  // dotted separator
  pdf.setDrawColor(185);
  pdf.setLineWidth(0.6);
  pdf.setLineDashPattern([3, 3], 0);
  pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
  pdf.setLineDashPattern([], 0);

  // title
  y += MASS_LINE_TO_TITLE_GAP;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(massLabel, MARGIN, y);

  // roles gap
  y += TITLE_TO_ROLES_GAP;

  const totalW = PAGE_W - MARGIN * 2;
  const colW = (totalW - COLUMN_GAP) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colW + COLUMN_GAP;

  const labelWLeft = 120;
  const labelWRight = 120;

  // ✅ compact spacing when only one mass (match print)
  let rowStep;
  if (compact) {
    rowStep = 28; // fixed spacing similar to print CSS
  } else {
    const usableH = sectionHeight - (y - sectionTop) - 10;
    const steps = 5;
    rowStep = Math.max(24, usableH / steps);
  }

  // LEFT
  let yL = y;
  yL =
    roleRow(pdf, {
      x: leftX,
      y: yL,
      label: "Thurifer:",
      value: (roles.thurifer || []).filter(Boolean).join(" | "),
      labelW: labelWLeft,
    }) +
    rowStep -
    ROW_EXTRA_SPACING;

  yL =
    roleRow(pdf, {
      x: leftX,
      y: yL,
      label: "Incense Bearer:",
      value: (roles.incenseBearer || []).filter(Boolean).join(" | "),
      labelW: labelWLeft,
    }) +
    rowStep -
    ROW_EXTRA_SPACING;

  yL =
    roleRow(pdf, {
      x: leftX,
      y: yL,
      label: "Cross Bearer:",
      value: (roles.crossBearer || []).filter(Boolean).join(" | "),
      labelW: labelWLeft,
    }) +
    rowStep -
    ROW_EXTRA_SPACING;

  const yPlateLast = platesTwoRows(pdf, {
    x: leftX,
    y: yL,
    namesArr: roles.plate || [],
    labelW: labelWLeft,
  });
  yL = yPlateLast + (compact ? 6 : rowStep * 0.15);

  // RIGHT
  let yR = y;
  yR =
    roleRow(pdf, {
      x: rightX,
      y: yR,
      label: "Bellers:",
      value: (roles.beller || []).filter(Boolean).join(" | "),
      labelW: labelWRight,
    }) +
    rowStep -
    ROW_EXTRA_SPACING;

  yR =
    roleRow(pdf, {
      x: rightX,
      y: yR,
      label: "Candle Bearers:",
      value: (roles.candleBearer || []).filter(Boolean).join(" | "),
      labelW: labelWRight,
    }) +
    rowStep -
    ROW_EXTRA_SPACING;

  yR =
    roleRow(pdf, {
      x: rightX,
      y: yR,
      label: "Main Servers:",
      value: (roles.mainServer || []).filter(Boolean).join(" | "),
      labelW: labelWRight,
    }) +
    rowStep -
    ROW_EXTRA_SPACING;

  // bottom separator
  const sepY = Math.max(yL, yR) + (compact ? 18 : 12);
  pdf.setDrawColor(185);
  pdf.setLineWidth(0.6);
  pdf.setLineDashPattern([3, 3], 0);
  pdf.line(MARGIN, sepY, PAGE_W - MARGIN, sepY);
  pdf.setLineDashPattern([], 0);

  return sepY + 6;
}

/** ---------------------- PDF EXPORT ---------------------- */
export async function exportAltarServerSchedulesPDF({
  dateISO,
  isSunday = true,
  department = "Altar Servers",
  templateID,
} = {}) {
  try {
    if (!dateISO) {
      await Swal.fire("Missing date", "Please select a date first.", "error");
      return;
    }

    const grouped = await fetchGrouped(dateISO);
    const allMasses = Object.keys(grouped);
    if (!allMasses.length) {
      await Swal.fire("No data", "No assignments found for that date.", "info");
      return;
    }

    const { sunday, template } = splitMasses(allMasses);
    const pdf = new jsPDF("p", "pt", [PAGE_W, PAGE_H]);

    // helper to render one page with a set of masses
    const renderMassPage = async (masses, centerLabel) => {
      // Normalize: treat null/empty as undefined so drawHeader can decide the default
      const label = centerLabel ?? undefined;

      const top = await drawHeader(pdf, department, dateISO, isSunday, label);
      const bottom = PAGE_H - MARGIN - FOOTER_H;
      const totalH = bottom - top;

      const single = masses.length === 1;
      const sectionH = single ? 320 : totalH / masses.length;

      masses.forEach((mass, i) => {
        const sectionTop = single ? top : top + i * sectionH;
        drawMassSection(pdf, {
          massLabel: mass,
          roles: grouped[mass] || {},
          sectionTop,
          sectionHeight: sectionH,
          compact: single,
        });
      });

      drawFooter(pdf);
    };

    // Page 1+: Sunday masses, 3 per page
    if (sunday.length) {
      const pages = chunk(sunday, 3);
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage([PAGE_W, PAGE_H]);
        await renderMassPage(pages[i], "Sunday Mass");
      }
    }

    // Page N+: Template masses, 3 per page
    if (template.length) {
      const type = await getTemplateMassType(templateID);
      const centerLabel = type;
      const pages = chunk(template, 3);
      for (let i = 0; i < pages.length; i++) {
        // Only add a page if we've already rendered any page (Sunday or earlier template)
        if (i > 0 || sunday.length > 0) {
          pdf.addPage([PAGE_W, PAGE_H]);
        }
        await renderMassPage(pages[i], centerLabel);
      }
    }
    pdf.save(`altar-server-schedule-${dateISO}.pdf`);
  } catch (e) {
    console.error("PDF export failed:", e);
    await Swal.fire("Error", "Failed to export schedule PDF.", "error");
  }
}

/** ---------------------- PNG EXPORT ---------------------- */
export async function exportAltarServerSchedulesPNG({
  dateISO,
  isSunday = true,
  department = "Altar Servers",
  templateID,
} = {}) {
  try {
    if (!dateISO) {
      await Swal.fire("Missing date", "Please select a date first.", "error");
      return;
    }

    const grouped = await fetchGrouped(dateISO);
    const allMasses = Object.keys(grouped);
    if (!allMasses.length) {
      await Swal.fire("No data", "No assignments found for that date.", "info");
      return;
    }

    const { sunday, template } = splitMasses(allMasses);

    // small canvas "pdf" shim (same as your current code)
    const makeCanvasCtx = () => {
      const canvas = document.createElement("canvas");
      canvas.width = PAGE_W;
      canvas.height = PAGE_H;
      const ctx = canvas.getContext("2d");
      let currentFontSize = 12;
      let currentFontWeight = "normal";
      ctx.font = `${currentFontWeight} ${currentFontSize}px Arial`;
      const fakePDF = {
        addImage: (src, _t, x, y, w, h) =>
          new Promise((res, rej) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            img.onload = () => {
              ctx.drawImage(img, x, y, w, h);
              res();
            };
            img.onerror = rej;
          }),
        setFont: (_f, weight) => {
          currentFontWeight = weight === "bold" ? "bold" : "normal";
          ctx.font = `${currentFontWeight} ${currentFontSize}px Arial`;
        },
        setFontSize: (size) => {
          currentFontSize = size;
          ctx.font = `${currentFontWeight} ${currentFontSize}px Arial`;
        },
        setDrawColor: (r, g, b) => {
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
        },
        setLineWidth: (w) => {
          ctx.lineWidth = w;
        },
        setLineDashPattern: (p) => {
          ctx.setLineDash(p);
        },
        line: (x1, y1, x2, y2) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        },
        text: (t, x, y, opt = {}) => {
          ctx.textAlign = opt.align === "center" ? "center" : "start";
          ctx.fillStyle = "#000";
          ctx.fillText(t, x, y);
        },
        getTextWidth: (t) => ctx.measureText(t || "").width,
        _canvas: canvas,
        _ctx: ctx,
      };
      return fakePDF;
    };

    const renderPageToPNG = async (masses, centerLabel) => {
      const fakePDF = makeCanvasCtx();
      const { _canvas: canvas, _ctx: ctx } = fakePDF;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const top = await drawHeader(
        fakePDF,
        department,
        dateISO,
        isSunday,
        centerLabel
      );
      const bottom = PAGE_H - MARGIN - FOOTER_H;
      const totalH = bottom - top;

      const single = masses.length === 1;
      const sectionH = single ? 320 : totalH / masses.length;

      masses.forEach((mass, i) => {
        const sectionTop = single ? top : top + i * sectionH;
        drawMassSection(fakePDF, {
          massLabel: mass,
          roles: grouped[mass] || {},
          sectionTop,
          sectionHeight: sectionH,
          compact: single,
        });
      });

      drawFooter(fakePDF);
      return canvas.toDataURL("image/png");
    };

    const zip = new JSZip();

    // Sunday pages
    if (sunday.length) {
      const pages = chunk(sunday, 3);
      for (let i = 0; i < pages.length; i++) {
        const img = await renderPageToPNG(pages[i], "Sunday Mass");
        zip.file(
          `altar-server-schedule-${dateISO}-sunday-${i + 1}.png`,
          img.split(",")[1],
          { base64: true }
        );
      }
    }

    // Template pages
    if (template.length) {
      const type = await getTemplateMassType(templateID);
      const centerLabel = type;
      const pages = chunk(template, 3);
      for (let i = 0; i < pages.length; i++) {
        const img = await renderPageToPNG(pages[i], centerLabel);
        zip.file(
          `altar-server-schedule-${dateISO}-template-${i + 1}.png`,
          img.split(",")[1],
          { base64: true }
        );
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `altar-server-schedule-${dateISO}.zip`);
  } catch (e) {
    console.error("PNG export failed:", e);
    await Swal.fire("Error", "Failed to export schedule PNG.", "error");
  }
}

/** ---------------------- PRINT ---------------------- */
export async function printAltarServerSchedules({
  dateISO,
  isSunday = true,
  department = "Altar Servers",
  templateID,
} = {}) {
  try {
    if (!dateISO) {
      await Swal.fire("Error", "Please select a date first.", "error");
      return;
    }

    const grouped = await fetchGrouped(dateISO);
    const allMasses = Object.keys(grouped);
    if (!allMasses.length) {
      await Swal.fire("Info", "No assignments found for that date.", "info");
      return;
    }

    const { sunday, template } = splitMasses(allMasses);

    const pages = [];

    // Sunday pages
    if (sunday.length) {
      for (const group of chunk(sunday, 3)) {
        pages.push(
          await renderSchedulePageHTML({
            grouped,
            masses: group,
            department,
            dateISO,
            centerLabel: "Sunday Mass",
          })
        );
      }
    }

    // Template pages
    if (template.length) {
      const type = await getTemplateMassType(templateID);
      const centerLabel = type;
      for (const group of chunk(template, 3)) {
        pages.push(
          await renderSchedulePageHTML({
            grouped,
            masses: group,
            department,
            dateISO,
            centerLabel,
          })
        );
      }
    }

    const html = pages.join("");

    const w = window.open("", "_blank", "width=816,height=1056");
    if (!w) {
      await Swal.fire(
        "Popup Blocked",
        "Please allow popups to print.",
        "error"
      );
      return;
    }
    w.document.open();
    w.document.write(`
      <html>
        <head>
          <title>Schedule (${dateISO})</title>
          <style>${getSchedulePrintStyles()}</style>
        </head>
        <body>${html}</body>
      </html>
    `);
    w.document.close();
    w.onload = () => {
      w.focus();
      w.print();
      w.close();
    };
  } catch (err) {
    console.error("Print failed:", err);
    await Swal.fire(
      "Error",
      "Unexpected error occurred while printing.",
      "error"
    );
  }
}

function renderMassSectionHTML(massLabel, rolesObj) {
  const j = (arr) =>
    Array.isArray(arr) ? arr.filter(Boolean).join(" | ") : "";
  const plates = Array.isArray(rolesObj.plate)
    ? rolesObj.plate.filter(Boolean)
    : [];
  const row1 = j(plates.slice(0, 5));
  const row2 = j(plates.slice(5, 10));

  return `
    <div class="mass-section">
      <div class="dotted-line"></div>
      <div class="mass-title">${massLabel}</div>

      <div class="roles-container">
        <!-- LEFT column (no plates here) -->
        <div class="left-column">
          <div class="role-row">
            <span class="role-label">Thurifer:</span>
            <span class="role-value">${j(rolesObj.thurifer)}</span>
          </div>
          <div class="role-row">
            <span class="role-label">Incense Bearer:</span>
            <span class="role-value">${j(rolesObj.incenseBearer)}</span>
          </div>
          <div class="role-row">
            <span class="role-label">Cross Bearer:</span>
            <span class="role-value">${j(rolesObj.crossBearer)}</span>
          </div>
        </div>

        <!-- RIGHT column -->
        <div class="right-column">
          <div class="role-row">
            <span class="role-label">Bellers:</span>
            <span class="role-value">${j(rolesObj.beller)}</span>
          </div>
          <div class="role-row">
            <span class="role-label">Candle Bearers:</span>
            <span class="role-value">${j(rolesObj.candleBearer)}</span>
          </div>
          <div class="role-row">
            <span class="role-label">Main Servers:</span>
            <span class="role-value">${j(rolesObj.mainServer)}</span>
          </div>
        </div>

        <!-- PLATES spans BOTH columns, like the PDF -->
        <div class="plates-row">
          <div class="role-row">
            <span class="role-label">Plates:</span>
            <span class="role-value nowrap">${row1}</span>
          </div>
          ${
            row2
              ? `<div class="role-row plates-second">
                   <span class="role-label"></span>
                   <span class="role-value nowrap">${row2}</span>
                 </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function getSchedulePrintStyles() {
  return `
  @page { size: 8.5in 11in; margin: 0; }

  /* lock to letter size, remove UA margins */
  html, body { margin: 0; padding: 0; width: 816px; height: 1056px; background: #fff; }
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; }

  /* page canvas */
  .page { width: 816px; height: 1056px; padding: 28px; margin: 0; background: #fff; position: relative; }

  /* header */
  .header { margin-bottom: 20px; }
  .logo-title-section { display: flex; align-items: flex-start; }
  .logo-container { width: 52px; height: 52px; margin-right: 14px; }
  .logo { width: 52px; height: 52px; display: block; }
  .title-container { flex: 1; margin-top: 6px; }
  .main-title { font-weight: 700; font-size: 26px; line-height: 1.1; }
  .subtitle { font-weight: 400; font-size: 14.5px; margin-top: 8px; }
  .center-heading { text-align: center; margin-top: 22px; }
  .schedule-title { font-weight: 700; font-size: 18px; }
  .mass-type { font-weight: 400; font-size: 16px; margin-top: 6px; }

  /* sections */
  .content { margin-top: 30px; }
  .mass-section { margin-top: 18px; }
  .mass-section:first-child { margin-top: 0; }
  .dotted-line { border-top: 0.6px dashed #b9b9b9; margin-bottom: 14px; }
  .mass-title { font-weight: 700; font-size: 15px; margin-bottom: 16px; }

  /* two columns */
  .roles-container { display: grid; grid-template-columns: 1fr 1fr; column-gap: 14px; }

  /* role rows */
  .role-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
  .role-label { width: 120px; flex: 0 0 120px; font-weight: 700; font-size: 15.5px; }

  /* underline only the text width; keep on one line (matches PDF/PNG) */
  .role-value {
    font-size: 15.5px;
    display: inline-block;
    white-space: nowrap;
    border-bottom: 0.9px solid #000;
    padding-bottom: 5px;
  }

  /* Plates spans BOTH columns; give extra space between the two plate lines */
  .plates-row { grid-column: 1 / -1; margin-top: 8px; }
  .plates-second { margin-top: 25px; }

  /* footer */
  .footer { position: absolute; bottom: 28px; left: 28px; right: 28px; font-size: 10.5px; }

  @media print {
    html, body { width: 816px; height: 1056px; }
    .page { page-break-inside: avoid; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  `;
}

const isSundayMassLabel = (label = "") =>
  /^(?:\d+(?:st|nd|rd|th)\s+Mass)/i.test(label);

const isTemplateMassLabel = (label = "") => /^Mass\s*-\s*/i.test(label);

function splitMasses(masses) {
  const sunday = [];
  const template = [];
  for (const m of masses) {
    if (isSundayMassLabel(m)) sunday.push(m);
    else if (isTemplateMassLabel(m)) template.push(m);
    else sunday.push(m); // fallback: treat unknown labels as Sunday
  }
  // Sort numerically for "1st/2nd/3rd", then by time for template
  sunday.sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));
  template.sort((a, b) => (a || "").localeCompare(b || ""));
  return { sunday, template };
}

export async function exportLectorCommentatorSchedulesPDF({
  dateISO,
  isSunday = true,
  department = "Lector Commentator",
  templateID,
} = {}) {
  try {
    if (!dateISO) {
      await Swal.fire("Missing date", "Please select a date first.", "error");
      return;
    }

    const grouped = await fetchGrouped(dateISO); // Fetch the assigned members
    const allMasses = Object.keys(grouped); // Get the list of masses for the date
    if (!allMasses.length) {
      await Swal.fire("No data", "No assignments found for that date.", "info");
      return;
    }

    const { sunday, template } = splitMasses(allMasses); // Split the masses into Sunday and template
    const pdf = new jsPDF("p", "pt", [PAGE_W, PAGE_H]);

    // Helper to render one page with a set of masses
    const renderMassPage = async (masses, centerLabel) => {
      const label = centerLabel ?? undefined;

      const top = await drawHeader(pdf, department, dateISO, isSunday, label);
      const bottom = PAGE_H - MARGIN - FOOTER_H;
      const totalH = bottom - top;

      const single = masses.length === 1;
      const sectionH = single ? 320 : totalH / masses.length;

      masses.forEach((mass, i) => {
        const sectionTop = single ? top : top + i * sectionH;
        drawMassSection(pdf, {
          massLabel: mass,
          roles: grouped[mass] || {},
          sectionTop,
          sectionHeight: sectionH,
          compact: single,
        });
      });

      drawFooter(pdf);
    };

    // Sunday pages
    if (sunday.length) {
      const pages = chunk(sunday, 3);
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage([PAGE_W, PAGE_H]);
        await renderMassPage(pages[i], "Sunday Mass");
      }
    }

    // Template pages
    if (template.length) {
      const type = await getTemplateMassType(templateID);
      const centerLabel = type;
      const pages = chunk(template, 3);
      for (let i = 0; i < pages.length; i++) {
        if (i > 0 || sunday.length > 0) {
          pdf.addPage([PAGE_W, PAGE_H]);
        }
        await renderMassPage(pages[i], centerLabel);
      }
    }
    pdf.save(`lector-commentator-schedule-${dateISO}.pdf`);
  } catch (e) {
    console.error("PDF export failed:", e);
    await Swal.fire("Error", "Failed to export schedule PDF.", "error");
  }
}

export async function exportLectorCommentatorSchedulesPNG({
  dateISO,
  isSunday = true,
  department = "Lector Commentator",
  templateID,
} = {}) {
  try {
    if (!dateISO) {
      await Swal.fire("Missing date", "Please select a date first.", "error");
      return;
    }

    const grouped = await fetchGrouped(dateISO); // Fetch the assigned members
    const allMasses = Object.keys(grouped); // Get the list of masses for the date
    if (!allMasses.length) {
      await Swal.fire("No data", "No assignments found for that date.", "info");
      return;
    }

    const { sunday, template } = splitMasses(allMasses); // Split the masses into Sunday and template

    // Small canvas "PDF" shim (same as your current code)
    const makeCanvasCtx = () => {
      const canvas = document.createElement("canvas");
      canvas.width = PAGE_W;
      canvas.height = PAGE_H;
      const ctx = canvas.getContext("2d");
      let currentFontSize = 12;
      let currentFontWeight = "normal";
      ctx.font = `${currentFontWeight} ${currentFontSize}px Arial`;
      const fakePDF = {
        addImage: (src, _t, x, y, w, h) =>
          new Promise((res, rej) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            img.onload = () => {
              ctx.drawImage(img, x, y, w, h);
              res();
            };
            img.onerror = rej;
          }),
        setFont: (_f, weight) => {
          currentFontWeight = weight === "bold" ? "bold" : "normal";
          ctx.font = `${currentFontWeight} ${currentFontSize}px Arial`;
        },
        setFontSize: (size) => {
          currentFontSize = size;
          ctx.font = `${currentFontWeight} ${currentFontSize}px Arial`;
        },
        setDrawColor: (r, g, b) => {
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
        },
        setLineWidth: (w) => {
          ctx.lineWidth = w;
        },
        setLineDashPattern: (p) => {
          ctx.setLineDash(p);
        },
        line: (x1, y1, x2, y2) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        },
        text: (t, x, y, opt = {}) => {
          ctx.textAlign = opt.align === "center" ? "center" : "start";
          ctx.fillStyle = "#000";
          ctx.fillText(t, x, y);
        },
        getTextWidth: (t) => ctx.measureText(t || "").width,
        _canvas: canvas,
        _ctx: ctx,
      };
      return fakePDF;
    };

    const renderPageToPNG = async (masses, centerLabel) => {
      const fakePDF = makeCanvasCtx();
      const { _canvas: canvas, _ctx: ctx } = fakePDF;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const top = await drawHeader(
        fakePDF,
        department,
        dateISO,
        isSunday,
        centerLabel
      );
      const bottom = PAGE_H - MARGIN - FOOTER_H;
      const totalH = bottom - top;

      const single = masses.length === 1;
      const sectionH = single ? 320 : totalH / masses.length;

      masses.forEach((mass, i) => {
        const sectionTop = single ? top : top + i * sectionH;
        drawMassSection(fakePDF, {
          massLabel: mass,
          roles: grouped[mass] || {},
          sectionTop,
          sectionHeight: sectionH,
          compact: single,
        });
      });

      drawFooter(fakePDF);
      return canvas.toDataURL("image/png");
    };

    const zip = new JSZip();

    // Sunday pages
    if (sunday.length) {
      const pages = chunk(sunday, 3);
      for (let i = 0; i < pages.length; i++) {
        const img = await renderPageToPNG(pages[i], "Sunday Mass");
        zip.file(
          `lector-commentator-schedule-${dateISO}-sunday-${i + 1}.png`,
          img.split(",")[1],
          { base64: true }
        );
      }
    }

    // Template pages
    if (template.length) {
      const type = await getTemplateMassType(templateID);
      const centerLabel = type;
      const pages = chunk(template, 3);
      for (let i = 0; i < pages.length; i++) {
        const img = await renderPageToPNG(pages[i], centerLabel);
        zip.file(
          `lector-commentator-schedule-${dateISO}-template-${i + 1}.png`,
          img.split(",")[1],
          { base64: true }
        );
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `lector-commentator-schedule-${dateISO}.zip`);
  } catch (e) {
    console.error("PNG export failed:", e);
    await Swal.fire("Error", "Failed to export schedule PNG.", "error");
  }
}

export async function printLectorCommentatorSchedules({
  dateISO,
  isSunday = true,
  department = "Lector Commentator",
  templateID,
} = {}) {
  try {
    if (!dateISO) {
      await Swal.fire("Error", "Please select a date first.", "error");
      return;
    }

    const grouped = await fetchGrouped(dateISO); // Fetch the assigned members
    const allMasses = Object.keys(grouped); // Get the list of masses for the date
    if (!allMasses.length) {
      await Swal.fire("Info", "No assignments found for that date.", "info");
      return;
    }

    const { sunday, template } = splitMasses(allMasses);

    const pages = [];

    // Sunday pages
    if (sunday.length) {
      for (const group of chunk(sunday, 3)) {
        pages.push(
          await renderSchedulePageHTML({
            grouped,
            masses: group,
            department,
            dateISO,
            centerLabel: "Sunday Mass",
          })
        );
      }
    }

    // Template pages
    if (template.length) {
      const type = await getTemplateMassType(templateID);
      const centerLabel = type;
      for (const group of chunk(template, 3)) {
        pages.push(
          await renderSchedulePageHTML({
            grouped,
            masses: group,
            department,
            dateISO,
            centerLabel,
          })
        );
      }
    }

    const html = pages.join("");

    const w = window.open("", "_blank", "width=816,height=1056");
    if (!w) {
      await Swal.fire(
        "Popup Blocked",
        "Please allow popups to print.",
        "error"
      );
      return;
    }
    w.document.open();
    w.document.write(`
      <html>
        <head>
          <title>Schedule (${dateISO})</title>
          <style>${getSchedulePrintStyles()}</style>
        </head>
        <body>${html}</body>
      </html>
    `);
    w.document.close();
    w.onload = () => {
      w.focus();
      w.print();
      w.close();
    };
  } catch (err) {
    console.error("Print failed:", err);
    await Swal.fire(
      "Error",
      "Unexpected error occurred while printing.",
      "error"
    );
  }
}
