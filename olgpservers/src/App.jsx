import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import Register from "./pages/register";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";

import Wrapper from "./helper/wrapper";

import "../src/assets/styles/index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <Wrapper>
              <Dashboard />
            </Wrapper>
          }
        />
        {/* Home */}
        <Route path="/" element={<Home />} />
        {/* Register */}
        <Route path="/register" element={<Register />} />
        {/* Login */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
