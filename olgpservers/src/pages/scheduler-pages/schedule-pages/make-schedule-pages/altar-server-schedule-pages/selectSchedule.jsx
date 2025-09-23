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
  fetchTemplateDates,
  filterByMonthYear,
  mergeSchedules,
} from "../../../../../assets/scripts/altarServerSchedule";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectScheduleAltarServer.css";

export default function SelectSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();
  const handleCardClick = () => navigate("/selectMassAltarServer");

  // Initialize with current month/year
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth()); // 0 = Jan
  const [year, setYear] = useState(today.getFullYear());

  // Supabase template dates (all, we’ll filter by month/year)
  const [templateDates, setTemplateDates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load template dates once (or you can refetch on demand)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await fetchTemplateDates(); // comes from altarServerSchedule.js
      if (!cancelled) {
        setTemplateDates(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute Sundays for the visible month
  const sundays = useMemo(() => getSundays(year, month), [year, month]);

  // Filter template rows to the visible month/year
  const visibleTemplates = useMemo(
    () => filterByMonthYear(templateDates, year, month),
    [templateDates, year, month]
  );

  // Merge & sort for display
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
          {/* Loading state (optional) */}
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

          {/* Render merged items: Sundays + Template dates (sorted) */}
          {scheduleItems.map((item) => {
            const isTemplate = item.source === "template";
            return (
              <div
                key={`${item.source}-${item.dateStr}-${item.id}`}
                className="schedule-card border-blue"
                onClick={handleCardClick}
                style={{ position: "relative" }}
              >
                {/* Small bookmark for Supabase-derived dates */}
                {isTemplate && (
                  <span
                    title="Template Schedule"
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      fontSize: 18,
                      lineHeight: 1,
                      userSelect: "none",
                    }}
                  >
                    🔖
                  </span>
                )}

                <img
                  src={image.emptyScheduleImage}
                  alt="Empty"
                  className="schedule-icon"
                />
                <p className="schedule-text">This Schedule is Empty.</p>

                <div className="date-divider blue"></div>
                <p className="schedule-date blue">
                  {formatScheduleDate(item.dateObj)}
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
