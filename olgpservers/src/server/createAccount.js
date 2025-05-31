require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cors = require("cors");
const supabase = require("../utils/supabase.server");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// Configure Nodemailer transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // your Gmail app password
  },
});

// Helper function to send welcome email
async function sendWelcomeEmail(to, idNumber) {
  await transporter.sendMail({
    from: `"OLGP Servers" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Welcome to OLGP Servers!",
    text: `Hello! Your account with ID number ${idNumber} has been created.`,
  });
}

// send email endpoint
app.post("/api/send-email", async (req, res) => {
  const { email, idNumber } = req.body;
  try {
    await sendWelcomeEmail(email, idNumber);
    res.json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// create an account
app.post("/api/create-account", async (req, res) => {
  const { idnumber, id, password, email } = req.body;
  const { data, error } = await supabase
    .from("authentication")
    .insert([{ idnumber, id, password, email }]);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Account created", data });
});

app.post("/api/login", async (req, res) => {
  const { idnumber, password } = req.body;
  const { data, error } = await supabase
    .from("authentication")
    .select("*")
    .eq("idnumber", idnumber)
    .eq("password", password)
    .single();
  if (error || !data) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ message: "Login successful", user: data });
});

app.listen(4000, () => console.log("Server running on port 4000"));
