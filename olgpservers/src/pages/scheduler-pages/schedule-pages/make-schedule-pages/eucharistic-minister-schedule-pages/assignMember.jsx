import React, { useState } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/assignMemberEucharisticMinister.css";

export default function AssignMemberEucharistic() {
  const members = [
    "John Paul Dungca",
    "Gabriel Cayabyab",
    "Argie Tapic",
    "Johnlie Tundayag",
    "Arcee Cabilangan",
    "Justine Willi Rigos",
  ];

  // assignment state for 6 ministers
  const [assigned, setAssigned] = useState({
    minister1: "",
    minister2: "",
    minister3: "",
    minister4: "",
    minister5: "",
    minister6: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const handleAssign = (name) => {
    setAssigned((prev) => {
      // unassign if already selected
      for (let key in prev) {
        if (prev[key] === name) {
          return { ...prev, [key]: "" };
        }
      }

      // find the first empty slot
      for (let key in prev) {
        if (!prev[key]) {
          return { ...prev, [key]: name };
        }
      }
      return prev;
    });
  };

  const isChecked = (name) => Object.values(assigned).includes(name);

  // filter members by search term
  const filteredMembers = members.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
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
                      className="breadcrumb-item"
                    >
                      Assign Group
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
                        Object.values(assigned).every((val) => val !== "") // disable if all 6 filled
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
            <div className="assign-right-scroll">
              {[...Array(6)].map((_, i) => (
                <div className="mb-4" key={i}>
                  <label className="form-label">
                    Eucharistic Minister {i + 1}:
                  </label>
                  <div className="assigned-name">
                    {assigned[`minister${i + 1}`] || (
                      <span className="text-muted">Empty</span>
                    )}
                  </div>
                  <div className="assign-line"></div>
                </div>
              ))}
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
                disabled={Object.values(assigned).every((val) => !val)}
              >
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
