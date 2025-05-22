import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <Link to="/register">Register</Link>
      <br />
      <Link to="/login">Login</Link>
      <br />
      <Link to="/dashboard">Dashboard</Link>
    </div>
  );
}

export default Home;
