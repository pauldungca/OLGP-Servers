import React, { useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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

  const handleCardClick = () => {
    navigate("/assignGroupEucharisticMinister");
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
        <div className="schedule-grid">
          {/* Empty Schedule */}
          <div className="schedule-card border-blue" onClick={handleCardClick}>
            <img
              src={image.emptyScheduleImage}
              alt="Empty"
              className="schedule-icon"
            />
            <p className="schedule-text">This Schedule is Empty.</p>
            <div className="date-divider blue"></div>
            <p className="schedule-date blue">1st Mass - 6:00 AM</p>
          </div>

          <div className="schedule-card border-blue">
            <img
              src={image.emptyScheduleImage}
              alt="Empty"
              className="schedule-icon"
            />
            <p className="schedule-text">This Schedule is Empty.</p>
            <div className="date-divider blue"></div>
            <p className="schedule-date blue">2nd Mass - 8:00 AM</p>
          </div>

          {/* Incomplete Schedule */}
          <div className="schedule-card border-orange">
            <img
              src={image.incompleteScheduleImage}
              alt="Incomplete"
              className="schedule-icon"
            />
            <p className="schedule-text">This Schedule is Incomplete.</p>
            <div className="date-divider orange"></div>
            <p className="schedule-date orange">3rd Mass - 5:00 PM</p>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
