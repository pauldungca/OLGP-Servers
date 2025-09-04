import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignGroup.css";

export default function AssignGroup() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);
  const groups = ["AGC", "CFC", "OLGC", "Coro Ni Maria"];
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const filteredGroups = groups.filter((g) =>
    g.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const navigate = useNavigate();

  const handleAssign = () => {
    navigate("/assignMemberEucharisticMinister");
  };

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
              <button className="btn btn-primary">
                <i className="bi bi-search"></i>
              </button>
            </div>

            <ul className="list-group assign-member-list">
              <li className="list-group-item active">Name</li>
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <li
                    key={group}
                    className={`list-group-item d-flex align-items-center ${
                      selectedGroup === group ? "selected" : ""
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <input
                      type="radio"
                      className="form-check-input me-2"
                      checked={selectedGroup === group}
                      onChange={() => setSelectedGroup(group)}
                    />
                    {group}
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
              <label className="form-label">Selected Option:</label>
              <div className="assigned-name">
                {selectedGroup || <span className="text-muted">Empty</span>}
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
              <button
                className="btn action-buttons assign-btn d-flex align-items-center"
                disabled={!selectedGroup}
                onClick={handleAssign}
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
