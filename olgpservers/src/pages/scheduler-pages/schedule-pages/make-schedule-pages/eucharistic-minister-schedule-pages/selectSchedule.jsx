import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import {
  // shared helpers (same ones used in your Choir file)
  getSundays,
  prevMonth,
  nextMonth,
  formatHeader,
  formatScheduleDate,
  filterByMonthYear,
  mergeSchedules,
  viewFor,
  getLoadingMessage,
  // EM-specific
  fetchEucharisticMinisterTemplateDates,
  computeEucharisticMinisterStatusForDate,
} from "../../../../../assets/scripts/fetchSchedule";

import {
  // EM auto-assign + completeness check
  autoAssignEucharisticMinisterSchedules,
  isMonthFullyScheduledEucharisticMinister,
} from "../../../../../assets/scripts/assignMember";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectScheduleAltarServer.css";

export default function SelectSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);
  const navigate = useNavigate();

  // Month state
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  // Data + UI state
  const [templateDates, setTemplateDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  const [scheduleStatus, setScheduleStatus] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [initialStatusLoadComplete, setInitialStatusLoadComplete] =
    useState(false);

  // Auto-assign UI state
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [autoDisabled, setAutoDisabled] = useState(false);

  // 1) Fetch ALL EM template uses once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchEucharisticMinisterTemplateDates();
        if (!cancelled) setTemplateDates(rows || []);
      } catch (err) {
        console.error("Error fetching EM template dates:", err);
        if (!cancelled) setTemplateDates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Build the calendar for the visible month
  const sundays = useMemo(() => getSundays(year, month), [year, month]);
  const visibleTemplates = useMemo(
    () => filterByMonthYear(templateDates, year, month),
    [templateDates, year, month]
  );
  const scheduleItems = useMemo(
    () => mergeSchedules(sundays, visibleTemplates),
    [sundays, visibleTemplates]
  );

  const viewKey = `${year}-${month}`;

  // Month nav
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

  // 3) Compute statuses for each visible date
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
            const status = await computeEucharisticMinisterStatusForDate({
              dateISO,
              isSunday: !!item.hasSunday,
            });
            if (!cancelled) next[dateISO] = status;
          } catch {
            if (!cancelled) next[dateISO] = "empty";
          }
        }

        if (!cancelled) setScheduleStatus(next);
      } catch (error) {
        console.error("Error computing EM schedule statuses:", error);
        if (!cancelled) setScheduleStatus({});
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

  // 4) Recompute “month complete?” for the auto button
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await isMonthFullyScheduledEucharisticMinister(year, month);
        if (!cancelled) setAutoDisabled(ok);
      } catch {
        if (!cancelled) setAutoDisabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const isLoading =
    loading || loadingStatus || !initialStatusLoadComplete || navigating;

  const handleCardClick = (item) => {
    navigate("/selectMassEucharisticMinister", {
      state: {
        selectedDate: formatScheduleDate(item.dateObj),
        selectedISO: item.dateStr,
        isSunday: !!item.hasSunday,
        templateID: item.template?.templateID ?? null,
        templateTime: item.template?.time ?? null,
      },
    });
  };

  // 5) Auto-assign handler (only reset UI on success)
  const handleAutoAssign = async () => {
    if (autoAssigning) return;
    setAutoAssigning(true);
    try {
      const res = await autoAssignEucharisticMinisterSchedules(year, month);
      if (res?.success) {
        setInitialStatusLoadComplete(false);
        setScheduleStatus({});
      }
    } finally {
      setAutoAssigning(false);
    }
  };

  return (
    <div className="schedule-page-container" key={viewKey}>
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
              type="button"
              className="arrow-btn"
              onClick={handlePrev}
              disabled={isLoading || autoAssigning}
              title="Previous month"
            >
              ←
            </button>
            <h5 className="month-title">{formatHeader(year, month)}</h5>
            <button
              type="button"
              className="arrow-btn"
              onClick={handleNext}
              disabled={isLoading || autoAssigning}
              title="Next month"
            >
              →
            </button>
          </div>

          <div className="auto-btn-container">
            <button
              type="button"
              className="auto-btn"
              disabled={isLoading || autoAssigning || autoDisabled}
              onClick={handleAutoAssign}
              title={
                autoDisabled
                  ? "All Sunday EM masses this month already have 6 assigned ministers."
                  : "Automatically assign EM groups (by rotation) and 6 ministers per Sunday mass."
              }
            >
              <img src={image.automaticIcon} alt="Auto" className="btn-icon" />
              {autoAssigning ? "Assigning…" : "Automatic"}
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
              {getLoadingMessage({ loading, navigating, loadingStatus }) ||
                "Loading month schedules..."}
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
                  >
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
      <Footer />
    </div>
  );
}
