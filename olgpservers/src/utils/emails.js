// put near your other imports/util fns in the same file
const API_BASE = process.env.REACT_APP_MAIL_API;

export const sendWelcomeEmail = async ({
  email,
  firstName,
  middleName,
  lastName,
  idNumber,
}) => {
  const fullName = [
    firstName || "",
    middleName ? `${middleName.charAt(0).toUpperCase()}.` : "",
    lastName || "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const tempPassword = "olgp2025-2026";

  const res = await fetch(`${API_BASE}/sendWelcome`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      name: fullName,
      idNumber,
      tempPassword,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Email API returned ${res.status}`);
  }
};

export const sendOtpEmail = async ({ email, fullName, otp }) => {
  const res = await fetch(`${API_BASE}/sendOTP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      name: fullName,
      otp,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Email API returned ${res.status}`);
  }
};
