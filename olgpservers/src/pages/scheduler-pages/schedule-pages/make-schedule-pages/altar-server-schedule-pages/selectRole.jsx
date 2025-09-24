import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../../../../../helper/icon";
import Footer from "../../../../../components/footer";

import {
  // NEW helpers pulled from assignMember.js
  isSundayFor,
  needTemplateFlagsFor,
  getTemplateFlags,
  roleCountsFor,
  roleVisibilityFor,
  fetchAssignmentsGrouped,
  resetAllAssignments,
  buildAssignNavState,
  getMemberNameById,
} from "../../../../../assets/scripts/assignMember";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectRole.css";

// ---- simple in-memory name cache so we don't refetch the same idNumber ----
const nameCache = new Map();
const nameFor = async (id) => {
  const key = String(id ?? "").trim();
  if (!key) return "";
  if (nameCache.has(key)) return nameCache.get(key);
  const full = await getMemberNameById(key);
  nameCache.set(key, full || key);
  return full || key;
};

export default function SelectRole() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Context from SelectMass
  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const selectedMass = location.state?.selectedMass || "No mass selected";
  const source = location.state?.source || null;
  const passedIsSunday = location.state?.isSunday;
  const templateID = location.state?.templateID ?? null;

  // Robust Sunday detection → helper
  const isSunday = useMemo(
    () => isSundayFor({ passedIsSunday, source, selectedISO }),
    [passedIsSunday, source, selectedISO]
  );

  // Template flags only needed on non-Sunday with a date
  const needFlags = useMemo(
    () => needTemplateFlagsFor({ isSunday, selectedISO }),
    [isSunday, selectedISO]
  );

  const [flags, setFlags] = useState(null);
  const [loadingFlags, setLoadingFlags] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!needFlags) {
        setFlags(null);
        return;
      }
      setLoadingFlags(true);
      const res = await getTemplateFlags(selectedISO);
      if (!cancelled) {
        setFlags(res);
        setLoadingFlags(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needFlags, selectedISO]);

  // Counts & visibility (computed)
  const counts = useMemo(
    () => roleCountsFor({ flags, isSunday }),
    [flags, isSunday]
  );

  const visible = useMemo(
    () => roleVisibilityFor({ flags, isSunday }),
    [flags, isSunday]
  );

  // Assignments preview (from Supabase)
  const [assignments, setAssignments] = useState({});
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [rev, setRev] = useState(0);

  const refreshAssignments = async () => {
    if (!selectedISO || !selectedMass) {
      setAssignments({});
      setInitialLoadComplete(true);
      return;
    }

    setLoadingAssignments(true);
    try {
      const grouped = await fetchAssignmentsGrouped({
        dateISO: selectedISO,
        massLabel: selectedMass,
      });

      // Enrich: swap idNumber -> fullName via members-information
      const roles = Object.keys(grouped || {});
      for (const role of roles) {
        const assignedMembers = grouped[role] || [];
        const assignedCount = assignedMembers.length;
        const requiredCount = counts[role] || 0; // Required count for this role

        // Assign full name for each member
        grouped[role] = await Promise.all(
          assignedMembers.map(async (r) => ({
            ...r,
            fullName: await nameFor(r.idNumber),
          }))
        );

        // Add role status (complete or incomplete)
        const roleStatus =
          assignedCount >= requiredCount
            ? "complete"
            : assignedCount === 0
            ? "empty"
            : "incomplete";
        grouped[role].status = roleStatus; // Add this to track role completion status
      }

      setAssignments(grouped || {});
    } catch (err) {
      console.error("Error refreshing assignments:", err);
      setAssignments({});
    } finally {
      setLoadingAssignments(false);
      setInitialLoadComplete(true);
    }
  };

  useEffect(() => {
    refreshAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedISO, selectedMass, rev, counts]); // Add counts as dependency

  const handleReset = async () => {
    const ok = await resetAllAssignments({
      dateISO: selectedISO,
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
      selectedISO,
      selectedMass,
      source,
      isSunday,
      templateID,
      roleKey,
      label,
      counts,
    });
    navigate("/assignMemberAltarServer", { state });
  };

  // Determine if we should show loading screen
  const isLoading =
    (needFlags && loadingFlags) || loadingAssignments || !initialLoadComplete;

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
                      className="breadcrumb-item"
                      state={{
                        selectedDate,
                        selectedISO,
                        selectedMass,
                        source,
                        isSunday,
                        templateID,
                      }}
                    >
                      Select Mass
                    </Link>
                  ),
                },
                {
                  title: "Select Role",
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

      <div className="schedule-content">
        <h4 style={{ marginBottom: "1rem" }}>
          Selected Date: {selectedDate} &nbsp;|&nbsp; Selected Mass:{" "}
          {selectedMass}
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
                width: "40px",
                height: "40px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #2e4a9e",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <p
              style={{
                marginTop: "1rem",
                color: "#666",
                fontSize: "16px",
              }}
            >
              {loadingFlags ? "Loading template..." : "Loading assignments..."}
            </p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <>
            <div className="role-cards-grid">
              {visible.thurifer && (
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

              {visible.beller && (
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

              {visible.mainServer && (
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

              {visible.candleBearer && (
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

              {visible.incenseBearer && (
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

              {visible.crossBearer && (
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

            {/* Big card at the bottom */}
            {visible.plate && (
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

            {/* Actions under the grid (Reset / Submit) */}
            <div className="role-card-actions">
              <button
                type="button"
                className="btn-reset-schedule"
                onClick={handleReset}
              >
                Reset
              </button>
              <button type="button" className="btn-submit-schedule">
                Submit Schedule
              </button>
            </div>
          </>
        )}
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
