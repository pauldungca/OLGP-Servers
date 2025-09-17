import React, { useState } from "react";
import images from "../../helper/images"; // adjust if needed
import { useNavigate } from "react-router-dom";
import "../../assets/styles/indexLogin.css";

export default function ConfirmPassword() {
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const toggleVisibility = (which) => {
    if (which === "new") setNewPasswordVisible((v) => !v);
    else setConfirmPasswordVisible((v) => !v);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your password reset logic here
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
            className="right-section p-5 bg-white d-flex flex-column justify-content-center align-items-center"
            style={{ borderRadius: 20, height: "100%" }}
          >
            <img
              src={images.securityLogo}
              alt="Security"
              style={{ width: 150, marginBottom: 20 }}
            />

            <h4 className="mb-4 text-center fw-semibold">RESET PASSWORD</h4>

            <form
              onSubmit={handleSubmit}
              className="w-100"
              style={{ maxWidth: 300 }}
            >
              {/* New Password */}
              <div className="mb-3 position-relative">
                <input
                  type={newPasswordVisible ? "text" : "password"}
                  className="form-control"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ height: 45, paddingRight: 40 }}
                />
                <i
                  className={`bi ${
                    newPasswordVisible ? "bi-eye" : "bi-eye-slash"
                  } toggle-password`}
                  onClick={() => toggleVisibility("new")}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 12,
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                  }}
                ></i>
              </div>

              {/* Confirm Password */}
              <div className="mb-4 position-relative">
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  className="form-control"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ height: 45, paddingRight: 40 }}
                />
                <i
                  className={`bi ${
                    confirmPasswordVisible ? "bi-eye" : "bi-eye-slash"
                  } toggle-password`}
                  onClick={() => toggleVisibility("confirm")}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 12,
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                  }}
                ></i>
              </div>

              {/* Buttons */}
              <div className="d-flex justify-content-between w-100">
                <button
                  type="button"
                  className="btn btn-cancel d-flex align-items-center justify-content-center"
                  onClick={() => navigate("/")}
                >
                  <i className="bi bi-x-circle me-1"></i> Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-verify">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
