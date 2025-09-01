import React from "react";
import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import Footer from "../../../components/footer";

import "../../../assets/styles/notification.css";

export default function Notification() {
  const notifications = [
    {
      id: 1,
      message:
        "Your scheduled event for Sunday 9 AM has been updated. Please confirm the changes.",
      time: "2h ago",
      link: "/viewNotificationSecretary",
    },
    {
      id: 2,
      message: "A replacement has been assigned to your role in the choir.",
      time: "5h ago",
      link: "/viewNotificationSecretary",
    },
    {
      id: 3,
      message: "System maintenance scheduled for tonight at 10 PM.",
      time: "1d ago",
      link: "/viewNotificationSecretary",
    },
    {
      id: 4,
      message: "Reminder: Meeting tomorrow at 6 PM in the parish hall.",
      time: "3d ago",
      link: "/viewNotificationSecretary",
    },
  ];

  function handleDelete(e) {
    Swal.fire({
      icon: "question",
      title: "Are you sure to delete this notification?",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
  }

  return (
    <div className="notification-page-container">
      <div className="notification-header">
        <div className="header-text-with-line">
          <h3>NOTIFICATION</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="notification-content">
        {notifications.map((notif) => (
          <Link
            to={notif.link}
            className="notification-row"
            key={notif.id}
            style={{ textDecoration: "none" }}
          >
            <div className="notification-message" title={notif.message}>
              {notif.message}
            </div>
            <div className="notification-actions">
              <span className="notification-time">{notif.time}</span>
              <button
                className="notification-btn delete-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(e);
                }}
              >
                <FaTrash />
              </button>
            </div>
          </Link>
        ))}
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
