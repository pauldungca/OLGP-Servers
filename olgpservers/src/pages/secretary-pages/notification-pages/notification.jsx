import React, { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";

import {
  fetchGlobalNotificationsForUser,
  dismissGlobalNotification,
} from "../../../assets/scripts/notification";

import "../../../assets/styles/notification.css";
import Footer from "../../../components/footer";

export default function NotificationSecretary() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const storedIdNumber = localStorage.getItem("idNumber");

  useEffect(() => {
    document.title = "OLGP Servers | Notifications";
    (async () => {
      setLoading(true);

      const global = await fetchGlobalNotificationsForUser(storedIdNumber);

      const normalizedGlobal = (global || []).map((g) => ({
        ...g,
        _kind: "global",
        label: g.title || "Announcement",
        date: new Date(g.created_at).toLocaleDateString(),
        time: new Date(g.created_at).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      }));

      setNotifications(normalizedGlobal);
      setLoading(false);
    })();
  }, [storedIdNumber]);

  const handleDelete = async (e, notif) => {
    e.preventDefault();
    e.stopPropagation();

    await dismissGlobalNotification(notif.id, storedIdNumber, setNotifications);
  };

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
              to={`/viewNotificationSecretary/${notif.id}?kind=global`}
              className="notification-row"
              key={`global-${notif.id}`}
              style={{ textDecoration: "none" }}
            >
              <div className="notification-message" title={notif.title}>
                {notif.label}
              </div>

              <div className="notification-actions">
                <span className="notification-time">
                  {notif.date} {notif.time}
                </span>
                <button
                  className="notification-btn delete-btn"
                  onClick={(e) => handleDelete(e, notif)}
                  title="Hide broadcast"
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
