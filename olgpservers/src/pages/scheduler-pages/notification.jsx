// src/pages/scheduler-pages/notification.jsx
import React, { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";

import {
  fetchRequestNotification, // personal
  deleteNotification, // personal
  fetchGlobalNotificationsForUser, // global
  dismissGlobalNotification, // global
  fetchUserSpecificNotifications, // <-- assignment (user-specific)
  deleteUserSpecificNotification,
} from "../../assets/scripts/notification";

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

      // fetch all three: personal, global, and assignment notifications
      const [personal, global, assigned] = await Promise.all([
        fetchRequestNotification(storedIdNumber),
        fetchGlobalNotificationsForUser(storedIdNumber),
        fetchUserSpecificNotifications(storedIdNumber), // <-- new
      ]);

      // normalize global (broadcasts)
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

      // normalize personal (request-type)
      const normalizedPersonal = (personal || []).map((p) => ({
        ...p,
        _kind: "personal",
        label: `${p.department} Request`,
        // keep existing p.date / p.time if you already store them; otherwise add similar formatting
      }));

      // normalize assignment/user-specific
      const normalizedAssigned = (assigned || []).map((a) => ({
        ...a,
        _kind: "assignment",
        label:
          a.role === "Schedule Cancellation" ? a.role : `Assigned: ${a.role}`,
        date: a.date || "",
        time: a.time || "",
      }));

      // merge; you can sort if you want, but for now just show together
      const merged = [
        ...normalizedGlobal,
        ...normalizedPersonal,
        ...normalizedAssigned,
      ];

      setNotifications(merged);
      setLoading(false);
    })();
  }, [storedIdNumber]);

  const handleDelete = async (e, notif) => {
    e.preventDefault();
    e.stopPropagation();

    if (notif._kind === "assignment") {
      await deleteUserSpecificNotification(notif.id, setNotifications);
      return;
    }

    if (notif._kind === "global") {
      await dismissGlobalNotification(
        notif.id,
        storedIdNumber,
        setNotifications
      );
    } else {
      await deleteNotification(notif.id, setNotifications);
    }
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
          notifications.map((notif) => {
            const rowKey = `${notif._kind}-${
              notif.id ??
              `${notif.idNumber}-${notif.date}-${notif.time}-${notif.role}`
            }`;

            const titleText =
              notif._kind === "personal"
                ? `Type ${notif["notification-type"]} • ${notif.department}`
                : notif._kind === "assignment"
                ? `Assigned as ${notif.role}`
                : notif.title;

            return (
              <Link
                to={`/viewNotification/${notif.id ?? ""}?kind=${notif._kind}`}
                className="notification-row"
                key={rowKey}
                style={{ textDecoration: "none" }}
              >
                <div className="notification-message" title={titleText}>
                  {notif.label}
                </div>

                <div className="notification-actions">
                  <span className="notification-time">
                    {notif.date} {notif.time}
                  </span>

                  {/* hide delete for assignment items (fetch-only for now) */}
                  <button
                    className="notification-btn delete-btn"
                    onClick={(e) => handleDelete(e, notif)}
                    title={
                      notif._kind === "personal"
                        ? "Delete request"
                        : notif._kind === "global"
                        ? "Hide broadcast"
                        : "Delete"
                    }
                  >
                    <FaTrash />
                  </button>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <Footer />
    </div>
  );
}
