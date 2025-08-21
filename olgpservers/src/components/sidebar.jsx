import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "../assets/styles/sidebar.css";
import icons from "../helper/icon";
import {
  fetchUserRoles,
  createNavigationLinks,
  createNavigationLinkWithSubmenu,
} from "../assets/scripts/sidebar.js";

export default function Sidebar({ collapsed, mobileOpen }) {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [userRoleType, setUserRoleType] = useState();
  const [, setUserRoles] = useState({
    isParishSecretary: false,
    isAltarServerScheduler: false,
    isEucharisticMinisterScheduler: false,
    isLectorCommentatorScheduler: false,
    isChoirScheduler: false,
  });
  const [, setUserId] = useState();

  const location = useLocation();
  const navigate = useNavigate();
  const navigationLinks = createNavigationLinks(navigate);
  const navigationLinkWithSubmenu = createNavigationLinkWithSubmenu(
    icons,
    navigate
  );

  useEffect(() => {
    const path = window.location.pathname.replace("/", "") || "dashboard";

    if (
      path.startsWith("members") ||
      path.startsWith("membersList") ||
      path.startsWith("addMember") ||
      path.startsWith("importMember") ||
      path.startsWith("selectDepartment")
    ) {
      setActivePage("members");
    } else if (path.includes("schedule")) {
      setActivePage("schedule");
      setActiveSubmenu("schedule-submenu");
    } else if (
      path.startsWith("departmentSettings") ||
      path.startsWith("selectMember") ||
      path.startsWith("assignReplacement")
    ) {
      setActivePage("department-settings");
    } else if (
      path.startsWith("notification") ||
      path.startsWith("viewNotification")
    ) {
      setActivePage("notification");
    } else {
      setActivePage(path);
    }

    if (path.includes("schedule")) {
      setActiveSubmenu("schedule-submenu");
    }

    const userIdNumber = localStorage.getItem("idNumber");
    if (userIdNumber) {
      setUserId(userIdNumber);
      fetchUserRoles(userIdNumber, setUserRoles, setUserRoleType);
    } else {
      setUserId("None");
      setUserRoleType("None");
    }
  }, [location]);

  const toggleSubmenu = (menuId) => {
    setActiveSubmenu(activeSubmenu === menuId ? null : menuId);
  };

  return (
    <div
      className={`sidebar p-3 ${collapsed ? "collapsed" : ""} ${
        mobileOpen ? "mobile-open" : ""
      }`}
      style={{ width: "250px" }}
    >
      {/* User Profile Section */}
      <div className="sidebar-user">
        <img
          src={icons.photoAccountLogo}
          alt="UserLogo"
          className="user-icon"
        />
        {!collapsed && (
          <div className="user-details">
            <span className="username">John Doe</span>
            <span className="user-role">{userRoleType}</span>
          </div>
        )}
      </div>

      <br />

      {/* Main Menu */}
      <ul className="nav flex-column">
        <li className="nav-section">MAIN</li>
        {/* Dashboard Link */}
        {navigationLinks(
          "Dashboard",
          "/dashboard",
          "dashboard",
          icons.dashboardLogo,
          activePage,
          collapsed
        )}

        {/* Schedule Link with Submenu */}
        {navigationLinkWithSubmenu(
          "Schedule",
          "/schedule",
          "schedule",
          icons.scheduleLogo,
          [
            {
              title: "Make Schedule",
              to: "/makeSchedule",
              pageName: "make-schedule",
              icon: icons.makeScheduleLogo,
            },
            {
              title: "View Schedule",
              to: "/viewSchedule",
              pageName: "view-schedule",
              icon: icons.viewScheduleLogo,
            },
            {
              title: "Open Schedule",
              to: "/openSchedule",
              pageName: "schedule-availability",
              icon: icons.scheduleAvalabilityLogo,
            },
          ],
          activePage,
          activeSubmenu,
          collapsed,
          toggleSubmenu
        )}
        {/* Notifications Link */}
        {navigationLinks(
          "Notifications",
          "/notification",
          "notification",
          icons.notificationLogo,
          activePage,
          collapsed
        )}

        {/* Members Link */}
        {navigationLinks(
          "Members",
          "/members",
          "members",
          icons.departmentLogo,
          activePage,
          collapsed
        )}

        {/* Members Link */}
        {navigationLinks(
          "Group",
          "/group",
          "group",
          icons.groupLogo,
          activePage,
          collapsed
        )}

        {/* Department Settings Link */}
        {navigationLinks(
          "Department Settings",
          "/departmentSettings",
          "department-settings",
          icons.departmentSettingsLogo,
          activePage,
          collapsed
        )}

        {/* Settings Section */}
        {!collapsed && <br />}
        <li className="nav-section nav-section-full">SETTINGS</li>
        {collapsed && <hr className="nav-divider-collapsed" />}

        {/* Account Link */}
        {navigationLinks(
          "Account",
          "/account",
          "account",
          icons.accountLogo,
          activePage,
          collapsed
        )}

        {/* Logout Link */}
        {navigationLinks(
          "Logout",
          "/logout",
          "logout",
          icons.logoutLogo,
          activePage,
          collapsed
        )}
      </ul>
    </div>
  );
}
