import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/dashboard";

import CreateAccoount from "./pages/login-pages/createAccoount";

// login pages import
import Login from "./pages/login-pages/login";
import VerifyOTP from "./pages/login-pages/verifyOTP";
import ConfirmPassword from "./pages/login-pages/confirmPassword";

import Wrapper from "./helper/wrapper";

import "./assets/styles/index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <Wrapper>
              <Dashboard />
            </Wrapper>
          }
        />
        <Route path="/" element={<Login />} />
        <Route path="/verifyOTP" element={<VerifyOTP />} />
        <Route path="/confirmPassword" element={<ConfirmPassword />} />

        <Route path="/createAccoount" element={<CreateAccoount />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
