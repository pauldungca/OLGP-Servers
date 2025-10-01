import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../../helper/icon";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import {
  updateTemplate,
  confirmCancel,
  getTemplateDetails,
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
const CHOIR_DEFAULTS = { Choir: 8 };
const LECTOR_DEFAULTS = { Readings: 2, Preface: 1 };

/** Map DB columns -> UI role labels for Altar */
const altarFromDbToLabel = (row) => ({
  "Candle Bearers": Number(row?.["candle-bearer"] || 0),
  Bellers: Number(row?.beller || 0),
  "Cross Bearer": Number(row?.["cross-bearer"] || 0),
  "Incense Bearer": Number(row?.["incense-bearer"] || 0),
  Thurifer: Number(row?.thurifer || 0),
  "Main Servers": Number(row?.["main-server"] || 0),
  Plates: Number(row?.plate || 0),
});

export default function EditTemplate() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const templateID = state?.templateID || state?.id || null;

  const [eucharisticMax, setEucharisticMax] = useState(10);
  const [choirMax, setChoirMax] = useState(CHOIR_DEFAULTS.Choir);

  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  // Header fields
  const [templateName, setTemplateName] = useState(state?.templateName || "");
  const [massType, setMassType] = useState("High Mass");

  // Departments toggles
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  // Modes
  const [mode, setMode] = useState({
    altar: "standard",
    eucharistic: "standard",
    choir: "standard",
    lector: "standard",
  });

  // Role enablement
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

  const counts = {};

  // Fetch maxima
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

  // Load from DB
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!templateID) return;
      try {
        const { header, altar, eucharistic, choir, lector } =
          await getTemplateDetails(templateID);
        if (cancelled) return;

        if (header) {
          if (!state?.templateName)
            setTemplateName(header["template-name"] || "");
          setMassType(header["mass-type"] || "High Mass");
        }

        const nextSelected = [];
        const nextMode = {
          altar: "standard",
          eucharistic: "standard",
          choir: "standard",
          lector: "standard",
        };
        const nextRoles = { altar: {}, eucharistic: {}, choir: {}, lector: {} };

        // Altar
        if (altar && Number(altar.isNeeded) === 1) {
          nextSelected.push("altar");
          const altarDbCounts = altarFromDbToLabel(altar);
          setAltarCounts(altarDbCounts);
          Object.entries(altarDbCounts).forEach(([label, num]) => {
            if (num > 0) nextRoles.altar[label] = true;
          });
          const allEnabled = Object.keys(ALTAR_DEFAULTS).every(
            (label) => (altarDbCounts[label] || 0) > 0
          );
          const defaultsMatch = Object.entries(ALTAR_DEFAULTS).every(
            ([label, def]) => (altarDbCounts[label] || 0) === def
          );
          nextMode.altar = allEnabled && defaultsMatch ? "standard" : "custom";
        }

        // Eucharistic
        if (eucharistic && Number(eucharistic.isNeeded) === 1) {
          nextSelected.push("eucharistic");
          const minister = Number(eucharistic["minister-count"] || 0);
          setEucharisticCount(minister);
          nextMode.eucharistic =
            minister === EUCHARISTIC_DEFAULTS.Minister ? "standard" : "custom";
        }

        // Choir
        if (choir && Number(choir.isNeeded) === 1) {
          nextSelected.push("choir");
          const choirCnt = Number(choir["group-count"] || 0);
          setChoirCount(choirCnt);
          nextMode.choir = choirCnt === 1 ? "standard" : "custom";
        }

        // Lector
        if (lector && Number(lector.isNeeded) === 1) {
          nextSelected.push("lector");
          const reading = Number(lector.reading || 0);
          const preface = Number(lector.preface || 0);

          setLectorCounts({ Readings: reading, Preface: preface });

          if (reading > 0) nextRoles.lector["Readings"] = true;
          if (preface > 0) nextRoles.lector["Preface"] = true;

          const matchesDefaults =
            reading === LECTOR_DEFAULTS.Readings &&
            preface === LECTOR_DEFAULTS.Preface;

          nextMode.lector = matchesDefaults ? "standard" : "custom";
        }

        setSelectedDepartments(nextSelected);
        setMode(nextMode);
        setEnabledRoles(nextRoles);
      } catch (err) {
        console.error("Failed to load template details:", err?.message || err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [templateID, state?.templateName]);

  const altarRoles = [
    { label: "Candle Bearers", default: ALTAR_DEFAULTS["Candle Bearers"] },
    { label: "Bellers", default: ALTAR_DEFAULTS.Bellers },
    { label: "Cross Bearer", default: ALTAR_DEFAULTS["Cross Bearer"] },
    { label: "Incense Bearer", default: ALTAR_DEFAULTS["Incense Bearer"] },
    { label: "Thurifer", default: ALTAR_DEFAULTS.Thurifer },
    { label: "Main Servers", default: ALTAR_DEFAULTS["Main Servers"] },
    { label: "Plates", default: ALTAR_DEFAULTS.Plates },
  ];

  const departments = [
    { id: "altar", name: "Altar Server" },
    { id: "eucharistic", name: "Eucharistic Minister" },
    { id: "choir", name: "Choir" },
    { id: "lector", name: "Lector Commentator" },
  ];

  const toggleRole = (dept, role) => {
    if (dept === "altar") {
      setEnabledRoles((prev) => {
        const nextEnabled = !prev.altar?.[role];
        const next = { ...prev, altar: { ...prev.altar, [role]: nextEnabled } };
        setAltarCounts((c) => ({
          ...c,
          [role]: nextEnabled ? ALTAR_DEFAULTS[role] : 0,
        }));
        return next;
      });
    } else if (dept === "lector") {
      setEnabledRoles((prev) => {
        const nextEnabled = !prev.lector?.[role];
        const next = {
          ...prev,
          lector: { ...prev.lector, [role]: nextEnabled },
        };
        setLectorCounts((c) => ({
          ...c,
          [role]: nextEnabled ? LECTOR_DEFAULTS[role] : 0,
        }));
        return next;
      });
    } else {
      setEnabledRoles((prev) => ({
        ...prev,
        [dept]: { ...prev[dept], [role]: !prev[dept]?.[role] },
      }));
    }
  };

  const choirStdDefault = Math.max(
    1,
    Math.min(CHOIR_DEFAULTS.Choir, choirMax || CHOIR_DEFAULTS.Choir)
  );
  const euchStdDefault = Math.max(
    1,
    Math.min(EUCHARISTIC_DEFAULTS.Minister, eucharisticMax || 0)
  );

  const handleSave = async () => {
    const ok = await updateTemplate({
      templateID,
      templateName,
      massType,
      selectedDepartments,
      mode,
      enabledRoles,
      counts: {
        ...counts,
        altar: altarCounts,
        eucharistic: { Minister: eucharisticCount, minister: eucharisticCount },
        choir: { Choir: choirCount, choir: choirCount },
        lector: lectorCounts,
      },
    });
    if (ok) navigate("/selectTemplate");
  };

  const toggleDepartment = (id) => {
    setSelectedDepartments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleCancel = async () => {
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

            <div className="d-flex gap-2 mb-3">
              <button
                className={`btn custom-standard-btn ${
                  mode.altar === "standard" ? "enabled" : ""
                }`}
                onClick={() => setMode((m) => ({ ...m, altar: "standard" }))}
                type="button"
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.altar === "custom" ? "enabled" : ""
                }`}
                onClick={() => setMode((m) => ({ ...m, altar: "custom" }))}
                type="button"
              >
                Custom
              </button>
            </div>

            <div className="row g-3">
              {altarRoles.map((role, idx) => {
                const enabled = !!enabledRoles.altar?.[role.label];
                return (
                  <div
                    key={idx}
                    className="col-md-3 d-flex align-items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      disabled={mode.altar === "standard"}
                      checked={enabled}
                      onChange={() => toggleRole("altar", role.label)}
                    />
                    <label className="form-check-label flex-grow-1">
                      {role.label}
                    </label>
                    <select
                      className="form-select form-select-sm w-auto"
                      disabled={
                        mode.altar === "standard" ||
                        mode.altar === "custom" ||
                        !enabled
                      }
                      value={
                        mode.altar === "standard"
                          ? role.default
                          : enabled
                          ? altarCounts[role.label] ?? 0
                          : 0
                      }
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

        {/* Eucharistic Ministers */}
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
                type="button"
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.eucharistic === "custom" ? "enabled" : ""
                }`}
                onClick={() => {
                  setMode((m) => ({ ...m, eucharistic: "custom" }));
                }}
                type="button"
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
                  setChoirCount(1);
                }}
                type="button"
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.choir === "custom" ? "enabled" : ""
                }`}
                onClick={() => {
                  setMode((m) => ({ ...m, choir: "custom" }));
                }}
                type="button"
              >
                Custom
              </button>
            </div>

            <div className="d-flex align-items-center gap-3">
              <label className="form-check-label">Choir Group Count:</label>
              <select
                className="form-select form-select-sm w-auto"
                disabled={mode.choir === "standard"}
                value={mode.choir === "standard" ? 1 : choirCount}
                onChange={(e) => setChoirCount(Number(e.target.value))}
              >
                {Array.from(
                  { length: Math.max(choirMax || choirStdDefault, 1) },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
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
                onClick={() => {
                  setMode((m) => ({ ...m, lector: "standard" }));
                  setEnabledRoles((prev) => ({
                    ...prev,
                    lector: {
                      Readings: true,
                      Preface: true,
                    },
                  }));
                  setLectorCounts({ ...LECTOR_DEFAULTS }); // reset to defaults
                }}
                type="button"
              >
                Standard
              </button>

              <button
                className={`btn custom-standard-btn ${
                  mode.lector === "custom" ? "enabled" : ""
                }`}
                onClick={() => setMode((m) => ({ ...m, lector: "custom" }))}
                type="button"
              >
                Custom
              </button>
            </div>

            <div className="row g-3">
              {[
                { label: "Readings", def: LECTOR_DEFAULTS.Readings },
                { label: "Preface", def: LECTOR_DEFAULTS.Preface },
              ].map((role, idx) => {
                const enabled = !!enabledRoles.lector?.[role.label];
                return (
                  <div
                    key={idx}
                    className="col-md-4 d-flex align-items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      disabled={mode.lector === "standard"}
                      checked={enabled}
                      onChange={() => toggleRole("lector", role.label)}
                    />
                    <label className="form-check-label">{role.label}:</label>
                    <select
                      className="form-select form-select-sm w-auto"
                      disabled={
                        mode.lector === "standard" ||
                        mode.lector === "custom" ||
                        !enabled
                      }
                      value={
                        mode.lector === "standard"
                          ? role.def
                          : enabled
                          ? lectorCounts[role.label] ?? 0
                          : 0
                      }
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
          <button
            type="button"
            className="btn-cancelButton"
            onClick={handleCancel}
          >
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
            className="btn btn-create"
            onClick={handleSave}
            disabled={!templateID}
            title={!templateID ? "Missing template ID" : "Save"}
          >
            <img
              src={image.createButtonImage}
              alt="Save"
              className="me-2"
              width="20"
              height="20"
            />
            Save
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
