// Notification.jsx
import React, { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { fetchRequestNotification } from "../../assets/scripts/notification";

import "../../assets/styles/notification.css";
import Footer from "../../components/footer";

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const storedIdNumber = localStorage.getItem("idNumber");

  useEffect(() => {
    document.title = "OLGP Servers | Notifications";
    (async () => {
      setLoading(true);
      const rows = await fetchRequestNotification(storedIdNumber);
      setNotifications(rows);
      setLoading(false);
    })();
  }, [storedIdNumber]);

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
          <h3>NOTIFICATIONS ({notifications.length})</h3>
          <div className="header-line"></div>
        </div>
      </div>

      <div className="notification-content">
        {loading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p>No notifications found.</p>
        ) : (
          notifications.map((notif) => (
            <Link
              to={`/viewNotification/${notif.id}`}
              className="notification-row"
              key={notif.id}
              style={{ textDecoration: "none" }}
            >
              <div
                className="notification-message"
                title={`Type ${notif["notification-type"]} • ${notif.department}`}
              >
                {/* Short label to display */}
                {notif.department} Request
              </div>
              <div className="notification-actions">
                <span className="notification-time">
                  {notif.date} {notif.time}
                </span>
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
          ))
        )}
      </div>
      <Footer />
    </div>
  );
}
