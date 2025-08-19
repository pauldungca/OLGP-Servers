import React, { useState } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../helper/icon";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/updateStatus.css";

export default function UpdateStatus() {
  // separate hover states for 12 buttons (4 cards × 3 buttons)
  const [hoveredBtn, setHoveredBtn] = useState({
    btn1: false,
    btn2: false,
    btn3: false,
    btn4: false,
    btn5: false,
    btn6: false,
    btn7: false,
    btn8: false,
    btn9: false,
    btn10: false,
    btn11: false,
    btn12: false,
  });

  // Button text variable
  const notAvailableText = "Not Available";

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

      <div className="schedule-content container">
        <div className="row g-4">
          {/* CARD 1 */}
          <div className="col-12">
            <div className="schedule-card">
              <div className="schedule-card-header">
                <strong>April 6, 2025 | Sunday Mass</strong>
              </div>
              <div className="row text-center">
                {/* Button 1 */}
                <div className="col-md-4 col-12 border-end">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn1: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn1: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn1
                          ? image.noButtonHoverImage
                          : image.noButtonImage
                      }
                      alt={notAvailableText}
                      className="schedule-btn-icon"
                    />
                    {notAvailableText}
                  </button>
                </div>

                {/* Button 2 */}
                <div className="col-md-4 col-12 border-end">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
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

                {/* Button 3 */}
                <div className="col-md-4 col-12">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn3: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn3: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn3
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
            </div>
          </div>

          {/* CARD 2 */}
          <div className="col-12">
            <div className="schedule-card">
              <div className="schedule-card-header">
                <strong>April 13, 2025 | Sunday Mass</strong>
              </div>
              <div className="row text-center">
                {/* Button 4 */}
                <div className="col-md-4 col-12 border-end">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn4: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn4: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn4
                          ? image.noButtonHoverImage
                          : image.noButtonImage
                      }
                      alt={notAvailableText}
                      className="schedule-btn-icon"
                    />
                    {notAvailableText}
                  </button>
                </div>

                {/* Button 5 */}
                <div className="col-md-4 col-12 border-end">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn5: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn5: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn5
                          ? image.noButtonHoverImage
                          : image.noButtonImage
                      }
                      alt={notAvailableText}
                      className="schedule-btn-icon"
                    />
                    {notAvailableText}
                  </button>
                </div>

                {/* Button 6 */}
                <div className="col-md-4 col-12">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn6: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn6: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn6
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
            </div>
          </div>

          {/* CARD 3 */}
          <div className="col-12">
            <div className="schedule-card">
              <div className="schedule-card-header">
                <strong>April 20, 2025 | Sunday Mass</strong>
              </div>
              <div className="row text-center">
                {/* Button 7 */}
                <div className="col-md-4 col-12 border-end">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn7: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn7: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn7
                          ? image.noButtonHoverImage
                          : image.noButtonImage
                      }
                      alt={notAvailableText}
                      className="schedule-btn-icon"
                    />
                    {notAvailableText}
                  </button>
                </div>

                {/* Button 8 */}
                <div className="col-md-4 col-12 border-end">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn8: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn8: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn8
                          ? image.noButtonHoverImage
                          : image.noButtonImage
                      }
                      alt={notAvailableText}
                      className="schedule-btn-icon"
                    />
                    {notAvailableText}
                  </button>
                </div>

                {/* Button 9 */}
                <div className="col-md-4 col-12">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn9: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn9: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn9
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
            </div>
          </div>

          {/* CARD 4 */}
          <div className="col-12">
            <div className="schedule-card">
              <div className="schedule-card-header">
                <strong>April 27, 2025 | Sunday Mass</strong>
              </div>
              <div className="row text-center">
                {/* Button 10 */}
                <div className="col-md-4 col-12 border-end">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn10: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn10: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn10
                          ? image.noButtonHoverImage
                          : image.noButtonImage
                      }
                      alt={notAvailableText}
                      className="schedule-btn-icon"
                    />
                    {notAvailableText}
                  </button>
                </div>

                {/* Button 11 */}
                <div className="col-md-4 col-12 border-end">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn11: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn11: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn11
                          ? image.noButtonHoverImage
                          : image.noButtonImage
                      }
                      alt={notAvailableText}
                      className="schedule-btn-icon"
                    />
                    {notAvailableText}
                  </button>
                </div>

                {/* Button 12 */}
                <div className="col-md-4 col-12">
                  <img
                    src={image.updateStatusImage}
                    alt="Calendar"
                    className="schedule-icon"
                  />
                  <p>Are you available in this mass?</p>
                  <button
                    className="btn schedule-btn"
                    onMouseEnter={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn12: true }))
                    }
                    onMouseLeave={() =>
                      setHoveredBtn((prev) => ({ ...prev, btn12: false }))
                    }
                  >
                    <img
                      src={
                        hoveredBtn.btn12
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
