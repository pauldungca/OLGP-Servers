import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import Header from "../../components/header";
import { Outlet } from "react-router-dom";
import "../../assets/styles/global.css";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true" ||
      window.innerWidth <= 1024
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Auto-collapse on tablet
      if (window.innerWidth <= 1024 && window.innerWidth > 768) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      const newCollapsed = !collapsed;
      setCollapsed(newCollapsed);
      localStorage.setItem("sidebar-collapsed", newCollapsed.toString());
    }

    const hamburgerIcon = document.getElementById("hamburgerIcon");
    const hamburgerIconMobile = document.getElementById("hamburgerIconMobile");

    if (hamburgerIcon) {
      hamburgerIcon.classList.toggle("rotated", !collapsed);
    }
    if (hamburgerIconMobile) {
      hamburgerIconMobile.classList.toggle("rotated", !collapsed);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        mobileOpen={isMobile && mobileOpen}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Header toggleSidebar={toggleSidebar} isMobile={isMobile} />
        <main
          className="scrollable-content"
          style={{ flex: 1, overflow: "auto" }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="mobile-sidebar-overlay" onClick={toggleSidebar} />
      )}
    </div>
  );
}
