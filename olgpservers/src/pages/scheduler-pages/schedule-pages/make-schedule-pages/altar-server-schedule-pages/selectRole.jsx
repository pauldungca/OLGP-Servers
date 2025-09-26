import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../../../../../helper/icon";
import Footer from "../../../../../components/footer";
import Swal from "sweetalert2";

import {
  isSundayFor,
  getTemplateFlags, // <- only call this for template masses
  roleCountsFor,
  roleVisibilityFor,
  fetchAssignmentsGrouped,
  resetAllAssignments,
  buildAssignNavState,
  getMemberNameById,
} from "../../../../../assets/scripts/assignMember";

import { insertUserSpecificNotifications } from "../../../../../assets/scripts/notification";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectRole.css";

const nameCache = new Map();
const nameFor = async (id) => {
  const key = String(id ?? "").trim();
  if (!key) return "";
  if (nameCache.has(key)) return nameCache.get(key);
  const full = await getMemberNameById(key);
  nameCache.set(key, full || key);
  return full || key;
};

const deriveTime = (selectedMassDisplay = "", explicitTime = "") => {
  if (explicitTime) return explicitTime;
  const m = /(\d{1,2}:\d{2}\s?(AM|PM))/i.exec(selectedMassDisplay || "");
  return m ? m[1] : "";
};

