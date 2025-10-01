import React, { useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";

import {
  fetchScheduleBasic,
  extractBasicFromState,
  getQueryParam,
  confirmAndCancelSchedule,
} from "../../../../assets/scripts/viewScheduleSecretary";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/cancelSchedule.css";

export default function CancelSchedule() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [basic, setBasic] = React.useState({
    clientName: "",
    time: "",
    scheduleID: null,
  });

  useEffect(() => {
    document.title = "OLGP Servers | Cancel Schedule";
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setError("");

      const fromState = extractBasicFromState(location.state);
      if (fromState && !cancelled) {
        setBasic(fromState);
      }

      const stateId = location?.state?.id;
      const queryId = getQueryParam(location.search, "id");
      const id = stateId || queryId;
      if (!id) {
        if (!fromState && !cancelled) setError("No schedule selected.");
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await fetchScheduleBasic(id);
        if (error) throw error;
        if (!cancelled && data) {
          setBasic((prev) => ({
            ...prev,
            clientName: data.clientName ?? "",
            time: data.time ?? "",
            scheduleID: location.state?.scheduleID ?? prev.scheduleID,
          }));
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError("Failed to load schedule details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [location]);

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>VIEW SCHEDULE</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link
                      to="/viewScheduleSecretary"
                      className="breadcrumb-item"
                    >
                      View Schedule
                    </Link>
                  ),
                },
                {
                  title: "Cancel Schedule",
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

      <div className="schedule-content container">
        <div className="cancel-schedule-card shadow-sm p-4 rounded">
          <h4 className="mb-4">Cancel Schedule</h4>

          {loading ? (
            <p className="text-muted">Loading details…</p>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <>
              <p>
                <strong>Client:</strong> {basic.clientName || "—"}
              </p>
              <p>
                <strong>Time:</strong> {basic.time || "—"}
              </p>

              <div className="text-center mt-4">
                <button
                  className="btn btn-confirm w-100"
                  onClick={() =>
                    confirmAndCancelSchedule(basic.scheduleID, navigate)
                  }
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
