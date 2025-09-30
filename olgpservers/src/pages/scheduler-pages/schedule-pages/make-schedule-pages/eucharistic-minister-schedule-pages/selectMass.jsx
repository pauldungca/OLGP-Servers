import React, { useEffect, useState, useMemo } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";
import ScheduleDropdownButton from "../../../../../components/scheduleDropdownButton";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectScheduleAltarServer.css";

// ===== EM helpers from your shared fetchSchedule.js =====
import {
  fetchEucharisticMinisterTemplateMassesForDate,
  getTemplateFlagsForEucharisticMinister,
  massStatusEucharisticMinister,
  getTemplateMassTypeEM,
} from "../../../../../assets/scripts/fetchSchedule";

import {
  exportEucharisticMinisterSchedulesPDF,
  exportEucharisticMinisterSchedulesPNG,
  printEucharisticMinisterSchedules,
} from "../../../../../assets/scripts/exportSchedule";

export default function SelectMass() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);
  const navigate = useNavigate();

  const location = useLocation();
  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const isSunday = !!location.state?.isSunday;

  // UI/data state
  const [massList, setMassList] = useState([]); // [{label, isSunday, templateID?}]
  const [statusByMass, setStatusByMass] = useState({});
  const [, setCenterByMass] = useState({});

  const [loading, setLoading] = useState(true); // initial load
  const [loadingStatus, setLoadingStatus] = useState(false); // per-mass status compute
  const [initialStatusLoadComplete, setInitialStatusLoadComplete] =
    useState(false);

  // Build mass list for the selected date, then compute statuses
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setInitialStatusLoadComplete(false);
      setStatusByMass({});
      setCenterByMass({});

      try {
        const list = [];

        if (isSunday) {
          list.push({ label: "1st Mass - 6:00 AM", isSunday: true });
          list.push({ label: "2nd Mass - 8:00 AM", isSunday: true });
          list.push({ label: "3rd Mass - 5:00 PM", isSunday: true });
        }

        const tmpl = await fetchEucharisticMinisterTemplateMassesForDate(
          selectedISO
        );

        (tmpl || []).forEach((t) =>
          list.push({
            label: `Mass - ${t.time} (No. ${t.id})`,
            isSunday: false,
            templateID: t.templateID,
          })
        );

        if (!cancelled) setMassList(list);

        // If nothing to show, finish early
        if ((list || []).length === 0) {
          if (!cancelled) {
            setLoading(false);
            setInitialStatusLoadComplete(true);
          }
          return;
        }

        // Compute statuses and center labels in parallel
        setLoadingStatus(true);

        const statusPairs = await Promise.all(
          list.map(async (m) => {
            const flags = m.isSunday
              ? null
              : await getTemplateFlagsForEucharisticMinister(
                  selectedISO,
                  m.templateID
                );
            const st = await massStatusEucharisticMinister({
              dateISO: selectedISO,
              massLabel: m.label,
              flags,
              isSunday: !!m.isSunday,
            });
            return [m.label, st];
          })
        );

        const centerPairs = await Promise.all(
          list.map(async (m) => {
            if (m.isSunday) return [m.label, "Sunday Mass"];
            const mt = await getTemplateMassTypeEM(m.templateID);
            return [m.label, mt || "Template Mass"];
          })
        );

        if (!cancelled) {
          setStatusByMass(Object.fromEntries(statusPairs));
          setCenterByMass(Object.fromEntries(centerPairs));
        }
      } catch (err) {
        console.error("SelectMass (EM) load error:", err);
        if (!cancelled) {
          setMassList([]);
          setStatusByMass({});
          setCenterByMass({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingStatus(false);
          setInitialStatusLoadComplete(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedISO, isSunday]);

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

  const isLoading = loading || loadingStatus || !initialStatusLoadComplete;

  const handleCardClick = (m) => {
    navigate("/assignGroupEucharisticMinister", {
      state: {
        selectedDate,
        selectedISO,
        selectedMassDisplay: m.label,
        isSunday: !!m.isSunday,
        templateID: m.templateID ?? null,
      },
    });
  };

  // ----- NEW: same disabling logic style as Altar Server -----
  // Get the list of labels shown on the page
  const masses = useMemo(() => massList.map((m) => m.label), [massList]);

  // All masses complete only if every label resolves to "complete"
  const allMassesComplete = useMemo(
    () =>
      masses.length > 0 &&
      masses.every((label) => statusByMass[label] === "complete"),
    [masses, statusByMass]
  );
  // -----------------------------------------------------------

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE - EUCHARISTIC MINISTER</h3>
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
                  title: "Select Mass",
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
        <h4 style={{ marginBottom: "0.5rem" }}>
          Selected Date: {selectedDate}
        </h4>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                border: "2px solid #f3f3f3",
                borderTop: "2px solid #2e4a9e",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ marginTop: 8, color: "#666", fontSize: 14 }}>
              Loading masses and statuses…
            </p>
            <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div className="schedule-grid">
            {massList.length === 0 ? (
              <div className="text-sm opacity-70">No masses on this date.</div>
            ) : (
              massList.map((m) => {
                const status = statusByMass[m.label] || "empty";
                const v = viewForCard(status);
                return (
                  <div
                    key={m.label}
                    className={`schedule-card status-${status} ${v.borderClass}`}
                    onClick={() => handleCardClick(m)}
                  >
                    <img src={v.img} alt={status} className="schedule-icon" />
                    <p className={`schedule-text ${v.textClass}`}>{v.copy}</p>
                    <div className={`date-divider ${v.dividerClass}`}></div>
                    <p className={`schedule-date ${v.dateClass}`}>{m.label}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ----- NEW: Disable actions unless allMassesComplete ----- */}
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
            exportEucharisticMinisterSchedulesPDF({
              dateISO: selectedISO,
              isSunday,
            })
          }
          onExportPNG={() =>
            exportEucharisticMinisterSchedulesPNG({
              dateISO: selectedISO,
              isSunday,
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
            printEucharisticMinisterSchedules({
              dateISO: selectedISO,
              isSunday,
            })
          }
        >
          <img src={icon.printIcon} alt="Print Icon" className="icon-btn" />{" "}
          Print Schedules
        </button>
      </div>
      {/* -------------------------------------------------------- */}

      <div>
        <Footer />
      </div>
    </div>
  );
}
