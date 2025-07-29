import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom"; // Make sure this import is correct

function Wrapper() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem("authToken");

      setAuthenticated(!!token);
      setLoading(false);
    };

    checkAuthentication();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return authenticated ? <Outlet /> : <Navigate to="/" replace />; // Using Navigate (correct spelling)
}

export default Wrapper;
