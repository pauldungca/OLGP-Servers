import React, { useState } from "react";
import Sidebar from "../../components/sidebar";
import Header from "../../components/header";
import { Outlet } from "react-router-dom";
import "../../assets/styles/global.css";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true"
  );

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem("sidebar-collapsed", newCollapsed.toString());

    const hamburgerIcon = document.getElementById("hamburgerIcon");
    if (hamburgerIcon) {
      hamburgerIcon.classList.toggle("rotated", newCollapsed);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Header toggleSidebar={toggleSidebar} />
        <main
          className="scrollable-content"
          style={{ flex: 1, overflow: "auto" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
