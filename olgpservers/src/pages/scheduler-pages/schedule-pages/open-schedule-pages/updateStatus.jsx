import React from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../helper/icon";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/updateStatus.css";

export default function UpdateStatus() {
  const question = "Are you available in this mass?";
  const buttonLabel = "Not Available";

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>OPEN SCHEDULE</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/openSchedule" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link to="/selectTime" className="breadcrumb-item">
                      Select Time
                    </Link>
                  ),
                },
                {
                  title: "Update Status",
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
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
            </div>

            {/* Middle Column */}
            <div className="schedule-col no-schedule">
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
            </div>

            {/* Right Column */}
            <div className="schedule-col no-schedule">
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
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
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
            </div>

            {/* Middle Column */}
            <div className="schedule-col no-schedule">
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
            </div>

            {/* Right Column */}
            <div className="schedule-col no-schedule">
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
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
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
            </div>

            {/* Middle Column */}
            <div className="schedule-col no-schedule">
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
            </div>

            {/* Right Column */}
            <div className="schedule-col no-schedule">
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
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
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
            </div>

            {/* Middle Column */}
            <div className="schedule-col no-schedule">
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
            </div>

            {/* Right Column */}
            <div className="schedule-col no-schedule">
              <img
                src={image.updateStatusImage}
                alt="No Schedule"
                className="img-no-schedule"
              />
              <p>{question}</p>
              <button className="btn cancel-btn">{buttonLabel}</button>
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
