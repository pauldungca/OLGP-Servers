import React, { useState } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../helper/icon";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/updateSchedule.css";

export default function UpdateSchedule() {
  const [hoveredBtn, setHoveredBtn] = useState({
    btn1: false,
    btn2: false,
    btn3: false,
  });

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
      <div className="schedule-content container">
        <div className="row g-4">
          <div className="col-12">
            <div className="schedule-card">
              <div className="schedule-card-header">
                <strong>April 6, 2025 | Sunday Mass</strong>
              </div>
              <div className="row text-center">
                <div className="col-md-4 col-12 border-end ">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>You don't have a schedule here.</p>
                </div>

                {/* Column 2 - Updated based on clearer image */}
                <div className="col-md-4 col-12 border-end assigned-group-column">
                  <div className="assigned-group-header">
                    <strong>Assigned Group:</strong>
                  </div>
                  <div className="group-name">Group 2</div>
                  <div className="mass-details">2nd Mass | 8:30 AM</div>
                  <div className="action-buttons">
                    <div className="d-flex justify-content-center">
                      <button className="btn export-btn me-3">Export</button>

                      <button className="btn print-btn">Print</button>
                    </div>
                  </div>
                  <div className="cancel-schedule">
                    <button
                      className="btn schedule-btn"
                      onMouseEnter={() =>
                        setHoveredBtn((prev) => ({ ...prev, btn2: true }))
                      }
                      onMouseLeave={() =>
                        setHoveredBtn((prev) => ({ ...prev, btn2: false }))
                      }
                    >
                      <img
                        src={
                          hoveredBtn.btn2
                            ? image.noButtonHoverImage
                            : image.noButtonImage
                        }
                        alt={notAvailableText}
                        className="schedule-btn-icon"
                      />
                      {notAvailableText}
                    </button>
                  </div>
                </div>

                <div className="col-md-4 col-12">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>You don't have a schedule here.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="schedule-card">
              <div className="schedule-card-header">
                <strong>April 6, 2025 | Sunday Mass</strong>
              </div>
              <div className="row text-center">
                <div className="col-md-4 col-12 border-end ">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>You don't have a schedule here.</p>
                </div>

                {/* Column 2 - Updated based on clearer image */}
                <div className="col-md-4 col-12 border-end assigned-group-column">
                  <div className="assigned-group-header">
                    <strong>Assigned Group:</strong>
                  </div>
                  <div className="group-name">Group 2</div>
                  <div className="mass-details">2nd Mass | 8:30 AM</div>
                  <div className="action-buttons">
                    <div className="d-flex justify-content-center">
                      <button className="btn export-btn me-3">Export</button>

                      <button className="btn print-btn">Print</button>
                    </div>
                  </div>
                  <div className="cancel-schedule">
                    <button
                      className="btn schedule-btn"
                      onMouseEnter={() =>
                        setHoveredBtn((prev) => ({ ...prev, btn2: true }))
                      }
                      onMouseLeave={() =>
                        setHoveredBtn((prev) => ({ ...prev, btn2: false }))
                      }
                    >
                      <img
                        src={
                          hoveredBtn.btn2
                            ? image.noButtonHoverImage
                            : image.noButtonImage
                        }
                        alt={notAvailableText}
                        className="schedule-btn-icon"
                      />
                      {notAvailableText}
                    </button>
                  </div>
                </div>

                <div className="col-md-4 col-12">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>You don't have a schedule here.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="schedule-card">
              <div className="schedule-card-header">
                <strong>April 6, 2025 | Sunday Mass</strong>
              </div>
              <div className="row text-center">
                <div className="col-md-4 col-12 border-end ">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>You don't have a schedule here.</p>
                </div>

                {/* Column 2 - Updated based on clearer image */}
                <div className="col-md-4 col-12 border-end assigned-group-column">
                  <div className="assigned-group-header">
                    <strong>Assigned Group:</strong>
                  </div>
                  <div className="group-name">Group 2</div>
                  <div className="mass-details">2nd Mass | 8:30 AM</div>
                  <div className="action-buttons">
                    <div className="d-flex justify-content-center">
                      <button className="btn export-btn me-3">Export</button>

                      <button className="btn print-btn">Print</button>
                    </div>
                  </div>
                  <div className="cancel-schedule">
                    <button
                      className="btn schedule-btn"
                      onMouseEnter={() =>
                        setHoveredBtn((prev) => ({ ...prev, btn2: true }))
                      }
                      onMouseLeave={() =>
                        setHoveredBtn((prev) => ({ ...prev, btn2: false }))
                      }
                    >
                      <img
                        src={
                          hoveredBtn.btn2
                            ? image.noButtonHoverImage
                            : image.noButtonImage
                        }
                        alt={notAvailableText}
                        className="schedule-btn-icon"
                      />
                      {notAvailableText}
                    </button>
                  </div>
                </div>

                <div className="col-md-4 col-12">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>You don't have a schedule here.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="schedule-card">
              <div className="schedule-card-header">
                <strong>April 6, 2025 | Sunday Mass</strong>
              </div>
              <div className="row text-center">
                <div className="col-md-4 col-12 border-end ">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>You don't have a schedule here.</p>
                </div>

                {/* Column 2 - Updated based on clearer image */}
                <div className="col-md-4 col-12 border-end assigned-group-column">
                  <div className="assigned-group-header">
                    <strong>Assigned Group:</strong>
                  </div>
                  <div className="group-name">Group 2</div>
                  <div className="mass-details">2nd Mass | 8:30 AM</div>
                  <div className="action-buttons">
                    <div className="d-flex justify-content-center">
                      <button className="btn export-btn me-3">Export</button>

                      <button className="btn print-btn">Print</button>
                    </div>
                  </div>
                  <div className="cancel-schedule">
                    <button
                      className="btn schedule-btn"
                      onMouseEnter={() =>
                        setHoveredBtn((prev) => ({ ...prev, btn2: true }))
                      }
                      onMouseLeave={() =>
                        setHoveredBtn((prev) => ({ ...prev, btn2: false }))
                      }
                    >
                      <img
                        src={
                          hoveredBtn.btn2
                            ? image.noButtonHoverImage
                            : image.noButtonImage
                        }
                        alt={notAvailableText}
                        className="schedule-btn-icon"
                      />
                      {notAvailableText}
                    </button>
                  </div>
                </div>

                <div className="col-md-4 col-12">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>You don't have a schedule here.</p>
                </div>
              </div>
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
