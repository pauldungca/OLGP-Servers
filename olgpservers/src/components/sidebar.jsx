import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "../assets/styles/sidebar.css";
import icons from "../helper/icon";
import {
  fetchUserRoles,
  createNavigationLinks,
  createNavigationLinkWithSubmenu,
  buildDisplayName,
  handleLogoutClick,
} from "../assets/scripts/sidebar.js";

// 🔹 Regular Sidebar
export function Sidebar({ collapsed, mobileOpen }) {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [userRoleType, setUserRoleType] = useState();
  const [userRoles, setUserRoles] = useState({
    isParishSecretary: false,
    isAltarServerScheduler: false,
    isEucharisticMinisterScheduler: false,
    isLectorCommentatorScheduler: false,
    isChoirScheduler: false,
    isAltarServerMember: false,
    isEucharisticMinisterMember: false,
    isLectorCommentatorMember: false,
    isChoirMember: false,
  });

  const [, setUserId] = useState();
  const [displayName, setDisplayName] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const navigationLinks = createNavigationLinks(navigate);
  const navigationLinkWithSubmenu = createNavigationLinkWithSubmenu(
    icons,
    navigate
  );

  useEffect(() => {
    const path = window.location.pathname.replace("/", "") || "dashboard";

    if (path.includes("schedule")) {
      setActivePage("schedule");
      setActiveSubmenu("schedule-submenu");
    } else if (
      path.startsWith("makeSchedule") ||
      path.startsWith("selectScheduleAltarServer") ||
      path.startsWith("selectMassAltarServer") ||
      path.startsWith("selectRoleAltarServer") ||
      path.startsWith("assignMemberAltarServer") ||
      path.startsWith("selectScheduleEucharisticMinister") ||
      path.startsWith("selectMassEucharisticMinister") ||
      path.startsWith("assignGroupEucharisticMinister") ||
      path.startsWith("assignMemberEucharisticMinister") ||
      path.startsWith("selectScheduleChoir") ||
      path.startsWith("selectMassChoir") ||
      path.startsWith("assignGroupChoir") ||
      path.startsWith("selectScheduleLectorCommentator") ||
      path.startsWith("selectMassLectorCommentator") ||
      path.startsWith("selectRoleLectorCommentator") ||
      path.startsWith("assignMemberLectorCommentator")
    ) {
      setActivePage("make-schedule");
    } else if (
      path.startsWith("viewSchedule") ||
      path.startsWith("updateSchedule") ||
      path.startsWith("cancelSchedule")
    ) {
      setActivePage("view-schedule");
    } else if (
      path.startsWith("openSchedule") ||
      path.startsWith("selectTime") ||
      path.startsWith("updateStatus")
    ) {
      setActivePage("schedule-availability");
    } else if (
      path.startsWith("notification") ||
      path.startsWith("viewNotification")
    ) {
      setActivePage("notification");
    } else if (
      path.startsWith("members") ||
      path.startsWith("membersList") ||
      path.startsWith("addMember") ||
      path.startsWith("importMember") ||
      path.startsWith("viewMemberInformation") ||
      path.startsWith("selectDepartment")
    ) {
      setActivePage("members");
    } else if (path.startsWith("group") || path.startsWith("selectGroup")) {
      setActivePage("group");
    } else if (
      path.startsWith("departmentSettings") ||
      path.startsWith("selectMember") ||
      path.startsWith("assignReplacement")
    ) {
      setActivePage("department-settings");
    } else if (
      path.startsWith("account") ||
      path.startsWith("verifyOTPAccount") ||
      path.startsWith("changePasswordAccount")
    ) {
      setActivePage("account");
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
      buildDisplayName(userIdNumber)
        .then(setDisplayName)
        .catch(() => setDisplayName(""));
    } else {
      setUserId("None");
      setUserRoleType("None");
      setDisplayName("None");
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
            <span className="username">{displayName}</span>
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
          ].filter((option) => {
            if (option.title === "Make Schedule") {
              return (
                userRoles.isAltarServerScheduler ||
                userRoles.isEucharisticMinisterScheduler ||
                userRoles.isLectorCommentatorScheduler ||
                userRoles.isChoirScheduler
              );
            }
            if (option.title === "View Schedule") {
              return (
                userRoles.isAltarServerMember ||
                userRoles.isEucharisticMinisterMember ||
                userRoles.isLectorCommentatorMember ||
                userRoles.isChoirMember ||
                userRoles.isAltarServerScheduler ||
                userRoles.isEucharisticMinisterScheduler ||
                userRoles.isLectorCommentatorScheduler ||
                userRoles.isChoirScheduler
              );
            }
            if (option.title === "Open Schedule") {
              return (
                userRoles.isAltarServerMember ||
                userRoles.isEucharisticMinisterMember ||
                userRoles.isLectorCommentatorMember
              );
            }
            return true;
          }),
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
        {(userRoles.isAltarServerScheduler ||
          userRoles.isLectorCommentatorScheduler) &&
          navigationLinks(
            "Members",
            "/members",
            "members",
            icons.departmentLogo,
            activePage,
            collapsed
          )}

        {/* Group Link */}
        {(userRoles.isEucharisticMinisterScheduler ||
          userRoles.isChoirScheduler) &&
          navigationLinks(
            "Group",
            "/group",
            "group",
            icons.groupLogo,
            activePage,
            collapsed
          )}

        {/* Department Settings Link */}
        {(userRoles.isAltarServerScheduler ||
          userRoles.isEucharisticMinisterScheduler ||
          userRoles.isChoirScheduler ||
          userRoles.isLectorCommentatorScheduler) &&
          navigationLinks(
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
          collapsed,
          handleLogoutClick(navigate)
        )}
      </ul>
    </div>
  );
}

// 🔹 Parish Secretary Sidebar
export function SecretarySidebar({ collapsed, mobileOpen }) {
  const [activePage, setActivePage] = useState("secretaryDashboard");

  const [, setUserId] = useState();
  const [displayName, setDisplayName] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const navigationLinks = createNavigationLinks(navigate);
  const navigationLinkWithSubmenu = createNavigationLinkWithSubmenu(
    icons,
    navigate
  );
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const toggleSubmenu = (menuId) => {
    setActiveSubmenu(activeSubmenu === menuId ? null : menuId);
  };

  useEffect(() => {
    const path =
      window.location.pathname.replace("/", "") || "secretaryDashboard";

    if (path.includes("schedule")) {
      setActivePage("schedule");
      setActiveSubmenu("schedule-submenu");
    } else if (
      path.startsWith("selectTemplate") ||
      path.startsWith("createTemplate") ||
      path.startsWith("useTemplate") ||
      path.startsWith("editTemplate")
    ) {
      setActivePage("make-schedule");
    } else if (
      path.startsWith("viewScheduleSecretary") ||
      path.startsWith("cancelScheduleSecretary")
    ) {
      setActivePage("view-schedule");
    } else if (
      path.startsWith("notificationSecretary") ||
      path.startsWith("viewNotificationSecretary")
    ) {
      setActivePage("secretaryNotification");
    } else if (
      path.startsWith("secretaryAccount") ||
      path.startsWith("verifyOTPAccountSecretary") ||
      path.startsWith("changePasswordAccountSecretary")
    ) {
      setActivePage("secretaryAccount");
    } else {
      setActivePage(path);
    }

    if (path.includes("schedule")) {
      setActiveSubmenu("schedule-submenu");
    }

    const userIdNumber = localStorage.getItem("idNumber");
    if (userIdNumber) {
      setUserId(userIdNumber);
      buildDisplayName(userIdNumber)
        .then(setDisplayName)
        .catch(() => setDisplayName(""));
    } else {
      setUserId("None");
      setDisplayName("None");
    }
  }, [location]);

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
            <span className="username">{displayName}</span>
            <span className="user-role">Parish Secretary</span>
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
          "/secretaryDashboard",
          "secretaryDashboard",
          icons.dashboardLogo,
          activePage,
          collapsed
        )}

        {/*Schedule Link */}
        {navigationLinkWithSubmenu(
          "Schedule",
          "/schedule",
          "schedule",
          icons.scheduleLogo,
          [
            {
              title: "Make Schedule",
              to: "/selectTemplate",
              pageName: "make-schedule",
              icon: icons.makeScheduleLogo,
            },
            {
              title: "View Schedule",
              to: "/viewScheduleSecretary",
              pageName: "view-schedule",
              icon: icons.viewScheduleLogo,
            },
          ],
          activePage,
          activeSubmenu,
          collapsed,
          toggleSubmenu
        )}

        {/* Notifications */}
        {navigationLinks(
          "Notifications",
          "/notificationSecretary",
          "secretaryNotification",
          icons.notificationLogo,
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
          "/secretaryAccount",
          "secretaryAccount",
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
          collapsed,
          handleLogoutClick(navigate)
        )}
      </ul>
    </div>
  );
}
