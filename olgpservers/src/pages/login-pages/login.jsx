import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase.js";
import bcrypt from "bcryptjs";
import images from "../../helper/images";
import Swal from "sweetalert2";

import "../../assets/styles/indexLogin.css";

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

  const login = async (idNumber, plainPassword) => {
    try {
      // 1) Get the auth row by idNumber only
      const { data, error } = await supabase
        .from("authentication")
        .select("idNumber, password")
        .eq("idNumber", idNumber)
        .single();

      if (error || !data) {
        return { error: "Invalid ID number or password." };
      }

      // 2) Compare plaintext vs bcrypt hash
      const isMatch = await bcrypt.compare(plainPassword, data.password);
      if (!isMatch) {
        return { error: "Invalid ID number or password." };
      }

      return { user: { idNumber: data.idNumber }, token: data.token };
    } catch (err) {
      return { error: "Error during login: " + err.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idNumber || !password) {
      await Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please enter both ID number and password.",
      });
      return;
    }

    const result = await login(idNumber, password);
    if (result.error) {
      await Swal.fire({
        icon: "error",
        title: "Login failed",
        text: result.error,
      });
      return;
    }

    const { user, token } = result;

    // fetch user-type flags you need (e.g., parish-secretary)
    const { data: userType, error: userTypeError } = await supabase
      .from("user-type")
      .select("parish-secretary")
      .eq("idNumber", idNumber)
      .single();

    if (userTypeError) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error fetching user type.",
      });
      return;
    }

    // Persist session
    localStorage.setItem("authToken", token);
    localStorage.setItem("userData", JSON.stringify(user));
    localStorage.setItem("idNumber", idNumber);
    localStorage.setItem("userType", JSON.stringify(userType));

    await Swal.fire({
      icon: "success",
      title: "Login successful!",
      timer: 1200,
      showConfirmButton: false,
    });

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
