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
import DepartmentSettings from "./pages/scheduler-pages/departmentSettings";

// Schedule Pages
import OpenSchedule from "./pages/scheduler-pages/schedule-pages/open-schedule-pages/openSchedule";
import ViewSchedule from "./pages/scheduler-pages/schedule-pages/view-schedule-pages/viewSchedule";
import MakeSchedule from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/makeSchedule";

//Open Schedule Pages
import SelectTime from "./pages/scheduler-pages/schedule-pages/open-schedule-pages/selectTime";

// Notification Pages
import ViewNotification from "./pages/scheduler-pages/notification-pages/viewNotification";

//Members Pages
import MembersList from "./pages/scheduler-pages/members-pages/membersList";
import AddMember from "./pages/scheduler-pages/members-pages/addMember";
import SelectDepartment from "./pages/scheduler-pages/members-pages/selectDepartment";
import ImportMember from "./pages/scheduler-pages/members-pages/importMember";

// Group Pages
import Group from "./pages/scheduler-pages/group";
import SelectGroup from "./pages/scheduler-pages/group-pages/selectGroup";

// Department Settings Pages
import SelectMember from "./pages/scheduler-pages/department-settings-pages/selectMember";
import AssignReplacement from "./pages/scheduler-pages/department-settings-pages/assignReplacement";

// Account Pages
import Account from "./pages/scheduler-pages/account";
import VerifyOTPAccount from "./pages/scheduler-pages/account-pages/verifyOTP";
import ChangePasswordAccount from "./pages/scheduler-pages/account-pages/changePasswordAccount";

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
            <Route path="departmentSettings" element={<DepartmentSettings />} />
            <Route path="logout" element={<Logout />} />

            {/* Notification Pages */}
            <Route path="viewNotification" element={<ViewNotification />} />

            {/* Schedule Pages */}
            <Route path="/openSchedule" element={<OpenSchedule />} />
            <Route path="/viewSchedule" element={<ViewSchedule />} />
            <Route path="/makeSchedule" element={<MakeSchedule />} />

            {/* Open Schedule Pages */}
            <Route path="/selectTime" element={<SelectTime />} />

            {/* Members Pages */}
            <Route path="/membersList" element={<MembersList />} />
            <Route path="/addMember" element={<AddMember />} />
            <Route path="/selectDepartment" element={<SelectDepartment />} />
            <Route path="/importMember" element={<ImportMember />} />

            {/* Group Pages */}
            <Route path="/group" element={<Group />} />
            <Route path="/selectGroup" element={<SelectGroup />} />

            {/* Department Settings Pages */}
            <Route path="/selectMember" element={<SelectMember />} />
            <Route path="/assignReplacement" element={<AssignReplacement />} />

            {/* Account Pages */}
            <Route path="/account" element={<Account />} />
            <Route path="/verifyOTPAccount" element={<VerifyOTPAccount />} />
            <Route
              path="/changePasswordAccount"
              element={<ChangePasswordAccount />}
            />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
