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
  filterByMonthYear,
  mergeSchedules,
  computeLectorCommentatorStatusForDate,
  viewFor,
  getLoadingMessage,
  fetchLectorCommentatorTemplateDates,
} from "../../../../../assets/scripts/fetchSchedule";

import {
  autoAssignLectorCommentatorSchedules,
  isMonthFullyScheduledLectorCommentator,
} from "../../../../../assets/scripts/assignMember";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectScheduleAltarServer.css";

export default function SelectSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule - Lector Commentator";
  }, []);
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const [autoDisabled, setAutoDisabled] = React.useState(false);

  const refreshMonthStatus = React.useCallback(async () => {
    const { isComplete } = await isMonthFullyScheduledLectorCommentator(
      year,
      month
    );
    setAutoDisabled(isComplete);
  }, [year, month]);

  useEffect(() => {
    refreshMonthStatus();
  }, [refreshMonthStatus]);

  const [templateDates, setTemplateDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  const [scheduleStatus, setScheduleStatus] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [initialStatusLoadComplete, setInitialStatusLoadComplete] =
    useState(false);

  // Track if auto-assignment is in progress
  const [autoAssigning, setAutoAssigning] = useState(false);

  // Fetch template dates (includes .time) for Lector Commentator
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchLectorCommentatorTemplateDates();
        if (!cancelled) setTemplateDates(rows || []);
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

  // Month data
  const sundays = useMemo(() => getSundays(year, month), [year, month]);
  const visibleTemplates = useMemo(
    () => filterByMonthYear(templateDates, year, month),
    [templateDates, year, month]
  );

  // One combined item per date from mergeSchedules
  const scheduleItems = useMemo(
    () => mergeSchedules(sundays, visibleTemplates),
    [sundays, visibleTemplates]
  );

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

  const handleCardClick = (item) => {
    navigate("/selectMassLectorCommentator", {
      state: {
        selectedDate: formatScheduleDate(item.dateObj),
        selectedISO: item.dateStr,
        source: "combined",
        isSunday: !!item.hasSunday,
        templateID: item.template?.templateID ?? null,
        time: item.template?.time || null, // pass time only (don't show here)
      },
    });
  };

  // Handle automatic assignment
  const handleAutoAssign = async () => {
    if (autoAssigning) return;

    setAutoAssigning(true);
    try {
      const result = await autoAssignLectorCommentatorSchedules(year, month);

      if (result.success) {
        // Refresh the schedule status after successful auto-assignment
        setInitialStatusLoadComplete(false);
        setScheduleStatus({});

        // Re-fetch statuses to show updated cards
        setTimeout(() => {
          setInitialStatusLoadComplete(true);
        }, 500);
      }
      await refreshMonthStatus();
    } catch (error) {
      console.error("Auto-assignment error:", error);
    } finally {
      setAutoAssigning(false);
    }
  };

  // Compute statuses for each combined date
  useEffect(() => {
    let cancelled = false;

    const fetchStatuses = async () => {
      if (scheduleItems.length === 0) {
        if (!cancelled) {
          setInitialStatusLoadComplete(true);
          setNavigating(false);
        }
        return;
      }

      if (!cancelled) {
        setLoadingStatus(true);
        setInitialStatusLoadComplete(false);
      }

      try {
        const next = {};

        for (const item of scheduleItems) {
          const dateISO = item.dateStr;

          try {
            const status = await computeLectorCommentatorStatusForDate({
              dateISO,
              isSunday: !!item.hasSunday,
              templateID: item.template?.templateID ?? null,
              templateTime: item.template?.time || null, // include template time
            });

            if (!cancelled) {
              next[dateISO] = status;
            }
          } catch {
            if (!cancelled) {
              next[dateISO] = "empty";
            }
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
          setNavigating(false);
        }
      }
    };

    fetchStatuses();

    return () => {
      cancelled = true;
    };
  }, [scheduleItems]);

  const isLoading =
    loading || loadingStatus || !initialStatusLoadComplete || navigating;

  return (
    <div className="schedule-page-container" key={viewKey}>
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE - Lector Commentator</h3>
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
              disabled={isLoading || autoAssigning}
            >
              ←
            </button>
            <h5 className="month-title">{formatHeader(year, month)}</h5>
            <button
              className="arrow-btn"
              onClick={handleNext}
              disabled={isLoading || autoAssigning}
            >
              →
            </button>
          </div>

          <div className="auto-btn-container">
            <button
              className="auto-btn"
              disabled={isLoading || autoAssigning || autoDisabled}
              onClick={handleAutoAssign}
              title="Automatically assign all Sunday masses for this month"
            >
              <img src={image.automaticIcon} alt="Auto" className="btn-icon" />
              {autoAssigning ? "Assigning..." : "Automatic"}
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
              scheduleItems.map((item) => {
                const dateISO = item.dateStr;
                const status = scheduleStatus[dateISO] || "empty";
                const v = viewFor(status, image);
                return (
                  <div
                    key={dateISO}
                    className={`schedule-card status-${status} ${v.border}`}
                    onClick={() => handleCardClick(item)}
                    style={{
                      position: "relative",
                      pointerEvents: autoAssigning ? "none" : "auto",
                      opacity: autoAssigning ? 0.7 : 1,
                    }}
                  >
                    {item.template &&
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
                      {formatScheduleDate(item.dateObj)}
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
