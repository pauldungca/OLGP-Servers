// src/pages/scheduler-pages/eucharistic-minister/assignGroup.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignGroup.css";

// Fetchers
import { fetchEucharisticMinisterGroups } from "../../../../../assets/scripts/group";

import {
  resetEucharisticMinisterGroupAndMembers,
  saveEucharisticMinisterGroup,
  fetchExistingEucharisticMinisterGroup,
  // server-side eligibility (same-day exclusion + rotation) — use only for SUNDAY
  fetchEligibleEucharisticMinisterGroups,
} from "../../../../../assets/scripts/assignMember";

// Label sniffers
const isSundayMassLabel = (label = "") =>
  /^(?:\d+(?:st|nd|rd|th)\s+Mass)/i.test(label);
const isTemplateMassLabel = (label = "") => /^Mass\s*-\s*/i.test(label);

export default function AssignGroup() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();
  const { state } = useLocation();

  // pulled from SelectMass navigation state
  const selectedDate = state?.selectedDate || "No date selected";
  const selectedISO = state?.selectedISO || null;
  const selectedMassDisplay = state?.selectedMassDisplay || "Selected Mass";
  const templateID = state?.templateID ?? null;
  const isSunday = !!state?.isSunday;

  // Derive massKind; prefer explicit isSunday flag, then fallback by label
  const massKind = useMemo(() => {
    if (isSunday) return "sunday";
    if (isTemplateMassLabel(selectedMassDisplay)) return "template";
    if (isSundayMassLabel(selectedMassDisplay)) return "sunday";
    return "template";
  }, [isSunday, selectedMassDisplay]);

  // groups + UI state
  const [allGroups, setAllGroups] = useState([]); // [{id, name}]
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null); // {id, name}
  const [loadingExistingGroup, setLoadingExistingGroup] = useState(true);

  // Fetch existing assigned group for this exact date+mass (to preselect and ensure visible)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingExistingGroup(true);
        const existingName = await fetchExistingEucharisticMinisterGroup(
          selectedISO,
          selectedMassDisplay
        );
        if (!cancelled) {
          window.__em_existingGroupName = existingName || null;
        }
      } catch (err) {
        console.error("Failed to fetch existing group assignment:", err);
        if (!cancelled) window.__em_existingGroupName = null;
      } finally {
        if (!cancelled) setLoadingExistingGroup(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedISO, selectedMassDisplay]);

  /**
   * Load groups:
   *  - TEMPLATE: show the full master list (no same-day filtering).
   *  - SUNDAY:   show only server-computed eligible names
   *              (same-day exclusivity + rotation), BUT always include the
   *              existing assignment for this mass if present.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingGroups(true);

        // 1) Load full master list
        const master = (await fetchEucharisticMinisterGroups()) || [];

        // 2) Build the working list based on massKind
        let reduced = master;

        if (massKind === "sunday") {
          const eligibleNames =
            (await fetchEligibleEucharisticMinisterGroups({
              dateISO: selectedISO,
              massLabel: selectedMassDisplay,
            })) || [];
          reduced = master.filter((g) => eligibleNames.includes(g.name));
        } else {
          // TEMPLATE ⇒ no extra filtering (show all groups)
          reduced = master.slice();
        }

        // 3) Ensure existing assignment is included even if normally filtered out
        const existingName = window.__em_existingGroupName;
        if (existingName) {
          const alreadyIn = reduced.some((g) => g.name === existingName);
          if (!alreadyIn) {
            const existingObj = master.find((g) => g.name === existingName);
            if (existingObj) reduced = [existingObj, ...reduced];
          }
        }

        if (!cancelled) setAllGroups(reduced);
      } catch (err) {
        console.error("Failed to load EM groups:", err);
        if (!cancelled) setAllGroups([]);
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedISO, selectedMassDisplay, massKind]);

  // Auto-select existing group when lists are ready
  useEffect(() => {
    if (
      !loadingGroups &&
      !loadingExistingGroup &&
      window.__em_existingGroupName &&
      allGroups.length > 0
    ) {
      const existingGroup = allGroups.find(
        (group) => group.name === window.__em_existingGroupName
      );
      if (existingGroup) {
        setSelectedGroup(existingGroup);
      }
      // cleanup
      delete window.__em_existingGroupName;
    }
  }, [loadingGroups, loadingExistingGroup, allGroups]);

  const filteredGroups = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();
    if (!term) return allGroups;
    return (allGroups || []).filter((g) =>
      (g?.name || "").toLowerCase().includes(term)
    );
  }, [allGroups, searchTerm]);

  const handleAssign = async () => {
    // Re-check the existing group to avoid no-op save
    const existingName = await fetchExistingEucharisticMinisterGroup(
      selectedISO,
      selectedMassDisplay
    );

    let shouldSave = true;
    if (existingName && existingName === selectedGroup?.name) {
      shouldSave = false;
    }

    if (shouldSave && selectedGroup?.name) {
      const ok = await saveEucharisticMinisterGroup({
        dateISO: selectedISO,
        massLabel: selectedMassDisplay,
        templateID,
        group: selectedGroup.name,
      });
      if (!ok) return;
    }

    // Go to assign members
    navigate("/assignMemberEucharisticMinister", {
      state: {
        selectedDate,
        selectedISO,
        selectedMassDisplay,
        templateID,
        isSunday: massKind === "sunday",
        massKind,
        group: selectedGroup
          ? { id: selectedGroup.id, name: selectedGroup.name }
          : null,
      },
    });
  };

  const handleReset = async () => {
    const ok = await resetEucharisticMinisterGroupAndMembers(
      selectedISO,
      selectedMassDisplay
    );
    if (ok) setSelectedGroup(null);
  };

  const isLoading = loadingGroups || loadingExistingGroup;

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE - EUCHARISTIC MINISTER</h3>
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
                      to="/selectScheduleEucharisticMinister"
                      className="breadcrumb-item"
                    >
                      Select Schedule
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectMassEucharisticMinister"
                      state={{
                        selectedDate,
                        selectedISO,
                        dateISOForDB: selectedISO,
                        source: "combined",
                        isSunday: true,
                        templateID,
                      }}
                      className="breadcrumb-item"
                    >
                      Select Mass
                    </Link>
                  ),
                },
                {
                  title: "Assign Group",
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

      {/* Content */}
      <div className="schedule-content">
        <h4 style={{ marginBottom: "0.5rem" }}>
          Selected Date: {selectedDate} | Selected Mass: {selectedMassDisplay}
        </h4>

        <div className="assign-container row">
          {/* Left side */}
          <div className="col-md-6 assign-left">
            <h5 className="assign-title">Assign Group</h5>

            {massKind === "template" && (
              <div
                style={{
                  fontSize: 13,
                  marginBottom: 8,
                  color: "#2e4a9e",
                  fontWeight: 600,
                }}
              >
                Template mass: showing all groups (no same-day blocking).
              </div>
            )}

            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-primary" type="button">
                <i className="bi bi-search"></i>
              </button>
            </div>

            <ul className="list-group assign-member-list">
              <li className="list-group-item active">Name</li>

              {isLoading ? (
                <li className="list-group-item text-muted">Loading groups…</li>
              ) : filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <li
                    key={group.id}
                    className={`list-group-item d-flex align-items-center ${
                      selectedGroup?.id === group.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <input
                      type="radio"
                      className="form-check-input me-2"
                      checked={selectedGroup?.id === group.id}
                      onChange={() => setSelectedGroup(group)}
                    />
                    {group.name}
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted">No results found</li>
              )}
            </ul>
          </div>

          {/* Right side */}
          <div className="col-md-6 assign-right">
            <div className="mb-4">
              <label className="form-label">
                Group for {selectedMassDisplay}:
              </label>
              <div className="assigned-name">
                {selectedGroup?.name || (
                  <span className="text-muted">Empty</span>
                )}
              </div>
              <div className="assign-line"></div>
            </div>

            <div className="bottom-buttons">
              <button
                className="btn action-buttons cancel-button d-flex align-items-center"
                disabled={!selectedGroup}
                onClick={handleReset}
              >
                <img
                  src={image.noButtonImage}
                  alt="Cancel"
                  className="img-btn"
                />
                Reset
              </button>
              <button
                className="btn action-buttons assign-btn d-flex align-items-center"
                disabled={!selectedGroup}
                onClick={handleAssign}
              >
                <img src={image.assignImage} alt="Assign" className="img-btn" />
                Assign Members
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
