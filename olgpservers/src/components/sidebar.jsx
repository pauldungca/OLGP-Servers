import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/styles/components.css";
import icons from "../helper/icon";

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    const path = window.location.pathname.replace("/", "") || "dashboard";
    setActivePage(path);

    if (path.includes("schedule")) {
      setActiveSubmenu("schedule-submenu");
    }
  }, []);

  const toggleSubmenu = (menuId) => {
    const newActiveSubmenu = activeSubmenu === menuId ? null : menuId;
    setActiveSubmenu(newActiveSubmenu);
  };

  return (
    <div
      className={`sidebar p-3 ${collapsed ? "collapsed" : ""}`}
      style={{ width: "250px" }}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <h4 className="sidebar-brand">
          OLGP <span className="thin-text">Servers</span>
        </h4>
        <h5 className="sidebar-brand-short">OLGP</h5>
      </div>

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
            <span className="user-role">Altar Server Scheduler</span>
          </div>
        )}
      </div>

      <br />

      {/* Main Menu */}
      <ul className="nav flex-column">
        <li className="nav-section">MAIN</li>
        <li className="nav-item">
          <Link
            to="/dashboard"
            className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
          >
            <img src={icons.dashboardLogo} className="icon" />
            <span>Dashboard</span>
          </Link>
        </li>

        <li className="nav-item has-submenu">
          <a
            href="#"
            className={`nav-link ${activePage === "schedule" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              toggleSubmenu("schedule-submenu");
            }}
          >
            <img src={icons.scheduleLogo} className="icon" />
            <span>Schedule</span>
            <img
              src={icons.arrowLogo}
              className={`arrow-icon ms-auto ${
                activeSubmenu === "schedule-submenu" ? "rotate" : ""
              }`}
              alt="arrow"
            />
          </a>
          <ul
            className={`submenu ${
              activeSubmenu === "schedule-submenu" ? "open" : ""
            }`}
            id="schedule-submenu"
          >
            <li className="nav-item">
              <Link
                to="/make-schedule"
                className={`nav-link sub-link ${
                  activePage === "make-schedule" ? "active" : ""
                }`}
              >
                <img src={icons.makeScheduleLogo} className="icon" />
                <span>Make Schedule</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/view-schedule"
                className={`nav-link sub-link ${
                  activePage === "view-schedule" ? "active" : ""
                }`}
              >
                <img src={icons.viewScheduleLogo} className="icon" />
                <span>View Schedule</span>
              </Link>
            </li>
          </ul>
        </li>
        <li className="nav-item">
          <Link
            to="/notification"
            className={`nav-link ${
              activePage === "notification" ? "active" : ""
            }`}
          >
            <img src={icons.notificationLogo} className="icon" />
            <span>Notifications</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link
            to="/department"
            className={`nav-link ${
              activePage === "department" ? "active" : ""
            }`}
          >
            <img src={icons.departmentLogo} className="icon" />
            <span>Department</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link
            to="/department-settings"
            className={`nav-link ${
              activePage === "department-settings" ? "active" : ""
            }`}
          >
            <img src={icons.departmentSettingsLogo} className="icon" />
            <span>Department Settings</span>
          </Link>
        </li>

        {/* Settings Section */}
        {!collapsed && <br />}
        <li className="nav-section nav-section-full">SETTINGS</li>
        <hr className="nav-divider-collapsed" />

        <li className="nav-item">
          <Link
            to="/account"
            className={`nav-link ${activePage === "account" ? "active" : ""}`}
          >
            <img src={icons.accountLogo} className="icon" />
            <span>Account</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link
            to="/logout"
            className={`nav-link ${activePage === "logout" ? "active" : ""}`}
          >
            <img src={icons.logoutLogo} className="icon" />
            <span>Logout</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
