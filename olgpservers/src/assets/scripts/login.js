import { supabase } from "../../utils/supabase";
import { sendOtpEmail } from "../../utils/emails";
import Swal from "sweetalert2";
import bcrypt from "bcryptjs";

// ============ HELPERS ============
export const formatMMSS = (s) => {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export const createOtpCountdown = (durationSec, onTick, onExpire) => {
  let remaining = Number(durationSec) || 0;
  if (remaining <= 0) return { stop: () => {} };
  if (typeof onTick === "function") onTick(remaining);
  const id = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(id);
      onTick?.(0);
      onExpire?.();
    } else onTick?.(remaining);
  }, 1000);
  return { stop: () => clearInterval(id) };
};

// ============ VERIFY EMAIL ============
export const handleVerifyEmail = async (email, navigate) => {
  try {
    if (!email) {
      await Swal.fire({
        icon: "warning",
        title: "Missing Field",
        text: "Please enter your email address.",
      });
      return false;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Email Format",
        text: "Please enter a valid email address (e.g., example@gmail.com).",
      });
      return false;
    }

    const { data, error } = await supabase
      .from("members-information")
      .select("email")
      .eq("email", email)
      .single();

    if (error || !data) {
      await Swal.fire({
        icon: "error",
        title: "Email Not Found",
        text: "This email is not registered in the system.",
      });
      return false;
    }

    await Swal.fire({
      icon: "success",
      title: "Email Verified",
      text: "Your email is registered in the system.",
      timer: 1000,
      showConfirmButton: false,
    });

    navigate("/verifyOTP", { state: { email } });
    return true;
  } catch (err) {
    console.error(err);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Something went wrong while verifying the email.",
    });
    return false;
  }
};

