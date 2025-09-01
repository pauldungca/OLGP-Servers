import React, { useState } from "react";
import { Breadcrumb } from "antd";
import { useNavigate, Link } from "react-router-dom";
import images from "../../../helper/images";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import "../../../assets/styles/account.css";
import "../../../assets/styles/changePasswordAccount.css";

export default function ChangePasswordAccount() {
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
                  title: (
                    <Link
                      to="/verifyOTPAccountSecretary"
                      className="breadcrumb-item"
                    >
                      Veriy OTP
                    </Link>
                  ),
                },
                {
                  title: "Change Password",
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
        <h4 className="mb-4 text-center fw-semibold">RESET PASSWORD</h4>
        <div className="d-flex justify-content-center">
          <form
            onSubmit={handleSubmit}
            className="w-100"
            style={{ maxWidth: "50%" }}
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
                } toggle-password eye`}
                onClick={() => toggleVisibility("confirm")}
              />
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-between w-100">
              <button
                type="button"
                className="btn btn-cancel d-flex align-items-center justify-content-center"
                onClick={handleCancel}
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
      <div>
        <Footer />
      </div>
    </div>
  );
}
