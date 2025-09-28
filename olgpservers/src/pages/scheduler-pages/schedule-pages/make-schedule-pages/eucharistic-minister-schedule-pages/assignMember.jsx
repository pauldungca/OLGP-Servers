import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignMemberEucharisticMinister.css";

import {
  fetchEucharisticMinisterGroupMembers,
  fetchEucharisticMinisterAssignments,
  saveEucharisticMinisterAssignments,
  resetEucharisticMinisterAssignments,
} from "../../../../../assets/scripts/assignMember";

export default function AssignMemberEucharistic() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();
  const { state } = useLocation();

  // From router state
  const selectedDate = state?.selectedDate || "No date selected";
  const selectedISO = state?.selectedISO || null;
  const selectedMassDisplay = state?.selectedMassDisplay || "Selected Mass";
  const templateID = state?.templateID ?? null;
  const isSunday = !!state?.isSunday;
  const group = state?.group || null;

  // Local state
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Assignment state (6 slots)
  const [assigned, setAssigned] = useState({
    minister1: "",
    minister2: "",
    minister3: "",
    minister4: "",
    minister5: "",
    minister6: "",
  });

  // Helper to normalize IDs to string everywhere
  const asStr = (v) => (v === null || v === undefined ? "" : String(v));

  // Load group members
  useEffect(() => {
    let cancelled = false;

    const loadGroupMembers = async () => {
      if (!group?.name) {
        setLoadingMembers(false);
        return;
      }

      try {
        setLoadingMembers(true);
        const groupMembers = await fetchEucharisticMinisterGroupMembers(
          group.name
        );

        if (!cancelled) {
          // Normalize IDs to string to avoid number/string mismatches
          const normalized = (groupMembers || []).map((m) => ({
            id: asStr(m.id),
            name: m.name,
          }));
          setMembers(normalized);
        }
      } catch (err) {
        console.error("Failed to load group members:", err);
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    };

    loadGroupMembers();
    return () => {
      cancelled = true;
    };
  }, [group?.name]);

  // Load existing assignments AFTER members are loaded (pre-check boxes)
  useEffect(() => {
    let cancelled = false;

    const loadExistingAssignments = async () => {
      if (!selectedISO || !selectedMassDisplay || loadingMembers) return;

      try {
        const existing = await fetchEucharisticMinisterAssignments(
          selectedISO,
          selectedMassDisplay
        );

        if (!cancelled && existing.length > 0) {
          const next = {
            minister1: "",
            minister2: "",
            minister3: "",
            minister4: "",
            minister5: "",
            minister6: "",
          };
          existing.slice(0, 6).forEach((a, i) => {
            next[`minister${i + 1}`] = {
              id: asStr(a.id),
              name: a.name || `Member ${a.id}`,
            };
          });
          setAssigned(next);
        }
      } catch (err) {
        console.error("Failed to load existing assignments:", err);
      }
    };

    loadExistingAssignments();
    return () => {
      cancelled = true;
    };
  }, [selectedISO, selectedMassDisplay, loadingMembers]);

  const handleAssign = (member) => {
    const mid = asStr(member.id);

    setAssigned((prev) => {
      // Unassign if already selected
      for (const key in prev) {
        if (prev[key] && asStr(prev[key].id) === mid) {
          return { ...prev, [key]: "" };
        }
      }
      // Assign to first empty slot
      for (const key in prev) {
        if (!prev[key]) {
          return { ...prev, [key]: { id: mid, name: member.name } };
        }
      }
      return prev;
    });
  };

  const isChecked = (member) => {
    const mid = asStr(member.id);
    return Object.values(assigned).some((m) => m && asStr(m.id) === mid);
  };

  const handleSave = async () => {
    try {
      const success = await saveEucharisticMinisterAssignments(
        selectedISO,
        selectedMassDisplay,
        templateID,
        assigned
      );

      if (success) {
        navigate("/selectMassEucharisticMinister", {
          state: { selectedDate, selectedISO, isSunday, templateID },
        });
      } else {
        alert("Failed to save assignments. Please try again.");
      }
    } catch (err) {
      console.error("Error saving assignments:", err);
      alert("An error occurred while saving assignments.");
    }
  };

  const handleCancel = async () => {
    try {
      const success = await resetEucharisticMinisterAssignments(
        selectedISO,
        selectedMassDisplay
      );

      if (success) {
        setAssigned({
          minister1: "",
          minister2: "",
          minister3: "",
          minister4: "",
          minister5: "",
          minister6: "",
        });
      } else {
        alert("Failed to reset assignments. Please try again.");
      }
    } catch (err) {
      console.error("Error resetting assignments:", err);
      alert("An error occurred while resetting assignments.");
    }
  };

  // Search filter
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  title: (
                    <Link
                      to="/assignGroupEucharisticMinister"
                      state={{
                        selectedDate,
                        selectedISO,
                        selectedMassDisplay,
                        templateID,
                        isSunday,
                      }}
                      className="breadcrumb-item"
                    >
                      Assign Group
                    </Link>
                  ),
                },
                { title: "Assign Member", className: "breadcrumb-item-active" },
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
        <h4 style={{ marginBottom: "0.5rem" }}>
          Selected Date: {selectedDate} | Selected Mass: {selectedMassDisplay}
        </h4>
        <h5 style={{ marginBottom: "1rem", color: "#666" }}>
          Group: {group?.name || "No group selected"}
        </h5>

        <div className="assign-container row">
          {/* Left */}
          <div className="col-md-6 assign-left">
            <h5 className="assign-title">Eucharistic Ministers</h5>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-primary">
                <i className="bi bi-search"></i>
              </button>
            </div>

            <ul className="list-group assign-member-list">
              <li className="list-group-item active">Name</li>
              {loadingMembers ? (
                <li className="list-group-item text-muted">Loading members…</li>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <li
                    key={member.id}
                    className="list-group-item d-flex align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      // Block adding new if all 6 filled, but allow unselecting
                      if (
                        !(
                          !isChecked(member) &&
                          Object.values(assigned).every((val) => val !== "")
                        )
                      ) {
                        handleAssign(member);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input me-2"
                      checked={isChecked(member)}
                      onChange={() => handleAssign(member)}
                      disabled={
                        !isChecked(member) &&
                        Object.values(assigned).every((val) => val !== "")
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    {member.name}
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted">
                  {group?.name
                    ? "No members found in this group"
                    : "No group selected"}
                </li>
              )}
            </ul>
          </div>

          {/* Right */}
          <div className="col-md-6 assign-right">
            <div className="assign-right-scroll">
              {[...Array(6)].map((_, i) => (
                <div className="mb-4" key={i}>
                  <label className="form-label">
                    Eucharistic Minister {i + 1}:
                  </label>
                  <div className="assigned-name">
                    {assigned[`minister${i + 1}`]?.name || (
                      <span className="text-muted">Empty</span>
                    )}
                  </div>
                  <div className="assign-line"></div>
                </div>
              ))}
            </div>

            <div className="bottom-buttons">
              <button
                className="btn action-buttons cancel-button d-flex align-items-center"
                disabled={Object.values(assigned).every((val) => !val)}
                onClick={handleCancel}
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
                disabled={Object.values(assigned).every((val) => !val)}
                onClick={handleSave}
              >
                <img src={image.assignImage} alt="Assign" className="img-btn" />
                Assign
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
