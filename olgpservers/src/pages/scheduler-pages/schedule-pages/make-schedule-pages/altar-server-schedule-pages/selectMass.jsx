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
  const source = location.state?.source || null;
  const passedIsSunday = location.state?.isSunday;

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
                  title: (
                    <Link
                      to="/selectScheduleAltarServer"
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
        <h4 style={{ marginBottom: "1rem" }}>Selected Date: {selectedDate}</h4>

        <div className="schedule-grid">
          {isSunday ? (
            <>
              {/* 1st Mass - Empty */}
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

              {/* 2nd Mass - Empty (keep complete aside) */}
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
              {/*
              // 🔒 Keep aside for later use:
              <div className="schedule-card border-green">
                <img src={image.completeScheduleImage} alt="Complete" className="schedule-icon" />
                <p className="schedule-text">This Schedule is Complete.</p>
                <div className="date-divider green"></div>
                <p className="schedule-date green">2nd Mass - 8:00 AM</p>
              </div>
              */}

              {/* 3rd Mass - Empty (keep incomplete aside) */}
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
              {/*
              // 🔒 Keep aside for later use:
              <div className="schedule-card border-orange">
                <img src={image.incompleteScheduleImage} alt="Incomplete" className="schedule-icon" />
                <p className="schedule-text">This Schedule is Incomplete.</p>
                <div className="date-divider orange"></div>
                <p className="schedule-date orange">3rd Mass - 5:00 PM</p>
              </div>
              */}
            </>
          ) : (
            // Non-Sunday (template date): single card labeled "Mass"
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
