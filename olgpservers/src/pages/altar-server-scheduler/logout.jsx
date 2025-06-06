import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear session data (e.g., tokens) from localStorage and sessionStorage
    localStorage.removeItem("authToken"); // Assuming "authToken" stores the token
    sessionStorage.removeItem("authToken");

    // Redirect to the homepage after logout
    navigate("/"); // Redirect to login page ("/")
  }, [navigate]);

  return (
    <div>
      <h2>Logging out...</h2>
      {/* You can also show a spinner or loading message here */}
    </div>
  );
}
