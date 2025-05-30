import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";
import emailjs from "../utils/emailJS";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  useEffect(() => {
    document.title = "OLGP Servers | Login";
  }, []);

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

  function sendEmailNotification() {
    if (!email) {
      setMessage("Please enter your email before sending OTP.");
      return;
    }
    var templateParams = {
      from_name: "OLGP Servers",
      passcode: "123456",
      time: 120,
      email: email,
    };

    emailjs.send("service_8mfk8z2", "template_1jhhemj", templateParams).then(
      (response) => {
        setMessage("Email sent successfully!");
      },
      (error) => {
        setMessage(
          "Failed to send email: " +
            (error?.text || error?.message || "Unknown error")
        );
      }
    );
  }

  return (
    <div>
      <h2>Login</h2> <br />
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
        <button type="button" onClick={sendEmailNotification}>
          Send OTP
        </button>
      </form>
      <p>Don't have an account? Click link here! </p>
      <Link to="/register">Register</Link>
    </div>
  );
}

export default Login;
