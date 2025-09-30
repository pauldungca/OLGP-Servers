// src/pages/scheduler-pages/viewNotification.jsx
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
  fetchGlobalNotificationById,
  fetchUserSpecificNotificationById,
  fetchTemplateMetaByScheduleID,
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
  const kind = (searchParams.get("kind") || "personal").toLowerCase();

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

        if (row?.scheduleID) {
          const meta = await fetchTemplateMetaByScheduleID(row.scheduleID);
          if (meta) row = { ...row, ...meta };
        }

        if (row) row._kind = "global";
      } else if (kind === "assignment") {
        row = await fetchUserSpecificNotificationById(id, storedIdNumber);
        if (row) row._kind = "assignment";
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

  // ===== Global (broadcast) renderers =====
  const renderGlobalTitle = (n) => n?.title || "Announcement";

  const renderGlobalBody = (n) => {
    if (!n) return null;

    const created = n.created_at ? new Date(n.created_at) : null;
    const displayDate = n.date || (created ? created.toLocaleDateString() : "");
    const displayTime =
      n.time ||
      n.scheduled_time ||
      n.start_time ||
      n.mass_time ||
      (created
        ? created.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : "");

    const noteText = (n.note ?? "").toString().trim() ? n.note : "non";
    const clientText =
      (n.clientName ?? n.client_name ?? n.client ?? "").toString().trim() ||
      "non";

    return (
      <div className="view-notification-card">
        {n.message && <p className="view-notification-text">{n.message}</p>}

        <div className="view-notification-detail">
          <span className="label">Client:</span>
          <span className="value">{clientText}</span>
        </div>
        <div className="view-notification-detail">
          <span className="label">Date:</span>
          <span className="value">{displayDate}</span>
        </div>
        <div className="view-notification-detail">
          <span className="label">Time:</span>
          <span className="value">{displayTime}</span>
        </div>
        <div className="view-notification-detail">
          <span className="label">Note:</span>
          <span className="value">{noteText}</span>
        </div>
      </div>
    );
  };

  // ===== Assignment (user-specific) renderers =====
  const renderAssignmentTitle = (n) => {
    if (!n) return "Assignment";
    const role = n.role ?? "";
    return role === "Schedule Cancellation"
      ? "Schedule Cancellation"
      : "Assignment";
  };

  const renderAssignmentBody = (n) => {
    if (!n) return null;

    const date = n.date ?? "";
    const time = n.time ?? "";
    const role = n.role ?? "";
    const reason = n.reason ?? "No reason provided";
    const isCancellation = role === "Schedule Cancellation";

    return (
      <div className="view-notification-card">
        {!isCancellation && (
          <p className="view-notification-text">
            You are assigned as <strong>{role}</strong>.
          </p>
        )}

        {isCancellation && (
          <p className="view-notification-text">
            A member has cancelled their schedule.
          </p>
        )}

        <div className="view-notification-detail">
          <span className="label">Date:</span>
          <span className="value">{date}</span>
        </div>
        <div className="view-notification-detail">
          <span className="label">Time:</span>
          <span className="value">{time}</span>
        </div>
        {!isCancellation && (
          <div className="view-notification-detail">
            <span className="label">Role:</span>
            <span className="value">{role}</span>
          </div>
        )}
        <div className="view-notification-detail">
          <span className="label">Reason:</span>
          <span className="value">{reason}</span>
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
        ) : kind === "assignment" ? (
          <>
            <h2 className="view-notification-title">
              {renderAssignmentTitle(notif)}
            </h2>
            {renderAssignmentBody(notif)}
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
