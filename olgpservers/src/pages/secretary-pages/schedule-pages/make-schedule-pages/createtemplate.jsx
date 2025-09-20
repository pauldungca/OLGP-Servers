import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate } from "react-router-dom";
import icon from "../../../../helper/icon";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import {
  createTemplate,
  confirmCancel,
  getEucharisticMax,
  getChoirMax,
} from "../../../../assets/scripts/template";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/createTemplate.css";

/* ======== MODULE-LEVEL CONSTANTS ======== */
const ALTAR_DEFAULTS = {
  "Candle Bearers": 2,
  Bellers: 2,
  "Cross Bearer": 1,
  "Incense Bearer": 1,
  Thurifer: 1,
  "Main Servers": 2,
  Plates: 10,
};

const EUCHARISTIC_DEFAULTS = { Minister: 6 };
const CHOIR_DEFAULTS = { Choir: 1 }; // Standard choir is 1 (per your refined behavior)
const LECTOR_DEFAULTS = { Readings: 2, Intercession: 1 };

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

  // Role toggles
  const [enabledRoles, setEnabledRoles] = useState({
    altar: {},
    eucharistic: {},
    choir: {},
    lector: {},
  });

  // Editable counts
  const [altarCounts, setAltarCounts] = useState({ ...ALTAR_DEFAULTS });
  const [eucharisticCount, setEucharisticCount] = useState(
    EUCHARISTIC_DEFAULTS.Minister
  );
  const [choirCount, setChoirCount] = useState(CHOIR_DEFAULTS.Choir);
  const [lectorCounts, setLectorCounts] = useState({ ...LECTOR_DEFAULTS });

  const [eucharisticMax, setEucharisticMax] = useState(10);
  const [choirMax, setChoirMax] = useState(CHOIR_DEFAULTS.Choir);

  // Fetch dynamic maxima
  useEffect(() => {
    (async () => {
      const max = await getEucharisticMax();
      setEucharisticMax(max || 0);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const max = await getChoirMax();
      setChoirMax(max || CHOIR_DEFAULTS.Choir);
    })();
  }, []);

  const departments = [
    { id: "altar", name: "Altar Server" },
    { id: "eucharistic", name: "Eucharistic Minister" },
    { id: "choir", name: "Choir" },
    { id: "lector", name: "Lector Commentator" },
  ];

  const altarRoles = [
    { label: "Candle Bearers", default: ALTAR_DEFAULTS["Candle Bearers"] },
    { label: "Bellers", default: ALTAR_DEFAULTS.Bellers },
    { label: "Cross Bearer", default: ALTAR_DEFAULTS["Cross Bearer"] },
    { label: "Incense Bearer", default: ALTAR_DEFAULTS["Incense Bearer"] },
    { label: "Thurifer", default: ALTAR_DEFAULTS.Thurifer },
    { label: "Main Servers", default: ALTAR_DEFAULTS["Main Servers"] },
    { label: "Plates", default: ALTAR_DEFAULTS.Plates },
  ];

  const lectorRoles = [
    { label: "Readings", default: LECTOR_DEFAULTS.Readings },
    { label: "Intercession", default: LECTOR_DEFAULTS.Intercession },
  ];

  // Standard-mode helpers to set all roles true + default counts
  const enableAllAltarStd = () => {
    setEnabledRoles((prev) => ({
      ...prev,
      altar: altarRoles.reduce((acc, r) => {
        acc[r.label] = true;
        return acc;
      }, {}),
    }));
    setAltarCounts({ ...ALTAR_DEFAULTS });
  };

  const enableAllLectorStd = () => {
    setEnabledRoles((prev) => ({
      ...prev,
      lector: lectorRoles.reduce((acc, r) => {
        acc[r.label] = true;
        return acc;
      }, {}),
    }));
    setLectorCounts({ ...LECTOR_DEFAULTS });
  };

  const toggleDepartment = (id) => {
    setSelectedDepartments((prev) => {
      const adding = !prev.includes(id);
      const next = adding ? [...prev, id] : prev.filter((d) => d !== id);

      // Auto-check roles if in Standard as soon as dept is added
      if (adding) {
        if (id === "altar" && mode.altar === "standard") {
          enableAllAltarStd();
        }
        if (id === "lector" && mode.lector === "standard") {
          enableAllLectorStd();
        }
      }

      return next;
    });
  };

  const toggleRole = (dept, role, defaultVal = 0) => {
    setEnabledRoles((prev) => {
      const next = !prev[dept]?.[role];
      if (mode[dept] === "custom") {
        if (dept === "altar") {
          setAltarCounts((c) => ({
            ...c,
            [role]: next ? c[role] || defaultVal : 0,
          }));
        }
        if (dept === "lector") {
          setLectorCounts((c) => ({
            ...c,
            [role]: next ? c[role] || defaultVal : 0,
          }));
        }
      }
      return {
        ...prev,
        [dept]: { ...(prev[dept] || {}), [role]: next },
      };
    });
  };

  const setDeptMode = (dept, nextMode) => {
    setMode((m) => ({ ...m, [dept]: nextMode }));

    if (nextMode === "standard") {
      if (dept === "altar") {
        enableAllAltarStd();
      }
      if (dept === "lector") {
        enableAllLectorStd();
      }
      if (dept === "eucharistic") {
        // cap standard by max
        const euchStdDefault = Math.max(
          1,
          Math.min(EUCHARISTIC_DEFAULTS.Minister, eucharisticMax || 0)
        );
        setEucharisticCount(euchStdDefault);
      }
      if (dept === "choir") {
        // cap standard by max (standard choir is 1 but clamp to max)
        const choirStdDefault = Math.max(
          1,
          Math.min(CHOIR_DEFAULTS.Choir, choirMax || CHOIR_DEFAULTS.Choir)
        );
        setChoirCount(choirStdDefault);
      }
    }

    if (nextMode === "custom") {
      if (dept === "altar") {
        setAltarCounts((c) =>
          altarRoles.reduce((acc, r) => {
            acc[r.label] = c[r.label] || 0;
            return acc;
          }, {})
        );
      }
      if (dept === "lector") {
        setLectorCounts((c) =>
          lectorRoles.reduce((acc, r) => {
            acc[r.label] = c[r.label] || 0;
            return acc;
          }, {})
        );
      }
    }
  };

  const onCreate = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await createTemplate({
        templateName,
        massType,
        selectedDepartments,
        mode,
        enabledRoles,
        counts: {
          altar: altarCounts,
          eucharistic: { Minister: eucharisticCount },
          choir: { Choir: choirCount },
          lector: lectorCounts,
        },
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

  // Computed defaults capped
  const euchStdDefault = Math.max(
    1,
    Math.min(EUCHARISTIC_DEFAULTS.Minister, eucharisticMax || 0)
  );
  const choirStdDefault = Math.max(
    1,
    Math.min(CHOIR_DEFAULTS.Choir, choirMax || CHOIR_DEFAULTS.Choir)
  );

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

        {/* Altar */}
        {selectedDepartments.includes("altar") && (
          <div className="department-section mt-3 p-3 enabled">
            <h5 className="section-title">Altar Servers</h5>
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
                  : altarCounts[role.label] ?? 0;
                return (
                  <div
                    key={idx}
                    className="col-md-3 d-flex align-items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      disabled={isStd}
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
                      disabled={isStd || !enabled}
                      value={value}
                      onChange={(e) =>
                        setAltarCounts((c) => ({
                          ...c,
                          [role.label]: Number(e.target.value),
                        }))
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

        {/* Eucharistic */}
        {selectedDepartments.includes("eucharistic") && (
          <div className="department-section mt-3 p-3 enabled">
            <h5 className="section-title">Eucharistic Ministers</h5>
            <div className="d-flex gap-2 mb-3">
              <button
                className={`btn custom-standard-btn ${
                  mode.eucharistic === "standard" ? "enabled" : ""
                }`}
                onClick={() => {
                  setMode((m) => ({ ...m, eucharistic: "standard" }));
                  setEucharisticCount(euchStdDefault);
                }}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.eucharistic === "custom" ? "enabled" : ""
                }`}
                onClick={() =>
                  setMode((m) => ({ ...m, eucharistic: "custom" }))
                }
              >
                Custom
              </button>
            </div>

            <div className="d-flex align-items-center gap-3">
              <label className="form-check-label">Minister’s Count:</label>
              <select
                className="form-select form-select-sm w-auto"
                disabled={mode.eucharistic === "standard"}
                value={
                  mode.eucharistic === "standard"
                    ? euchStdDefault
                    : eucharisticCount
                }
                onChange={(e) => setEucharisticCount(Number(e.target.value))}
              >
                {Array.from(
                  { length: Math.max(eucharisticMax, 1) },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {n}
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
                onClick={() => {
                  setMode((m) => ({ ...m, choir: "standard" }));
                  setChoirCount(choirStdDefault);
                }}
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.choir === "custom" ? "enabled" : ""
                }`}
                onClick={() => setMode((m) => ({ ...m, choir: "custom" }))}
              >
                Custom
              </button>
            </div>

            <div className="d-flex align-items-center gap-3">
              <label className="form-check-label">Choir Group Count:</label>
              <select
                className="form-select form-select-sm w-auto"
                disabled={mode.choir === "standard"}
                value={mode.choir === "standard" ? choirStdDefault : choirCount}
                onChange={(e) => setChoirCount(Number(e.target.value))}
              >
                {Array.from(
                  { length: Math.max(choirMax, 1) },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value={0}>0</option>
              </select>
            </div>
          </div>
        )}

        {/* Lector */}
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
                  : lectorCounts[role.label] ?? 0;
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
                      disabled={isStd || !enabled}
                      value={value}
                      onChange={(e) =>
                        setLectorCounts((c) => ({
                          ...c,
                          [role.label]: Number(e.target.value),
                        }))
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
