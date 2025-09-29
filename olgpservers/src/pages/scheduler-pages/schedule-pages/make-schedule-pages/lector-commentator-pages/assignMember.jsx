// src/pages/scheduler-pages/lector-commentator/assignMember.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";

import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import {
  fetchLectorCommentatorMembersNormalized,
  slotBaseLabelFor,
  preloadAssignedForLectorCommentatorRole,
  isMemberChecked,
  deepResetLectorCommentatorRoleAssignments,
  saveLectorCommentatorRoleAssignments,
  ensureArraySize,
} from "../../../../../assets/scripts/assignMember";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignMemberRole.css";

export default function AssignMemberLectorCommentator() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule - Lector Commentator";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // ====== Nav state from SelectRole
  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const selectedMass = location.state?.selectedMass || "No mass selected";
  const selectedMassDisplay =
    location.state?.selectedMassDisplay || selectedMass;

  const source = location.state?.source || null;
  const isSunday = location.state?.isSunday ?? null;
  const templateID = location.state?.templateID ?? null;

  const selectedRoleKey = location.state?.selectedRoleKey || "reading";
  const selectedRoleLabel = location.state?.selectedRoleLabel || "Reading";
  const slotsCount = Math.max(1, Number(location.state?.slotsCount || 1));

  const massKind =
    location.state?.massKind || (templateID ? "template" : "sunday");

  const slotBaseLabel = useMemo(
    () => slotBaseLabelFor(selectedRoleKey, selectedRoleLabel),
    [selectedRoleKey, selectedRoleLabel]
  );

  // Check if this is a template mass
  const isTemplateMass = useMemo(() => {
    return templateID !== null && templateID !== undefined;
  }, [templateID]);

  // ====== LEFT: Members list
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // NEW: include-unavailable override (for template masses)
  const [includeUnavailable, setIncludeUnavailable] = useState(false);

  // Load members list (refetch when override flips or template status changes)
  /*useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMembers(true);
        const normalized = await fetchLectorCommentatorMembersNormalized(
          selectedISO,
          selectedMass,
          selectedRoleKey,
          {
            massKind,
            includeUnavailable: includeUnavailable || isTemplateMass, // Template masses always include all
          }
        );
        if (!cancelled) setMembers(normalized || []);
      } catch (err) {
        console.error("LC fetch members failed:", err);
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    selectedISO,
    selectedMass,
    selectedRoleKey,
    massKind,
    includeUnavailable,
    isTemplateMass,
  ]);*/

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMembers(true);
        const normalized = await fetchLectorCommentatorMembersNormalized(
          selectedISO,
          selectedMass,
          selectedRoleKey,
          {
            includeUnavailable: includeUnavailable || isTemplateMass,
          }
        );
        if (!cancelled) setMembers(normalized || []);
      } catch (err) {
        console.error("LC fetch members failed:", err);
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    })();
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

  const filteredMembers = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();
    return (members || []).filter((m) =>
      (m.fullName || "").toLowerCase().includes(term)
    );
  }, [members, searchTerm]);

  // Priority = never did role OR last assignment > 30 days
  const priorityOnlyMembers = useMemo(
    () =>
      filteredMembers.filter(
        (m) => m.roleCount === 0 || (m.daysSinceLastRole ?? 0) > 30
      ),
    [filteredMembers]
  );

  // ====== RIGHT: Assigned slots
  const [preloading, setPreloading] = useState(true);
  const [assigned, setAssigned] = useState(ensureArraySize([], slotsCount));

  // Keep size in sync if slots change
  useEffect(() => {
    setAssigned((prev) => ensureArraySize(prev, slotsCount));
  }, [slotsCount]);

  // Preload existing assignments for role
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedISO || !selectedMass) {
        setPreloading(false);
        return;
      }
      try {
        setPreloading(true);
        const arr = await preloadAssignedForLectorCommentatorRole({
          dateISO: selectedISO,
          massLabel: selectedMass,
          roleKey: selectedRoleKey,
          slotsCount,
        });
        if (!cancelled) setAssigned(arr);
      } catch (err) {
        console.error("LC preload assigned failed:", err);
        if (!cancelled) setAssigned(ensureArraySize([], slotsCount));
      } finally {
        if (!cancelled) setPreloading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedISO, selectedMass, selectedRoleKey, slotsCount]);

  // ====== AUTO-FALLBACK: if list becomes empty, show all members ========
  useEffect(() => {
    // Template masses don't need this logic - they already show all members
    if (isTemplateMass) return;

    if (loadingMembers) return;

    // If list is empty, activate override to show all
    if (filteredMembers.length === 0) {
      setIncludeUnavailable(true);
    }
    // If list has members again and override is active, turn it off to show only available
    else if (includeUnavailable && filteredMembers.length > 0) {
      setIncludeUnavailable(false);
    }
  }, [
    isTemplateMass,
    loadingMembers,
    filteredMembers.length,
    includeUnavailable,
  ]);

  // ====== Handlers
  const handleToggleMember = (member) => {
    setAssigned((prev) => {
      const id = String(member.idNumber ?? "").trim();
      const idx = prev.findIndex((m) => m && String(m.idNumber) === id);

      // Unassign if already chosen
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = null;
        return next;
      }

      // Assign to first empty slot
      const emptyIdx = prev.findIndex((m) => !m);
      if (emptyIdx !== -1) {
        const next = [...prev];
        next[emptyIdx] = { idNumber: id, fullName: member.fullName };
        return next;
      }

      // Otherwise replace first
      const next = [...prev];
      next[0] = { idNumber: id, fullName: member.fullName };
      return next;
    });
  };

  const handleDeepReset = async () => {
    const next = await deepResetLectorCommentatorRoleAssignments({
      dateISO: selectedISO,
      massLabel: selectedMass,
      templateID,
      roleKey: selectedRoleKey,
      slotsCount,
    });
    setIncludeUnavailable(false);
    setAssigned(next);
  };

  const handleSave = async () => {
    try {
      await saveLectorCommentatorRoleAssignments({
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

  // ====== UI helpers
  const formatRotationInfo = (m) => {
    const roleCount = Number.isFinite(m.roleCount) ? m.roleCount : 0;
    if (roleCount === 0) return "New to role";

    const d = m.daysSinceLastRole;
    const days =
      d === Infinity
        ? "Never"
        : d === 0
        ? "Today"
        : d === 1
        ? "1 day ago"
        : Number.isFinite(d)
        ? `${d} days ago`
        : "—";
    return `${roleCount}x done • Last: ${days}`;
  };

  const nothingToShow = !loadingMembers && filteredMembers.length === 0;

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
                      to="/selectRoleLectorCommentator"
                      className="breadcrumb-item"
                      state={{
                        selectedDate,
                        selectedISO,
                        selectedMass,
                        selectedMassDisplay,
                        source,
                        isSunday,
                        templateID,
                        massKind,
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
          {selectedMassDisplay}
        </h4>
        <div
          style={{ color: "#2e4a9e", marginBottom: "1rem", fontWeight: 600 }}
        >
          Role: {selectedRoleLabel} &nbsp;•&nbsp; Slots: {slotsCount}
        </div>

        <div className="assign-container row">
          {/* LEFT */}
          <div className="col-md-6 assign-left">
            <h5 className="assign-title">{selectedRoleLabel}</h5>

            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder={
                  loadingMembers ? "Loading members…" : "Search members"
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loadingMembers}
              />
              <button className="btn btn-primary" disabled>
                <i className="bi bi-search"></i>
              </button>
            </div>

            <ul className="list-group assign-member-list">
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
              ) : includeUnavailable || isTemplateMass ? (
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
                      <div className="d-flex align-items-center flex-grow-1">
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={checked}
                          onChange={() => handleToggleMember(m)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="d-flex align-items-center">
                          {m.fullName}
                          <span
                            className="badge bg-success ms-2"
                            style={{ fontSize: "0.7em" }}
                            title="Priority for role rotation"
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
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {/* RIGHT */}
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
