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

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectScheduleAltarServer.css";

export default function SelectSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();

  // Initialize with current month/year
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  // Supabase template dates (all months; we'll filter)
  const [templateDates, setTemplateDates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch templates once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await fetchAltarServerTemplateDates();
      if (!cancelled) {
        setTemplateDates(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sundays for visible month
  const sundays = useMemo(() => getSundays(year, month), [year, month]);

  // Templates for visible month
  const visibleTemplates = useMemo(
    () => filterByMonthYear(templateDates, year, month),
    [templateDates, year, month]
  );

  // Merge & sort: [{ id, dateObj, dateStr, source: "sunday"|"template" }, ...]
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

  // Pass ISO + source + explicit isSunday so the next page is unambiguous
  const handleCardClick = (dateObj, source) => {
    const selectedISO = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
    navigate("/selectMassAltarServer", {
      state: {
        selectedDate: formatScheduleDate(dateObj), // display label
        selectedISO, // reliable date
        source, // "sunday" | "template"
        isSunday: source === "sunday",
      },
    });
  };

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE</h3>
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
            <button className="arrow-btn" onClick={handlePrev}>
              ❮
            </button>
            <h5 className="month-title">{formatHeader(year, month)}</h5>
            <button className="arrow-btn" onClick={handleNext}>
              ❯
            </button>
          </div>

          <div className="auto-btn-container">
            <button className="auto-btn">
              <img src={image.automaticIcon} alt="Auto" className="btn-icon" />
              Automatic
            </button>
          </div>
        </div>

        <div className="schedule-grid schedule-content">
          {loading && (
            <div className="schedule-card border-blue" style={{ opacity: 0.6 }}>
              <img
                src={image.emptyScheduleImage}
                alt="Loading"
                className="schedule-icon"
              />
              <p className="schedule-text">Loading schedules…</p>
              <div className="date-divider blue"></div>
              <p className="schedule-date blue">&nbsp;</p>
            </div>
          )}

          {scheduleItems.map((sched) => {
            const key = `${sched.source}-${sched.dateObj.toISOString()}`;
            const isTemplate = sched.source === "template";
            return (
              <div
                key={key}
                className="schedule-card border-blue"
                onClick={() => handleCardClick(sched.dateObj, sched.source)}
                style={{ position: "relative" }}
              >
                {/* 🔖 Restore bookmark mark ONLY for template-sourced items */}
                {isTemplate &&
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
                      🔖
                    </span>
                  ))}

                <img
                  src={image.emptyScheduleImage}
                  alt="Empty"
                  className="schedule-icon"
                />
                <p className="schedule-text">This Schedule is Empty.</p>
                <div className="date-divider blue"></div>
                <p className="schedule-date blue">
                  {formatScheduleDate(sched.dateObj)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="action-buttons">
          <DropDownButton />
          <button className="btn btn-blue">
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
