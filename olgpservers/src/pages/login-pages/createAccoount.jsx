import React, { useState } from "react";
import supabase from "../../utils/supabase";

export default function CreateAccoount() {
  const [id, setId] = useState("");
  const [idnumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function generateRandomString(length = 12) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idnumber || !password || !email) {
      setMessage("Please fill in all fields.");
      return;
    } else if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    } else if (!email.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    } else {
      setMessage("Creating account...");
      const randomStr = generateRandomString();
      setId(randomStr);
      try {
        const response = await fetch(
          "http://localhost:4000/api/create-account",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idnumber, id: randomStr, password, email }),
          }
        );
        const result = await response.json();
        if (response.ok) {
          setMessage("Account created!");
          setEmail("");
          setId("");
          setIdNumber("");
          setPassword("");
        } else {
          setMessage("Error: " + (result.error || "Unknown error"));
        }
      } catch (err) {
        setMessage("Network error: " + err.message);
      }
    }
  };

  const sendEmail = async () => {
    setMessage("Sending email...");
    try {
      const response = await fetch("http://localhost:4000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, idnumber }),
      });
      const result = await response.json();
      if (response.ok) setMessage("Email sent!");
      else setMessage("Error: " + (result.error || "Unknown error"));
    } catch (err) {
      setMessage("Network error: " + err.message);
    }
  };

  return (
    <div>
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Id Number"
          value={idnumber}
          onChange={(e) => setIdNumber(e.target.value.replace(/[^0-9]/g, ""))}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Create</button>
        <button type="button" onClick={sendEmail}>
          Send Email
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
