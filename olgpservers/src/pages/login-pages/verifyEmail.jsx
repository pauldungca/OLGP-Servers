import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import images from "../../helper/images";
import { handleVerifyEmail } from "../../assets/scripts/login";
import "../../assets/styles/indexLogin.css";

export default function VerifyEmail() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleVerifyEmail(email, navigate);
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
            <img src={images.OLGPlogo} alt="OLGP" className="logo" />
            <h3 className="mt-3 text-white text-center fw-semibold">
              OLGP Servers
            </h3>
          </div>
          <div
            className="right-section p-5 bg-white d-flex flex-column justify-content-center align-items-center"
            style={{ borderRadius: 20, height: "100%" }}
          >
            <img
              src={images.securityLogo}
              alt="Security"
              style={{ width: 150, marginBottom: 20 }}
            />
            <h4 className="mb-4 text-center fw-semibold">ENTER YOUR EMAIL</h4>
            <form onSubmit={handleSubmit} className="w-100 text-center">
              <div className="mb-4 d-flex justify-content-center">
                <input
                  type="email"
                  className="form-control verify-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "80%" }}
                />
              </div>
              <div className="d-flex justify-content-center gap-3 w-100">
                <button
                  type="button"
                  className="btn btn-cancel"
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
