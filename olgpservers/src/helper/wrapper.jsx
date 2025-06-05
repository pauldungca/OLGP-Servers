import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function Wrapper({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check for token in localStorage (or make an API call to verify token)
        const token = localStorage.getItem("authToken");

        // If you need to verify the token with the backend, you could make an API call here
        // const response = await verifyTokenAPI(token);
        // setAuthenticated(response.isValid);

        // For now, just check if token exists
        setAuthenticated(!!token);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return authenticated ? children : <Navigate to="/" replace />;
}

export default Wrapper;
