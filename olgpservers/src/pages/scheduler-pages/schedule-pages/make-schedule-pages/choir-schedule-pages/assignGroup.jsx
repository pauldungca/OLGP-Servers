// src/pages/scheduler-pages/choir/assignGroup.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";

import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignGroup.css";

// === Helpers (keep DB logic outside JSX) ===
import {
  getChoirGroupAssignments,
  saveChoirGroupAssignments,
  clearChoirGroupAssignments,
  fetchAvailableChoirGroupsForMass,
} from "../../../../../assets/scripts/assignMember";

// Label sniffers
const isSundayMassLabel = (label = "") =>
  /^(?:\d+(?:st|nd|rd|th)\s+Mass)/i.test(label);
const isTemplateMassLabel = (label = "") => /^Mass\s*-\s*/i.test(label);

export default function AssignGroupChoir() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule - Choir";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // ---- Context from SelectMassChoir ----
  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const dateISOForDB = location.state?.dateISOForDB || selectedISO;

  // DB label (e.g., "1st Mass - 6:00 AM" or "Mass - 7:00 PM")
  const selectedMass = location.state?.selectedMass || "No mass selected";

  // UI label (e.g., "High Mass - 7:00 PM"); fallback to DB label
  const selectedMassDisplay =
    location.state?.selectedMassDisplay || selectedMass;

  const source = location.state?.source || null;
  const isSunday = Boolean(location.state?.isSunday);
  const templateID = location.state?.templateID ?? null;
  const time = location.state?.time || null;
  const passedMassKind = location.state?.massKind || null; // "sunday" | "template"

  const massKind = useMemo(() => {
    if (passedMassKind) return passedMassKind;
    if (isSundayMassLabel(selectedMass)) return "sunday";
    if (isTemplateMassLabel(selectedMass)) return "template";
    return "template"; // safe default
  }, [passedMassKind, selectedMass]);

  const isTemplate = massKind === "template";

  // ---- Data: Choir groups ----
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingGroups(true);
      try {
        const groups = await fetchAvailableChoirGroupsForMass({
          dateISO: dateISOForDB,
          massLabel: selectedMass,
          isTemplate,
        });

        if (!cancelled) setAvailableGroups(groups);
      } catch (e) {
        console.error("fetchAvailableChoirGroupsForMass error:", e);
        if (!cancelled) {
          setAvailableGroups([{ id: "knm-local", name: "Koro Ni Maria" }]);
        }
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateISOForDB, selectedMass, isTemplate]);

  // ---- Preselect already-assigned group (if any) ----
  const [preloading, setPreloading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!dateISOForDB || !selectedMass) {
        setPreloading(false);
        return;
      }
      setPreloading(true);
      try {
        // expects a mapping keyed by group name (e.g., { "Koro Ni Maria": true })
        const grouped = await getChoirGroupAssignments(
          dateISOForDB,
          selectedMass
        );
        const current = Object.keys(grouped || {})[0];
        if (!cancelled && current) {
          const found =
            availableGroups.find(
              (g) =>
                (g.name || "").trim().toLowerCase() === current.toLowerCase()
            ) || null;
          setSelectedGroup(found);
        }
      } catch (e) {
        console.error("getChoirGroupAssignments error:", e);
      } finally {
        if (!cancelled) setPreloading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [availableGroups, dateISOForDB, selectedMass]);

  // ---- Search + visibility ----
  const [search, setSearch] = useState("");

  const visibleGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (availableGroups || []).filter((g) =>
      (g.name || "").toLowerCase().includes(term)
    );
  }, [availableGroups, search]);

  // ---- Actions ----
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    if (!selectedGroup) return;
    setSaving(true);
    try {
      await saveChoirGroupAssignments({
        dateISO: dateISOForDB,
        massLabel: selectedMass, // DB label
        templateID,
        assignedGroups: [selectedGroup], // 1 group per mass
      });

      // Return to Select Mass page
      navigate("/selectMassChoir", {
        state: {
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
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await clearChoirGroupAssignments(dateISOForDB, selectedMass);
      setSelectedGroup(null);
    } catch (e) {
      console.error("clearChoirGroupAssignments error:", e);
    }
  };

  // ---- Render ----
  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE - CHOIR</h3>

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
                    <Link to="/selectScheduleChoir" className="breadcrumb-item">
                      Select Schedule
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectMassChoir"
                      className="breadcrumb-item"
                      state={{
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
                      }}
                    >
                      Select Mass
                    </Link>
                  ),
                },
                { title: "Assign Group", className: "breadcrumb-item-active" },
              ]}
              separator={
                <img
                  src={icon.chevronIcon}
                  alt="Chevron Icon"
                  style={{ width: 15, height: 15 }}
                />
              }
              className="customized-breadcrumb"
            />
          </div>

          <div className="header-line"></div>
        </div>
      </div>

      <div className="schedule-content">
        <h4 style={{ marginBottom: "0.75rem" }}>
          Selected Date: {selectedDate} &nbsp;|&nbsp; Selected Mass:{" "}
          {selectedMassDisplay}
        </h4>

        <div className="assign-container row">
          {/* Left: list of groups */}
          <div className="col-md-6 assign-left">
            <h5 className="assign-title">Assign Choir Group</h5>

            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder={
                  loadingGroups ? "Loading choir groups..." : "Search"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loadingGroups}
              />
              <button className="btn btn-primary" disabled>
                <i className="bi bi-search"></i>
              </button>
            </div>

            <ul className="list-group assign-member-list">
              <li className="list-group-item active">Available Groups</li>

              {loadingGroups || preloading ? (
                <li className="list-group-item text-muted">
                  {loadingGroups ? "Fetching groups…" : "Loading assignment…"}
                </li>
              ) : visibleGroups.length ? (
                visibleGroups.map((g) => (
                  <li
                    key={g.id ?? g.name}
                    className={`list-group-item d-flex align-items-center ${
                      selectedGroup?.name === g.name ? "selected" : ""
                    }`}
                    onClick={() => setSelectedGroup(g)}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      className="form-check-input me-2"
                      checked={selectedGroup?.name === g.name}
                      onChange={() => setSelectedGroup(g)}
                    />
                    {g.name}
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted">No groups found</li>
              )}
            </ul>
          </div>

          {/* Right: chosen + actions */}
          <div className="col-md-6 assign-right">
            <div className="mb-4">
              <label className="form-label">Selected Group:</label>
              <div className="assigned-name">
                {selectedGroup?.name || (
                  <span className="text-muted">None selected</span>
                )}
              </div>
              <div className="assign-line"></div>
            </div>

            <div className="bottom-buttons">
              <button
                className="btn action-buttons cancel-button d-flex align-items-center"
                onClick={handleReset}
                disabled={saving}
              >
                <img
                  src={image.noButtonImage}
                  alt="Reset"
                  className="img-btn"
                />
                Reset
              </button>

              <button
                className="btn action-buttons assign-btn d-flex align-items-center"
                onClick={handleAssign}
                disabled={!selectedGroup || saving}
              >
                <img src={image.assignImage} alt="Assign" className="img-btn" />
                {saving ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
