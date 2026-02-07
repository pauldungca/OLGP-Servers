import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import images from "../../helper/images";
import {
  sendOtpToUser,
  handleVerifyOTP,
  createOtpCountdown,
  formatMMSS,
} from "../../assets/scripts/login";
import "../../assets/styles/indexLogin.css";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [sentOtp, setSentOtp] = useState("");
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerHandle = useRef(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    document.title = "OLGP Servers | Verify OTP";
    return () => timerHandle.current?.stop();
  }, []);

  const handleInputChange = (idx, e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      if (otp[idx]) newOtp[idx] = "";
      else if (idx > 0) inputRefs.current[idx - 1]?.focus();
      setOtp(newOtp);
    }
  };

  const sendOTP = async () => {
    const otpCode = await sendOtpToUser(email);
    if (!otpCode) return;
    setSentOtp(otpCode);
    setShowMessage(true);
    setOtpEnabled(true);
    setOtp(Array(6).fill(""));
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
    timerHandle.current?.stop();
    timerHandle.current = createOtpCountdown(
      120,
      (sec) => setCountdown(sec),
      () => setOtpEnabled(false),
    );
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join("");
    await handleVerifyOTP(enteredOtp, email, sentOtp, navigate);
  };

  return (
    <div
      className="min-vh-100"
      style={{
        background: `url(${images.backgroundImage}) no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="card login-card d-flex flex-row overflow-hidden">
          <div className="left-section d-flex flex-column justify-content-center align-items-center h-100">
            <img
              src={images.OLGPlogo}
              alt="Our Lady of Guadalupe Logo"
              className="logo"
            />
            <h3
              className="mt-3 text-white text-center"
              style={{ fontWeight: "600", fontSize: "1.5rem" }}
            >
              OLGP Servers
            </h3>
          </div>
          <div
            className="right-section p-5 bg-white d-flex flex-column justify-content-between align-items-center"
            style={{ borderRadius: 20 }}
          >
            <img
              src={images.securityLogo}
              alt="Security"
              style={{ width: 150, marginBottom: 30 }}
            />
            {showMessage && (
              <div className="text-center mb-3">
                <p>OTP is sent to</p>
                <p className="fw-bold">{email}</p>
              </div>
            )}
            <div className="d-flex gap-2 mb-4 justify-content-center">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  className="form-control text-center"
                  style={{ width: 50, height: 60, fontSize: 24 }}
                  value={digit}
                  disabled={!otpEnabled}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  onChange={(e) => handleInputChange(idx, e)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                />
              ))}
            </div>
            <div className="d-flex justify-content-center gap-3 w-100 mb-3">
              <button
                className="btn btn-cancel d-flex align-items-center justify-content-center"
                onClick={() => navigate("/")}
              >
                <i className="bi bi-x-circle me-1"></i> Cancel
              </button>
              <button
                className="btn btn-verify"
                disabled={!otpEnabled}
                onClick={handleVerify}
              >
                Verify OTP
              </button>
            </div>
            <div className="text-center mt-2">
              {countdown > 0 ? (
                <span className="text-muted">
                  Resend in {formatMMSS(countdown)}
                </span>
              ) : (
                <button
                  className="text-decoration-none"
                  style={{
                    color: "#3454b4",
                    background: "none",
                    border: "none",
                  }}
                  onClick={sendOTP}
                >
                  Click here to receive an OTP via email
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
