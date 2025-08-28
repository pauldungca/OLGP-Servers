import React from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import image from "../../../../../helper/images";
import Footer from "../../../../../components/footer";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectScheduleAltarServer.css";
import DropDownButton from "../../../../../components/dropDownButton";

export default function SelectSchedule() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate("/selectMassLectorCommentator");
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
            <button className="arrow-btn">❮</button>
            <h5 className="month-title">MONTH OF APRIL - 2025</h5>
            <button className="arrow-btn">❯</button>
          </div>

          <div className="auto-btn-container">
            <button className="auto-btn">
              <img src={image.automaticIcon} alt="Auto" className="btn-icon" />
              Automatic
            </button>
          </div>
        </div>
        <div className="schedule-grid schedule-content">
          {/* Empty Schedule */}
          <div className="schedule-card border-blue" onClick={handleCardClick}>
            <img
              src={image.emptyScheduleImage}
              alt="Empty"
              className="schedule-icon"
            />
            <p className="schedule-text">This Schedule is Empty.</p>
            <div className="date-divider blue"></div>
            <p className="schedule-date blue">April 6 - Sunday</p>
          </div>

          <div className="schedule-card border-blue">
            <img
              src={image.emptyScheduleImage}
              alt="Empty"
              className="schedule-icon"
            />
            <p className="schedule-text">This Schedule is Empty.</p>
            <div className="date-divider blue"></div>
            <p className="schedule-date blue">April 9 - Wednesday</p>
          </div>

          <div className="schedule-card border-blue">
            <img
              src={image.emptyScheduleImage}
              alt="Empty"
              className="schedule-icon"
            />
            <p className="schedule-text">This Schedule is Empty.</p>
            <div className="date-divider blue"></div>
            <p className="schedule-date blue">April 10 - Thursday</p>
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
            <p className="schedule-date orange">April 27 - Sunday</p>
          </div>
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
