import React, { useState } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import "../../../assets/styles/departmentSettings.css";
import "../../../assets/styles/assignReplacement.css";

export default function AssignReplacement() {
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    "Altar Server",
    "Eucharistic Minister",
    "Choir",
    "Lector Commentator",
  ];

  return (
    <div className="department-settings-page-container">
      <div className="department-settings-header">
        <div className="header-text-with-line">
          <h3>DEPARTMENT SETTINGS</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/departmentSettings" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link to="/selectMember" className="breadcrumb-item">
                      Assign Member
                    </Link>
                  ),
                },
                {
                  title: "Assign Replacement",
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
      <div className="department-settings-content">
        <h1>Assign Replacement</h1>
        <p>
          By confirming, you acknowledge that you are transferring department
          scheduler privileges to <strong>Juan D. Cruz</strong>, authorizing
          them to manage and update the schedule as needed.
        </p>

        <div className="assign-replacement-role-container">
          {roles.map((role, index) => (
            <button
              key={index}
              className={`assign-replacement-role-btn ${
                selectedRole === role ? "selected" : ""
              }`}
              onClick={() =>
                setSelectedRole(selectedRole === role ? null : role)
              }
            >
              {role}
            </button>
          ))}
        </div>

        <div>
          <button
            className="assign-replacement-confirm-btn"
            onClick={() => alert(`Selected Role: ${selectedRole}`)}
            disabled={!selectedRole}
          >
            Confirm
          </button>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
