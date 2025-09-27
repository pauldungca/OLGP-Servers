import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";
import Swal from "sweetalert2";

import {
  getChoirGroupAssignments,
  saveChoirGroupAssignments,
  clearChoirGroupAssignments,
} from "../../../../../assets/scripts/assignMember";

import { fetchChoirGroups } from "../../../../../assets/scripts/group";
import { supabase } from "../../../../../utils/supabase";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignGroup.css";

export default function AssignGroupChoir() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule - Choir";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Get state from navigation
  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const dateISOForDB = location.state?.dateISOForDB || selectedISO;
  const selectedMass = location.state?.selectedMass || "No mass selected";
  const selectedMassDisplay =
    location.state?.selectedMassDisplay || selectedMass;
  const source = location.state?.source || null;
  const isSunday = location.state?.isSunday || false;
  const templateID = location.state?.templateID || null;
  const time = location.state?.time || null;
  const massKind = location.state?.massKind || "sunday";

  // Available choir groups - fetch from database
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [allAssignedGroups, setAllAssignedGroups] = useState(new Set()); // Groups assigned to other masses

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [, setLoadingAssignments] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredGroups = availableGroups.filter((group) => {
    // Filter by search term
    const matchesSearch = group.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Don't show groups that are assigned to OTHER masses on the same date
    const isAssignedToOtherMass = allAssignedGroups.has(group.name);

    return matchesSearch && !isAssignedToOtherMass;
  });

  // Load all assignments for this date to check which groups are already assigned
  useEffect(() => {
    const loadAllAssignmentsForDate = async () => {
      if (!dateISOForDB) return;

      try {
        // Fetch all assignments for this date across all masses
        const { data: allAssignments, error } = await supabase
          .from("choir-placeholder")
          .select("group, mass")
          .eq("date", dateISOForDB);

        if (error) {
          console.error("Error loading all assignments:", error);
          return;
        }

        // Create a set of groups that are assigned to OTHER masses (not current mass)
        const assignedToOtherMasses = new Set();
        (allAssignments || []).forEach((assignment) => {
          if (assignment.mass !== selectedMass && assignment.group) {
            assignedToOtherMasses.add(assignment.group);
          }
        });

        setAllAssignedGroups(assignedToOtherMasses);
      } catch (error) {
        console.error("Error loading all assignments for date:", error);
      }
    };

    loadAllAssignmentsForDate();
  }, [dateISOForDB, selectedMass]);

  // Load available choir groups from database
  useEffect(() => {
    const loadChoirGroups = async () => {
      setLoadingGroups(true);
      try {
        const groups = await fetchChoirGroups();

        // Add "Koro Ni Maria" as an additional option if not already in the database
        const fetchedGroups = groups || [];
        const hasKoroNiMaria = fetchedGroups.some(
          (group) =>
            group.name && group.name.toLowerCase().includes("koro ni maria")
        );

        if (!hasKoroNiMaria) {
          fetchedGroups.push({
            id: 999, // Use a high numeric ID for "Koro Ni Maria"
            name: "Koro Ni Maria",
          });
        }

        setAvailableGroups(fetchedGroups);
      } catch (error) {
        console.error("Error loading choir groups:", error);
        // Fallback to at least show "Koro Ni Maria" if database fetch fails
        setAvailableGroups([
          {
            id: 999,
            name: "Koro Ni Maria",
          },
        ]);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadChoirGroups();
  }, []);

  // Load current assignments and pre-select assigned group
  useEffect(() => {
    const loadAssignments = async () => {
      if (!dateISOForDB || !selectedMass) return;

      setLoadingAssignments(true);
      try {
        const assignments = await getChoirGroupAssignments(
          dateISOForDB,
          selectedMass
        );

        // Auto-select the first assigned group if any exists
        const assignedGroupNames = Object.keys(assignments || {});
        if (assignedGroupNames.length > 0) {
          const firstAssignedGroupName = assignedGroupNames[0];

          // Find the matching group from available groups and select it
          const matchingGroup = availableGroups.find(
            (group) => group.name === firstAssignedGroupName
          );

          if (matchingGroup) {
            setSelectedGroup(matchingGroup);
          }
        }
      } catch (error) {
        console.error("Error loading choir assignments:", error);
      } finally {
        setLoadingAssignments(false);
      }
    };

    // Only load assignments after available groups are loaded
    if (availableGroups.length > 0) {
      loadAssignments();
    }
  }, [dateISOForDB, selectedMass, availableGroups]);

  const handleAssign = async () => {
    if (!selectedGroup) return;

    setSaving(true);
    try {
      // Prepare the assignment data to match your database schema
      const assignmentData = {
        dateISO: dateISOForDB,
        massLabel: selectedMass,
        templateID: templateID, // Include templateID if available
        assignedGroups: [selectedGroup],
      };

      await saveChoirGroupAssignments(assignmentData);

      await Swal.fire({
        icon: "success",
        title: "Group Assigned!",
        text: `${selectedGroup.name} has been assigned to this mass.`,
        timer: 1500,
        showConfirmButton: false,
      });

      // Navigate back to SelectMass after successful assignment
      navigate("/selectMassChoir", {
        state: {
          selectedDate,
          selectedISO,
          dateISOForDB,
          source,
          isSunday,
        },
      });
    } catch (error) {
      console.error("Error assigning group:", error);
      console.error("Full error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      let errorMessage =
        "There was an error assigning the group. Please try again.";
      if (error.message) {
        errorMessage = `Database error: ${error.message}`;
      }

      await Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const success = await clearChoirGroupAssignments(
        dateISOForDB,
        selectedMass
      );
      if (success) {
        // Clear the selected group after successful reset
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error("Error resetting assignments:", error);
    }
  };

  // Build back navigation state
  const backToMassState = {
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
  };

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
                      state={backToMassState}
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
        <h4 style={{ marginBottom: "1rem" }}>
          Selected Date: {selectedDate} | Selected Mass: {selectedMassDisplay}
        </h4>

        <>
          <div className="assign-container row">
            {/* Left side */}
            <div className="col-md-6 assign-left">
              <h5 className="assign-title">Assign Choir Group</h5>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search choir groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-primary">
                  <i className="bi bi-search"></i>
                </button>
              </div>

              <ul className="list-group assign-member-list">
                <li className="list-group-item active">Available Groups</li>
                {loadingGroups ? (
                  <li className="list-group-item text-center">
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        border: "2px solid #f3f3f3",
                        borderTop: "2px solid #2e4a9e",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "10px auto",
                      }}
                    />
                    <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
                    <small className="text-muted">Loading groups...</small>
                  </li>
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
                  <li className="list-group-item text-muted">
                    No groups found
                  </li>
                )}
              </ul>
            </div>

            {/* Right side */}
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
                  disabled={!selectedGroup || saving}
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
                  disabled={!selectedGroup || saving}
                  onClick={handleAssign}
                >
                  <img
                    src={image.assignImage}
                    alt="Assign"
                    className="img-btn"
                  />
                  {saving ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </>
      </div>

      <Footer />
    </div>
  );
}
