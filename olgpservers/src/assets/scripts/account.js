import { supabase } from "../../utils/supabase";
import { sendOtpEmail } from "../../utils/emails";
import Swal from "sweetalert2";
import bcrypt from "bcryptjs";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import image from "../../helper/images";
import { to12Hour } from "./viewScheduleSecretary";

import {
  fetchUserAltarServerSchedules,
  fetchUserLectorCommentatorSchedules,
  fetchUserChoirSchedules,
  fetchUserEucharisticMinisterSchedules,
} from "./viewScheduleNormal";

// US Letter in points (you already use these dims in other exports)
const PAGE_W = 816;
const PAGE_H = 1056;
const M = 40; // margin

export const formatMMSS = (s) => {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  if (user.length <= 2) return `${user[0] || ""}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

export const fetchMemberInformation = async (idNumber) => {
  if (!idNumber) return null;

  try {
    const { data, error } = await supabase
      .from("members-information")
      .select("*")
      .eq("idNumber", idNumber)
      .single();

    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error("fetchMemberInformation error:", err.message);
    return null;
  }
};

export const editMemberInfo = async (
  idNumber,
  firstName,
  middleName,
  lastName,
  address,
  sex,
  email,
  contactNumber
) => {
  if (!idNumber) {
    await Swal.fire({
      icon: "error",
      title: "Missing ID",
      text: "No ID number provided.",
    });
    return false;
  }

  // ✅ Required fields validation (middleName is optional)
  if (!firstName || !lastName || !address || !sex || !email || !contactNumber) {
    await Swal.fire({
      icon: "warning",
      title: "Missing Information",
      text: "Please fill in all required fields.",
    });
    return false;
  }

  const confirm = await Swal.fire({
    icon: "question",
    title: "Save changes?",
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  if (!confirm.isConfirmed) return false;

  try {
    const { data, error } = await supabase
      .from("members-information")
      .update({
        firstName,
        middleName: middleName || null,
        lastName,
        address,
        sex,
        email,
        contactNumber,
      })
      .eq("idNumber", idNumber)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No rows updated");

    //window.location.reload();

    return true;
  } catch (err) {
    console.error("editMemberInfo error:", err);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to save your information.",
    });
    return false;
  }
};

export const fetchMemberNameAndEmail = async (idNumber) => {
  if (!idNumber) return null;

  try {
    const { data, error } = await supabase
      .from("members-information")
      .select("firstName, middleName, lastName, email")
      .eq("idNumber", idNumber)
      .single();

    if (error) throw error;
    if (!data) return null;

    const fullName = [
      data.firstName || "",
      data.middleName ? `${data.middleName[0].toUpperCase()}.` : "",
      data.lastName || "",
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      fullName,
      email: data.email || "",
    };
  } catch (err) {
    console.error("fetchMemberNameAndEmail error:", err.message);
    return null;
  }
};

export const generateOtpCode = (len = 6) => {
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

export const createOtpCountdown = (durationSec, onTick, onExpire) => {
  let remaining = Number(durationSec) || 0;
  if (remaining <= 0) return { stop: () => {} };

  // initial tick
  if (typeof onTick === "function") onTick(remaining);

  const id = setInterval(() => {
    remaining -= 1;

    if (remaining <= 0) {
      clearInterval(id);
      if (typeof onTick === "function") onTick(0);
      if (typeof onExpire === "function") onExpire();
      return;
    }

    if (typeof onTick === "function") onTick(remaining);
  }, 1000);

  return {
    stop: () => clearInterval(id),
  };
};

export const handleSendOtp = async ({ email, fullName }) => {
  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Show loading Swal
    Swal.fire({
      title: "Sending OTP…",
      text: "Please wait while we send your verification code.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Send email via backend
    await sendOtpEmail({
      email,
      fullName,
      otp: otpCode,
    });

    // Close the loading Swal
    Swal.close();

    // Show success Swal
    await Swal.fire({
      icon: "success",
      title: "OTP Sent",
      text: `The OTP was sent to you email. Please check your inbox.`,
    });

    return otpCode; // return so component can compare later
  } catch (err) {
    console.error("sendOtpEmail error:", err);

    // Close loading Swal if still open
    Swal.close();

    // Show error Swal
    await Swal.fire({
      icon: "error",
      title: "Failed",
      text: "Could not send OTP. Please try again.",
    });

    return null;
  }
};

export const validateNewPassword = (password, confirmPassword) => {
  if (!password || !confirmPassword) {
    return { valid: false, message: "Please fill out both password fields." };
  }

  if (password !== confirmPassword) {
    return { valid: false, message: "Passwords do not match." };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  }

  // must contain at least one digit
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number.",
    };
  }

  // must contain at least one special (non-alphanumeric)
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character.",
    };
  }

  return { valid: true };
};

export const updateAuthenticationPassword = async (idNumber, rawPassword) => {
  const hashed = bcrypt.hashSync(rawPassword, 10);

  const { data, error } = await supabase
    .from("authentication")
    .update({ password: hashed })
    .eq("idNumber", idNumber)
    .select("idNumber")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update password.");
  }

  return data;
};

export const changePasswordForAccount = async (
  idNumber,
  newPassword,
  confirmPassword
) => {
  // Validate
  const { valid, message } = validateNewPassword(newPassword, confirmPassword);
  if (!valid) {
    await Swal.fire({
      icon: "error",
      title: "Invalid Password",
      text: message,
    });
    return false;
  }

  try {
    await updateAuthenticationPassword(idNumber, newPassword);

    // Close loading then show success
    Swal.close();

    return true;
  } catch (err) {
    console.error("changePasswordForAccount error:", err);
    Swal.close();
    await Swal.fire({
      icon: "error",
      title: "Update Failed",
      text:
        err.message || "We couldn't update your password. Please try again.",
    });
    return false;
  }
};

export const handleBackupMonthDialog = async () => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  // 1) Ask for month
  const { value: picked } = await Swal.fire({
    title: "Backup Schedules",
    html: `
      <div style="display:flex;flex-direction:column;gap:8px;text-align:left">
        <label for="backup-month" style="font-size:14px">Select the month you want to back up:</label>
        <input id="backup-month" type="month" class="swal2-input" value="${defaultMonth}">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Generate PDF",
    focusConfirm: false,
    reverseButtons: true,
    preConfirm: () => {
      const el = document.getElementById("backup-month");
      if (!el || !el.value) {
        Swal.showValidationMessage("Please select a month.");
        return;
      }
      return el.value; // "YYYY-MM"
    },
  });

  if (!picked) return;

  // 2) Generate PDF for selected month
  try {
    if (!/^\d{4}-\d{2}$/.test(picked)) {
      await Swal.fire("Invalid month", "Please pick a valid month.", "warning");
      return;
    }

    const [yearStr, monStr] = picked.split("-");
    const start = dayjs(`${yearStr}-${monStr}-01`);
    const end = start.endOf("month");

    const { data, error } = await supabase
      .from("use-template-table")
      .select("date,time,clientName")
      .gte("date", start.format("YYYY-MM-DD"))
      .lte("date", end.format("YYYY-MM-DD"))
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      await Swal.fire(
        "No data",
        `No schedules found for ${start.format("MMMM YYYY")}.`,
        "info"
      );
      return;
    }

    const pdf = new jsPDF("p", "pt", [816, 1056]);
    const width = 816,
      height = 1056;
    const M = 40,
      logoW = 60,
      logoH = 60;

    const drawHeader = () => {
      // Border
      //pdf.setLineWidth(8);
      //pdf.setDrawColor(0, 0, 0);
      // pdf.rect(4, 4, width - 8, height - 8);

      // Logo
      try {
        pdf.addImage(image.OLGPlogo, "PNG", M, M, logoW, logoH);
      } catch {}

      // Titles
      const textX = M + logoW + 20;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Our Lady of Guadalupe Parish", textX, M + 25);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text("Parish Secretary", textX, M + 55);

      // Separator
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.line(M, M + logoH + 16, width - M, M + logoH + 16);

      // Month title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Schedules for ${start.format("MMMM YYYY")}`,
        width / 2,
        M + logoH + 60,
        { align: "center" }
      );
    };

    const startY = M + logoH + 100;
    const bottomPad = 60;
    const blockH = 80; // vertical space per entry

    let y = startY;
    let page = 1;
    const totalPages = Math.max(
      1,
      Math.ceil((data.length * blockH) / (height - startY - bottomPad))
    );

    drawHeader();

    for (const row of data) {
      if (y + blockH > height - bottomPad) {
        // footer
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text(`Page ${page} of ${totalPages}`, width - M, height - M + 2, {
          align: "right",
        });

        pdf.addPage();
        page++;
        drawHeader();
        y = startY;
      }

      // Date
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      const dateHuman = dayjs(row.date).format("MMMM D - YYYY");
      pdf.text(`Date: ${dateHuman}`, M, y);

      // Client Name
      y += 22;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(14);
      pdf.text(`Client Name: ${row.clientName || "—"}`, M, y);

      // Time (12-hour)
      y += 18;
      pdf.text(`Time: ${to12Hour(row.time || "")}`, M, y);

      // Divider
      y += 16;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(M, y, width - M, y);
      y += 24;
    }

    // final footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Page ${page} of ${totalPages}`, width - M, height - M + 2, {
      align: "right",
    });

    pdf.save(`schedules-${start.format("YYYY-MM")}.pdf`);
  } catch (err) {
    console.error("backup month pdf error:", err);
    await Swal.fire("Error", "Failed to generate the monthly PDF.", "error");
  }
};

