import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();

    navigate("/");
  }, [navigate]);

  return (
    <div>
      <h2>Logging out...</h2>
    </div>
  );
}
