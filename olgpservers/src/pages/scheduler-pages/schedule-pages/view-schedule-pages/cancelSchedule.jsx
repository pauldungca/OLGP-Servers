import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Breadcrumb } from "antd";
import icon from "../../../../helper/icon";

import {
  // Per-user variants — implement these in viewScheduleNormal.js
  fetchAltarServerScheduleByDateForUser,
  fetchLectorCommentatorScheduleByDateForUser,
  fetchEucharisticScheduleByDateForUser,
} from "../../../../assets/scripts/viewScheduleNormal";

import { cancelSchedule } from "../../../../assets/scripts/viewScheduleNormal";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/cancelSchedule.css";

/* =======================
   Helpers (outside component)
   ======================= */
const SUNDAY_ORDER = [
  "1st Mass - 6:00 AM",
  "2nd Mass - 8:00 AM",
  "3rd Mass - 5:00 PM",
];

function pickBestSunday(masses = []) {
  for (const label of SUNDAY_ORDER) if (masses.includes(label)) return label;
  return masses[0] || "";
}

function deriveTimeFromLabel(label = "") {
  // "2nd Mass - 8:00 AM" → "2nd Mass | 8:00 AM"
  if (!label) return "";
  const parts = label.split("-").map((s) => s.trim());
  if (parts.length >= 2) return `${parts[0]} | ${parts[1]}`;
  return label;
}

export default function CancelSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | View Schedule";
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  // Passed in from previous page
  const department = location.state?.department || "Members";
  const selectedISO = location.state?.selectedISO || null;
  const selectedMass = location.state?.selectedMass || null; // optional

  // Current user idNumber (who is cancelling)
  const idNumber = useMemo(() => localStorage.getItem("idNumber") || "", []);

  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [reason, setReason] = useState("");

  // Resolved display values
  const [massLabel, setMassLabel] = useState(""); // DB label e.g. "2nd Mass - 8:00 AM"
  const [timeLabel, setTimeLabel] = useState(""); // UI label e.g. "2nd Mass | 8:00 AM"
  const [summary, setSummary] = useState(null); // raw rows for reference

  const displayDate = useMemo(() => {
    if (!selectedISO) return "—";
    try {
      const d = new Date(selectedISO);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return selectedISO;
    }
  }, [selectedISO]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Basic guardrails
      if (!selectedISO) {
        setLoading(false);
        setFetchErr("Missing date.");
        return;
      }
      if (!idNumber) {
        setLoading(false);
        setFetchErr("Missing user idNumber.");
        return;
      }

      setLoading(true);
      setFetchErr("");

      try {
        const dep = (department || "").toLowerCase();
        let rows = [];

        if (dep.includes("lector")) {
          rows = await fetchLectorCommentatorScheduleByDateForUser(
            selectedISO,
            idNumber
          );
        } else if (dep.includes("euchar")) {
          rows = await fetchEucharisticScheduleByDateForUser(
            selectedISO,
            idNumber
          );
        } else {
          // default to Altar Servers
          rows = await fetchAltarServerScheduleByDateForUser(
            selectedISO,
            idNumber
          );
        }

        if (cancelled) return;
        setSummary(rows || []);

        const masses = Array.from(
          new Set((rows || []).map((r) => r.mass).filter(Boolean))
        );

        if (masses.length === 0) {
          setMassLabel("—");
          setTimeLabel("—");
        } else {
          const chosen =
            selectedMass && masses.includes(selectedMass)
              ? selectedMass
              : pickBestSunday(masses);

          setMassLabel(chosen);
          setTimeLabel(deriveTimeFromLabel(chosen));
        }
      } catch (e) {
        if (!cancelled) {
          setFetchErr(e?.message || "Failed to fetch schedule.");
          setMassLabel("—");
          setTimeLabel("—");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedISO, department, idNumber, selectedMass]);

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>VIEW SCHEDULE - {department.toUpperCase()}</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/viewSchedule" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/updateSchedule"
                      className="breadcrumb-item"
                      state={{ department }}
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

          {!selectedISO ? (
            <div className="alert alert-danger">Missing date.</div>
          ) : loading ? (
            <div className="text-center" style={{ padding: "1rem" }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  border: "3px solid #f3f3f3",
                  borderTop: "3px solid #2e4a9e",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto",
                }}
              />
              <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
              <div style={{ marginTop: 8, color: "#666" }}>
                Loading your schedule…
              </div>
            </div>
          ) : fetchErr ? (
            <div className="alert alert-danger">{fetchErr}</div>
          ) : (
            <>
              <p>
                <strong>Date:</strong> {displayDate}
              </p>
              <p>
                <strong>Mass:</strong> {massLabel || "—"}
              </p>
              <p>
                <strong>Time:</strong> {timeLabel || "—"}
              </p>

              <div className="mb-3 row align-items-center reason-row">
                <label className="col-sm-2 col-form-label">
                  <strong>Reason:</strong>
                </label>
                <div className="col-sm-10">
                  <textarea
                    className="form-control"
                    placeholder="Enter reason (max 150 characters)"
                    maxLength={150}
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    {reason.length}/150
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <button
                  className="btn btn-confirm w-100"
                  disabled={!selectedISO || loading}
                  onClick={async () => {
                    const success = await cancelSchedule({
                      department,
                      idNumber,
                      dateISO: selectedISO,
                      mass: massLabel,
                      reason: reason.trim(),
                    });

                    if (success) {
                      navigate("/updateSchedule", {
                        state: { department },
                      });
                    }
                  }}
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
