import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Supabase
import { supabase } from "./utils/supabase";

// Ant Design
import "antd/dist/reset.css";

import CreateAccoount from "./pages/login-pages/createAccoount";
import Login from "./pages/login-pages/login";
import VerifyOTP from "./pages/login-pages/verifyOTP";
import ConfirmPassword from "./pages/login-pages/confirmPassword";
import Wrapper from "./helper/wrapper";
import "./assets/styles/index.css";

// Altar Server Scheduler
import Dashboard from "./pages/altar-server-scheduler/dashboard";
import Notification from "./pages/altar-server-scheduler/notification";
import Logout from "./pages/altar-server-scheduler/logout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/verifyOTP" element={<VerifyOTP />} />
        <Route path="/confirmPassword" element={<ConfirmPassword />} />
        <Route path="/createAccoount" element={<CreateAccoount />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <Wrapper>
              <Dashboard />
            </Wrapper>
          }
        />
        <Route
          path="/notification"
          element={
            <Wrapper>
              <Notification />
            </Wrapper>
          }
        />
        <Route
          path="/logout"
          element={
            <Wrapper>
              <Logout />
            </Wrapper>
          }
        />
        {/* Add more protected routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
