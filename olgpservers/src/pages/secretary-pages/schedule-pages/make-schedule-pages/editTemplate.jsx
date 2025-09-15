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
} from "../../../../assets/scripts/template";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/createTemplate.css";

/* ======== MODULE-LEVEL CONSTANTS (stable; no need in deps) ======== */
const ALTAR_DEFAULTS = {
  "Candle Bearers": 2,
  Bellers: 2,
  "Cross Bearer": 1,
  "Incense Bearer": 1,
  Thurifer: 1,
  "Main Servers": 2,
  Plates: 10, // DB column is "plate"; this is for UI/default inference only
};

const EUCHARISTIC_DEFAULTS = { Minister: 6 };
const CHOIR_DEFAULTS = { Choir: 8 };
const LECTOR_DEFAULTS = { Readings: 2, Intercession: 1 };

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

  // Prefer the public templateID; fall back to numeric id
  const templateID = state?.templateID || state?.id || null;

  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  // Header fields
  const [templateName, setTemplateName] = useState(state?.templateName || "");
  const [massType, setMassType] = useState("High Mass");

  // UI state to hydrate
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

  // kept for payload parity; not used for editing numbers in this UI
  const counts = {};

  // On mount/load: fetch existing values and hydrate the UI
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!templateID) return;

      try {
        const { header, altar, eucharistic, choir, lector } =
          await getTemplateDetails(templateID);
        if (cancelled) return;

        // Header
        if (header) {
          if (!state?.templateName)
            setTemplateName(header["template-name"] || "");
          setMassType(header["mass-type"] || "High Mass");
        }

        // Start fresh
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
          const altarCounts = altarFromDbToLabel(altar);

          // enable any role that has a positive count
          Object.entries(altarCounts).forEach(([label, num]) => {
            if (num > 0) nextRoles.altar[label] = true;
          });

          // infer mode: "standard" if counts match defaults for enabled roles and all disabled are zero
          const matchesDefaults = Object.keys(ALTAR_DEFAULTS).every((label) => {
            const num = altarCounts[label] || 0;
            const def = ALTAR_DEFAULTS[label] || 0;
            const enabled = !!nextRoles.altar[label];
            if (enabled) return num === def;
            return num === 0;
          });

          nextMode.altar = matchesDefaults ? "standard" : "custom";
        }

        // Eucharistic
        if (eucharistic && Number(eucharistic.isNeeded) === 1) {
          nextSelected.push("eucharistic");
          const minister = Number(eucharistic.minister || 0);
          if (minister > 0) nextRoles.eucharistic["Minister"] = true;
          nextMode.eucharistic =
            minister === EUCHARISTIC_DEFAULTS.Minister ? "standard" : "custom";
        }

        // Choir
        if (choir && Number(choir.isNeeded) === 1) {
          nextSelected.push("choir");
          const choirCount = Number(choir.choir || 0);
          if (choirCount > 0) nextRoles.choir["Choir"] = true;
          nextMode.choir =
            choirCount === CHOIR_DEFAULTS.Choir ? "standard" : "custom";
        }

        // Lector
        if (lector && Number(lector.isNeeded) === 1) {
          nextSelected.push("lector");
          const reading = Number(lector.reading || 0);
          const intercession = Number(lector.intercession || 0);
          if (reading > 0) nextRoles.lector["Readings"] = true;
          if (intercession > 0) nextRoles.lector["Intercession"] = true;

          const matchesDefaults =
            reading === LECTOR_DEFAULTS.Readings &&
            intercession === LECTOR_DEFAULTS.Intercession;

          nextMode.lector = matchesDefaults ? "standard" : "custom";
        }

        setSelectedDepartments(nextSelected);
        setMode(nextMode);
        setEnabledRoles(nextRoles);
      } catch (err) {
        // Non-fatal: allow manual editing
        console.error("Failed to load template details:", err?.message || err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // deps: templateID only (module-level constants don't need to be listed)
  }, [templateID, state?.templateName]);

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

  const toggleDepartment = (id) => {
    setSelectedDepartments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleRole = (dept, role) => {
    setEnabledRoles((prev) => ({
      ...prev,
      [dept]: {
        ...prev[dept],
        [role]: !prev[dept]?.[role],
      },
    }));
  };

  const handleSave = async () => {
    if (!templateID) {
      alert("Missing template ID. Open this page via Select Template → Edit.");
      return;
    }
    const ok = await updateTemplate({
      templateID,
      templateName,
      massType,
      selectedDepartments,
      mode,
      enabledRoles,
      counts,
    });
    if (ok) navigate("/selectTemplate");
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
                onClick={() =>
                  setMode((m) => ({ ...m, eucharistic: "standard" }))
                }
                type="button"
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
                type="button"
              >
                Custom
              </button>
            </div>

            <div className="d-flex align-items-center gap-3">
              <input
                type="checkbox"
                className="form-check-input"
                disabled={mode.eucharistic === "standard"}
                checked={!!enabledRoles.eucharistic?.["Minister"]}
                onChange={() => toggleRole("eucharistic", "Minister")}
              />
              <label className="form-check-label">Minister’s Count:</label>
              <select
                className="form-select form-select-sm w-auto"
                disabled={
                  mode.eucharistic === "standard" ||
                  !enabledRoles.eucharistic?.["Minister"]
                }
                value={
                  mode.eucharistic === "standard"
                    ? EUCHARISTIC_DEFAULTS.Minister
                    : enabledRoles.eucharistic?.["Minister"]
                    ? EUCHARISTIC_DEFAULTS.Minister
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
                onClick={() => setMode((m) => ({ ...m, choir: "standard" }))}
                type="button"
              >
                Standard
              </button>
              <button
                className={`btn custom-standard-btn ${
                  mode.choir === "custom" ? "enabled" : ""
                }`}
                onClick={() => setMode((m) => ({ ...m, choir: "custom" }))}
                type="button"
              >
                Custom
              </button>
            </div>

            <div className="d-flex align-items-center gap-3">
              <input
                type="checkbox"
                className="form-check-input"
                disabled={mode.choir === "standard"}
                checked={!!enabledRoles.choir?.["Choir"]}
                onChange={() => toggleRole("choir", "Choir")}
              />
              <label className="form-check-label">Choir Group Count:</label>
              <select
                className="form-select form-select-sm w-auto"
                disabled={
                  mode.choir === "standard" || !enabledRoles.choir?.["Choir"]
                }
                value={
                  mode.choir === "standard"
                    ? CHOIR_DEFAULTS.Choir
                    : enabledRoles.choir?.["Choir"]
                    ? CHOIR_DEFAULTS.Choir
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
                onClick={() => setMode((m) => ({ ...m, lector: "standard" }))}
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
                { label: "Intercession", def: LECTOR_DEFAULTS.Intercession },
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
                    <label className="form-check-label flex-grow-1">
                      {role.label}:
                    </label>
                    <select
                      className="form-select form-select-sm w-auto"
                      disabled={mode.lector === "standard" || !enabled}
                      value={
                        mode.lector === "standard"
                          ? role.def
                          : enabled
                          ? role.def
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
