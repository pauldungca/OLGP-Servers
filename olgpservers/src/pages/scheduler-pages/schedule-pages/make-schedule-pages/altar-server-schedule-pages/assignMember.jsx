import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignMemberRole.css";

export default function AssignMember() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);
  const members = [
    "John Paul Dungca",
    "Gabriel Cayabyab",
    "Argie Tapic",
    "Andrea Morales",
    "Arcee Cabilangan",
    "Justine Willi Rigos",
    "Johnlie Tundayag",
  ];

  const [assigned, setAssigned] = useState({
    candleBearer1: "",
    candleBearer2: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const handleAssign = (name) => {
    setAssigned((prev) => {
      if (prev.candleBearer1 === name) {
        return { ...prev, candleBearer1: "" };
      }
      if (prev.candleBearer2 === name) {
        return { ...prev, candleBearer2: "" };
      }

      if (!prev.candleBearer1) {
        return { ...prev, candleBearer1: name };
      }
      if (!prev.candleBearer2) {
        return { ...prev, candleBearer2: name };
      }

      return prev;
    });
  };

  const isChecked = (name) =>
    assigned.candleBearer1 === name || assigned.candleBearer2 === name;

  // filter members based on search term
  const filteredMembers = members.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="assign-container row">
          {/* Left side */}
          <div className="col-md-6 assign-left">
            <h5 className="assign-title">Candle Bearers</h5>
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
              {filteredMembers.length > 0 ? (
                filteredMembers.map((name) => (
                  <li
                    key={name}
                    className="list-group-item d-flex align-items-center"
                  >
                    <input
                      type="checkbox"
                      className="form-check-input me-2"
                      checked={isChecked(name)}
                      onChange={() => handleAssign(name)}
                      disabled={
                        !isChecked(name) &&
                        assigned.candleBearer1 &&
                        assigned.candleBearer2
                      }
                    />
                    {name}
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
              <label className="form-label">Candle Bearer 1:</label>
              <div className="assigned-name">
                {assigned.candleBearer1 || (
                  <span className="text-muted">Empty</span>
                )}
              </div>
              <div className="assign-line"></div>
            </div>

            <div className="mb-4">
              <label className="form-label">Candle Bearer 2:</label>
              <div className="assigned-name">
                {assigned.candleBearer2 || (
                  <span className="text-muted">Empty</span>
                )}
              </div>
              <div className="assign-line"></div>
            </div>

            <div className="bottom-buttons">
              <button className="btn action-buttons cancel-btn d-flex align-items-center">
                <img
                  src={image.noButtonImage}
                  alt="Cancel"
                  className="img-btn"
                />
                Cancel
              </button>
              <button className="btn action-buttons assign-btn d-flex align-items-center">
                <img src={image.assignImage} alt="Assign" className="img-btn" />
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
