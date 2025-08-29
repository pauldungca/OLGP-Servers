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

// Secretary Pages
import SecretaryDashboard from "./pages/secretary-pages/dashboard";

// Schedule Pages

// Make Schedule Pages
import SelectTemplate from "./pages/secretary-pages/schedule-pages/make-schedule-pages/selectTemplate";
import CreateTemplate from "./pages/secretary-pages/schedule-pages/make-schedule-pages/createtemplate";
import UseTemplate from "./pages/secretary-pages/schedule-pages/make-schedule-pages/useTemplate";
import EditTemplate from "./pages/secretary-pages/schedule-pages/make-schedule-pages/editTemplate";

// Scheduler Pages
import Dashboard from "./pages/scheduler-pages/dashboard";
import Notification from "./pages/scheduler-pages/notification";
import Members from "./pages/scheduler-pages/member";
import DepartmentSettings from "./pages/scheduler-pages/departmentSettings";

// Schedule Pages
import OpenSchedule from "./pages/scheduler-pages/schedule-pages/open-schedule-pages/openSchedule";
import ViewSchedule from "./pages/scheduler-pages/schedule-pages/view-schedule-pages/viewSchedule";
import MakeSchedule from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/makeSchedule";

// Make Schedule Pages

// Altar Server Schedule Pages
import SelectSchedule from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/altar-server-schedule-pages/selectSchedule";
import SelectMass from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/altar-server-schedule-pages/selectMass";
import SelectRole from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/altar-server-schedule-pages/selectRole";
import AssignMember from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/altar-server-schedule-pages/assignMember";

// Eucharistic Minister Schedule Pages
import SelectScheduleEM from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/eucharistic-minister-schedule-pages/selectSchedule";
import SelectMassEM from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/eucharistic-minister-schedule-pages/selectMass";
import AssignGroup from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/eucharistic-minister-schedule-pages/assignGroup";
import AssignMemberEM from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/eucharistic-minister-schedule-pages/assignMember";

// Choir Schedule Pages
import SelectScheduleChoir from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/choir-schedule-pages/selectSchedule";
import SelectMassChoir from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/choir-schedule-pages/selectMass";
import AssignGroupChoir from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/choir-schedule-pages/assignGroup";

// Lector Commentator Schedule Pages
import SelectScheduleLectorCommentator from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/lector-commentator-pages/selectSchedule";
import SelectMassLectorCommentator from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/lector-commentator-pages/selectMass";
import SelectRoleLectorCommentator from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/lector-commentator-pages/selectRole";
import AssignMemberLectorCommentator from "./pages/scheduler-pages/schedule-pages/make-schedule-pages/lector-commentator-pages/assignMember";

//Open Schedule Pages
import SelectTime from "./pages/scheduler-pages/schedule-pages/open-schedule-pages/selectTime";
import UpdateStatus from "./pages/scheduler-pages/schedule-pages/open-schedule-pages/updateStatus";

// View Schedule Pages
import UpdateSchedule from "./pages/scheduler-pages/schedule-pages/view-schedule-pages/updateSchedule";
import CancelSchedule from "./pages/scheduler-pages/schedule-pages/view-schedule-pages/cancelSchedule";

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
import Layout from "./pages/scheduler-pages/layout"; // Layout component to wrap the content in the scheduler pages
import SecretaryLayout from "./pages/secretary-pages/layout"; // Layout component to wrap the content in the secretary pages
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
          {/* Secretary Routes */}
          <Route element={<SecretaryLayout />}>
            <Route
              path="/secretaryDashboard"
              element={<SecretaryDashboard />}
            />

            {/* Make Schedule Pages */}
            <Route path="/selectTemplate" element={<SelectTemplate />} />
            <Route path="/createTemplate" element={<CreateTemplate />} />
            <Route path="/useTemplate" element={<UseTemplate />} />
            <Route path="/editTemplate" element={<EditTemplate />} />
          </Route>
          <Route element={<Layout />}>
            {/*Schheduler Routes*/}
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

            {/* Make Schedule Pages */}

            {/* Altar Server Schedule Pages */}
            <Route
              path="/selectScheduleAltarServer"
              element={<SelectSchedule />}
            />
            <Route path="/selectMassAltarServer" element={<SelectMass />} />
            <Route path="/selectRoleAltarServer" element={<SelectRole />} />
            <Route path="/assignMemberAltarServer" element={<AssignMember />} />

            {/* Eucharistic Minister Schedule Pages */}
            <Route
              path="/selectScheduleEucharisticMinister"
              element={<SelectScheduleEM />}
            />
            <Route
              path="/selectMassEucharisticMinister"
              element={<SelectMassEM />}
            />
            <Route
              path="/assignGroupEucharisticMinister"
              element={<AssignGroup />}
            />
            <Route
              path="/assignMemberEucharisticMinister"
              element={<AssignMemberEM />}
            />

            {/* Choir Schedule Pages */}
            <Route
              path="/selectScheduleChoir"
              element={<SelectScheduleChoir />}
            />
            <Route path="/selectMassChoir" element={<SelectMassChoir />} />
            <Route path="/assignGroupChoir" element={<AssignGroupChoir />} />

            {/* Lector Commentator Schedule Pages */}
            <Route
              path="/selectScheduleLectorCommentator"
              element={<SelectScheduleLectorCommentator />}
            />
            <Route
              path="/selectMassLectorCommentator"
              element={<SelectMassLectorCommentator />}
            />
            <Route
              path="/selectRoleLectorCommentator"
              element={<SelectRoleLectorCommentator />}
            />
            <Route
              path="/assignMemberLectorCommentator"
              element={<AssignMemberLectorCommentator />}
            />

            {/* Open Schedule Pages */}
            <Route path="/selectTime" element={<SelectTime />} />
            <Route path="/updateStatus" element={<UpdateStatus />} />

            {/* View Schedule Pages */}
            <Route path="/updateSchedule" element={<UpdateSchedule />} />
            <Route path="/cancelSchedule" element={<CancelSchedule />} />

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
