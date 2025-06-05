import React, { useEffect, useState } from "react";
import Footer from "../../components/footer";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";

export default function Notification() {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true"
  );

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem("sidebar-collapsed", newCollapsed.toString());

    // Find the hamburger icon and toggle the rotated class
    const hamburgerIcon = document.getElementById("hamburgerIcon");
    if (hamburgerIcon) {
      hamburgerIcon.classList.toggle("rotated", newCollapsed);
    }
  };

  // Update document title when Dashboard is loaded
  useEffect(() => {
    document.title = "OLGP Servers | Notification";
  }, []);

  return (
    <div className="d-flex">
      {/* Pass collapsed state to Sidebar */}
      <Sidebar collapsed={collapsed} />

      <div className="flex-grow-1 d-flex flex-column">
        {/* Pass toggleSidebar function to Header */}
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-grow-1">
          {/* Main content of the dashboard */}
          <h2>Welcome to the Notification</h2>
          <p>
            This is your main Notification page where you can manage your
            content.
          </p>
        </main>

        {/* Footer Component */}
        <Footer />
      </div>
    </div>
  );
}
