import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";
import ScheduleDropdownButton from "../../../../../components/scheduleDropdownButton";

import {
  exportAltarServerSchedulesPDF,
  exportAltarServerSchedulesPNG,
  printAltarServerSchedules,
} from "../../../../../assets/scripts/exportSchedule";

import {
  isSundayFor,
  getTemplateFlags,
  roleCountsFor,
  roleVisibilityFor,
  fetchAssignmentsGrouped,
} from "../../../../../assets/scripts/assignMember";

import {
  getTemplateMassType,
  fetchTemplateMassesForDate,
} from "../../../../../assets/scripts/fetchSchedule";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectScheduleAltarServer.css";

export default function SelectMass() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const source = location.state?.source || null;
  const passedIsSunday = location.state?.isSunday;

  const department = "Altar Server";
  const isSunday = useMemo(
    () => isSundayFor({ passedIsSunday, source, selectedISO }),
    [passedIsSunday, source, selectedISO],
  );

  const [templateUses, setTemplateUses] = useState([]); // [{templateID,time}]
  const [massTypes, setMassTypes] = useState({}); // {templateID: "High Mass"}
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!selectedISO) {
        setTemplateUses([]);
        return;
      }
      setLoadingTemplates(true);
      try {
        const uses = await fetchTemplateMassesForDate(selectedISO); // [{templateID,time}]

        if (!cancel) setTemplateUses(uses || []);

        // fetch each mass-type once
        const uniqueIds = Array.from(
          new Set((uses || []).map((u) => u.templateID)),
        );

        const entries = await Promise.all(
          uniqueIds.map(async (id) => [id, await getTemplateMassType(id)]),
        );
        if (!cancel) {
          const map = {};
          for (const [id, type] of entries) map[id] = type || "Mass";

          setMassTypes(map);
        }
      } finally {
        if (!cancel) setLoadingTemplates(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [selectedISO]);

  const templateCards = useMemo(() => {
    const map = new Map();
    for (const u of templateUses) {
      const type = massTypes[u.templateID] || "Mass";
      // Use the row ID to make it unique
      const uniqueKey = `${type} - ${u.time} (No. ${u.id})`;
      const storage = `Mass - ${u.time} - ${u.id}`;

      map.set(uniqueKey, {
        storageLabel: storage,
        templateID: u.templateID,
        useId: u.id,
        time: u.time,
      });
    }
    return map;
  }, [templateUses, massTypes]);

  const masses = useMemo(() => {
    const sundayMasses = isSunday
      ? ["1st Mass - 6:00 AM", "2nd Mass - 8:00 AM", "3rd Mass - 5:00 PM"]
      : [];
    return [...sundayMasses, ...Array.from(templateCards.keys())];
  }, [isSunday, templateCards]);

  /** Precompute default (Sunday) rules */
  const sundayCounts = useMemo(
    () => roleCountsFor({ flags: null, isSunday: true }),
    [],
  );
  const sundayVisible = useMemo(
    () => roleVisibilityFor({ flags: null, isSunday: true }),
    [],
  );

  /** Cache flags per templateID so we don’t refetch for each card */
  const [tmplFlags, setTmplFlags] = useState({}); // {templateID: flags}

  useEffect(() => {
    let cancel = false;
    (async () => {
      const ids = Array.from(new Set(templateUses.map((u) => u.templateID)));
      const next = {};
      for (const id of ids) {
        try {
          next[id] = await getTemplateFlags(selectedISO, id);
        } catch {
          next[id] = null;
        }
      }
      if (!cancel) setTmplFlags(next);
    })();
    return () => {
      cancel = true;
    };
  }, [selectedISO, templateUses]);

  /** Compute status per mass (displayLabel) */
  const computeStatusForMass = useCallback(
    async (displayLabel) => {
      const tmplMeta = templateCards.get(displayLabel); // undefined for Sunday cards
      const labelToRead = tmplMeta ? tmplMeta.storageLabel : displayLabel;

      const grouped = await fetchAssignmentsGrouped({
        dateISO: selectedISO,
        massLabel: labelToRead,
      });

      // choose rules
      const counts = tmplMeta
        ? roleCountsFor({
            flags: tmplFlags[tmplMeta.templateID],
            isSunday: false,
          })
        : sundayCounts;
      const visible = tmplMeta
        ? roleVisibilityFor({
            flags: tmplFlags[tmplMeta.templateID],
            isSunday: false,
          })
        : sundayVisible;

      const totalAssigned = Object.values(grouped || {}).reduce(
        (s, a) => s + (Array.isArray(a) ? a.length : 0),
        0,
      );
      if (totalAssigned === 0) return "empty";

      let allComplete = true;
      for (const roleKey of Object.keys(visible || {})) {
        if (!visible[roleKey]) continue;
        const need = Number(counts[roleKey] || 0);
        if (need <= 0) continue;
        const have = Array.isArray(grouped?.[roleKey])
          ? grouped[roleKey].length
          : 0;
        if (have < need) allComplete = false;
      }
      return allComplete ? "complete" : "incomplete";
    },
    [selectedISO, templateCards, tmplFlags, sundayCounts, sundayVisible],
  );

  const [massStatus, setMassStatus] = useState({});
  const [loadingMass, setLoadingMass] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!selectedISO) {
        setInitialLoadComplete(true);
        return;
      }
      setLoadingMass(true);
      try {
        const next = {};
        for (const label of masses) {
          try {
            next[label] = await computeStatusForMass(label);
          } catch {
            next[label] = "empty";
          }
        }
        if (!cancel) setMassStatus(next);
      } finally {
        if (!cancel) {
          setLoadingMass(false);
          setInitialLoadComplete(true);
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [selectedISO, masses, computeStatusForMass]);

  const goNext = (displayLabel) => {
    const tmplMeta = templateCards.get(displayLabel); // {storageLabel, templateID, time} | undefined
    navigate("/selectRoleAltarServer", {
      state: {
        selectedDate,
        selectedISO,
        dateISOForDB: selectedISO,
        selectedMass: tmplMeta ? tmplMeta.storageLabel : displayLabel, // DB label
        selectedMassDisplay: displayLabel, // UI label
        source,
        isSunday,
        templateID: tmplMeta ? tmplMeta.templateID : null,
        time: tmplMeta ? tmplMeta.time : null,
        massKind: tmplMeta ? "template" : "sunday",
      },
    });
  };

  const viewForCard = (status) => {
    if (status === "complete")
      return {
        borderClass: "border-green",
        dividerClass: "green",
        textClass: "green",
        dateClass: "green",
        copy: "Complete schedule.",
        img: image.completeScheduleImage,
      };
    if (status === "incomplete")
      return {
        borderClass: "border-orange",
        dividerClass: "orange",
        textClass: "orange",
        dateClass: "orange",
        copy: "Incomplete schedule.",
        img: image.incompleteScheduleImage,
      };
    return {
      borderClass: "border-blue",
      dividerClass: "blue",
      textClass: "blue",
      dateClass: "blue",
      copy: "This Schedule is Empty.",
      img: image.emptyScheduleImage,
    };
  };

  const isLoading = loadingTemplates || loadingMass || !initialLoadComplete;

  const allMassesComplete = useMemo(
    () => masses.every((label) => massStatus[label] === "complete"),
    [masses, massStatus],
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
                { title: "Select Mass", className: "breadcrumb-item-active" },
              ]}
              separator={
                <img
                  src={icon.chevronIcon}
                  alt="Chevron Icon"
                  style={{ width: 15, height: 15 }}
                />
              }
              className="customized-breadcrumb"
            />
          </div>
          <div className="header-line"></div>
        </div>
      </div>

      <div className="schedule-content">
        <h4 style={{ marginBottom: "0.5rem" }}>
          Selected Date: {selectedDate}
        </h4>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #2e4a9e",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
              }}
            />
            <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
            <p style={{ marginTop: "1rem", color: "#666", fontSize: 16 }}>
              {loadingTemplates
                ? "Loading template masses..."
                : "Checking mass schedules..."}
            </p>
          </div>
        ) : (
          <>
            <div className="schedule-grid">
              {masses.map((label) => {
                const status = massStatus[label] || "empty";
                const v = viewForCard(status);
                return (
                  <div
                    key={label}
                    className={`schedule-card status-${status} ${v.borderClass}`}
                    onClick={() => goNext(label)}
                  >
                    <img src={v.img} alt={status} className="schedule-icon" />
                    <p className={`schedule-text ${v.textClass}`}>{v.copy}</p>
                    <div className={`date-divider ${v.dividerClass}`}></div>
                    <p className={`schedule-date ${v.dateClass}`}>{label}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div
        className="action-buttons"
        style={
          !allMassesComplete
            ? { pointerEvents: "none", opacity: 0.6 }
            : undefined
        }
      >
        <ScheduleDropdownButton
          onExportPDF={() =>
            exportAltarServerSchedulesPDF({
              dateISO: selectedISO,
              isSunday,
              department,
            })
          }
          onExportPNG={() =>
            exportAltarServerSchedulesPNG({
              dateISO: selectedISO,
              isSunday,
              department,
            })
          }
        />
        <button
          className="btn btn-blue flex items-center gap-2"
          style={
            !allMassesComplete
              ? { pointerEvents: "none", opacity: 0.9 }
              : undefined
          }
          onClick={() =>
            printAltarServerSchedules({
              dateISO: selectedISO,
              isSunday,
              department,
            })
          }
        >
          <img src={icon.printIcon} alt="Print Icon" className="icon-btn" />{" "}
          Print Schedules
        </button>
      </div>

      <Footer />
    </div>
  );
}