export default function SelectRole() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null; // display date
  const dateISOForDB = location.state?.dateISOForDB || selectedISO; // DB key
  const selectedMass = location.state?.selectedMass || "No mass selected"; // DB label
  const selectedMassDisplay =
    location.state?.selectedMassDisplay || selectedMass; // UI label
  const source = location.state?.source || null;
  const passedIsSunday = location.state?.isSunday;
  const templateID = location.state?.templateID ?? null;
  const time = location.state?.time || null;
  const massKind = location.state?.massKind || (time ? "template" : "sunday"); // "template" | "sunday"

  const isSunday = useMemo(
    () => isSundayFor({ passedIsSunday, source, selectedISO }),
    [passedIsSunday, source, selectedISO]
  );

  /** ---------------------------
   * Load flags ONLY for template masses
   * -------------------------- */
  const [flags, setFlags] = useState(null);
  const [loadingFlags, setLoadingFlags] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (massKind !== "template" || !templateID) {
        setFlags(null);
        return;
      }
      setLoadingFlags(true);
      try {
        const res = await getTemplateFlags(selectedISO, templateID);
        if (!cancelled) setFlags(res);
      } finally {
        if (!cancelled) setLoadingFlags(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [massKind, selectedISO, templateID]);

  // For the selected mass:
  // - template mass: use template flags and non-Sunday semantics
  // - sunday mass:   no flags, use Sunday semantics
  const counts = useMemo(
    () =>
      roleCountsFor({
        flags: massKind === "template" ? flags : null,
        isSunday: massKind !== "template",
      }),
    [flags, massKind]
  );

  const visible = useMemo(
    () =>
      roleVisibilityFor({
        flags: massKind === "template" ? flags : null,
        isSunday: massKind !== "template",
      }),
    [flags, massKind]
  );

  // Show a role only if it's visible AND requires at least 1
  const showRole = (key) =>
    Boolean(visible?.[key]) && Number(counts?.[key] || 0) > 0;

  /** ---------------------------
   * Assignments preview
   * -------------------------- */
  const [assignments, setAssignments] = useState({});
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [rev, setRev] = useState(0);

  // notification states
  const [notifyDisabled, setNotifyDisabled] = useState(false); // disabled after success
  const [isNotifying, setIsNotifying] = useState(false); // in-flight guard

  // re-enable when switching to another schedule/mass
  useEffect(() => {
    setNotifyDisabled(false);
  }, [dateISOForDB, selectedMass]);

  const refreshAssignments = async () => {
    if (!dateISOForDB || !selectedMass) {
      setAssignments({});
      setInitialLoadComplete(true);
      return;
    }

    setLoadingAssignments(true);
    try {
      const grouped = await fetchAssignmentsGrouped({
        dateISO: dateISOForDB,
        massLabel: selectedMass, // DB label
      });

      const roles = Object.keys(grouped || {});
      for (const role of roles) {
        const assignedMembers = grouped[role] || [];
        const assignedCount = assignedMembers.length;
        const requiredCount = Number(counts?.[role] || 0);

        grouped[role] = await Promise.all(
          assignedMembers.map(async (r) => ({
            ...r,
            fullName: await nameFor(r.idNumber),
          }))
        );

        grouped[role].status =
          assignedCount >= requiredCount
            ? "complete"
            : assignedCount === 0
            ? "empty"
            : "incomplete";
      }

      setAssignments(grouped || {});
    } catch {
      setAssignments({});
    } finally {
      setLoadingAssignments(false);
      setInitialLoadComplete(true);
    }
  };

  useEffect(() => {
    refreshAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISOForDB, selectedMass, rev, counts]);

  const handleReset = async () => {
    const ok = await resetAllAssignments({
      dateISO: dateISOForDB,
      massLabel: selectedMass,
    });
    if (ok) {
      await refreshAssignments();
      setRev((r) => r + 1);
    }
  };

  const goAssign = (roleKey, label) => {
    const state = buildAssignNavState({
      selectedDate,
      selectedISO, // display date
      selectedMass, // DB label
      selectedMassDisplay, // UI label
      source,
      isSunday,
      templateID,
      roleKey,
      label,
      counts,
      time,
      dateISOForDB, // DB key
      massKind,
    });
    navigate("/assignMemberAltarServer", { state });
  };

  const isLoading =
    (massKind === "template" && loadingFlags) ||
    loadingAssignments ||
    !initialLoadComplete;

  const backToMassState = {
    selectedDate,
    selectedISO,
    dateISOForDB,
    selectedMass, // DB label
    selectedMassDisplay, // UI label
    source,
    isSunday,
    templateID,
    time,
    massKind,
  };

  // Required/visible roles for this mass
  const requiredRoleKeys = useMemo(
    () =>
      Object.keys(counts || {}).filter(
        (k) => Boolean(visible?.[k]) && Number(counts?.[k] || 0) > 0
      ),
    [counts, visible]
  );

  // All roles must be completed BEFORE enabling the button
  const allRolesCompleted = useMemo(() => {
    if (!initialLoadComplete || requiredRoleKeys.length === 0) return false;
    return requiredRoleKeys.every(
      (k) => assignments?.[k]?.status === "complete"
    );
  }, [assignments, requiredRoleKeys, initialLoadComplete]);

  // Send notifications handler
  const handleNotifyAssigned = async (e) => {
    e.preventDefault();

    if (!allRolesCompleted) {
      await Swal.fire(
        "Complete all roles",
        "You can only send notifications after all required roles are filled.",
        "info"
      );
      return;
    }
    if (notifyDisabled || isNotifying) return; // guard double clicks

    setIsNotifying(true);
    try {
      await refreshAssignments(); // ensure latest
      const timeText = deriveTime(selectedMassDisplay, time);

      // count assigned members (arrays only)
      const total = Object.values(assignments || {}).reduce(
        (sum, v) => sum + (Array.isArray(v) ? v.length : 0),
        0
      );

      const { isConfirmed } = await Swal.fire({
        title: "Send Notifications?",
        text:
          total > 0
            ? `Send notifications to ${total} assigned member${
                total !== 1 ? "s" : ""
              }? You can only do this once per schedule.`
            : "No assigned members found.",
        icon: total > 0 ? "question" : "info",
        showCancelButton: total > 0,
        confirmButtonText: "Yes, send",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });
      if (!isConfirmed) return;

      const inserted = await insertUserSpecificNotifications({
        dateISO: dateISOForDB,
        time: timeText,
        assignments,
      });

      // Disable after successful insert; will reset when schedule/mass changes
      if (inserted > 0) setNotifyDisabled(true);
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE - ALTAR SERVER</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/makeSchedule" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectScheduleAltarServer"
                      className="breadcrumb-item"
                    >
                      Select Schedule
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectMassAltarServer"
                      state={backToMassState}
                      className="breadcrumb-item"
                    >
                      Select Mass
                    </Link>
                  ),
                },
                { title: "Select Role", className: "breadcrumb-item-active" },
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

      <div className="schedule-content">
        <h4 style={{ marginBottom: "1rem" }}>
          Selected Date: {selectedDate} | Selected Mass: {selectedMassDisplay}
        </h4>

        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
              padding: "2rem",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #2e4a9e",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            {/* make the spinner actually spin */}
            <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>

            <p style={{ marginTop: "1rem", color: "#666", fontSize: 16 }}>
              {massKind === "template" && loadingFlags
                ? "Loading template..."
                : "Loading assignments..."}
            </p>
          </div>
        ) : (
          <>
            <div className="role-cards-grid">
              {showRole("thurifer") && (
                <div
                  className={`role-card ${
                    assignments.thurifer?.status === "complete"
                      ? "complete"
                      : assignments.thurifer?.status === "incomplete"
                      ? "incomplete"
                      : "empty"
                  }`}
                  onClick={() => goAssign("thurifer", "Thurifer")}
                >
                  {(assignments.thurifer || []).slice(0, 2).map((p) => (
                    <div className="assigned-member" key={p.idNumber}>
                      {p.fullName}
                    </div>
                  ))}
                  <div className="role-card-divider"></div>
                  <p className="role-card-title">Thurifer</p>
                </div>
              )}

              {showRole("beller") && (
                <div
                  className={`role-card ${
                    assignments.beller?.status === "complete"
                      ? "complete"
                      : assignments.beller?.status === "incomplete"
                      ? "incomplete"
                      : "empty"
                  }`}
                  onClick={() => goAssign("beller", "Bellers")}
                >
                  {(assignments.beller || []).slice(0, 2).map((p) => (
                    <div className="assigned-member" key={p.idNumber}>
                      {p.fullName}
                    </div>
                  ))}
                  <div className="role-card-divider"></div>
                  <p className="role-card-title">Bellers</p>
                </div>
              )}

              {showRole("mainServer") && (
                <div
                  className={`role-card ${
                    assignments.mainServer?.status === "complete"
                      ? "complete"
                      : assignments.mainServer?.status === "incomplete"
                      ? "incomplete"
                      : "empty"
                  }`}
                  onClick={() => goAssign("mainServer", "Book and Mic")}
                >
                  {(assignments.mainServer || []).slice(0, 2).map((p) => (
                    <div className="assigned-member" key={p.idNumber}>
                      {p.fullName}
                    </div>
                  ))}
                  <div className="role-card-divider"></div>
                  <p className="role-card-title">Book and Mic</p>
                </div>
              )}

              {showRole("candleBearer") && (
                <div
                  className={`role-card ${
                    assignments.candleBearer?.status === "complete"
                      ? "complete"
                      : assignments.candleBearer?.status === "incomplete"
                      ? "incomplete"
                      : "empty"
                  }`}
                  onClick={() => goAssign("candleBearer", "Candle Bearers")}
                >
                  {(assignments.candleBearer || []).slice(0, 2).map((p) => (
                    <div className="assigned-member" key={p.idNumber}>
                      {p.fullName}
                    </div>
                  ))}
                  <div className="role-card-divider"></div>
                  <p className="role-card-title">Candle Bearers</p>
                </div>
              )}

              {showRole("incenseBearer") && (
                <div
                  className={`role-card ${
                    assignments.incenseBearer?.status === "complete"
                      ? "complete"
                      : assignments.incenseBearer?.status === "incomplete"
                      ? "incomplete"
                      : "empty"
                  }`}
                  onClick={() => goAssign("incenseBearer", "Incense Bearer")}
                >
                  {(assignments.incenseBearer || []).slice(0, 2).map((p) => (
                    <div className="assigned-member" key={p.idNumber}>
                      {p.fullName}
                    </div>
                  ))}
                  <div className="role-card-divider"></div>
                  <p className="role-card-title">Incense Bearer</p>
                </div>
              )}

              {showRole("crossBearer") && (
                <div
                  className={`role-card ${
                    assignments.crossBearer?.status === "complete"
                      ? "complete"
                      : assignments.crossBearer?.status === "incomplete"
                      ? "incomplete"
                      : "empty"
                  }`}
                  onClick={() => goAssign("crossBearer", "Cross Bearer")}
                >
                  {(assignments.crossBearer || []).slice(0, 2).map((p) => (
                    <div className="assigned-member" key={p.idNumber}>
                      {p.fullName}
                    </div>
                  ))}
                  <div className="role-card-divider"></div>
                  <p className="role-card-title">Cross Bearer</p>
                </div>
              )}
            </div>

            {showRole("plate") && (
              <div
                className={`role-card big-role-card ${
                  assignments.plate?.status === "complete"
                    ? "complete"
                    : assignments.plate?.status === "incomplete"
                    ? "incomplete"
                    : "empty"
                }`}
                onClick={() => goAssign("plate", "Plates")}
              >
                <div className="assigned-grid-plate">
                  {(assignments.plate || [])
                    .filter((p) => p?.fullName)
                    .slice(0, 10)
                    .map((p) => (
                      <div
                        className="assigned-member ellipsis"
                        key={p.idNumber}
                      >
                        {p.fullName}
                      </div>
                    ))}
                </div>

                <div className="role-card-divider"></div>
                <p className="role-card-title">Plates</p>
              </div>
            )}

            <div className="role-card-actions">
              <button
                type="button"
                className="btn-reset-schedule"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn-submit-schedule"
                onClick={handleNotifyAssigned}
                disabled={notifyDisabled || !allRolesCompleted || isNotifying}
                title={
                  notifyDisabled
                    ? "Notifications already sent for this schedule."
                    : !allRolesCompleted
                    ? "Complete all required roles to enable."
                    : isNotifying
                    ? "Sending..."
                    : "Send Notification to assigned members"
                }
              >
                {isNotifying ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
