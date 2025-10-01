import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";

import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import {
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

  // -------- Context from Select Role --------
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

  // Does this role use gender filtering?
  const needsGenderFiltering = useMemo(
    () => selectedRoleKey === "candleBearer" || selectedRoleKey === "beller",
    [selectedRoleKey]
  );

  // -------- Members (left list) --------
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // NEW: include-unavailable override + explicit override sex
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [overrideSex, setOverrideSex] = useState(null);

  // Check if this is a template mass
  const isTemplateMass = useMemo(() => {
    return templateID !== null && templateID !== undefined;
  }, [templateID]);

  // Load members list (refetch when override flips)
  useEffect(() => {
    let cancelled = false;
    const loadMembers = async () => {
      setLoadingMembers(true);
      const normalized = await fetchMembersNormalized(
        selectedISO,
        selectedMass,
        selectedRoleKey,
        {
          includeUnavailable: includeUnavailable || isTemplateMass, // Template masses always include all
          massLabel: selectedMass, // ⭐ PASS MASS LABEL to check same-mass assignments
        }
      );
      if (!cancelled) {
        setMembers(normalized);
        setLoadingMembers(false);
      }
    };
    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [
    selectedISO,
    selectedMass,
    selectedRoleKey,
    includeUnavailable,
    isTemplateMass,
  ]);

  // -------- Assigned (right panel) --------
  const [preloading, setPreloading] = useState(true);
  const [assigned, setAssigned] = useState(ensureArraySize([], slotsCount));

  // Keep slots array in sync with count
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

  // -------- Gender filter (auto-locks to sex of first assigned member) --------
  const genderFilter = useMemo(() => {
    if (!needsGenderFiltering) return null;
    const assignedMembers = assigned.filter(Boolean);
    if (assignedMembers.length === 0) return null;

    const firstAssigned = assignedMembers[0];
    const first = members.find((m) => m.idNumber === firstAssigned.idNumber);
    return first?.sex || null;
  }, [needsGenderFiltering, assigned, members]);

  // -------- Search + gender filter application --------
  const filteredMembers = useMemo(() => {
    let filtered = members.filter((m) =>
      (m.fullName || "")
        .toLowerCase()
        .includes((searchTerm || "").toLowerCase())
    );

    const g = overrideSex || genderFilter;
    if (g) filtered = filtered.filter((m) => m.sex === g);

    return filtered;
  }, [members, searchTerm, genderFilter, overrideSex]);

  // -------- AUTO-FALLBACK: if Male/Female chosen and list becomes empty, show all of that sex --------
  useEffect(() => {
    // Template masses don't need this logic - they already show all members
    if (isTemplateMass) return;

    if (!needsGenderFiltering) return;
    const g = genderFilter;
    if (!g) return;
    if (loadingMembers) return;

    // If list is empty, activate override to show all of that gender
    if (filteredMembers.length === 0) {
      setIncludeUnavailable(true);
      setOverrideSex(g);
    }
    // If list has members again and override is active, turn it off to show only available
    else if (includeUnavailable && filteredMembers.length > 0) {
      setIncludeUnavailable(false);
      setOverrideSex(null);
    }
  }, [
    isTemplateMass,
    needsGenderFiltering,
    genderFilter,
    loadingMembers,
    filteredMembers.length,
    includeUnavailable,
  ]);

  // -------- Priority-only sublist --------
  const priorityOnlyMembers = useMemo(() => {
    return filteredMembers.filter(
      (m) => (m.roleCount || 0) === 0 || (m.daysSinceLastRole || Infinity) > 30
    );
  }, [filteredMembers]);

  // -------- UI Handlers --------
  const handleToggleMember = (member) => {
    setAssigned((prev) => {
      const id = String(member.idNumber ?? "").trim();
      const alreadyIdx = prev.findIndex((m) => m && String(m.idNumber) === id);

      if (alreadyIdx >= 0) {
        const next = [...prev];
        next[alreadyIdx] = null;
        return next;
      }

      const emptyIndex = prev.findIndex((m) => !m);
      if (emptyIndex !== -1) {
        const next = [...prev];
        next[emptyIndex] = { idNumber: id, fullName: member.fullName };
        return next;
      }

      const next = [...prev];
      next[0] = { idNumber: id, fullName: member.fullName };
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
    setIncludeUnavailable(false);
    setOverrideSex(null);
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

  const formatRotationInfo = (member) => {
    const roleCount =
      typeof member.roleCount === "number" ? member.roleCount : 0;
    if (roleCount === 0) return "New to role";

    const d = member.daysSinceLastRole;
    const dayText =
      d === Infinity
        ? "Never"
        : d === 0
        ? "Today"
        : d === 1
        ? "1 day ago"
        : Number.isFinite(d)
        ? `${d} days ago`
        : "—";

    return `${roleCount}x done • Last: ${dayText}`;
  };

  const nothingToShow = !loadingMembers && filteredMembers.length === 0;

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
                { title: "Assign Member", className: "breadcrumb-item-active" },
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
        <h4 style={{ marginBottom: "0.5rem" }}>
          Selected Date: {selectedDate} &nbsp;|&nbsp; Selected Mass:{" "}
          {selectedMass}
        </h4>
        <div
          style={{ color: "#2e4a9e", marginBottom: "1rem", fontWeight: 600 }}
        >
          Role: {selectedRoleLabel} &nbsp;•&nbsp; Slots: {slotsCount}
          {(overrideSex || genderFilter) && (
            <span style={{ color: "#e74c3c", marginLeft: "10px" }}>
              (Filtered: {overrideSex || genderFilter} only
              {isTemplateMass
                ? ", template mass - all members shown"
                : includeUnavailable
                ? ", showing all"
                : ""}
              )
            </span>
          )}
        </div>

        <div className="assign-container row">
          {/* LEFT: candidates */}
          <div className="col-md-6 assign-left">
            <h5 className="assign-title">{selectedRoleLabel}</h5>

            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder={loadingMembers ? "Fetching members…" : "Search"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loadingMembers}
              />
              <button className="btn btn-primary" disabled>
                <i className="bi bi-search"></i>
              </button>
            </div>

            <ul className="list-group">
              {preloading ? (
                <li className="list-group-item text-muted">
                  {loadingMembers
                    ? "Fetching members..."
                    : "Loading assignments..."}
                </li>
              ) : nothingToShow ? (
                <li className="list-group-item text-muted">
                  No candidates with the current constraints.
                </li>
              ) : includeUnavailable || overrideSex || isTemplateMass ? (
                // Override mode: show all without priority filtering
                filteredMembers.map((m) => {
                  const checked = isMemberChecked(assigned, m);
                  return (
                    <li
                      key={String(m.idNumber)}
                      className="list-group-item d-flex align-items-center justify-content-between"
                      onClick={() => handleToggleMember(m)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-center">
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={!!checked}
                          onChange={() => handleToggleMember(m)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="d-flex align-items-center">
                          {m.fullName}
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
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : priorityOnlyMembers.length > 0 ? (
                priorityOnlyMembers.map((m) => {
                  const checked = isMemberChecked(assigned, m);
                  return (
                    <li
                      key={String(m.idNumber)}
                      className="list-group-item d-flex align-items-center justify-content-between priority-member"
                      onClick={() => handleToggleMember(m)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: "#f8f9ff",
                        borderLeft: "3px solid #2e4a9e",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={!!checked}
                          onChange={() => handleToggleMember(m)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="d-flex align-items-center">
                          {m.fullName}
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
                          <span
                            className="badge bg-success ms-2"
                            style={{ fontSize: "0.7em" }}
                          >
                            Priority
                          </span>
                        </div>
                      </div>
                      <div
                        className="text-end"
                        style={{
                          fontSize: "0.75em",
                          color: "#6c757d",
                          minWidth: "120px",
                        }}
                      >
                        {formatRotationInfo(m)}
                      </div>
                    </li>
                  );
                })
              ) : (
                filteredMembers.map((m) => {
                  const checked = isMemberChecked(assigned, m);
                  return (
                    <li
                      key={String(m.idNumber)}
                      className="list-group-item d-flex align-items-center justify-content-between"
                      onClick={() => handleToggleMember(m)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-center">
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={!!checked}
                          onChange={() => handleToggleMember(m)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="d-flex align-items-center">
                          {m.fullName}
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
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {/* RIGHT: slots */}
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

      <Footer />
    </div>
  );
}
