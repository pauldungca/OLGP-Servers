import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import images from "../../helper/images";

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "OLGP Servers | Login";
  }, []);

  const handleIdChange = (e) => {
    // Only allow numbers
    setIdNumber(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value); // Update password state
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((v) => !v); // Toggle password visibility
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idNumber || !password) {
      alert("Please enter both ID number and password.");
      return;
    }
    try {
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idnumber: idNumber, password }),
      });
      const result = await response.json();
      if (response.ok) {
        // Login successful, redirect or set auth state
        alert("Login successful!");
        // Example: navigate("/dashboard");
      } else {
        alert(result.error || "Login failed.");
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  };

  const handleForgotPassword = () => {
    navigate("/verifyOTP"); // Navigate to the Verify OTP page
  };

  const handleCreateAccount = () => {
    navigate("/createAccoount"); // Navigate to the Create Account page
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
            <img
              src={images.OLGPlogo}
              alt="Our Lady of Guadalupe Logo"
              className="logo"
            />
            {/* <button onClick={handleCreateAccount}>Create Account</button> */}
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

              <div className="mb-4 text-end" style={{ marginTop: -8 }}>
                <button
                  type="button"
                  className="text-decoration-none btn btn-link p-0"
                  style={{ fontSize: "0.875rem" }}
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
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
