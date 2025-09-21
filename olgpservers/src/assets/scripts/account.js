import { supabase } from "../../utils/supabase";
import { sendOtpEmail } from "../../utils/emails";
import Swal from "sweetalert2";
import bcrypt from "bcryptjs";
import jsPDF from "jspdf"; // if not already imported at top

import dayjs from "dayjs";
import image from "../../helper/images";
import { to12Hour } from "./viewScheduleSecretary";

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
        contactNumber: contactNumber,
      })
      .eq("idNumber", idNumber)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No rows updated");

    await Swal.fire({
      icon: "success",
      title: "Saved",
      text: "Your information was updated.",
    });

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
