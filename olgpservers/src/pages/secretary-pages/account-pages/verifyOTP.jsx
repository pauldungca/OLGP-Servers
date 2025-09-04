import React, { useRef, useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { useNavigate, Link } from "react-router-dom";
import images from "../../../helper/images";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import "../../../assets/styles/account.css";
import "../../../assets/styles/verifyOTPAccount.css";

export default function VerifyOTP() {
  useEffect(() => {
    document.title = "OLGP Servers | Account";
  }, []);
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
    if (idx < 5 && value) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[idx]) {
        newOtp[idx] = "";
        setOtp(newOtp);
      } else if (idx > 0) {
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
    navigate("/changePasswordAccountSecretary");
  };

  const handleCancel = () => {
    navigate("/secretaryAccount");
  };
  return (
    <div className="account-page-container">
      <div className="account-header">
        <div className="header-text-with-line">
          <h3>ACCOUNT</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/secretaryAccount" className="breadcrumb-item">
                      Account
                    </Link>
                  ),
                },
                {
                  title: "Verify OTP",
                  className: "breadcrumb-item-active",
                },
              ]}
              separator={
                <img
                  src={icon.chevronIcon}
                  alt="Chevron Icon"
                  style={{ width: "15px", height: "15px" }}
                />
              }
              className="customized-breadcrumb"
            />
          </div>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="account-content">
        <div className="d-flex justify-content-center">
          <img src={images.securityLogo} alt="Security" className="logo" />
        </div>

        {/* OTP Message */}
        {showMessage && (
          <div className="mb-4 text-center message" id="otp-message">
            <p className="mb-0">OTP is sent to</p>
            <p className="mb-0 fw-bold">johnpauldungca0908@gmail.com</p>
          </div>
        )}

        {/* OTP Input Boxes */}
        <div
          className="d-flex gap-2 mb-4 justify-content-center"
          id="otp-inputs"
        >
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              className="form-control text-center otp-input otp-style"
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
            onClick={handleCancel}
          >
            <i className="bi bi-x-circle me-1"></i> Cancel
          </button>
          <button
            type="button"
            className={`btn btn-verify px-4${!otpEnabled ? " disabled" : ""}`}
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
            className="text-decoration-none email"
            onClick={sendOTP}
          >
            Click here to receive an OTP via email
          </button>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
