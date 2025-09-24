import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import {
  // DB + helpers
  fetchMembersNormalized,
  slotBaseLabelFor,
  preloadAssignedForRole,
  isMemberChecked,
  deepResetRoleAssignments,
  saveRoleAssignments,
  ensureArraySize,
} from "../../../../../assets/scripts/assignMember";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignMemberRole.css";

export default function AssignMember() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // -------- Context from SelectRole --------
  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const selectedMass = location.state?.selectedMass || "No mass selected";
  const source = location.state?.source || null;
  const isSunday = location.state?.isSunday ?? null;
  const templateID = location.state?.templateID ?? null;

  const selectedRoleKey = location.state?.selectedRoleKey || "candleBearer";
  const selectedRoleLabel =
    location.state?.selectedRoleLabel || "Candle Bearers";
  const slotsCount = Math.max(1, Number(location.state?.slotsCount || 1));

  const slotBaseLabel = useMemo(
    () => slotBaseLabelFor(selectedRoleKey, selectedRoleLabel),
    [selectedRoleKey, selectedRoleLabel]
  );

  // Check if current role needs gender filtering (candle bearers or bellers)
  const needsGenderFiltering = useMemo(
    () => selectedRoleKey === "candleBearer" || selectedRoleKey === "beller",
    [selectedRoleKey]
  );

  // -------- Members (left list) --------
  const [members, setMembers] = useState([]); // [{ idNumber, fullName, role, sex }]
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      // Pass the role (e.g., "thurifer") along with dateISO and massLabel
      const normalizedMembers = await fetchMembersNormalized(
        selectedISO,
        selectedMass,
        selectedRoleKey
      );
      setMembers(normalizedMembers);
      setLoadingMembers(false);
    };
    loadMembers();
  }, [selectedISO, selectedMass, selectedRoleKey]);

  // -------- Assigned (right panel) --------
  const [preloading, setPreloading] = useState(true);
  const [assigned, setAssigned] = useState(ensureArraySize([], slotsCount));

  // Keep assigned array size in sync with slotsCount
  useEffect(() => {
    setAssigned((prev) => ensureArraySize(prev, slotsCount));
  }, [slotsCount]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedISO || !selectedMass) {
        setPreloading(false);
        return;
      }
      try {
        setPreloading(true);
        const arr = await preloadAssignedForRole({
          dateISO: selectedISO,
          massLabel: selectedMass,
          roleKey: selectedRoleKey,
          slotsCount,
        });
        if (!cancelled) setAssigned(arr);
      } catch {
        if (!cancelled) setAssigned(ensureArraySize([], slotsCount));
      } finally {
        if (!cancelled) setPreloading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedISO, selectedMass, selectedRoleKey, slotsCount]);

  // -------- Gender filtering logic --------
  const genderFilter = useMemo(() => {
    if (!needsGenderFiltering) return null;

    // Check if any members are assigned
    const assignedMembers = assigned.filter(Boolean);
    if (assignedMembers.length === 0) return null;

    // Find the first assigned member and check their gender
    const firstAssigned = assignedMembers[0];
    const firstAssignedMember = members.find(
      (m) => m.idNumber === firstAssigned.idNumber
    );

    // Return the gender of the first assigned member to filter by that gender
    return firstAssignedMember?.sex || null;
  }, [needsGenderFiltering, assigned, members]);

  // -------- Search --------
  const [searchTerm, setSearchTerm] = useState("");
  const filteredMembers = useMemo(() => {
    let filtered = members.filter((m) =>
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply gender filter if needed
    if (genderFilter) {
      filtered = filtered.filter((m) => m.sex === genderFilter);
    }

    return filtered;
  }, [members, searchTerm, genderFilter]);

  // -------- UI Handlers --------
  const handleToggleMember = (member) => {
    setAssigned((prev) => {
      const id = String(member.idNumber ?? "").trim();
      const alreadyIdx = prev.findIndex(
        (m) => m && String(m.idNumber) === id // Add null check here too
      );

      // If already assigned, unassign them
      if (alreadyIdx >= 0) {
        const next = [...prev];
        next[alreadyIdx] = null; // unassign member by setting to null
        return next; // Don't filter out nulls - keep array structure intact
      }

      // If not assigned, assign them
      const emptyIndex = prev.findIndex((m) => !m);
      if (emptyIndex !== -1) {
        const next = [...prev];
        next[emptyIndex] = {
          idNumber: id,
          fullName: member.fullName,
        };
        return next;
      }

      // If no empty slots, replace the first slot
      const next = [...prev];
      next[0] = {
        idNumber: id,
        fullName: member.fullName,
      };
      return next;
    });
  };

  const handleDeepReset = async () => {
    const next = await deepResetRoleAssignments({
      dateISO: selectedISO,
      massLabel: selectedMass,
      templateID,
      roleKey: selectedRoleKey,
      slotsCount,
    });
    setAssigned(next);
  };

  const handleSave = async () => {
    try {
      await saveRoleAssignments({
        dateISO: selectedISO,
        massLabel: selectedMass,
        templateID,
        roleKey: selectedRoleKey,
        assigned,
      });
    } finally {
      navigate(-1);
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
                      className="breadcrumb-item"
                      state={{
                        selectedDate,
                        selectedISO,
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
                  title: (
                    <Link
                      to="/selectRoleAltarServer"
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
                      Select Role
                    </Link>
                  ),
                },
                {
                  title: "Assign Member",
                  className: "breadcrumb-item-active",
                },
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
        {/* Context header */}
        <h4 style={{ marginBottom: "0.5rem" }}>
          Selected Date: {selectedDate} &nbsp;|&nbsp; Selected Mass:{" "}
          {selectedMass}
        </h4>
        <div
          style={{ color: "#2e4a9e", marginBottom: "1rem", fontWeight: 600 }}
        >
          Role: {selectedRoleLabel} &nbsp;•&nbsp; Slots: {slotsCount}
          {genderFilter && (
            <span style={{ color: "#e74c3c", marginLeft: "10px" }}>
              (Filtered: {genderFilter} only)
            </span>
          )}
        </div>

        <div className="assign-container row">
          {/* Left side */}
          <div className="col-md-6 assign-left">
            <h5 className="assign-title">{selectedRoleLabel}</h5>

            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder={loadingMembers ? "Loading members..." : "Search"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loadingMembers}
              />
              <button className="btn btn-primary" disabled>
                <i className="bi bi-search"></i>
              </button>
            </div>

            <ul className="list-group assign-member-list">
              <li className="list-group-item active">Name</li>

              {loadingMembers || preloading ? (
                <li className="list-group-item text-muted">
                  {loadingMembers
                    ? "Fetching members…"
                    : "Loading assignments…"}
                </li>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((m) => {
                  // Check if the current member is already assigned to the role
                  const checked = isMemberChecked(assigned, m); // Check if the member is assigned

                  return (
                    <li
                      key={String(m.idNumber)}
                      className="list-group-item d-flex align-items-center"
                      onClick={() => handleToggleMember(m)} // Handles toggling (assign/unassign)
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input me-2"
                        checked={checked} // Set the checkbox to be checked if the member is assigned
                        onChange={() => handleToggleMember(m)} // Handles change of the checkbox (assign/unassign)
                        onClick={(e) => e.stopPropagation()} // Prevent the event from bubbling up to the parent `li`
                      />
                      {m.fullName} {/* Display the member's full name */}
                      {needsGenderFiltering && (
                        <span
                          className={`badge ms-2 ${
                            m.sex === "Male" ? "bg-primary" : "bg-secondary"
                          }`}
                          style={{ fontSize: "0.7em" }}
                        >
                          {m.sex === "Male" ? "M" : "F"}
                        </span>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="list-group-item text-muted">No results found</li>
              )}
            </ul>
          </div>

          {/* Right side */}
          <div className="col-md-6 assign-right">
            <div className="assign-right-scroll">
              {Array.from({ length: slotsCount }).map((_, i) => (
                <div className="mb-4" key={i}>
                  <label className="form-label">
                    {slotBaseLabel} {slotsCount > 1 ? i + 1 : ""}
                  </label>
                  <div className="assigned-name">
                    {assigned[i]?.fullName || (
                      <span className="text-muted">Empty</span>
                    )}
                  </div>
                  <div className="assign-line"></div>
                </div>
              ))}
            </div>

            <div className="bottom-buttons">
              <button
                className="action-buttons cancel-button d-flex align-items-center"
                onClick={handleDeepReset}
                disabled={preloading}
              >
                Reset
              </button>
              <button
                className="action-buttons assign-btn d-flex align-items-center"
                onClick={handleSave}
                disabled={preloading}
              >
                <img src={image.assignImage} alt="Save" className="img-btn" />
                Save
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