// ============ SEND OTP ============
export const sendOtpToUser = async (email) => {
  try {
    const { data, error } = await supabase
      .from("members-information")
      .select("firstName, middleName, lastName")
      .eq("email", email)
      .single();

    if (error || !data) {
      await Swal.fire({
        icon: "error",
        title: "Email Not Found",
        text: "This email does not exist in the system.",
      });
      return null;
    }

    const middleInitial = data.middleName
      ? `${data.middleName.charAt(0).toUpperCase()}.`
      : "";
    const fullName = `${data.firstName} ${middleInitial} ${data.lastName}`
      .replace(/\s+/g, " ")
      .trim();

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    Swal.fire({
      title: "Sending OTP…",
      text: "Please wait while we send your verification code.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await sendOtpEmail({ email, fullName, otp: otpCode });
    Swal.close();

    await Swal.fire({
      icon: "success",
      title: "OTP Sent",
      text: `An OTP has been sent to ${email}. Please check your inbox.`,
    });

    return otpCode;
  } catch (err) {
    Swal.close();
    await Swal.fire({
      icon: "error",
      title: "Failed to Send OTP",
      text: "Something went wrong while sending your OTP. Please try again.",
    });
    return null;
  }
};

// ============ VERIFY OTP ============
export const handleVerifyOTP = async (enteredOtp, email, sentOtp, navigate) => {
  if (!email) {
    await Swal.fire({
      icon: "error",
      title: "Missing Email",
      text: "Email not found. Please go back and try again.",
    });
    return false;
  }

  if (!enteredOtp || enteredOtp.length !== 6) {
    await Swal.fire({
      icon: "warning",
      title: "Invalid Code",
      text: "Please enter the 6-digit OTP code.",
    });
    return false;
  }

  if (enteredOtp !== sentOtp) {
    await Swal.fire({
      icon: "error",
      title: "Incorrect OTP",
      text: "The code you entered is incorrect. Please try again.",
    });
    return false;
  }

  await Swal.fire({
    icon: "success",
    title: "OTP Verified!",
    text: "Your OTP has been successfully verified.",
    showConfirmButton: false,
    timer: 1500,
  });

  navigate("/confirmPassword", { state: { email } });
  return true;
};

// ============ PASSWORD ============
export const fetchIdNumberByEmail = async (email) => {
  const { data, error } = await supabase
    .from("members-information")
    .select("idNumber")
    .eq("email", email)
    .single();
  return error ? null : data?.idNumber;
};

export const validateNewPassword = (p, c) => {
  if (!p || !c)
    return { valid: false, message: "Please fill out both password fields." };
  if (p !== c) return { valid: false, message: "Passwords do not match." };
  if (p.length < 8)
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  if (!/\d/.test(p))
    return {
      valid: false,
      message: "Password must contain at least one number.",
    };
  if (!/[^A-Za-z0-9]/.test(p))
    return {
      valid: false,
      message: "Password must contain at least one special character.",
    };
  return { valid: true };
};

export const updateAuthenticationPassword = async (idNumber, rawPassword) => {
  try {
    const hashed = bcrypt.hashSync(rawPassword, 10);
    const { error } = await supabase
      .from("authentication")
      .update({ password: hashed })
      .eq("idNumber", idNumber);
    if (error) throw error;
    return true;
  } catch (err) {
    await Swal.fire({
      icon: "error",
      title: "Failed to Update Password",
      text: "Something went wrong while saving your password.",
    });
    return false;
  }
};

export const handleConfirmPassword = async (
  newPassword,
  confirmPassword,
  email,
  navigate,
) => {
  const { valid, message } = validateNewPassword(newPassword, confirmPassword);
  if (!valid) {
    await Swal.fire({
      icon: "error",
      title: "Invalid Password",
      text: message,
    });
    return false;
  }
  const idNumber = await fetchIdNumberByEmail(email);
  if (!idNumber) {
    await Swal.fire({
      icon: "error",
      title: "User Not Found",
      text: "No account found for this email.",
    });
    return false;
  }
  const success = await updateAuthenticationPassword(idNumber, newPassword);
  if (success) {
    await Swal.fire({
      icon: "success",
      title: "Password Reset Successful",
      text: "You can now log in with your new password.",
      timer: 1500,
      showConfirmButton: false,
    });
    navigate("/");
  }
  return success;
};

/** Validate input fields */
export const validateLoginFields = async (idNumber, password) => {
  if (!idNumber || !password) {
    await Swal.fire({
      icon: "warning",
      title: "Missing fields",
      text: "Please enter both ID number and password.",
    });
    return false;
  }
  return true;
};

/** Perform login check and return result */
export const performLogin = async (idNumber, plainPassword) => {
  try {
    // Check if input is email or ID number
    const isEmail = idNumber.includes("@");

    let query = supabase
      .from("authentication")
      .select("idNumber, email, password");

    if (isEmail) {
      query = query.eq("email", idNumber);
    } else {
      query = query.eq("idNumber", idNumber);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return { error: "Invalid Credentials" };
    }

    const isMatch = await bcrypt.compare(plainPassword, data.password);
    if (!isMatch) {
      return { error: "Invalid Credentials" };
    }

    const token = btoa(`${data.idNumber}:${Date.now()}`);

    return { user: { idNumber: data.idNumber }, token: token };
  } catch (err) {
    return { error: "Error during login: " + err.message };
  }
};

/** Fetch user type */
export const fetchUserType = async (idNumber) => {
  const { data, error } = await supabase
    .from("user-type")
    .select("parish-secretary")
    .eq("idNumber", idNumber)
    .single();

  if (error) {
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error fetching user type.",
    });
    return null;
  }

  return data;
};

/** Handle success alert */
export const showLoginSuccess = async () => {
  await Swal.fire({
    icon: "success",
    title: "Login successful!",
    timer: 1200,
    showConfirmButton: false,
  });
};

/** Handle login failure alert */
export const showLoginError = async (errorMessage) => {
  await Swal.fire({
    icon: "error",
    title: "Login failed",
    text: errorMessage,
  });
};

/** Forgot Password Navigation */
export const goToForgotPassword = (navigate) => {
  navigate("/verifyEmail");
};