function fullNameOf(m) {
  const mi = m?.middleName
    ? ` ${String(m.middleName).charAt(0).toUpperCase()}.`
    : "";
  return `${m?.firstName || ""}${mi} ${m?.lastName || ""}`
    .trim()
    .replace(/\s+/g, " ");
}

async function fetchMembersForDepartment(deptKey) {
  // deptKey one of: 'altar', 'lector', 'choir', 'em'
  const FLAG_MAP = {
    altar: "altar-server-member",
    lector: "lector-commentator-member",
    choir: "choir-member",
    em: "eucharistic-minister-member",
  };
  const flag = FLAG_MAP[deptKey];
  if (!flag) return [];

  const { data: rows, error } = await supabase
    .from("user-type")
    .select("idNumber")
    .eq(flag, 1);

  if (error || !rows?.length) return [];

  const ids = Array.from(new Set(rows.map((r) => r.idNumber).filter(Boolean)));
  if (!ids.length) return [];

  const { data: members, error: memErr } = await supabase
    .from("members-information")
    .select("idNumber, firstName, middleName, lastName")
    .in("idNumber", ids);

  if (memErr || !members) return [];

  // Return sorted by last,first
  return members
    .map((m) => ({ idNumber: m.idNumber, name: fullNameOf(m) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchMyMonthlySchedules({ deptKey, idNumber, year, month }) {
  switch (deptKey) {
    case "altar":
      return await fetchUserAltarServerSchedules(idNumber, year, month);
    case "lector":
      return await fetchUserLectorCommentatorSchedules(idNumber, year, month);
    case "choir":
      return await fetchUserChoirSchedules(idNumber, year, month);
    case "em":
      return await fetchUserEucharisticMinisterSchedules(idNumber, year, month);
    default:
      return [];
  }
}

function drawCommonHeader(pdf, titleLeft, subtitleLeft, midTitle) {
  // Logo
  try {
    pdf.addImage(image.OLGPlogo, "PNG", M, M, 60, 60);
  } catch {}
  // Parish + subtitle
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.text("Our Lady of Guadalupe Parish", M + 80, M + 24);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(16);
  pdf.text(subtitleLeft, M + 80, M + 48);

  // Center title (section)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text(titleLeft, PAGE_W / 2, M + 88, { align: "center" });

  if (midTitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);
    pdf.text(midTitle, PAGE_W / 2, M + 108, { align: "center" });
  }

  // divider
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.8);
  pdf.line(M, M + 120, PAGE_W - M, M + 120);
}

function paginateFooter(pdf, page, total) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Page ${page} of ${total}`, PAGE_W - M, PAGE_H - M + 2, {
    align: "right",
  });
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, M, PAGE_H - M + 2);
}

function renderMembersTable(pdf, members, departmentLabel) {
  // header
  drawCommonHeader(pdf, "Members of the Organization", departmentLabel);

  // table header
  const startY = M + 140;
  const cellH = 36;
  const idW = 200;
  const nameW = PAGE_W - M - M - idW;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.rect(M, startY, idW, cellH);
  pdf.rect(M + idW, startY, nameW, cellH);
  pdf.text("ID Number", M + 10, startY + cellH / 2 + 4);
  pdf.text("Name", M + idW + 10, startY + cellH / 2 + 4);

  // rows
  pdf.setFont("helvetica", "normal");
  let y = startY + cellH;
  const bottomPad = 70;
  const rowsPerPage = Math.floor((PAGE_H - y - bottomPad) / cellH);
  const chunks = [];
  for (let i = 0; i < members.length; i += rowsPerPage) {
    chunks.push(members.slice(i, i + rowsPerPage));
  }

  const totalPages = Math.max(1, chunks.length);
  let page = 1;

  for (let c = 0; c < chunks.length; c++) {
    const pageMembers = chunks[c];
    if (c > 0) {
      paginateFooter(pdf, page, totalPages);
      pdf.addPage([PAGE_W, PAGE_H]);
      page++;
      // redraw header + header row
      drawCommonHeader(pdf, "Members of the Organization", departmentLabel);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.rect(M, startY, idW, cellH);
      pdf.rect(M + idW, startY, nameW, cellH);
      pdf.text("ID Number", M + 10, startY + cellH / 2 + 4);
      pdf.text("Name", M + idW + 10, startY + cellH / 2 + 4);
      y = startY + cellH;
    }

    for (const m of pageMembers) {
      pdf.rect(M, y, idW, cellH);
      pdf.rect(M + idW, y, nameW, cellH);
      pdf.text(String(m.idNumber), M + 10, y + cellH / 2 + 4);
      pdf.text(m.name || "", M + idW + 10, y + cellH / 2 + 4);
      y += cellH;
    }
  }

  paginateFooter(pdf, page, totalPages);
  return { nextPage: page, nextY: y };
}

function renderMyMonthSchedules(pdf, schedules, departmentLabel, monthLabel) {
  // start a fresh page
  pdf.addPage([PAGE_W, PAGE_H]);
  drawCommonHeader(
    pdf,
    "My Schedule",
    departmentLabel,
    `Schedules for ${monthLabel}`
  );

  const startY = M + 140;
  const lineH = 18;
  const blockH = 64;
  const bottomPad = 70;

  let y = startY;
  let page = 1;
  const rowsPerPage = Math.floor((PAGE_H - startY - bottomPad) / blockH);
  const chunks = [];
  for (let i = 0; i < schedules.length; i += rowsPerPage) {
    chunks.push(schedules.slice(i, i + rowsPerPage));
  }
  const totalPages = Math.max(1, chunks.length);

  for (let c = 0; c < chunks.length; c++) {
    const rows = chunks[c];
    if (c > 0) {
      paginateFooter(pdf, page, totalPages);
      pdf.addPage([PAGE_W, PAGE_H]);
      page++;
      drawCommonHeader(
        pdf,
        "My Schedule",
        departmentLabel,
        `Schedules for ${monthLabel}`
      );
      y = startY;
    }

    for (const row of rows) {
      // Date
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      const dateHuman = dayjs(row.date).format("MMMM D, YYYY");
      pdf.text(`Date: ${dateHuman}`, M, y);

      // Mass / Role
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(13);
      pdf.text(`Mass: ${row.mass || "—"}`, M, y + lineH);
      // Choir rows often have group (no role)
      const roleTxt = row.role
        ? `Role: ${row.role}`
        : row.group
        ? `Group: ${row.group}`
        : "Role: —";
      pdf.text(roleTxt, M, y + lineH * 2);

      // Optional: slot display
      if (typeof row.slot !== "undefined") {
        pdf.text(`Slot: ${String(row.slot)}`, M, y + lineH * 3);
      }

      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(M, y + blockH - 10, PAGE_W - M, y + blockH - 10);

      y += blockH;
    }
  }

  paginateFooter(pdf, page, totalPages);
}

function deptLabelOf(key) {
  return (
    {
      altar: "Altar Servers",
      lector: "Lector Commentator",
      choir: "Choir",
      em: "Eucharistic Minister",
    }[key] || "Department"
  );
}

/**
 * Open a month+department picker (from available scheduler roles),
 * then export a single PDF containing:
 *   1) Members list of that department
 *   2) The current user's schedule for that month (rows grouped by date)
 *
 * @param {{ idNumber: string|number, available: Array<'altar'|'lector'|'choir'|'em'> }} opts
 */
export const handleBackupSchedulersMonthDialog = async (opts = {}) => {
  try {
    const idNumber = opts?.idNumber ?? localStorage.getItem("idNumber");
    if (!idNumber) {
      await Swal.fire("Not logged in", "Missing user idNumber.", "error");
      return;
    }

    // Which departments can this user schedule?
    const choices = Array.isArray(opts?.available) ? opts.available : [];
    if (!choices.length) {
      await Swal.fire(
        "No scheduler role",
        "You have no scheduler department.",
        "info"
      );
      return;
    }

    // 1) Ask department
    const { value: deptKey } = await Swal.fire({
      title: "Backup Data",
      input: "select",
      inputLabel: "Choose Department",
      inputOptions: {
        altar: choices.includes("altar") ? "Altar Servers" : "(not available)",
        lector: choices.includes("lector")
          ? "Lector Commentator"
          : "(not available)",
        choir: choices.includes("choir") ? "Choir" : "(not available)",
        em: choices.includes("em") ? "Eucharistic Minister" : "(not available)",
      },
      inputValue: choices[0],
      inputValidator: (v) => (!v ? "Please choose a department" : undefined),
      showCancelButton: true,
      confirmButtonText: "Next",
      reverseButtons: true,
    });
    if (!deptKey) return;

    // 2) Ask month
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const { value: ym } = await Swal.fire({
      title: "Select Month",
      html: `<input id="monthInput" type="month" class="swal2-input" value="${defaultMonth}" />`,
      focusConfirm: false,
      preConfirm: () => document.getElementById("monthInput").value,
      showCancelButton: true,
      confirmButtonText: "Export to PDF",
      reverseButtons: true,
    });
    if (!ym) return;

    const [yStr, mStr] = ym.split("-");
    const year = Number(yStr);
    const month = Number(mStr) - 1;
    if (!year || month < 0) {
      await Swal.fire("Invalid month", "Please pick a valid month.", "error");
      return;
    }

    // Show a small loader
    Swal.fire({
      title: "Building PDF…",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    // Fetch members (department) and my schedules (month)
    const departmentLabel = deptLabelOf(deptKey);
    const [members, mySched] = await Promise.all([
      fetchMembersForDepartment(deptKey),
      fetchMyMonthlySchedules({ deptKey, idNumber, year, month }),
    ]);

    // Build PDF
    const pdf = new jsPDF("p", "pt", [PAGE_W, PAGE_H]);

    // Section 1: Members table (same visual language as your existing member export)
    renderMembersTable(pdf, members, departmentLabel);

    // Section 2: My month schedules (same monthly style as your Account backup)
    const monthLabel = dayjs(
      `${year}-${String(month + 1).padStart(2, "0")}-01`
    ).format("MMMM YYYY");
    // Normalize/pretty fields a bit for the print (time strings etc.)
    const prettyRows = (mySched || []).map((r) => ({
      date: r.date,
      mass: r.mass,
      role: r.role,
      group: r.group,
      slot: r.slot,
      time: r.time ? to12Hour(r.time) : null,
    }));
    renderMyMonthSchedules(pdf, prettyRows, departmentLabel, monthLabel);

    Swal.close();
    pdf.save(
      `${deptKey}-backup-${year}-${String(month + 1).padStart(2, "0")}.pdf`
    );
  } catch (err) {
    console.error("Scheduler backup export failed:", err);
    Swal.close();
    await Swal.fire("Error", "Failed to export backup PDF.", "error");
  }
};
