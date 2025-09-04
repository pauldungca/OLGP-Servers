import React, { useEffect } from "react";
import CalendarPage from "../../components/calendar";
import Footer from "../../components/footer";

import "../../assets/styles/dashboard.css";

export default function Dashboard() {
  useEffect(() => {
    document.title = "OLGP Servers | Dashboard";
  }, []);
  return (
    <div className="dashboard-page-container">
      <div className="dashboard-header">
        <div className="header-text-with-line">
          <h3>DASHBOARD</h3>
          <div className="header-line"></div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="row g-3">
          <div className="col-12">
            <div className="calendar-container p-3 rounded">
              <CalendarPage />
            </div>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
