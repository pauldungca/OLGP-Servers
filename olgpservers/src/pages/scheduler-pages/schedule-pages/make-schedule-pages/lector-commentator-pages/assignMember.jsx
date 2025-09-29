import React, { useState, useEffect, useMemo } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

// Import necessary functions from assignMember
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

  // -------- Context from SelectRole --------
  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const selectedMass = location.state?.selectedMass || "No mass selected";
  const source = location.state?.source || null;
  const isSunday = location.state?.isSunday ?? null;
  const templateID = location.state?.templateID ?? null;

  const selectedRoleKey = location.state?.selectedRoleKey || "reading";
  const selectedRoleLabel = location.state?.selectedRoleLabel || "Reading";
  const slotsCount = Math.max(1, Number(location.state?.slotsCount || 1));

  const slotBaseLabel = useMemo(
    () => slotBaseLabelFor(selectedRoleKey, selectedRoleLabel),
    [selectedRoleKey, selectedRoleLabel]
  );

  // -------- Members (left list) --------
  const [members, setMembers] = useState([]); // [{ idNumber, fullName, roleCount, daysSinceLastRole, ... }]
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      const normalizedMembers = await fetchLectorCommentatorMembersNormalized(
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
        const arr = await preloadAssignedForLectorCommentatorRole({
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

  // -------- Search + Priority-only filter --------
  const [searchTerm, setSearchTerm] = useState("");

  // base filter by search
  const filteredMembers = useMemo(() => {
    return members.filter((m) =>
      (m.fullName || "")
        .toLowerCase()
        .includes((searchTerm || "").toLowerCase())
    );
  }, [members, searchTerm]);

  // show ONLY priority members (new to role OR last assignment > 30 days)
  const priorityOnlyMembers = useMemo(() => {
    return filteredMembers.filter(
      (m) => m.roleCount === 0 || m.daysSinceLastRole > 30
    );
  }, [filteredMembers]);

  // -------- UI Handlers --------
  const handleToggleMember = (member) => {
    setAssigned((prev) => {
      const id = String(member.idNumber ?? "").trim();
      const alreadyIdx = prev.findIndex((m) => m && String(m.idNumber) === id);

      // If already assigned, unassign them
      if (alreadyIdx >= 0) {
        const next = [...prev];
        next[alreadyIdx] = null; // unassign
        return next;
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
    const next = await deepResetLectorCommentatorRoleAssignments({
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
              <li className="list-group-item active d-flex justify-content-between">
                <span>Name</span>
                <span style={{ fontSize: "0.85em", opacity: 0.9 }}>
                  Role History
                </span>
              </li>

              {loadingMembers || preloading ? (
                <li className="list-group-item text-muted">
                  {loadingMembers
                    ? "Fetching members..."
                    : "Loading assignments..."}
                </li>
              ) : priorityOnlyMembers.length > 0 ? (
                priorityOnlyMembers.map((m) => {
                  const checked = isMemberChecked(assigned, m);
                  // all in this list are priority by construction
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
                        <div>
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
