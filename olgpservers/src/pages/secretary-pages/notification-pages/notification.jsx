import React from "react";
import { useNavigate } from "react-router";
import Footer from "../../../components/footer";

import "../../../assets/styles/notification.css";

export default function Notification() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate("/viewNotificationSecretary");
  };
  return (
    <div className="notification-page-container">
      <div className="notification-header">
        <div className="header-text-with-line">
          <h3>NOTIFICATION</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="notification-content">
        <button onClick={handleCardClick}>Next Page</button>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
