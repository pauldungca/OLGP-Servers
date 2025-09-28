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
  // 👇 NEW: uses server-side logic to compute eligible groups (same-day + rotation)
  fetchEligibleEucharisticMinisterGroups,
} from "../../../../../assets/scripts/assignMember";

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

  // groups + UI state
  const [allGroups, setAllGroups] = useState([]); // [{id, name}]
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null); // store the whole object {id, name}
  const [loadingExistingGroup, setLoadingExistingGroup] = useState(true);

  // Fetch existing assigned group for this exact date+mass (for auto-select + include even if filtered)
  useEffect(() => {
    let cancelled = false;

    const fetchExistingGroup = async () => {
      try {
        setLoadingExistingGroup(true);

        const existingGroupName = await fetchExistingEucharisticMinisterGroup(
          selectedISO,
          selectedMassDisplay
        );

        if (!cancelled && existingGroupName) {
          // Store temporarily until eligible list is computed
          window.existingGroupName = existingGroupName;
        }
      } catch (err) {
        console.error("Failed to fetch existing group assignment:", err);
      } finally {
        if (!cancelled) {
          setLoadingExistingGroup(false);
        }
      }
    };

    fetchExistingGroup();

    return () => {
      cancelled = true;
    };
  }, [selectedISO, selectedMassDisplay]);

  /**
   * Load master groups and filter them by eligibility rules:
   *  - same-day exclusivity
   *  - Sunday ordinal rotation
   * Always include the "existing assignment" for this mass if present,
   * even when normally filtered out, so it remains visible/selected.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingGroups(true);

        // 1) Load full master list [{id, name}, ...]
        const master = (await fetchEucharisticMinisterGroups()) || [];

        // 2) Compute eligible names for this date+mass
        const eligibleNames =
          (await fetchEligibleEucharisticMinisterGroups({
            dateISO: selectedISO,
            massLabel: selectedMassDisplay,
          })) || [];

        // 3) Reduce master by eligible names
        let reduced = master.filter((g) => eligibleNames.includes(g.name));

        // 4) If there's an existing assignment for THIS mass, ensure it's present
        const existingName = window.existingGroupName;
        if (existingName) {
          const existsInReduced = reduced.some((g) => g.name === existingName);
          if (!existsInReduced) {
            const existingObj = master.find((g) => g.name === existingName);
            if (existingObj) {
              reduced = [existingObj, ...reduced]; // prepend for visibility
            }
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
  }, [selectedISO, selectedMassDisplay]);

  // Auto-select existing group when lists are ready
  useEffect(() => {
    if (
      !loadingGroups &&
      !loadingExistingGroup &&
      window.existingGroupName &&
      allGroups.length > 0
    ) {
      const existingGroup = allGroups.find(
        (group) => group.name === window.existingGroupName
      );

      if (existingGroup) {
        setSelectedGroup(existingGroup);
      }

      // Clean up temporary storage
      delete window.existingGroupName;
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
    // Check if there's already an existing group assignment
    const existingGroupName = await fetchExistingEucharisticMinisterGroup(
      selectedISO,
      selectedMassDisplay
    );

    let shouldSave = true;

    // If there's already a group assigned and it's the same as selected, skip saving
    if (existingGroupName && existingGroupName === selectedGroup?.name) {
      shouldSave = false;
    }

    // Only save if we need to (new assignment or different group)
    if (shouldSave && selectedGroup?.name) {
      const ok = await saveEucharisticMinisterGroup({
        dateISO: selectedISO,
        massLabel: selectedMassDisplay,
        templateID,
        group: selectedGroup.name,
      });

      if (!ok) {
        // If save failed, don't navigate
        return;
      }
    }

    // Navigate to assign members (whether we saved or not)
    navigate("/assignMemberEucharisticMinister", {
      state: {
        selectedDate,
        selectedISO,
        selectedMassDisplay,
        templateID,
        isSunday,
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
    if (ok) {
      setSelectedGroup(null); // uncheck radio
    }
  };

  const isLoading = loadingGroups || loadingExistingGroup;

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE</h3>
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
                        isSunday,
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
        {/* Selected date and mass label */}
        <h4 style={{ marginBottom: "0.5rem" }}>
          Selected Date: {selectedDate} | Selected Mass: {selectedMassDisplay}
        </h4>

        <div className="assign-container row">
          {/* Left side */}
          <div className="col-md-6 assign-left">
            <h5 className="assign-title">Assign Group</h5>
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
              {/* Dynamic label uses the selected mass from SelectMass */}
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
      <div>
        <Footer />
      </div>
    </div>
  );
}
