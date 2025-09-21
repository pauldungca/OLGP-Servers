import dayjs from "dayjs";
import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import jsPDF from "jspdf"; // ✅ PDF
import image from "../../helper/images";

/* ===================== Dates / UI helpers ===================== */
export const NOW = dayjs();
export const CURRENT_YEAR = NOW.year();
export const CURRENT_MONTH = NOW.month();

export const defaultMonthValue = dayjs(
  `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, "0")}-01`
);

export const makeDisableMonths =
  (currentYear = CURRENT_YEAR, currentMonth = CURRENT_MONTH) =>
  (date) => {
    if (!date) return false;
    const y = date.year();
    const m = date.month();
    if (y < currentYear) return true;
    if (y === currentYear && m < currentMonth) return true;
    return false;
  };

export const popupClassForYear = (panelYear, currentYear = CURRENT_YEAR) =>
  `month-select-dropdown ${
    panelYear === currentYear ? "hide-left" : "show-both"
  }`;

export const getMonthDays = (monthValue) => {
  if (!monthValue || !dayjs.isDayjs(monthValue)) return [];
  const start = monthValue.startOf("month");
  const end = monthValue.endOf("month");
  const days = [];
  let d = start;
  while (d.isBefore(end, "day") || d.isSame(end, "day")) {
    days.push(d);
    d = d.add(1, "day");
  }
  return days;
};

