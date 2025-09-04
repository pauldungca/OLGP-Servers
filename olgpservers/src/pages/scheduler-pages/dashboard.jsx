import React, { useEffect } from "react";
import "../../assets/styles/dashboard.css";
import images from "../../helper/images";

import CalendarPage from "../../components/calendar";

import Footer from "../../components/footer";

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
          {/* Card 1 */}
          <div className="col-md-6">
            <div className="d-flex align-items-center p-3 rounded card-style">
              <img
                src={images.departmentHandlesImages}
                alt="Department Handles"
                className="img-people"
              />
              <div>
                <h4 className="mb-0 fw-bold fs-3">1</h4>
                <small>Department Handles</small>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="col-md-6">
            <div className="d-flex align-items-center p-3 rounded card-style">
              <img
                src={images.massCompletedImage}
                alt="Mass Completed"
                className="img-checkIcon"
              />
              <div>
                <h4 className="mb-0 fw-bold fs-3">5</h4>
                <small>Mass Completed</small>
              </div>
            </div>
          </div>
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
