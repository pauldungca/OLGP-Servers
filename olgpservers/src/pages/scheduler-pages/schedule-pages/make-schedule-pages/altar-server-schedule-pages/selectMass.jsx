import React, { useEffect, useMemo } from "react";
import { Breadcrumb } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

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
  const source = location.state?.source || null; // "sunday" | "template"
  const passedIsSunday = location.state?.isSunday;
  const templateID = location.state?.templateID ?? null; // ← read templateID if provided

  const isSunday = useMemo(() => {
    if (typeof passedIsSunday === "boolean") return passedIsSunday;
    if (source === "sunday") return true;
    if (selectedISO) {
      const [y, m, d] = selectedISO.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.getDay() === 0;
    }
    return false;
  }, [passedIsSunday, source, selectedISO]);

  const goNext = (massLabel) => {
    navigate("/selectRoleAltarServer", {
      state: {
        selectedDate,
        selectedISO,
        selectedMass: massLabel,
        source,
        isSunday,
        templateID, // ← pass through
      },
    });
  };

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

        {/* Show Template ID only for template-sourced dates */}
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

        <div className="schedule-grid">
          {isSunday ? (
            <>
              <div
                className="schedule-card border-blue"
                onClick={() => goNext("1st Mass - 6:00 AM")}
              >
                <img
                  src={image.emptyScheduleImage}
                  alt="Empty"
                  className="schedule-icon"
                />
                <p className="schedule-text">This Schedule is Empty.</p>
                <div className="date-divider blue"></div>
                <p className="schedule-date blue">1st Mass - 6:00 AM</p>
              </div>

              <div
                className="schedule-card border-blue"
                onClick={() => goNext("2nd Mass - 8:00 AM")}
              >
                <img
                  src={image.emptyScheduleImage}
                  alt="Empty"
                  className="schedule-icon"
                />
                <p className="schedule-text">This Schedule is Empty.</p>
                <div className="date-divider blue"></div>
                <p className="schedule-date blue">2nd Mass - 8:00 AM</p>
              </div>

              <div
                className="schedule-card border-blue"
                onClick={() => goNext("3rd Mass - 5:00 PM")}
              >
                <img
                  src={image.emptyScheduleImage}
                  alt="Empty"
                  className="schedule-icon"
                />
                <p className="schedule-text">This Schedule is Empty.</p>
                <div className="date-divider blue"></div>
                <p className="schedule-date blue">3rd Mass - 5:00 PM</p>
              </div>
            </>
          ) : (
            <div
              className="schedule-card border-blue"
              onClick={() => goNext("Mass")}
            >
              <img
                src={image.emptyScheduleImage}
                alt="Empty"
                className="schedule-icon"
              />
              <p className="schedule-text">This Schedule is Empty.</p>
              <div className="date-divider blue"></div>
              <p className="schedule-date blue">Mass</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