export const chunkInto = (arr, size = 3) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export const groupByDate = (rows) =>
  rows.reduce((acc, r) => {
    const key = r.date; // 'YYYY-MM-DD'
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

export const formatDateHeading = (isoDate) =>
  dayjs(isoDate).format("MMMM D, YYYY");

/* ===================== Data fetches ===================== */
export const fetchMonthSchedules = async (monthValue) => {
  const startDate = monthValue.startOf("month").format("YYYY-MM-DD");
  const endDate = monthValue.endOf("month").format("YYYY-MM-DD");

  const { data, error } = await supabase
    .from("use-template-table")
    .select("id,scheduleID,templateID,date,time,note,clientName")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const fetchScheduleBasic = async (id) => {
  if (!id) return { data: null, error: new Error("Missing id") };
  const { data, error } = await supabase
    .from("use-template-table")
    .select("clientName,time,scheduleID")
    .eq("id", id)
    .single();
  return { data, error };
};

/* ===================== Cancel helpers ===================== */
export const extractBasicFromState = (state) => {
  if (!state || typeof state !== "object") return null;
  const { clientName, time, scheduleID } = state;
  if (!clientName && !time && !scheduleID) return null;
  return {
    clientName: clientName ?? "",
    time: time ?? "",
    scheduleID: scheduleID ?? null,
  };
};

export const getQueryParam = (search, key) => {
  try {
    const sp = new URLSearchParams(search || "");
    const val = sp.get(key);
    return val ?? null;
  } catch {
    return null;
  }
};

/** Delete by scheduleID (updated requirement) */
export const cancelScheduleByScheduleID = async (scheduleID) => {
  if (!scheduleID) return { error: new Error("Missing scheduleID") };
  const { error } = await supabase
    .from("use-template-table")
    .delete()
    .eq("scheduleID", scheduleID);
  return { error };
};

export const confirmAndCancelSchedule = async (scheduleID, navigate) => {
  if (!scheduleID) {
    await Swal.fire("Missing Info", "No scheduleID was provided.", "warning");
    return;
  }

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This will cancel the schedule permanently.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, cancel it!",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  const { error } = await cancelScheduleByScheduleID(scheduleID);
  if (error) {
    console.error(error);
    await Swal.fire("Error", "Failed to cancel schedule.", "error");
    return;
  }

  await Swal.fire({
    title: "Cancelled!",
    text: "The schedule was removed.",
    icon: "success",
    showConfirmButton: false,
    timer: 1200,
    allowOutsideClick: false,
    allowEscapeKey: false,
    timerProgressBar: true,
  });

  navigate("/viewScheduleSecretary");
};

/* =========================================================
   =============== Shared time formatter ===================
   ========================================================= */

/** Convert "HH:mm" or "HH:mm:ss" -> "h:mm AM/PM" without dayjs plugins */
export const to12Hour = (time24) => {
  if (!time24) return "";
  const parts = time24.split(":");
  const hh = parseInt(parts[0] || "0", 10);
  const mm = parseInt(parts[1] || "0", 10);
  const ampm = hh >= 12 ? "PM" : "AM";
  let h = hh % 12;
  if (h === 0) h = 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ampm}`;
};

/* =========================================================
   ========== EXPORT TO PNG (exact layout replica) =========
   ========================================================= */

/** Draw ONE page on canvas. Returns the canvas. */
const drawSchedulePage = async ({
  dateLabel,
  items, // [{ time, clientName }]
  pageIndex,
  pageCount,
}) => {
  // Page size used across your exports (8.5 x 11)
  const width = 816;
  const height = 1056;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);

  // Outer thick black border
  ctx.save();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#000";
  ctx.strokeRect(4, 4, width - 8, height - 8);
  ctx.restore();

  // Top header (logo + titles)
  const M = 24; // margin
  const logoW = 60;
  const logoH = 60;

  // Logo
  await new Promise((resolve) => {
    const imgEl = new Image();
    imgEl.crossOrigin = "anonymous";
    imgEl.onload = () => {
      ctx.drawImage(imgEl, M, M, logoW, logoH);
      resolve();
    };
    imgEl.onerror = () => resolve(); // proceed even if logo fails
    imgEl.src = image.OLGPlogo;
  });

  // Title block
  const textX = M + logoW + 16;
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "#000";
  ctx.textAlign = "left";
  ctx.fillText("Our Lady of Guadalupe Parish", textX, M + 28);

  ctx.font = "normal 16px Arial";
  ctx.fillStyle = "#333";
  ctx.fillText("Parish Secretary", textX, M + 54);

  // Thin separator line under header
  ctx.beginPath();
  ctx.moveTo(M, M + logoH + 16);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";
  ctx.lineTo(width - M, M + logoH + 16);
  ctx.stroke();

  // Centered page title
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText(`Schedule for ${dateLabel}`, width / 2, M + logoH + 60);

  // Body fonts
  const timeFont = "bold 18px Arial";
  const labelFont = "normal 16px Arial";
  const nameFont = "bold 22px Arial";

  // Items
  const startY = M + logoH + 105; // first block start
  const blockGap = 170;
  const leftColX = M + 8;

  items.forEach((item, idx) => {
    const y = startY + idx * blockGap;

    // Time (bold, left) — 12-hour
    ctx.font = timeFont;
    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.fillText(to12Hour(item.time || ""), leftColX, y);

    // "Client Name:" label
    ctx.font = labelFont;
    ctx.fillStyle = "#555";
    const lineY = y + 36;
    const labelText = "Client Name:";
    ctx.fillText(labelText, leftColX, lineY);

    // Mass name (bold) right after label
    ctx.font = nameFont;
    ctx.fillStyle = "#000";
    const labelWidth = ctx.measureText(labelText).width;
    ctx.fillText(item.clientName || "—", leftColX + labelWidth + 10, lineY);

    // Dotted divider
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(leftColX - 8, y + 70);
    ctx.lineTo(width - M, y + 70);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  });

  // Page number (optional)
  if (pageCount > 1) {
    ctx.font = "normal 10px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "right";
    ctx.fillText(
      `Page ${pageIndex} of ${pageCount}`,
      width - M,
      height - M + 2
    );
  }

  return canvas;
};

/**
 * Export one day's schedules to PNG.
 * - Exactly 3 items per page to preserve the layout.
 * - If more than 3, creates a ZIP of PNG pages.
 */
export const exportScheduleDayAsPNG = async (isoDate, dayItemsRaw = []) => {
  try {
    // Normalize & sort by time
    const items = [...dayItemsRaw].sort((a, b) => {
      const tA = (a.time || "").slice(0, 5);
      const tB = (b.time || "").slice(0, 5);
      return tA.localeCompare(tB);
    });

    if (items.length === 0) {
      await Swal.fire(
        "Nothing to export",
        "No schedules for this day.",
        "info"
      );
      return;
    }

    const dateLabel = formatDateHeading(isoDate);

    // Exactly 3 per page
    const pages = chunkInto(items, 3);

    if (pages.length === 1) {
      const canvas = await drawSchedulePage({
        dateLabel,
        items: pages[0],
        pageIndex: 1,
        pageCount: 1,
      });

      await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          saveAs(blob, `schedule-${isoDate}.png`);
          resolve();
        });
      });
    } else {
      const zip = new JSZip();
      let pageNo = 1;
      for (const pg of pages) {
        const canvas = await drawSchedulePage({
          dateLabel,
          items: pg,
          pageIndex: pageNo,
          pageCount: pages.length,
        });
        const dataURL = canvas.toDataURL("image/png");
        zip.file(
          `schedule-${isoDate}-page-${pageNo}.png`,
          dataURL.split(",")[1],
          { base64: true }
        );
        pageNo++;
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `schedule-${isoDate}.zip`);
    }
  } catch (err) {
    console.error("exportScheduleDayAsPNG error:", err);
    await Swal.fire("Error", "Failed to export PNG.", "error");
  }
};

/* =========================================================
   =============== EXPORT TO PDF (new) =====================
   ========================================================= */

/** Draw one PDF page in the same layout as PNG. */
const drawSchedulePagePDF = async ({
  pdf,
  dateLabel,
  items,
  pageIndex,
  pageCount,
}) => {
  const width = 816;
  const height = 1056;
  const M = 24;
  const logoW = 60;
  const logoH = 60;

  // Border
  pdf.setLineWidth(8);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(4, 4, width - 8, height - 8);

  // Header logo
  try {
    // jsPDF addImage is sync; image can be URL/dataURL
    pdf.addImage(image.OLGPlogo, "PNG", M, M, logoW, logoH);
  } catch (e) {
    // continue without logo
  }

  // Titles
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(0, 0, 0);
  const textX = M + logoW + 16;
  pdf.text("Our Lady of Guadalupe Parish", textX, M + 28);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(16);
  pdf.setTextColor(51, 51, 51);
  pdf.text("Parish Secretary", textX, M + 54);

  // Separator
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(M, M + logoH + 16, width - M, M + logoH + 16);

  // Centered title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Schedule for ${dateLabel}`, width / 2, M + logoH + 60, {
    align: "center",
  });

  // Body fonts
  const timeSize = 18;
  const labelSize = 16;
  const nameSize = 22;

  // Items
  const startY = M + logoH + 105;
  const blockGap = 170;
  const leftColX = M + 8;

  items.forEach((item, idx) => {
    const y = startY + idx * blockGap;

    // Time
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(timeSize);
    pdf.setTextColor(0, 0, 0);
    pdf.text(to12Hour(item.time || ""), leftColX, y);

    // Label "Client Name:"
    const lineY = y + 36;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(labelSize);
    pdf.setTextColor(85, 85, 85);
    const labelText = "Client Name:";
    pdf.text(labelText, leftColX, lineY);

    // Name, right after label
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(nameSize);
    pdf.setTextColor(0, 0, 0);
    const labelWidth = pdf.getTextWidth(labelText);
    pdf.text(item.clientName || "—", leftColX + labelWidth + 10, lineY);

    // Dotted divider (fallback to solid if setLineDash not available)
    try {
      if (typeof pdf.setLineDash === "function") {
        pdf.setLineDash([2, 3], 0);
      }
      pdf.setDrawColor(51, 51, 51);
      pdf.setLineWidth(1);
      pdf.line(leftColX - 8, y + 70, width - M, y + 70);
      if (typeof pdf.setLineDash === "function") {
        pdf.setLineDash([]); // reset
      }
    } catch {
      // solid line fallback
      pdf.setDrawColor(51, 51, 51);
      pdf.setLineWidth(0.5);
      pdf.line(leftColX - 8, y + 70, width - M, y + 70);
    }
  });

  // Page number
  if (pageCount > 1) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Page ${pageIndex} of ${pageCount}`, width - M, height - M + 2, {
      align: "right",
    });
  }
};

/** Export one day's schedules to a paginated PDF (3 per page). */
export const exportScheduleDayAsPDF = async (isoDate, dayItemsRaw = []) => {
  try {
    const items = [...dayItemsRaw].sort((a, b) => {
      const tA = (a.time || "").slice(0, 5);
      const tB = (b.time || "").slice(0, 5);
      return tA.localeCompare(tB);
    });

    if (items.length === 0) {
      await Swal.fire(
        "Nothing to export",
        "No schedules for this day.",
        "info"
      );
      return;
    }

    const dateLabel = formatDateHeading(isoDate);
    const pages = chunkInto(items, 3);

    const pdf = new jsPDF("p", "pt", [816, 1056]);

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();
      await drawSchedulePagePDF({
        pdf,
        dateLabel,
        items: pages[i],
        pageIndex: i + 1,
        pageCount: pages.length,
      });
    }

    pdf.save(`schedule-${isoDate}.pdf`);
  } catch (err) {
    console.error("exportScheduleDayAsPDF error:", err);
    await Swal.fire("Error", "Failed to export PDF.", "error");
  }
};

/* ===================== PRINT (new) ===================== */

const getSchedulePrintStyles = () => `
  @page { size: 8.5in 11in; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; }
  .print-container { width: 100%; }
  .page {
    width: 816px; height: 1056px; padding: 40px; position: relative;
    background: #fff; margin: 0 auto; display: block;
  }
  .header { margin-bottom: 40px; }
  .logo-title-section { display: flex; align-items: flex-start; }
  .logo-container { width: 60px; height: 60px; margin-right: 20px; }
  .logo { width: 60px; height: 60px; display: block; }
  .title-container { flex: 1; margin-top: 25px; }
  .main-title { font-weight: bold; font-size: 30px; line-height: 1; }
  .subtitle { font-size: 16px; color: #333; margin-top: 6px; }
  .separator { border-top: 1px solid #000; margin-top: 16px; }
  .center-title { text-align: center; font-weight: bold; font-size: 18px; margin: 28px 0 0; }

  /* schedule blocks per page */
  .blocks { margin-top: 40px; }
  .block { margin-bottom: 70px; }           /* space to mimic PNG layout (3 per page) */
  .time { font-weight: bold; font-size: 18px; color: #000; }
  .label { font-size: 16px; color: #555; margin-top: 10px; display: inline-block; }
  .name { font-weight: bold; font-size: 22px; color: #000; display: inline-block; margin-left: 10px; }
  .divider {
    margin-top: 14px; border-bottom: 1px dashed #333; height: 1px;
  }

  .footer {
    position: absolute; bottom: 40px; left: 40px; right: 40px; font-size: 10px;
    display: flex; justify-content: space-between;
  }

  @media print {
    .page { page-break-inside: avoid; }
    .page:not(:first-child) { page-break-before: always; }
    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
  }
`;

const renderSchedulePageHTML = (dateLabel, items, pageNumber, totalPages) => {
  return `
    <div class="page">
      <div class="header">
        <div class="logo-title-section">
          <div class="logo-container">
            <img src="${image.OLGPlogo}" class="logo" alt="OLGP Logo" />
          </div>
          <div class="title-container">
            <div class="main-title">Our Lady of Guadalupe Parish</div>
            <div class="subtitle">Parish Secretary</div>
            <div class="separator"></div>
          </div>
        </div>
        <div class="center-title">Schedule for ${dateLabel}</div>
      </div>

      <div class="blocks">
        ${items
          .map(
            (it) => `
          <div class="block">
            <div class="time">${to12Hour(it.time || "")}</div>
            <div class="label">Client Name:</div>
            <div class="name">${(it.clientName || "—")
              .toString()
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</div>
            <div class="divider"></div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="footer">
        <span>Generated: ${new Date().toLocaleDateString()}</span>
        <span>Page ${pageNumber} of ${totalPages}</span>
      </div>
    </div>
  `;
};

export const printScheduleDay = async (isoDate, dayItemsRaw = []) => {
  try {
    const items = [...dayItemsRaw].sort((a, b) => {
      const tA = (a.time || "").slice(0, 5);
      const tB = (b.time || "").slice(0, 5);
      return tA.localeCompare(tB);
    });

    if (items.length === 0) {
      await Swal.fire("Nothing to print", "No schedules for this day.", "info");
      return;
    }

    const dateLabel = formatDateHeading(isoDate);
    const pages = chunkInto(items, 3); // 3 per page to match your PNG/PDF layout

    let htmlContent = '<div class="print-container">';
    pages.forEach((pg, idx) => {
      htmlContent += renderSchedulePageHTML(
        dateLabel,
        pg,
        idx + 1,
        pages.length
      );
    });
    htmlContent += "</div>";

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
          <title>Schedule — ${dateLabel}</title>
          <style>${getSchedulePrintStyles()}</style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
    w.document.close();

    w.onload = () => {
      w.focus();
      w.print();
      w.close();
    };
  } catch (err) {
    console.error("printScheduleDay error:", err);
    await Swal.fire(
      "Error",
      "Unexpected error occurred while printing.",
      "error"
    );
  }
};
