import React, { useState } from "react";
import supabase from "../helper/supabaseClient";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data && data.user) {
      navigate("/dashboard");
    }

    setEmail("");
    setPassword("");
  };

  return (
    <div>
      <h2>Login</h2>
      <br />
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Enter Email: </label>
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          placeholder="Enter Email"
          name="email"
          id=""
          required
        />
        <br />
        <label htmlFor="password">Enter Password: </label>
        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          placeholder="Enter Password"
          name="password"
          id=""
          required
        />
        <br />
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? Click link here! </p>
      <Link to="/register">Register</Link>
    </div>
  );
}

export default Login;
