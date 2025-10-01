import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";

import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignGroup.css";

// Keep DB in .js helpers
import {
  getChoirGroupAssignments,
  saveChoirGroupAssignments,
  clearChoirGroupAssignments,
  fetchAvailableChoirGroupsForMass,
} from "../../../../../assets/scripts/assignMember";

import { getTemplateChoirGroupCount } from "../../../../../assets/scripts/fetchSchedule"; // NEW

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

  const massKind = React.useMemo(() => {
    if (passedMassKind) return passedMassKind;
    if (isSundayMassLabel(selectedMass)) return "sunday";
    if (isTemplateMassLabel(selectedMass)) return "template";
    return "template"; // safe default
  }, [passedMassKind, selectedMass]);

  const isTemplate = massKind === "template";

  // ---- Required slots from template-choir ("group-count") ----
  // Start at 0 so we don't flash 1 slot before real value arrives
  const [requiredCount, setRequiredCount] = useState(0);
  useEffect(() => {
    let stopped = false;
    (async () => {
      if (!isTemplate) {
        if (!stopped) setRequiredCount(1);
        return;
      }
      const c = await getTemplateChoirGroupCount({
        templateID,
        dateISO: selectedISO,
      });
      if (!stopped) setRequiredCount(Math.max(1, Number(c) || 1));
    })();
    return () => {
      stopped = true;
    };
  }, [isTemplate, selectedISO, templateID]);

  // ---- Available groups ----
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
        if (!cancelled)
          setAvailableGroups([{ id: "knm-local", name: "Koro Ni Maria" }]);
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateISOForDB, selectedMass, isTemplate]);

  // ---- Selection state ----
  const [preloading, setPreloading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null); // Sunday (single)
  const [selectedGroupNames, setSelectedGroupNames] = useState([]); // Template (fixed slots)

  // Keep slots array length == requiredCount (like Thurifer 1..N)
  useEffect(() => {
    if (isTemplate) {
      setSelectedGroupNames((prev) => {
        const next = Array.from(
          { length: Math.max(1, requiredCount) },
          (_, i) => prev[i] ?? null
        );
        return next;
      });
    } else {
      setSelectedGroupNames([]);
    }
  }, [isTemplate, requiredCount]);

  // ---- Preload existing assignments (AFTER we know requiredCount) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!dateISOForDB || !selectedMass) {
        setPreloading(false);
        return;
      }
      // Wait until requiredCount resolved to avoid locking to 1
      if (isTemplate && requiredCount < 1) return;

      setPreloading(true);
      try {
        const grouped = await getChoirGroupAssignments(
          dateISOForDB,
          selectedMass
        );
        if (cancelled) return;

        const keys = Object.keys(grouped || {});
        if (isTemplate) {
          setSelectedGroup(null);
          setSelectedGroupNames((prev) => {
            const slots = Array.from(
              { length: requiredCount },
              (_, i) => keys[i] ?? prev[i] ?? null
            );
            return slots.slice(0, requiredCount);
          });
        } else {
          const current = keys[0];
          if (current) {
            const found =
              availableGroups.find(
                (g) =>
                  (g.name || "").trim().toLowerCase() ===
                  String(current).trim().toLowerCase()
              ) || null;
            setSelectedGroup(found);
          } else {
            setSelectedGroup(null);
          }
          setSelectedGroupNames([]);
        }
      } catch (e) {
        console.error("getChoirGroupAssignments error:", e);
      } finally {
        if (!cancelled) setPreloading(false);
      }
    })();
    // IMPORTANT: depend on requiredCount so it reruns when the real count arrives
  }, [availableGroups, dateISOForDB, selectedMass, isTemplate, requiredCount]);

  // ---- Search ----
  const [search, setSearch] = useState("");
  const visibleGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (availableGroups || []).filter((g) =>
      (g.name || "").toLowerCase().includes(term)
    );
  }, [availableGroups, search]);

  // ---- Template selection toggle (checkboxes fill first empty slot; clicking again clears) ----
  const toggleCheckbox = (g) => {
    const name = String(g?.name || "").trim();
    setSelectedGroupNames((prev) => {
      const slots = [...prev];
      const takenIdx = slots.findIndex((s) => s === name);
      if (takenIdx !== -1) {
        // unassign
        slots[takenIdx] = null;
        return slots;
      }
      // choose first empty slot
      const emptyIdx = slots.findIndex((s) => s == null);
      if (emptyIdx !== -1) {
        slots[emptyIdx] = name;
      }
      return slots;
    });
  };

  // ---- Actions ----
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    setSaving(true);
    try {
      if (isTemplate) {
        const assignedGroups = selectedGroupNames
          .filter(Boolean)
          .map((n) => ({ name: n }));
        if (assignedGroups.length === 0) {
          setSaving(false);
          return;
        }
        await saveChoirGroupAssignments({
          dateISO: dateISOForDB,
          massLabel: selectedMass,
          templateID,
          assignedGroups,
        });
      } else {
        if (!selectedGroup) {
          setSaving(false);
          return;
        }
        await saveChoirGroupAssignments({
          dateISO: dateISOForDB,
          massLabel: selectedMass,
          templateID,
          assignedGroups: [selectedGroup],
        });
      }

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
    } catch (e) {
      console.error("clearChoirGroupAssignments error:", e);
    } finally {
      setSelectedGroup(null);
      setSelectedGroupNames(
        Array.from({ length: Math.max(1, requiredCount) }, () => null)
      );
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
          {/* Left: group list */}
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

              {loadingGroups ||
              preloading ||
              (isTemplate && requiredCount === 0) ? (
                <li className="list-group-item text-muted">
                  {loadingGroups ? "Fetching groups…" : "Loading assignment…"}
                </li>
              ) : visibleGroups.length ? (
                visibleGroups.map((g) => {
                  const picked = isTemplate
                    ? selectedGroupNames.includes(g.name)
                    : selectedGroup?.name === g.name;

                  return (
                    <li
                      key={g.id ?? g.name}
                      className={`list-group-item d-flex align-items-center ${
                        picked ? "selected" : ""
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        isTemplate ? toggleCheckbox(g) : setSelectedGroup(g)
                      }
                    >
                      {isTemplate ? (
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={selectedGroupNames.includes(g.name)}
                          onChange={() => toggleCheckbox(g)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <input
                          type="radio"
                          className="form-check-input me-2"
                          checked={selectedGroup?.name === g.name}
                          onChange={() => setSelectedGroup(g)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {g.name}
                    </li>
                  );
                })
              ) : (
                <li className="list-group-item text-muted">No groups found</li>
              )}
            </ul>
          </div>

          {/* Right: selected slots */}
          <div className="col-md-6 assign-right">
            <div className="mb-4">
              {isTemplate ? (
                <div className="assigned-name">
                  {Array.from(
                    { length: Math.max(1, requiredCount) },
                    (_, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <strong>Group {i + 1}</strong>
                        <div>
                          {selectedGroupNames[i] || (
                            <span className="text-muted">Empty</span>
                          )}
                        </div>
                        <div className="assign-line"></div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <>
                  <label className="form-label">Selected Group:</label>
                  <div className="assigned-name">
                    {selectedGroup?.name || (
                      <span className="text-muted">None selected</span>
                    )}
                  </div>
                  <div className="assign-line"></div>
                </>
              )}
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
                disabled={
                  saving ||
                  (isTemplate
                    ? selectedGroupNames.filter(Boolean).length === 0
                    : !selectedGroup)
                }
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
