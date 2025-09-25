import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import {
  getSundays,
  prevMonth,
  nextMonth,
  formatHeader,
  formatScheduleDate,
  fetchAltarServerTemplateDates,
  filterByMonthYear,
  mergeSchedules,
  computeStatusForDate,
  viewFor,
  getLoadingMessage,
} from "../../../../../assets/scripts/fetchSchedule";

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

  // show loader when navigating months
  const [navigating, setNavigating] = useState(false);

  // schedule-level statuses
  const [scheduleStatus, setScheduleStatus] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [initialStatusLoadComplete, setInitialStatusLoadComplete] =
    useState(false);

  // fetch template dates (once)
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

  // recompute visible items for the current month
  const sundays = useMemo(() => getSundays(year, month), [year, month]);
  const visibleTemplates = useMemo(
    () => filterByMonthYear(templateDates, year, month),
    [templateDates, year, month]
  );
  const scheduleItems = useMemo(
    () => mergeSchedules(sundays, visibleTemplates),
    [sundays, visibleTemplates]
  );

  // ensure the grid fully remounts when month/year changes (prevents flash of previous month)
  const viewKey = `${year}-${month}`;

  const handlePrev = () => {
    const { year: y, month: m } = prevMonth(year, month);
    setNavigating(true);
    setYear(y);
    setMonth(m);
    setInitialStatusLoadComplete(false);
    setScheduleStatus({});
    window.scrollTo(0, 0);
  };

  const handleNext = () => {
    const { year: y, month: m } = nextMonth(year, month);
    setNavigating(true);
    setYear(y);
    setMonth(m);
    setInitialStatusLoadComplete(false);
    setScheduleStatus({});
    window.scrollTo(0, 0);
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

  // recalc statuses whenever the visible items change; end navigation when done
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (scheduleItems.length === 0) {
        setInitialStatusLoadComplete(true);
        setNavigating(false);
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
            next[dateISO] = await computeStatusForDate({
              dateISO,
              isSunday: sched.source === "sunday",
              templateID: sched.templateID,
            });
          } catch {
            next[dateISO] = "empty";
          }
        }
        if (!cancelled) setScheduleStatus(next);
      } catch (error) {
        console.error("Error computing schedule statuses:", error);
        if (!cancelled) setScheduleStatus({});
      } finally {
        if (!cancelled) {
          setLoadingStatus(false);
          setInitialStatusLoadComplete(true);
          setNavigating(false); // turn off month loader when done
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduleItems]);

  // Show loading if initial loading, status loading, or navigating between months
  const isLoading =
    loading || loadingStatus || !initialStatusLoadComplete || navigating;

  return (
    <div className="schedule-page-container" key={viewKey}>
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
              {getLoadingMessage({ loading, navigating, loadingStatus })}
            </p>
            <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
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
                  minHeight: 200,
                  color: "#666",
                  fontSize: 16,
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
                const v = viewFor(status, image);
                return (
                  <div
                    key={`${dateISO}-${sched.source}`}
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
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
