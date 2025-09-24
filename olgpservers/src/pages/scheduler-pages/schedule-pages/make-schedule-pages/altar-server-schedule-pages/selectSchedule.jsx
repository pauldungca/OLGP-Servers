import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";
import DropDownButton from "../../../../../components/dropDownButton";

import {
  getSundays,
  prevMonth,
  nextMonth,
  formatHeader,
  formatScheduleDate,
  fetchAltarServerTemplateDates,
  filterByMonthYear,
  mergeSchedules,
} from "../../../../../assets/scripts/fetchSchedule";

import {
  fetchAssignmentsGrouped,
  getTemplateFlags,
  roleCountsFor,
  roleVisibilityFor,
} from "../../../../../assets/scripts/assignMember";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectScheduleAltarServer.css";

export default function SelectSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const [templateDates, setTemplateDates] = useState([]);
  const [loading, setLoading] = useState(true);

  // schedule-level statuses
  const [scheduleStatus, setScheduleStatus] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [initialStatusLoadComplete, setInitialStatusLoadComplete] =
    useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchAltarServerTemplateDates();
        if (!cancelled) setTemplateDates(rows);
      } catch (err) {
        console.error("Error fetching template dates:", err);
        if (!cancelled) setTemplateDates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sundays = useMemo(() => getSundays(year, month), [year, month]);
  const visibleTemplates = useMemo(
    () => filterByMonthYear(templateDates, year, month),
    [templateDates, year, month]
  );

  const scheduleItems = useMemo(
    () => mergeSchedules(sundays, visibleTemplates),
    [sundays, visibleTemplates]
  );

  const handlePrev = () => {
    const { year: y, month: m } = prevMonth(year, month);
    setYear(y);
    setMonth(m);
  };

  const handleNext = () => {
    const { year: y, month: m } = nextMonth(year, month);
    setYear(y);
    setMonth(m);
  };

  const handleCardClick = (sched) => {
    const { dateObj, dateStr, source, templateID } = sched;
    const selectedISO =
      source === "template" && dateStr
        ? dateStr
        : dateObj.toISOString().slice(0, 10);

    navigate("/selectMassAltarServer", {
      state: {
        selectedDate: formatScheduleDate(dateObj),
        selectedISO,
        source,
        isSunday: source === "sunday",
        templateID: source === "template" ? templateID : null,
      },
    });
  };

  // --- compute status for each date ---
  const computeStatusForDate = async (
    dateISO,
    isSunday,
    templateID,
    source
  ) => {
    const masses = isSunday
      ? ["1st Mass - 6:00 AM", "2nd Mass - 8:00 AM", "3rd Mass - 5:00 PM"]
      : ["Mass"];

    // get template flags if needed
    let flags = null;
    if (!isSunday && dateISO) {
      flags = await getTemplateFlags(dateISO);
    }
    const counts = roleCountsFor({ flags, isSunday });
    const visible = roleVisibilityFor({ flags, isSunday });

    let allEmpty = true;
    let allComplete = true;
    for (const massLabel of masses) {
      const grouped = await fetchAssignmentsGrouped({
        dateISO,
        massLabel,
      });
      const totalAssigned = Object.values(grouped || {}).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      );
      if (totalAssigned > 0) allEmpty = false;

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
    }

    if (allEmpty) return "empty";
    return allComplete ? "complete" : "incomplete";
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (scheduleItems.length === 0) {
        setInitialStatusLoadComplete(true);
        return;
      }

      setLoadingStatus(true);
      setInitialStatusLoadComplete(false);

      try {
        const next = {};
        for (const sched of scheduleItems) {
          const dateISO =
            sched.source === "template" && sched.dateStr
              ? sched.dateStr
              : sched.dateObj.toISOString().slice(0, 10);
          try {
            next[dateISO] = await computeStatusForDate(
              dateISO,
              sched.source === "sunday",
              sched.templateID,
              sched.source
            );
          } catch {
            next[dateISO] = "empty";
          }
        }
        if (!cancelled) {
          setScheduleStatus(next);
        }
      } catch (error) {
        console.error("Error computing schedule statuses:", error);
        if (!cancelled) {
          setScheduleStatus({});
        }
      } finally {
        if (!cancelled) {
          setLoadingStatus(false);
          setInitialStatusLoadComplete(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduleItems]);

  const viewFor = (status) => {
    if (status === "complete") {
      return {
        border: "border-green",
        text: "Complete schedule",
        textClass: "green",
        dividerClass: "green",
        img: image.completeScheduleImage,
      };
    }
    if (status === "incomplete") {
      return {
        border: "border-orange",
        text: "Incomplete schedule",
        textClass: "orange",
        dividerClass: "orange",
        img: image.incompleteScheduleImage,
      };
    }
    return {
      border: "border-blue",
      text: "This Schedule is Empty.",
      textClass: "blue",
      dividerClass: "blue",
      img: image.emptyScheduleImage,
    };
  };

  // Determine if we should show loading screen
  const isLoading = loading || loadingStatus || !initialStatusLoadComplete;

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
                  title: "Select Schedule",
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
        <div className="month-header">
          <div className="month-nav">
            <button
              className="arrow-btn"
              onClick={handlePrev}
              disabled={isLoading}
            >
              ←
            </button>
            <h5 className="month-title">{formatHeader(year, month)}</h5>
            <button
              className="arrow-btn"
              onClick={handleNext}
              disabled={isLoading}
            >
              →
            </button>
          </div>

          <div className="auto-btn-container">
            <button className="auto-btn" disabled={isLoading}>
              <img src={image.automaticIcon} alt="Auto" className="btn-icon" />
              Automatic
            </button>
          </div>
        </div>

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
              {loading
                ? "Loading schedules..."
                : "Checking schedule statuses..."}
            </p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div className="schedule-grid schedule-content">
            {scheduleItems.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                  color: "#666",
                  fontSize: "16px",
                }}
              >
                <p>No schedules available for {formatHeader(year, month)}</p>
              </div>
            ) : (
              scheduleItems.map((sched) => {
                const dateISO =
                  sched.source === "template" && sched.dateStr
                    ? sched.dateStr
                    : sched.dateObj.toISOString().slice(0, 10);
                const status = scheduleStatus[dateISO] || "empty";
                const v = viewFor(status);
                return (
                  <div
                    key={dateISO}
                    className={`schedule-card status-${status} ${v.border}`}
                    onClick={() => handleCardClick(sched)}
                    style={{ position: "relative" }}
                  >
                    {sched.source === "template" &&
                      (icon.bookmarkIcon ? (
                        <img
                          src={icon.bookmarkIcon}
                          alt="Template"
                          title="Template Schedule"
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 18,
                            height: 18,
                            pointerEvents: "none",
                            userSelect: "none",
                          }}
                        />
                      ) : (
                        <span
                          title="Template Schedule"
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            fontSize: 18,
                            lineHeight: 1,
                            userSelect: "none",
                            pointerEvents: "none",
                          }}
                        >
                          📖
                        </span>
                      ))}
                    <img src={v.img} alt={status} className="schedule-icon" />
                    <p className={`schedule-text ${v.textClass}`}>{v.text}</p>
                    <div className={`date-divider ${v.dividerClass}`}></div>
                    <p className={`schedule-date ${v.textClass}`}>
                      {formatScheduleDate(sched.dateObj)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="action-buttons">
          <DropDownButton />
          <button className="btn btn-blue" disabled={isLoading}>
            <img src={icon.printIcon} alt="Print Icon" className="icon-btn" />
            Print Members List
          </button>
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
