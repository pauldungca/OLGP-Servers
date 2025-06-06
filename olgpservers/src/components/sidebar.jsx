import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/styles/components.css";
import icons from "../helper/icon";
import { Tooltip } from "antd";

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

  function navigationLinks(title, toPage, pageName, icon) {
    return (
      <li className="nav-item">
        {collapsed ? (
          <Tooltip
            title={title}
            placement="right"
            overlayClassName="sidebar-tooltip"
            align={{
              offset: [10, -18], // Adjust horizontal offset
            }}
          >
            <Link
              to={toPage}
              className={`nav-link ${activePage === pageName ? "active" : ""}`}
            >
              <img src={icon} className="icon" />
            </Link>
          </Tooltip>
        ) : (
          <Link
            to={toPage}
            className={`nav-link ${activePage === pageName ? "active" : ""}`}
          >
            <img src={icon} className="icon" />
            <span>{title}</span>
          </Link>
        )}
      </li>
    );
  }

  function navigationLinkWithSubmenu(
    title,
    toPage,
    pageName,
    icon,
    submenuItems
  ) {
    return (
      <li className="nav-item has-submenu">
        <a
          href="#"
          className={`nav-link ${activePage === pageName ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            toggleSubmenu(`${pageName}-submenu`);
          }}
        >
          <img src={icon} className="icon" />
          {!collapsed && <span>{title}</span>}
          {collapsed ? (
            <Tooltip
              title={title}
              placement="right"
              overlayClassName="sidebar-tooltip"
              align={{ offset: [10, -18] }}
            >
              <span></span> {/* Empty span for tooltip positioning */}
            </Tooltip>
          ) : null}
          <img
            src={icons.arrowLogo}
            className={`arrow-icon ms-auto ${
              activeSubmenu === `${pageName}-submenu` ? "rotate" : ""
            }`}
            alt="arrow"
          />
        </a>
        <ul
          className={`submenu ${
            activeSubmenu === `${pageName}-submenu` ? "open" : ""
          }`}
          id={`${pageName}-submenu`}
        >
          {submenuItems.map((item, index) => (
            <li className="nav-item" key={index}>
              {collapsed ? (
                <Tooltip
                  title={item.title}
                  placement="right"
                  overlayClassName="sidebar-tooltip"
                  align={{ offset: [10, -13] }}
                >
                  <Link
                    to={item.to}
                    className={`nav-link sub-link ${
                      activePage === item.pageName ? "active" : ""
                    }`}
                  >
                    <img src={item.icon} className="icon" />
                  </Link>
                </Tooltip>
              ) : (
                <Link
                  to={item.to}
                  className={`nav-link sub-link ${
                    activePage === item.pageName ? "active" : ""
                  }`}
                >
                  <img src={item.icon} className="icon" />
                  <span>{item.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </li>
    );
  }

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
        {/* Dashboard Link */}
        {navigationLinks(
          "Dashboard",
          "/dashboard",
          "dashboard",
          icons.dashboardLogo
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
              to: "/make-schedule",
              pageName: "make-schedule",
              icon: icons.makeScheduleLogo,
            },
            {
              title: "View Schedule",
              to: "/view-schedule",
              pageName: "view-schedule",
              icon: icons.viewScheduleLogo,
            },
          ]
        )}
        {/* Notifications Link */}
        {navigationLinks(
          "Notifications",
          "/notification",
          "notification",
          icons.notificationLogo
        )}

        {/* Department Link */}
        {navigationLinks(
          "Department",
          "/department",
          "department",
          icons.departmentLogo
        )}

        {/* Department Settings Link */}
        {navigationLinks(
          "Department Settings",
          "/department-settings",
          "department-settings",
          icons.departmentSettingsLogo
        )}

        {/* Settings Section */}
        {!collapsed && <br />}
        <li className="nav-section nav-section-full">SETTINGS</li>
        <hr className="nav-divider-collapsed" />

        {/* Account Link */}
        {navigationLinks("Account", "/account", "account", icons.accountLogo)}

        {/* Logout Link */}
        {navigationLinks("Logout", "/logout", "logout", icons.logoutLogo)}
      </ul>
    </div>
  );
}
