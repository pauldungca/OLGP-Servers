// src/pages/Logout.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear session data (e.g., tokens)
    localStorage.removeItem("userToken"); // Remove token from localStorage
    sessionStorage.removeItem("userToken"); // Remove token from sessionStorage

    // Optionally, clear cookies if needed
    // document.cookie = "userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Redirect to the homepage after logout
    navigate("/"); // Redirect to homepage (./)
  }, [navigate]);

  return (
    <div>
      <h2>Logging out...</h2>
    </div>
  );
}
