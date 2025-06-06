import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function Wrapper({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check for token in localStorage
        const token = localStorage.getItem("authToken");

        // Here, you can also verify the token by calling an API if needed
        // const response = await verifyTokenAPI(token);
        // setAuthenticated(response.isValid);

        // If token exists, consider the user authenticated
        setAuthenticated(!!token);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false); // Set loading to false after the check is done
      }
    };

    checkAuthentication();
  }, []);

  // Show a loading message while checking for authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // If authenticated, render the children (protected routes)
  return authenticated ? children : <Navigate to="/" replace />;
}

export default Wrapper;
