import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../helper/icon";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/updateSchedule.css";

export default function UpdateSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | View Schedule";
  }, []);
  const navigate = useNavigate();
  const [hoveredBtn, setHoveredBtn] = useState({
    btn1: false,
    btn2: false,
    btn3: false,
  });

  function navToCancel() {
    navigate("/cancelSchedule");
  }

  // Button text variable
  const notAvailableText = "Cancel Schedule";
  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>VIEW SCHEDULE</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/viewSchedule" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: "View Schedule",
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
        <div className="update-schedule-wrapper">
          <div className="update-schedule-header">
            April 6, 2025 | Sunday Mass
          </div>

          <div className="update-schedule-body">
            {/* Left Column */}
            <div className="schedule-col no-schedule">
              <img src={image.updateStatusImage} alt="No Schedule" />
              <p>You don’t have a schedule here.</p>
            </div>

            {/* Middle Column */}
            <div className="schedule-col assigned-group">
              <div className="assigned-box">
                <p className="assigned-label">Assigned Group:</p>
                <h3 className="group-name">Group 2</h3>
              </div>

              <p className="mass-time">2nd Mass | 8:30 AM</p>

              <div className="action-buttons justify-content-center">
                {<button className="btn export-btn">Export</button>}
                {<button className="btn print-btn">Print</button>}
              </div>

              <button
                className="btn cancel-btn"
                onMouseEnter={() =>
                  setHoveredBtn((prev) => ({ ...prev, btn2: true }))
                }
                onMouseLeave={() =>
                  setHoveredBtn((prev) => ({ ...prev, btn2: false }))
                }
                onClick={navToCancel}
              >
                <img
                  src={
                    hoveredBtn.btn2
                      ? image.noButtonHoverImage
                      : image.noButtonImage
                  }
                  alt="Cancel Schedule"
                  className="cancel-btn-icon"
                />
                {notAvailableText}
              </button>
            </div>

            {/* Right Column */}
            <div className="schedule-col no-schedule">
              <img src={image.updateStatusImage} alt="No Schedule" />
              <p>You don’t have a schedule here.</p>
            </div>
          </div>
        </div>
        <div className="update-schedule-wrapper">
          <div className="update-schedule-header">
            April 6, 2025 | Sunday Mass
          </div>

          <div className="update-schedule-body">
            {/* Left Column */}
            <div className="schedule-col no-schedule">
              <img src={image.updateStatusImage} alt="No Schedule" />
              <p>You don’t have a schedule here.</p>
            </div>

            {/* Middle Column */}
            <div className="schedule-col assigned-group">
              <div className="assigned-box">
                <p className="assigned-label">Assigned Group:</p>
                <h3 className="group-name">Group 2</h3>
              </div>

              <p className="mass-time">2nd Mass | 8:30 AM</p>

              <div className="action-buttons justify-content-center">
                {<button className="btn export-btn">Export</button>}
                {<button className="btn print-btn">Print</button>}
              </div>

              <button
                className="btn cancel-btn"
                onMouseEnter={() =>
                  setHoveredBtn((prev) => ({ ...prev, btn2: true }))
                }
                onMouseLeave={() =>
                  setHoveredBtn((prev) => ({ ...prev, btn2: false }))
                }
                onClick={navToCancel}
              >
                <img
                  src={
                    hoveredBtn.btn2
                      ? image.noButtonHoverImage
                      : image.noButtonImage
                  }
                  alt="Cancel Schedule"
                  className="cancel-btn-icon"
                />
                {notAvailableText}
              </button>
            </div>

            {/* Right Column */}
            <div className="schedule-col no-schedule">
              <img src={image.updateStatusImage} alt="No Schedule" />
              <p>You don’t have a schedule here.</p>
            </div>
          </div>
        </div>
        <div className="update-schedule-wrapper">
          <div className="update-schedule-header">
            April 6, 2025 | Sunday Mass
          </div>

          <div className="update-schedule-body">
            {/* Left Column */}
            <div className="schedule-col no-schedule">
              <img src={image.updateStatusImage} alt="No Schedule" />
              <p>You don’t have a schedule here.</p>
            </div>

            {/* Middle Column */}
            <div className="schedule-col assigned-group">
              <div className="assigned-box">
                <p className="assigned-label">Assigned Group:</p>
                <h3 className="group-name">Group 2</h3>
              </div>

              <p className="mass-time">2nd Mass | 8:30 AM</p>

              <div className="action-buttons justify-content-center">
                {<button className="btn export-btn">Export</button>}
                {<button className="btn print-btn">Print</button>}
              </div>

              <button
                className="btn cancel-btn"
                onMouseEnter={() =>
                  setHoveredBtn((prev) => ({ ...prev, btn2: true }))
                }
                onMouseLeave={() =>
                  setHoveredBtn((prev) => ({ ...prev, btn2: false }))
                }
                onClick={navToCancel}
              >
                <img
                  src={
                    hoveredBtn.btn2
                      ? image.noButtonHoverImage
                      : image.noButtonImage
                  }
                  alt="Cancel Schedule"
                  className="cancel-btn-icon"
                />
                {notAvailableText}
              </button>
            </div>

            {/* Right Column */}
            <div className="schedule-col no-schedule">
              <img src={image.updateStatusImage} alt="No Schedule" />
              <p>You don’t have a schedule here.</p>
            </div>
          </div>
        </div>
        <div className="update-schedule-wrapper">
          <div className="update-schedule-header">
            April 6, 2025 | Sunday Mass
          </div>

          <div className="update-schedule-body">
            {/* Left Column */}
            <div className="schedule-col no-schedule">
              <img src={image.updateStatusImage} alt="No Schedule" />
              <p>You don’t have a schedule here.</p>
            </div>

            {/* Middle Column */}
            <div className="schedule-col assigned-group">
              <div className="assigned-box">
                <p className="assigned-label">Assigned Group:</p>
                <h3 className="group-name">Group 2</h3>
              </div>

              <p className="mass-time">2nd Mass | 8:30 AM</p>

              <div className="action-buttons justify-content-center">
                {<button className="btn export-btn">Export</button>}
                {<button className="btn print-btn">Print</button>}
              </div>

              <button
                className="btn cancel-btn"
                onMouseEnter={() =>
                  setHoveredBtn((prev) => ({ ...prev, btn2: true }))
                }
                onMouseLeave={() =>
                  setHoveredBtn((prev) => ({ ...prev, btn2: false }))
                }
                onClick={navToCancel}
              >
                <img
                  src={
                    hoveredBtn.btn2
                      ? image.noButtonHoverImage
                      : image.noButtonImage
                  }
                  alt="Cancel Schedule"
                  className="cancel-btn-icon"
                />
                {notAvailableText}
              </button>
            </div>

            {/* Right Column */}
            <div className="schedule-col no-schedule">
              <img src={image.updateStatusImage} alt="No Schedule" />
              <p>You don’t have a schedule here.</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
