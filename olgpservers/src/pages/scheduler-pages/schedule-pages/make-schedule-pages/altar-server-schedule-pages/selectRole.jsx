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
  const [rev, setRev] = useState(0);

  const refreshAssignments = async () => {
    if (!selectedISO || !selectedMass) {
      setAssignments({});
      return;
    }
    setLoadingAssignments(true);
    try {
      const grouped = await fetchAssignmentsGrouped({
        dateISO: selectedISO,
        massLabel: selectedMass,
      });

      // enrich: swap idNumber -> fullName via members-information
      const roles = Object.keys(grouped || {});
      for (const role of roles) {
        const arr = grouped[role] || [];
        grouped[role] = await Promise.all(
          arr.map(async (r) => ({
            ...r,
            // ensure we always display a name (fallback to the id)
            fullName: await nameFor(r.idNumber),
          }))
        );
      }

      setAssignments(grouped || {});
    } catch {
      setAssignments({});
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    refreshAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedISO, selectedMass, rev]);

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

        {(needFlags && loadingFlags) || loadingAssignments ? (
          <div style={{ padding: "8px 2px", opacity: 0.8 }}>
            {loadingFlags ? "Loading template…" : "Loading assignments…"}
          </div>
        ) : null}

        <div className="role-cards-grid">
          {visible.thurifer && (
            <div
              className="role-card"
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
              className="role-card"
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
              className="role-card"
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
              className="role-card"
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
              className="role-card"
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
              className="role-card"
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
            className="role-card big-role-card"
            onClick={() => goAssign("plate", "Plates")}
          >
            <div className="assigned-grid-plate">
              {(assignments.plate || [])
                .filter((p) => p?.fullName)
                .slice(0, 10)
                .map((p) => (
                  <div className="assigned-member ellipsis" key={p.idNumber}>
                    {p.fullName}
                  </div>
                ))}
            </div>

            <div className="role-card-divider"></div>
            <p className="role-card-title">Plates</p>
          </div>
        )}
      </div>

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

      <div>
        <Footer />
      </div>
    </div>
  );
}
