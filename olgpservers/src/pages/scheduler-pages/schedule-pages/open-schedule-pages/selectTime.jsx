import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/selectTime.css";

export default function SelectTime() {
  const navigate = useNavigate();
  const [year, setYear] = useState(2025);

  const prevYear = () => setYear(year - 1);
  const nextYear = () => setYear(year + 1);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  function handleNavigate() {
    navigate("/updateStatus");
  }

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
                  title: "Select Time",
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
        <div className="year-selector">
          <button className="year-btn" onClick={prevYear}>
            ◀
          </button>
          <span className="year-text">{year}</span>
          <button className="year-btn" onClick={nextYear}>
            ▶
          </button>
        </div>

        <div className="container mt-3">
          <div className="row g-3">
            {months.map((month, index) => (
              <div key={index} className="col-6 col-md-3">
                <button className="month-card" onClick={handleNavigate}>
                  {month}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
