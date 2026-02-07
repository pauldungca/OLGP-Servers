import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import images from "../../helper/images";
import { handleConfirmPassword } from "../../assets/scripts/login";
import "../../assets/styles/indexLogin.css";

export default function ConfirmPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleVisibility = (type) => {
    if (type === "new") setNewPasswordVisible(!newPasswordVisible);
    else setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleConfirmPassword(newPassword, confirmPassword, email, navigate);
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

          {/* Right Section */}
          <div
            className="right-section p-5 bg-white d-flex flex-column justify-content-center align-items-center"
            style={{ borderRadius: 20 }}
          >
            <img
              src={images.securityLogo}
              alt="Security"
              style={{ width: 150, marginBottom: 20 }}
            />

            <h4 className="mb-4 text-center fw-semibold">RESET PASSWORD</h4>

            <form
              onSubmit={handleSubmit}
              className="w-100 text-center"
              style={{ maxWidth: 320 }}
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
                  }`}
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
                  }`}
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
              <div className="d-flex justify-content-center gap-3">
                <button
                  type="button"
                  className="btn btn-cancel d-flex align-items-center justify-content-center"
                  onClick={() => navigate("/")}
                >
                  <i className="bi bi-x-circle me-1"></i> Cancel
                </button>
                <button type="submit" className="btn btn-verify">
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
