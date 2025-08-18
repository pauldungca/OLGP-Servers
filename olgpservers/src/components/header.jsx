import React from "react";
import "../assets/styles/header.css";

export default function Header({ toggleSidebar, isMobile }) {
  return (
    <div className={`topbar ${isMobile ? "mobile-topbar" : ""}`}>
      {!isMobile && (
        <button className="hamburger" onClick={toggleSidebar}>
          <i id="hamburgerIcon" className="bi bi-list"></i>
        </button>
      )}

      {isMobile && (
        <button className="hamburger mobile-hamburger" onClick={toggleSidebar}>
          <i id="hamburgerIconMobile" className="bi bi-list"></i>
        </button>
      )}
    </div>
  );
}
