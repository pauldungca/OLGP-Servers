import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../../../../../helper/icon";
import Footer from "../../../../../components/footer";
import Swal from "sweetalert2";
import {
  isSundayFor,
  getTemplateFlagsLectorCommentator,
  roleCountsForLectorCommentator,
  roleVisibilityForLectorCommentator,
  fetchAssignmentsGroupedLectorCommentator,
  resetAllAssignmentsLectorCommentator,
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

export default function SelectRoleLectorCommentator() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule - Lector Commentator";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const dateISOForDB = location.state?.dateISOForDB || selectedISO;
  const selectedMass = location.state?.selectedMass || "No mass selected";
  const selectedMassDisplay =
    location.state?.selectedMassDisplay || selectedMass;
  const source = location.state?.source || null;
  const passedIsSunday = location.state?.isSunday;
  const templateID = location.state?.templateID ?? null;
  const time = location.state?.time || null;
  const massKind = location.state?.massKind || (time ? "template" : "sunday");

  const isSunday = useMemo(
    () => isSundayFor({ passedIsSunday, source, selectedISO }),
    [passedIsSunday, source, selectedISO]
  );

  const [loadingFlags, setLoadingFlags] = useState(false);
  const [flags, setFlags] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (massKind !== "template" || !templateID) {
        setFlags(null);
        return;
      }
      setLoadingFlags(true);
      try {
        const res = await getTemplateFlagsLectorCommentator(
          selectedISO,
          templateID
        );
        if (!cancelled) setFlags(res);
      } finally {
        if (!cancelled) setLoadingFlags(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [massKind, selectedISO, templateID]);

  const counts = useMemo(() => {
    return roleCountsForLectorCommentator({
      flags: massKind === "template" ? flags : null,
      isSunday: massKind !== "template",
    });
  }, [flags, massKind]);

  const visible = useMemo(() => {
    return roleVisibilityForLectorCommentator({
      flags: massKind === "template" ? flags : null,
      isSunday: massKind !== "template",
    });
  }, [flags, massKind]);

  const showRole = (key) =>
    Boolean(visible?.[key]) && Number(counts?.[key] || 0) > 0;

  const [assignments, setAssignments] = useState({});
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const refreshAssignments = useCallback(async () => {
    if (!dateISOForDB || !selectedMass) {
      setAssignments({});
      setInitialLoadComplete(true);
      return;
    }

    setLoadingAssignments(true);
    try {
      const grouped = await fetchAssignmentsGroupedLectorCommentator({
        dateISO: dateISOForDB,
        massLabel: selectedMass,
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
  }, [dateISOForDB, selectedMass, counts]);

  useEffect(() => {
    refreshAssignments();
  }, [refreshAssignments]);

  const handleReset = async () => {
    const ok = await resetAllAssignmentsLectorCommentator({
      dateISO: dateISOForDB,
      massLabel: selectedMass,
    });
    if (ok) {
      await refreshAssignments();
    }
  };

  const goAssign = (roleKey, label) => {
    const state = buildAssignNavState({
      selectedDate,
      selectedISO,
      selectedMass,
      selectedMassDisplay,
      source,
      isSunday,
      templateID,
      roleKey,
      label,
      counts,
      time,
      dateISOForDB,
      massKind,
    });
    navigate("/assignMemberLectorCommentator", { state });
  };

  const isLoading =
    (massKind === "template" && loadingFlags) ||
    loadingAssignments ||
    !initialLoadComplete;

  const backToMassState = {
    selectedDate,
    selectedISO,
    dateISOForDB,
    selectedMass,
    selectedMassDisplay,
    source,
    isSunday,
    templateID,
    time,
    massKind,
  };

  const requiredRoleKeys = useMemo(
    () =>
      Object.keys(counts || {}).filter(
        (k) => Boolean(visible?.[k]) && Number(counts?.[k] || 0) > 0
      ),
    [counts, visible]
  );

  const allRolesCompleted = useMemo(() => {
    if (!initialLoadComplete || requiredRoleKeys.length === 0) return false;
    return requiredRoleKeys.every(
      (k) => assignments?.[k]?.status === "complete"
    );
  }, [assignments, requiredRoleKeys, initialLoadComplete]);

  const [isNotifying, setIsNotifying] = useState(false);
  const [notifyDisabled, setNotifyDisabled] = useState(false);

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
    if (isNotifying) return;

    setIsNotifying(true);
    try {
      await refreshAssignments();
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
        time: deriveTime(selectedMassDisplay, time),
        assignments,
      });

      if (inserted > 0) setNotifyDisabled(true);
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE - LECTOR COMMENTATOR</h3>
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
                      to="/selectScheduleLectorCommentator"
                      className="breadcrumb-item"
                    >
                      Select Schedule
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectMassLectorCommentator"
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
                margin: "0 auto",
              }}
            />
            <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
            <p style={{ marginTop: "1rem", color: "#666", fontSize: 16 }}>
              {massKind === "template" && loadingFlags
                ? "Loading template..."
                : "Loading assignments..."}
            </p>
          </div>
        ) : (
          <div className="role-cards-grid">
            {showRole("reading") && (
              <div
                className={`role-card ${
                  assignments.reading?.status === "complete"
                    ? "complete"
                    : assignments.reading?.status === "incomplete"
                    ? "incomplete"
                    : "empty"
                }`}
                onClick={() => goAssign("reading", "Reading")}
              >
                {(assignments.reading || []).slice(0, 2).map((p) => (
                  <div className="assigned-member" key={p.idNumber}>
                    {p.fullName}
                  </div>
                ))}
                <div className="role-card-divider"></div>
                <p className="role-card-title">Reading</p>
              </div>
            )}

            {showRole("preface") && (
              <div
                className={`role-card ${
                  assignments.preface?.status === "complete"
                    ? "complete"
                    : assignments.preface?.status === "incomplete"
                    ? "incomplete"
                    : "empty"
                }`}
                onClick={() => goAssign("preface", "Preface")}
              >
                {(assignments.preface || []).slice(0, 2).map((p) => (
                  <div className="assigned-member" key={p.idNumber}>
                    {p.fullName}
                  </div>
                ))}
                <div className="role-card-divider"></div>
                <p className="role-card-title">Preface</p>
              </div>
            )}
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
      </div>

      <Footer />
    </div>
  );
}
