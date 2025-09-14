import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate } from "react-router-dom";
import icon from "../../../../helper/icon";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import {
  createTemplate,
  confirmCancel,
} from "../../../../assets/scripts/template";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/createTemplate.css";

export default function Createtemplate() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  // Controlled inputs
  const [templateName, setTemplateName] = useState("");
  const [massType, setMassType] = useState("High Mass");
  const [saving, setSaving] = useState(false);

  // Department UI state
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [mode, setMode] = useState({
    altar: "standard",
    eucharistic: "standard",
    choir: "standard",
    lector: "standard",
  });

  // Role toggles (optional visual checkboxes)
  const [enabledRoles, setEnabledRoles] = useState({
    altar: {},
    eucharistic: {},
    choir: {},
    lector: {},
  });

  // Editable counts (used when mode[dept] === "custom")
  const [counts, setCounts] = useState({
    altar: {
      "Candle Bearers": 0,
      Bellers: 0,
      "Cross Bearer": 0,
      "Incense Bearer": 0,
      Thurifer: 0,
      "Main Servers": 0,
      Plates: 0,
    },
    eucharistic: { Minister: 0 },
    choir: { Choir: 0 },
    lector: { Readings: 0, Intercession: 0 },
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
    setSelectedDepartments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleRole = (dept, role, defaultVal = 0) => {
    setEnabledRoles((prev) => {
      const next = !prev[dept]?.[role];
      // If in custom: toggling off -> force count 0; toggling on with 0 -> set to default
      if (mode[dept] === "custom") {
        setCounts((c) => ({
          ...c,
          [dept]: {
            ...c[dept],
            [role]: next ? c[dept]?.[role] || defaultVal : 0,
          },
        }));
      }
      return {
        ...prev,
        [dept]: { ...(prev[dept] || {}), [role]: next },
      };
    });
  };

  const setDeptMode = (dept, nextMode) => {
    setMode((m) => ({ ...m, [dept]: nextMode }));
    if (nextMode === "custom") {
      // On entering custom, initialize that department's counts to 0
      setCounts((c) => {
        if (dept === "altar") {
          return {
            ...c,
            altar: {
              "Candle Bearers": 0,
              Bellers: 0,
              "Cross Bearer": 0,
              "Incense Bearer": 0,
              Thurifer: 0,
              "Main Servers": 0,
              Plates: 0,
            },
          };
        }
        if (dept === "eucharistic") {
          return { ...c, eucharistic: { Minister: 0 } };
        }
        if (dept === "choir") {
          return { ...c, choir: { Choir: 0 } };
        }
        if (dept === "lector") {
          return { ...c, lector: { Readings: 0, Intercession: 0 } };
        }
        return c;
      });
    }
    // If switching back to standard, UI will show defaults automatically.
  };

  const onCustomCountChange = (dept, role, value) => {
    const n = Number(value);
    setCounts((c) => ({
      ...c,
      [dept]: { ...c[dept], [role]: isNaN(n) ? 0 : n },
    }));
  };

  // ACTIONS
  const onCreate = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await createTemplate({
        templateName,
        massType,
        selectedDepartments,
        mode,
        enabledRoles, // optional now
        counts, // <-- pass custom counts
      });
      if (res) navigate("/selectTemplate");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = async () => {
    const ok = await confirmCancel();
    if (ok) navigate("/selectTemplate");
  };

  return (
    <div className="schedule-page-container">
      {/* Header */}
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
                  title: "Create Mass Schedule Template",
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
      <div className="schedule-content container">
        {/* Mass Type + Template Name */}
        <div className="row mb-4">
          <div className="col-md-8">
            <input
              type="text"
              className="form-control template-name-input"
              placeholder="Enter template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select
              className="form-select mass-type-dropdown"
              value={massType}
              onChange={(e) => setMassType(e.target.value)}
            >
              <option>High Mass</option>
              <option>Low Mass</option>
              <option>Solemn Mass</option>
              <option>Votive Mass</option>
              <option>Vigil Mass</option>
              <option>Pontifical Mass</option>
              <option>Concelebrated Mass</option>
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
                onClick={() => setDeptMode("altar", "standard")}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.altar === "custom" ? "enabled" : ""
                }`}
                onClick={() => setDeptMode("altar", "custom")}
              >
                Custom
              </button>
            </div>

            <div className="row g-3">
              {altarRoles.map((role, idx) => {
                const enabled = !!enabledRoles.altar[role.label];
                const isStd = mode.altar === "standard";
                const value = isStd
                  ? role.default
                  : counts.altar[role.label] ?? 0;
                return (
                  <div
                    key={idx}
                    className="col-md-3 d-flex align-items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      disabled={isStd} // disable only in standard
                      checked={enabled}
                      onChange={() =>
                        toggleRole("altar", role.label, role.default)
                      }
                    />
                    <label className="form-check-label flex-grow-1">
                      {role.label}
                    </label>
                    <select
                      className="form-select form-select-sm w-auto"
                      disabled={isStd} // editable in custom
                      value={value}
                      onChange={(e) =>
                        onCustomCountChange("altar", role.label, e.target.value)
                      }
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
                onClick={() => setDeptMode("eucharistic", "standard")}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.eucharistic === "custom" ? "enabled" : ""
                }`}
                onClick={() => setDeptMode("eucharistic", "custom")}
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
                onChange={() =>
                  toggleRole("eucharistic", "Minister", 4 /* default */)
                }
              />
              <label className="form-check-label">Minister’s Count:</label>
              <select
                className="form-select form-select-sm w-auto"
                disabled={mode.eucharistic === "standard"}
                value={
                  mode.eucharistic === "standard"
                    ? 4
                    : counts.eucharistic["Minister"] ?? 0
                }
                onChange={(e) =>
                  onCustomCountChange("eucharistic", "Minister", e.target.value)
                }
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
                onClick={() => setDeptMode("choir", "standard")}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.choir === "custom" ? "enabled" : ""
                }`}
                onClick={() => setDeptMode("choir", "custom")}
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
                onChange={() => toggleRole("choir", "Choir", 1 /* default */)}
              />
              <label className="form-check-label">Choir Group Count:</label>
              <select
                className="form-select form-select-sm w-auto"
                disabled={mode.choir === "standard"}
                value={
                  mode.choir === "standard" ? 1 : counts.choir["Choir"] ?? 0
                }
                onChange={(e) =>
                  onCustomCountChange("choir", "Choir", e.target.value)
                }
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
                onClick={() => setDeptMode("lector", "standard")}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.lector === "custom" ? "enabled" : ""
                }`}
                onClick={() => setDeptMode("lector", "custom")}
              >
                Custom
              </button>
            </div>

            <div className="row g-3">
              {lectorRoles.map((role, idx) => {
                const enabled = !!enabledRoles.lector[role.label];
                const isStd = mode.lector === "standard";
                const value = isStd
                  ? role.default
                  : counts.lector[role.label] ?? 0;
                return (
                  <div
                    key={idx}
                    className="col-md-4 d-flex align-items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      disabled={isStd}
                      checked={enabled}
                      onChange={() =>
                        toggleRole("lector", role.label, role.default)
                      }
                    />
                    <label className="form-check-label flex-grow-1">
                      {role.label}:
                    </label>
                    <select
                      className="form-select form-select-sm w-auto"
                      disabled={isStd}
                      value={value}
                      onChange={(e) =>
                        onCustomCountChange(
                          "lector",
                          role.label,
                          e.target.value
                        )
                      }
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
          <button type="button" className="btn-cancelButton" onClick={onCancel}>
            <img
              src={image.noButtonImage}
              alt="Cancel"
              className="me-2"
              width="20"
              height="20"
            />
            Cancel
          </button>
          <button
            type="button"
            className="btn-create"
            onClick={onCreate}
            disabled={saving}
          >
            <img
              src={image.createButtonImage}
              alt="Create"
              className="me-2"
              width="20"
              height="20"
            />
            {saving ? "Creating..." : "Create"}
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
