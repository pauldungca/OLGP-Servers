import React, { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";
import { Link } from "react-router-dom";

function Register() {
  useEffect(() => {
    document.title = "OLGP Servers | Register";
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    }

    if (data) {
      setMessage(
        "User created successfully. Please check your email for confirmation."
      );
    }

    setEmail("");
    setPassword("");
  };

  return (
    <div>
      <h2>Register</h2>
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
        <button type="submit">Create Account</button>
      </form>
      <p>Already have an account? Click link here! </p>
      <Link to="/login">Login</Link>
    </div>
  );
}

export default Register;
