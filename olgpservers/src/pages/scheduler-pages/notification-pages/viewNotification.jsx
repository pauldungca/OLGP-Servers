import React, { useEffect, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useParams, useNavigate } from "react-router-dom";

import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import {
  fetchRequestNotificationById,
  renderNotificationBody,
  renderNotificationTitle,
  approveRequest,
  denyRequest,
} from "../../../assets/scripts/notification";

import "../../../assets/styles/notification.css";
import "../../../assets/styles/viewNotification.css";

export default function ViewNotification() {
  const { id } = useParams();
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
      const row = await fetchRequestNotificationById(id, storedIdNumber);
      setNotif(row);
      setLoading(false);
    })();
  }, [id, storedIdNumber]);

  const onApprove = async () => {
    const ok = await approveRequest(notif, navigate);
    if (ok) setNotif(null);
  };

  const onDeny = async () => {
    const ok = await denyRequest(notif, navigate);
    if (ok) setNotif(null);
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
        ) : (
          <>
            {/* Title outside card */}
            <h2 className="view-notification-title">
              {renderNotificationTitle(notif)}
            </h2>
            {/* Card container */}
            {renderNotificationBody(notif, onApprove, onDeny)}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
