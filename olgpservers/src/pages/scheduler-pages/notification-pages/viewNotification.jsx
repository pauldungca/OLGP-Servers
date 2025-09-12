import React, { useEffect, useState } from "react";
import { Breadcrumb } from "antd";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import {
  fetchRequestNotificationById,
  fetchGlobalNotificationById, // ⬅️ add this import
  renderNotificationBody,
  renderNotificationTitle,
  approveRequest,
  denyRequest,
} from "../../../assets/scripts/notification";

import "../../../assets/styles/notification.css";
import "../../../assets/styles/viewNotification.css";

export default function ViewNotification() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const kind = (searchParams.get("kind") || "personal").toLowerCase(); // "personal" | "global"

  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const storedIdNumber = localStorage.getItem("idNumber");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "OLGP Servers | Notifications";
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);

      let row = null;
      if (kind === "global") {
        row = await fetchGlobalNotificationById(id);
      } else {
        row = await fetchRequestNotificationById(id, storedIdNumber);
        if (row) row._kind = "personal";
      }

      setNotif(row);
      setLoading(false);
    })();
  }, [id, storedIdNumber, kind]);

  const onApprove = async () => {
    const ok = await approveRequest(notif, navigate);
    if (ok) setNotif(null);
  };

  const onDeny = async () => {
    const ok = await denyRequest(notif, navigate);
    if (ok) setNotif(null);
  };

  // Simple renderers for GLOBAL/broadcast rows
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
          <h3>NOTIFICATIONS</h3>
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
        {loading ? (
          <p>Loading...</p>
        ) : !notif ? (
          <p>Notification not found or you do not have access.</p>
        ) : kind === "global" ? (
          <>
            <h2 className="view-notification-title">
              {renderGlobalTitle(notif)}
            </h2>
            {renderGlobalBody(notif)}
          </>
        ) : (
          <>
            <h2 className="view-notification-title">
              {renderNotificationTitle(notif)}
            </h2>
            {renderNotificationBody(notif, onApprove, onDeny)}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
