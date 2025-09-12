import React, { useRef, useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { useNavigate, Link } from "react-router-dom";
import images from "../../../helper/images";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import Swal from "sweetalert2";

import {
  fetchMemberNameAndEmail,
  createOtpCountdown,
  formatMMSS,
  handleSendOtp,
} from "../../../assets/scripts/account";

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
  const [generatedOtp, setGeneratedOtp] = useState("");

  const [memberInfo, setMemberInfo] = useState(null);
  const storedIdNumber = localStorage.getItem("idNumber");

  const [countdown, setCountdown] = useState(0);
  const timerHandle = useRef(null);

  // Load member info (name + email)
  useEffect(() => {
    const loadMember = async () => {
      if (storedIdNumber) {
        const info = await fetchMemberNameAndEmail(storedIdNumber);
        setMemberInfo(info);
      }
    };
    loadMember();
  }, [storedIdNumber]);

  // Clean up countdown on unmount
  useEffect(() => {
    return () => {
      if (timerHandle.current) timerHandle.current.stop();
    };
  }, []);

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

  const sendOTP = async () => {
    if (!memberInfo) return;

    try {
      const otpCode = await handleSendOtp({
        email: memberInfo.email,
        fullName: memberInfo.fullName,
      });

      if (!otpCode) return; // failed to send OTP

      setGeneratedOtp(otpCode);

      // Enable inputs
      setShowMessage(true);
      setOtpEnabled(true);
      setOtp(Array(6).fill(""));

      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);

      // Start 2-minute timer
      if (timerHandle.current) timerHandle.current.stop();
      timerHandle.current = createOtpCountdown(
        120,
        (sec) => setCountdown(sec),
        () => {
          Swal.fire({
            icon: "warning",
            title: "OTP Expired",
            text: "Your OTP has expired. Please request a new one.",
          });
          setOtpEnabled(false);
        }
      );

      // Store OTP locally for verification
      console.log("Generated OTP (for debugging):", otpCode);
    } catch (err) {
      console.error("sendOTP error:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to send OTP",
        text: "There was a problem sending your OTP. Please try again.",
      });
    }
  };

  const handleVerify = () => {
    const enteredOtp = otp.join("");

    if (enteredOtp !== generatedOtp) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: "The OTP you entered is incorrect. Please try again.",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Verified",
      text: "OTP verified successfully!",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      navigate("/changePasswordAccount");
    });
  };

  const handleCancel = () => {
    navigate("/account");
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
                    <Link to="/account" className="breadcrumb-item">
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
        <div className="otp-card">
          <div className="d-flex justify-content-center">
            <img src={images.securityLogo} alt="Security" className="logo" />
          </div>

          {/* OTP Message */}
          {showMessage && memberInfo && (
            <div className="mb-4 text-center message" id="otp-message">
              <p className="mb-0">OTP is sent to</p>
              <p className="mb-0 fw-bold">{memberInfo.email}</p>
            </div>
          )}

          {/* OTP Input Boxes */}
          <div className="d-flex mb-4 justify-content-center" id="otp-inputs">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                className="form-control text-center otp-input"
                value={digit}
                disabled={!otpEnabled}
                ref={(el) => (inputRefs.current[idx] = el)}
                onChange={(e) => handleInputChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="action-row">
            <button
              type="button"
              className="btn btn-cancel d-flex align-items-center justify-content-center"
              onClick={handleCancel}
            >
              <i className="bi bi-x-circle me-1"></i> Cancel
            </button>
            <button
              type="button"
              className="btn btn-verify px-4"
              disabled={!otpEnabled}
              onClick={handleVerify}
            >
              Verify OTP
            </button>
          </div>

          {/* Email Link */}
          <div className="text-center mt-2">
            {countdown > 0 ? (
              <span className="text-muted">
                Resend in {formatMMSS(countdown)}
              </span>
            ) : (
              <button
                type="button"
                className="text-decoration-none email"
                onClick={sendOTP}
              >
                Click here to receive an OTP via email
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
