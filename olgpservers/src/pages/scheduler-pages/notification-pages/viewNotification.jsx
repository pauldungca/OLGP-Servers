import React, { useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../helper/icon";
import "../../../assets/styles/notification.css";
import "../../../assets/styles/viewNotification.css";

import Footer from "../../../components/footer";

export default function ViewNotification() {
  useEffect(() => {
    document.title = "OLGP Servers | Notifications";
  }, []);
  return (
    <div className="notification-page-container">
      <div className="notification-header">
        <div className="header-text-with-line">
          <h3>NOTIFICATION</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/notification" className="breadcrumb-item">
                      Notification
                    </Link>
                  ),
                },
                {
                  title: "View Notification",
                  className: "breadcrumb-item-active",
                },
              ]}
              separator={
                <img
                  src={icon.chevronIcon}
                  alt="Chevron Icon"
                  style={{ width: "15px", height: "15px" }}
                />
              }
              className="customized-breadcrumb"
            />
          </div>
          <div className="header-line"></div>
        </div>
      </div>

      <div className="notification-content">
        {/* Title outside card */}
        <h2 className="view-notification-title">
          A New Wedding Mass is Scheduled
        </h2>

        {/* Card container */}
        <div className="view-notification-card">
          <p className="view-notification-text">
            A New Wedding Mass is Scheduled. Here are the details:
          </p>
          <div className="view-notification-detail">
            <span className="label">Date:</span>
            <span className="value">07/25/2025</span>
          </div>
          <div className="view-notification-detail">
            <span className="label">Time:</span>
            <span className="value">10:00 AM</span>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
