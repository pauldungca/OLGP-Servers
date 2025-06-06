import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();

    navigate("/"); // Redirect to login page ("/")
  }, [navigate]);

  return (
    <div>
      <h2>Logging out...</h2>
      {/* You can also show a spinner or loading message here */}
    </div>
  );
}
