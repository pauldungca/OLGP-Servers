import React from "react";
import "../assets/styles/components.css";

// Pass toggleSidebar function as a prop to this component
export default function Header({ toggleSidebar }) {
  return (
    <div className="topbar p-2 d-flex justify-content-between align-items-center">
      <button className="hamburger" onClick={toggleSidebar}>
        <i id="hamburgerIcon" className="bi bi-list"></i>
      </button>
    </div>
  );
}
