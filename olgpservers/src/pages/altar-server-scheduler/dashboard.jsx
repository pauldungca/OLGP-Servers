import React, { useEffect, useState } from "react";
import Footer from "../../components/footer";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true"
  );

  const [idNumber, setIdNumber] = useState("");

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem("sidebar-collapsed", newCollapsed.toString());

    const hamburgerIcon = document.getElementById("hamburgerIcon");
    if (hamburgerIcon) {
      hamburgerIcon.classList.toggle("rotated", newCollapsed);
    }
  };

  useEffect(() => {
    document.title = "OLGP Servers | Dashboard";
    const storedIdNumber = localStorage.getItem("idNumber");
    if (storedIdNumber) {
      setIdNumber(storedIdNumber);
    } else {
      setIdNumber("No ID found");
    }
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
          <h2>Welcome to the Dashboard</h2>
          <p>
            This is your main dashboard page where you can manage your content.
            <h4>{idNumber}</h4>
          </p>
        </main>

        {/* Footer Component */}
        <Footer />
      </div>
    </div>
  );
}
