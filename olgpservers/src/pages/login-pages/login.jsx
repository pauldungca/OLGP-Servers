import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import images from "../../helper/images";
import "../../assets/styles/indexLogin.css";
import {
  validateLoginFields,
  performLogin,
  fetchUserType,
  showLoginSuccess,
  showLoginError,
  goToForgotPassword,
} from "../../assets/scripts/login";

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "OLGP Servers | Login";
  }, []);

  const handleIdChange = (e) => {
    setIdNumber(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((v) => !v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const valid = await validateLoginFields(idNumber, password);
    if (!valid) return;

    const result = await performLogin(idNumber, password);
    if (result.error) {
      await showLoginError(result.error);
      return;
    }

    const { user, token } = result;
    const userType = await fetchUserType(idNumber);
    if (!userType) return;

    localStorage.setItem("authToken", token);
    localStorage.setItem("userData", JSON.stringify(user));
    localStorage.setItem("idNumber", idNumber);
    localStorage.setItem("userType", JSON.stringify(userType));

    await showLoginSuccess();

    if (userType["parish-secretary"] === 1) {
      navigate("/secretaryDashboard");
    } else {
      navigate("/dashboard");
    }
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
          <div className="right-section p-5 bg-white d-flex flex-column justify-content-center">
            <h2
              className="mb-4 text-center text-secondary"
              style={{ fontSize: 40 }}
            >
              Login
            </h2>

            <form onSubmit={handleSubmit}>
              {/* ID Number */}
              <div className="mb-4">
                <input
                  type="text"
                  className="form-control"
                  value={idNumber}
                  onChange={handleIdChange}
                  placeholder="ID number"
                  style={{ height: 45, borderRadius: 4, padding: "10px 15px" }}
                />
              </div>

              {/* Password */}
              <div className="mb-4 position-relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  className="form-control"
                  placeholder="Password"
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  style={{
                    height: 45,
                    borderRadius: 4,
                    padding: "10px 15px",
                    paddingRight: 40,
                  }}
                />
                <i
                  className={`bi ${
                    passwordVisible ? "bi-eye" : "bi-eye-slash"
                  } toggle-password`}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 15,
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                  }}
                  onClick={togglePasswordVisibility}
                ></i>
              </div>

              {/* Forgot Password */}
              <div className="text-end mb-4">
                <span
                  className="forgot-password-text"
                  onClick={() => goToForgotPassword(navigate)}
                >
                  Forgot Password?
                </span>
              </div>

              <button type="submit" className="btn btn-login">
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
