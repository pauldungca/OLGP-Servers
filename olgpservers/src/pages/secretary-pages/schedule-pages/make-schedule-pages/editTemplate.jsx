import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../helper/icon";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/createTemplate.css";

export default function EditTemplate() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [mode, setMode] = useState({
    altar: "standard",
    eucharistic: "standard",
    choir: "standard",
    lector: "standard",
  });

  const [enabledRoles, setEnabledRoles] = useState({
    altar: {},
    eucharistic: {},
    choir: {},
    lector: {},
  });

  const departments = [
    { id: "altar", name: "Altar Server" },
    { id: "eucharistic", name: "Eucharistic Minister" },
    { id: "choir", name: "Choir" },
    { id: "lector", name: "Lector Commentator" },
  ];

  const altarRoles = [
    { label: "Candle Bearers", default: 2 },
    { label: "Bellers", default: 2 },
    { label: "Cross Bearer", default: 1 },
    { label: "Incense Bearer", default: 1 },
    { label: "Thurifer", default: 1 },
    { label: "Main Servers", default: 2 },
    { label: "Plates", default: 10 },
  ];

  const lectorRoles = [
    { label: "Readings", default: 2 },
    { label: "Intercession", default: 1 },
  ];

  const toggleDepartment = (id) => {
    if (selectedDepartments.includes(id)) {
      setSelectedDepartments(selectedDepartments.filter((d) => d !== id));
    } else {
      setSelectedDepartments([...selectedDepartments, id]);
    }
  };

  const toggleRole = (dept, role) => {
    setEnabledRoles((prev) => ({
      ...prev,
      [dept]: {
        ...prev[dept],
        [role]: !prev[dept][role],
      },
    }));
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
                    <Link to="/selectTemplate" className="breadcrumb-item">
                      Select Template
                    </Link>
                  ),
                },
                {
                  title: "Edit Mass Schedule Template",
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
      <div className="schedule-content container">
        {/* Mass Type + Template Name */}
        <div className="row mb-4">
          <div className="col-md-8">
            <input
              type="text"
              className="form-control template-name-input"
              placeholder="Enter template name"
            />
          </div>
          <div className="col-md-4">
            <select className="form-select mass-type-dropdown">
              <option>High Mass</option>
              <option>Low Mass</option>
              <option>Special Mass</option>
            </select>
          </div>
        </div>

        {/* Department Buttons */}
        <div className="d-flex gap-3 mb-4 flex-wrap w-100">
          {departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              className={`btn department-btn flex-fill ${
                selectedDepartments.includes(dept.id) ? "active" : ""
              }`}
              onClick={() => toggleDepartment(dept.id)}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {/* Altar Servers */}
        {selectedDepartments.includes("altar") && (
          <div className="department-section mt-3 p-3 enabled">
            <h5 className="section-title">Altar Servers</h5>

            {/* Standard / Custom */}
            <div className="d-flex gap-2 mb-3">
              <button
                className={`btn custom-standard-btn ${
                  mode.altar === "standard" ? "enabled" : ""
                }`}
                onClick={() => setMode({ ...mode, altar: "standard" })}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.altar === "custom" ? "enabled" : ""
                }`}
                onClick={() => setMode({ ...mode, altar: "custom" })}
              >
                Custom
              </button>
            </div>

            <div className="row g-3">
              {altarRoles.map((role, idx) => {
                const enabled = enabledRoles.altar[role.label];
                return (
                  <div
                    key={idx}
                    className="col-md-3 d-flex align-items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      disabled={mode.altar === "standard"}
                      checked={!!enabled}
                      onChange={() => toggleRole("altar", role.label)}
                    />
                    <label className="form-check-label flex-grow-1">
                      {role.label}
                    </label>
                    <select
                      className="form-select form-select-sm w-auto"
                      disabled={mode.altar === "standard" || !enabled}
                      value={
                        mode.altar === "standard"
                          ? role.default
                          : enabled
                          ? role.default
                          : 0
                      }
                      readOnly
                    >
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                      <option value={0}>0</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Eucharistic Ministers */}
        {selectedDepartments.includes("eucharistic") && (
          <div className="department-section mt-3 p-3 enabled">
            <h5 className="section-title">Eucharistic Ministers</h5>
            <div className="d-flex gap-2 mb-3">
              <button
                className={`btn custom-standard-btn ${
                  mode.eucharistic === "standard" ? "enabled" : ""
                }`}
                onClick={() => setMode({ ...mode, eucharistic: "standard" })}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.eucharistic === "custom" ? "enabled" : ""
                }`}
                onClick={() => setMode({ ...mode, eucharistic: "custom" })}
              >
                Custom
              </button>
            </div>

            <div className="d-flex align-items-center gap-3">
              <input
                type="checkbox"
                className="form-check-input"
                disabled={mode.eucharistic === "standard"}
                checked={!!enabledRoles.eucharistic["Minister"]}
                onChange={() => toggleRole("eucharistic", "Minister")}
              />
              <label className="form-check-label">Minister’s Count:</label>
              <select
                className="form-select form-select-sm w-auto"
                disabled={
                  mode.eucharistic === "standard" ||
                  !enabledRoles.eucharistic["Minister"]
                }
                value={
                  mode.eucharistic === "standard"
                    ? 4
                    : enabledRoles.eucharistic["Minister"]
                    ? 4
                    : 0
                }
                readOnly
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
                <option value={0}>0</option>
              </select>
            </div>
          </div>
        )}

        {/* Choir */}
        {selectedDepartments.includes("choir") && (
          <div className="department-section mt-3 p-3 enabled">
            <h5 className="section-title">Choir</h5>
            <div className="d-flex gap-2 mb-3">
              <button
                className={`btn custom-standard-btn ${
                  mode.choir === "standard" ? "enabled" : ""
                }`}
                onClick={() => setMode({ ...mode, choir: "standard" })}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.choir === "custom" ? "enabled" : ""
                }`}
                onClick={() => setMode({ ...mode, choir: "custom" })}
              >
                Custom
              </button>
            </div>

            <div className="d-flex align-items-center gap-3">
              <input
                type="checkbox"
                className="form-check-input"
                disabled={mode.choir === "standard"}
                checked={!!enabledRoles.choir["Choir"]}
                onChange={() => toggleRole("choir", "Choir")}
              />
              <label className="form-check-label">Choir Group Count:</label>
              <select
                className="form-select form-select-sm w-auto"
                disabled={
                  mode.choir === "standard" || !enabledRoles.choir["Choir"]
                }
                value={
                  mode.choir === "standard"
                    ? 1
                    : enabledRoles.choir["Choir"]
                    ? 1
                    : 0
                }
                readOnly
              >
                {[...Array(5)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
                <option value={0}>0</option>
              </select>
            </div>
          </div>
        )}

        {/* Lector Commentators */}
        {selectedDepartments.includes("lector") && (
          <div className="department-section mt-3 p-3 enabled">
            <h5 className="section-title">Lector-Commentators</h5>
            <div className="d-flex gap-2 mb-3">
              <button
                className={`btn custom-standard-btn ${
                  mode.lector === "standard" ? "enabled" : ""
                }`}
                onClick={() => setMode({ ...mode, lector: "standard" })}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.lector === "custom" ? "enabled" : ""
                }`}
                onClick={() => setMode({ ...mode, lector: "custom" })}
              >
                Custom
              </button>
            </div>

            <div className="row g-3">
              {lectorRoles.map((role, idx) => {
                const enabled = enabledRoles.lector[role.label];
                return (
                  <div
                    key={idx}
                    className="col-md-4 d-flex align-items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      disabled={mode.lector === "standard"}
                      checked={!!enabled}
                      onChange={() => toggleRole("lector", role.label)}
                    />
                    <label className="form-check-label flex-grow-1">
                      {role.label}:
                    </label>
                    <select
                      className="form-select form-select-sm w-auto"
                      disabled={mode.lector === "standard" || !enabled}
                      value={
                        mode.lector === "standard"
                          ? role.default
                          : enabled
                          ? role.default
                          : 0
                      }
                      readOnly
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                      <option value={0}>0</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-3 mt-5 mb-4">
          <button type="button" className="btn btn-cancel">
            <img
              src={image.noButtonImage}
              alt="Cancel"
              className="me-2"
              width="20"
              height="20"
            />
            Cancel
          </button>
          <button type="button" className="btn btn-create">
            <img
              src={image.createButtonImage}
              alt="Create"
              className="me-2"
              width="20"
              height="20"
            />
            Save
          </button>
        </div>
      </div>

      {/* Footer */}
      <div>
        <Footer />
      </div>
    </div>
  );
}
