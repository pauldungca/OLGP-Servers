import React, { useRef, useState } from "react";
import images from "../../helper/images";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/indexLogin.css";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const inputRefs = useRef([]);

  const handleInputChange = (idx, e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    // Move to next input
    if (idx < 5 && value) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[idx]) {
        // If there's a value, clear it
        newOtp[idx] = "";
        setOtp(newOtp);
      } else if (idx > 0) {
        // If input is empty, move to previous
        inputRefs.current[idx - 1].focus();
        newOtp[idx - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const sendOTP = () => {
    setShowMessage(true);
    setOtpEnabled(true);
    setOtp(Array(6).fill(""));
    setTimeout(() => {
      inputRefs.current[0].focus();
    }, 100);
  };

  const handleVerify = () => {
    // Do your OTP verification logic here
    // Example: navigate("/forgot-password");
    //alert("Your OTP is: " + otp.join(""));
    navigate("/confirmPassword");
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
          {/* Left Section */}
          <div className="left-section d-flex justify-content-center align-items-center h-100">
            <img src={images.OLGPlogo} alt="Logo" className="logo" />
          </div>
          {/* Right Section */}
          <div
            className="right-section p-5 bg-white d-flex flex-column justify-content-between align-items-center"
            style={{ borderRadius: 20, height: "100%" }}
          >
            <img
              src={images.securityLogo}
              alt="Security"
              style={{ width: 150, marginBottom: 30 }}
            />

            {/* OTP Message */}
            {showMessage && (
              <div className="mb-4 text-center" id="otp-message">
                <p className="mb-0">OTP is sent to</p>
                <p className="mb-0 fw-bold">johnpauldungca0908@gmail.com</p>
              </div>
            )}

            {/* OTP Input Boxes */}
            <div className="d-flex gap-2 mb-4" id="otp-inputs">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  className="form-control text-center otp-input"
                  style={{
                    width: 50,
                    height: 60,
                    fontSize: 24,
                  }}
                  value={digit}
                  disabled={!otpEnabled}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  onChange={(e) => handleInputChange(idx, e)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-between w-100 px-5 mb-3">
              <button
                type="button"
                className="btn btn-cancel d-flex align-items-center justify-content-center"
                onClick={() => (window.location.href = "/")}
              >
                <i className="bi bi-x-circle me-1"></i> Cancel
              </button>
              <button
                type="button"
                className={`btn btn-verify px-4${
                  !otpEnabled ? " disabled" : ""
                }`}
                disabled={!otpEnabled}
                onClick={handleVerify}
              >
                Verify OTP
              </button>
            </div>

            {/* Email Link */}
            <div className="text-center mt-2">
              <button
                type="button"
                className="text-decoration-none"
                style={{
                  color: "#3454b4",
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                  cursor: "pointer",
                }}
                onClick={sendOTP}
              >
                Click here to receive an OTP via email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
