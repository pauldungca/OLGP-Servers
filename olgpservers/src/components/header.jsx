import React from "react";
import "../assets/styles/components.css";

export default function Header({ toggleSidebar }) {
  return (
    <div className="topbar p-2 d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center gap-3">
        <button className="hamburger" onClick={toggleSidebar}>
          <i id="hamburgerIcon" className="bi bi-list"></i>
        </button>
      </div>
    </div>
  );
}
