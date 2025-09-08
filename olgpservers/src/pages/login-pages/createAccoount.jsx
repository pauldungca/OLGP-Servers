import React, { useState } from "react";
import { supabase } from "../../utils/supabase.js";

export default function CreateAccoount() {
  const [idNumber, setIdNumber] = useState(""); // Correct variable name here
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [, setOtp] = useState("");
  const [name, setName] = useState("");

  React.useEffect(() => {
    setName("Paul Dungca");
  }, []);

  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function createAccount(idNumber, password, email) {
    return supabase
      .from("authentication")
      .insert([{ idNumber, password, email }])
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }
        return data;
      })
      .catch((err) => {
        throw new Error("Account creation failed: " + err.message);
      });
  }

  async function defineUserType(
    idNumber,
    roles = {
      parishSecretary: 0,
      altarScheduler: 0,
      ministerScheduler: 0,
      choirScheduler: 0,
      lectorScheduler: 0,
      altarMember: 0,
      eucharisticMinister: 0,
      choirMember: 0,
      lectorCommentator: 0,
    }
  ) {
    try {
      const { data, error } = await supabase
        .from("user-type")
        .insert([
          {
            idNumber: idNumber,
            "parish-secretary": roles.parishSecretary,
            "altar-server-scheduler": roles.altarScheduler,
            "eucharistic-minister-scheduler": roles.ministerScheduler,
            "choir-scheduler": roles.choirScheduler,
            "lector-commentator-scheduler": roles.lectorScheduler,
            "altar-server-member": roles.altarMember,
            "eucharistic-minister-member": roles.eucharisticMinister,
            "choir-member": roles.choirMember,
            "lector-commentator-member": roles.lectorCommentator,
          },
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("User type creation failed:", err);
      throw new Error("User type definition failed: " + err.message);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idNumber || !password || !email) {
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
      try {
        await createAccount(idNumber, password, email); // for creating an account
        await defineUserType(idNumber, {
          parishSecretary: 0,
          altarScheduler: 0,
          ministerScheduler: 0,
          choirScheduler: 0,
          lectorScheduler: 0,
          altarMember: 0,
          eucharisticMinister: 0,
          choirMember: 0,
          lectorCommentator: 0,
        }); // for identifying the user, 1 for a role and 0 for not role
        setMessage("Account created!");
        setEmail("");
        setIdNumber("");
        setPassword("");
      } catch (err) {
        setMessage("Network error: " + err.message);
        console.log("Error creating account:", err);
      }
    }
  };

  const sendEmail = async () => {
    const otpValue = generateOTP();
    setOtp(otpValue);
    alert("Your OTP is: " + otpValue);
    setMessage("Sending email...");
    try {
      const response = await fetch("http://localhost:5000/sendOTP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue, name }),
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
          value={idNumber}
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
