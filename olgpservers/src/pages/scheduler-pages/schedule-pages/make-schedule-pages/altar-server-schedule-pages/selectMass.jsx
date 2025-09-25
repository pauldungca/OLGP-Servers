// /assets/pages/schedule/altarServer/selectMass.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";
import DropDownButton from "../../../../../components/dropDownButton";

import {
  exportAltarServerSchedulesPDF,
  exportAltarServerSchedulesPNG,
  printAltarServerSchedules,
} from "../../../../../assets/scripts/exportSchedule";

import {
  isSundayFor,
  needTemplateFlagsFor,
  getTemplateFlags,
  roleCountsFor,
  roleVisibilityFor,
  fetchAssignmentsGrouped,
} from "../../../../../assets/scripts/assignMember";

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
  const templateID = location.state?.templateID ?? null;

  const department = "Altar Server";

  // Sunday detection
  const isSunday = useMemo(
    () => isSundayFor({ passedIsSunday, source, selectedISO }),
    [passedIsSunday, source, selectedISO]
  );

  // Need template flags only for non-Sunday
  const needFlags = useMemo(
    () => needTemplateFlagsFor({ isSunday, selectedISO }),
    [isSunday, selectedISO]
  );

  const [flags, setFlags] = useState(null);
  const [loadingFlags, setLoadingFlags] = useState(false);

  // mass -> "empty" | "incomplete" | "complete"
  const [massStatus, setMassStatus] = useState({});
  const [loadingMass, setLoadingMass] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!needFlags) {
        setFlags(null);
        return;
      }
      setLoadingFlags(true);
      try {
        const res = await getTemplateFlags(selectedISO);
        if (!cancelled) {
          setFlags(res);
        }
      } catch (error) {
        console.error("Error fetching template flags:", error);
        if (!cancelled) {
          setFlags(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingFlags(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needFlags, selectedISO]);

  const counts = useMemo(
    () => roleCountsFor({ flags, isSunday }),
    [flags, isSunday]
  );
  const visible = useMemo(
    () => roleVisibilityFor({ flags, isSunday }),
    [flags, isSunday]
  );

  // Which masses to show
  const masses = useMemo(
    () =>
      isSunday
        ? ["1st Mass - 6:00 AM", "2nd Mass - 8:00 AM", "3rd Mass - 5:00 PM"]
        : ["Mass"],
    [isSunday]
  );

  // Compute a status for one mass
  const computeStatusForMass = async (massLabel) => {
    const grouped = await fetchAssignmentsGrouped({
      dateISO: selectedISO,
      massLabel,
    });

    const totalAssigned = Object.values(grouped || {}).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );
    if (totalAssigned === 0) return "empty";

    let allComplete = true;
    for (const roleKey of Object.keys(visible || {})) {
      if (!visible[roleKey]) continue;
      const need = Number(counts[roleKey] || 0);
      if (need <= 0) continue;
      const have = Array.isArray(grouped[roleKey])
        ? grouped[roleKey].length
        : 0;
      if (have < need) {
        allComplete = false;
      }
    }
    return allComplete ? "complete" : "incomplete";
  };

  // Load statuses
  useEffect(() => {
    let cancelled = false;
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
        if (!cancelled) {
          setMassStatus(next);
        }
      } catch (error) {
        console.error("Error computing mass statuses:", error);
        if (!cancelled) {
          setMassStatus({});
        }
      } finally {
        if (!cancelled) {
          setLoadingMass(false);
          setInitialLoadComplete(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedISO, isSunday, JSON.stringify(counts), JSON.stringify(visible)]);

  const goNext = (massLabel) => {
    navigate("/selectRoleAltarServer", {
      state: {
        selectedDate,
        selectedISO,
        selectedMass: massLabel,
        source,
        isSunday,
        templateID,
      },
    });
  };

  // Map a status to classes + copy + image
  const viewFor = (status) => {
    if (status === "complete") {
      return {
        borderClass: "border-green",
        dividerClass: "green",
        textClass: "green",
        dateClass: "green",
        copy: "Complete schedule.",
        img: image.completeScheduleImage,
      };
    }
    if (status === "incomplete") {
      return {
        borderClass: "border-orange",
        dividerClass: "orange",
        textClass: "orange",
        dateClass: "orange",
        copy: "Incomplete schedule.",
        img: image.incompleteScheduleImage,
      };
    }
    // empty
    return {
      borderClass: "border-blue",
      dividerClass: "blue",
      textClass: "blue",
      dateClass: "blue",
      copy: "This Schedule is Empty.",
      img: image.emptyScheduleImage,
    };
  };

  // Determine if we should show loading screen
  const isLoading =
    (needFlags && loadingFlags) || loadingMass || !initialLoadComplete;

  const allMassesComplete = useMemo(
    () => masses.every((label) => massStatus[label] === "complete"),
    [masses, massStatus]
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

        {source === "template" && templateID && (
          <div
            style={{
              display: "inline-block",
              padding: "6px 10px",
              border: "1px solid #2e4a9e",
              borderRadius: 8,
              fontSize: 14,
              color: "#2e4a9e",
              marginBottom: "1rem",
            }}
          >
            Template ID: <strong>{templateID}</strong>
          </div>
        )}

        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
              padding: "2rem",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #2e4a9e",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <p
              style={{
                marginTop: "1rem",
                color: "#666",
                fontSize: "16px",
              }}
            >
              {loadingFlags
                ? "Loading template..."
                : "Checking mass schedules..."}
            </p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div className="schedule-grid">
            {masses.map((label) => {
              const status = massStatus[label] || "empty";
              const v = viewFor(status);
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
        )}

        {!isLoading && (
          <div
            className="action-buttons"
            style={
              !allMassesComplete
                ? { pointerEvents: "none", opacity: 0.6 }
                : undefined
            }
          >
            <DropDownButton
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
              <img src={icon.printIcon} alt="Print Icon" className="icon-btn" />
              Print Schedules
            </button>
          </div>
        )}
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
