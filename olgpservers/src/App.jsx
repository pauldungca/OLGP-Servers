import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Ant Design
import "antd/dist/reset.css";

//bootstrap
import "bootstrap/dist/css/bootstrap.min.css";

// Login Pages
import CreateAccoount from "./pages/login-pages/createAccoount";
import Login from "./pages/login-pages/login";
import VerifyOTP from "./pages/login-pages/verifyOTP";
import ConfirmPassword from "./pages/login-pages/confirmPassword";

// Scheduler Pages
import Dashboard from "./pages/scheduler-pages/dashboard";
import Notification from "./pages/scheduler-pages/notification";
import Members from "./pages/scheduler-pages/member";

//Members Pages
import MembersList from "./pages/scheduler-pages/members-pages/membersList";
import AddMember from "./pages/scheduler-pages/members-pages/addMember";
import SelectDepartment from "./pages/scheduler-pages/members-pages/selectDepartment";

import Logout from "./pages/scheduler-pages/logout";

// Layout & Wrapper
import Layout from "./pages/scheduler-pages/layout"; // Layout component to wrap the content
import Wrapper from "./helper/wrapper"; // Wrapper component to handle authentication

import "./assets/styles/font.css";

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
        <Route element={<Wrapper />}>
          <Route element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="notification" element={<Notification />} />
            <Route path="members" element={<Members />} />
            <Route path="logout" element={<Logout />} />

            {/* Members Pages */}
            <Route path="/membersList" element={<MembersList />} />
            <Route path="/addMember" element={<AddMember />} />
            <Route path="/selectDepartment" element={<SelectDepartment />} />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
