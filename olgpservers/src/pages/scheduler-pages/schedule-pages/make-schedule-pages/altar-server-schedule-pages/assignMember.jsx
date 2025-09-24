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
  placeMember,
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

  // -------- Members (left list) --------
  const [members, setMembers] = useState([]); // [{ idNumber, fullName, role }]
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMembers(true);
      const normalized = await fetchMembersNormalized();
      if (!cancelled) {
        setMembers(normalized);
        setLoadingMembers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------- Assigned (right panel) --------
  const [preloading, setPreloading] = useState(true);
  const [assigned, setAssigned] = useState(ensureArraySize([], slotsCount));

  // keep assigned array size in sync with slotsCount
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

  // -------- Search --------
  const [searchTerm, setSearchTerm] = useState("");
  const filteredMembers = useMemo(
    () =>
      members.filter((m) =>
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [members, searchTerm]
  );

  // -------- UI Handlers --------
  const handleToggleMember = (member) => {
    setAssigned((prev) => placeMember(prev, member));
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
                  const checked = isMemberChecked(assigned, m);
                  return (
                    <li
                      key={String(m.idNumber)}
                      className="list-group-item d-flex align-items-center"
                      onClick={() => handleToggleMember(m)}
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input me-2"
                        checked={checked}
                        onChange={() => handleToggleMember(m)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {m.fullName}
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
