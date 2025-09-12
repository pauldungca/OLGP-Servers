import React, { useEffect, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useParams } from "react-router-dom";

import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import { fetchGlobalNotificationById } from "../../../assets/scripts/notification";

import "../../../assets/styles/notification.css";
import "../../../assets/styles/viewNotification.css";

export default function ViewNotfication() {
  const { id } = useParams();
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "OLGP Servers | Notifications";
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const row = await fetchGlobalNotificationById(id);
      setNotif(row || null);
      setLoading(false);
    })();
  }, [id]);

  const renderGlobalTitle = (n) => n?.title || "Announcement";
  const renderGlobalBody = (n) => {
    if (!n) return null;
    const created = n.created_at ? new Date(n.created_at) : null;
    const date = created ? created.toLocaleDateString() : "";
    const time = created
      ? created.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "";

    return (
      <div className="view-notification-card">
        <p className="view-notification-text">{n.message}</p>
        <div className="view-notification-detail">
          <span className="label">Date:</span>
          <span className="value">{date}</span>
        </div>
        <div className="view-notification-detail">
          <span className="label">Time:</span>
          <span className="value">{time}</span>
        </div>
      </div>
    );
  };

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
                    <Link
                      to="/notificationSecretary"
                      className="breadcrumb-item"
                    >
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
        {loading ? (
          <p>Loading...</p>
        ) : !notif ? (
          <p>Notification not found.</p>
        ) : (
          <>
            <h2 className="view-notification-title">
              {renderGlobalTitle(notif)}
            </h2>
            {renderGlobalBody(notif)}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
