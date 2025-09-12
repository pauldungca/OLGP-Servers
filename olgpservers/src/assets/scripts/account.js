import { supabase } from "../../utils/supabase";
import { sendOtpEmail } from "../../utils/emails";
import Swal from "sweetalert2";
import bcrypt from "bcryptjs";

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

  // at least one number
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number.",
    };
  }

  // at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>_\-[\];'/+=`~]/.test(password)) {
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
    await Swal.fire({
      icon: "success",
      title: "Password Updated",
      text: "Your password has been changed successfully.",
    });

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
