import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/selectTime.css";

export default function SelectTime() {
  useEffect(() => {
    document.title = "OLGP Servers | Open Schedule";
  }, []);

  const location = useLocation();
  const department = location.state?.department || "Department";

  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());

  const prevYear = () => setYear((y) => y - 1);
  const nextYear = () => setYear((y) => y + 1);

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

  function handleNavigate(monthIndex) {
    navigate("/updateStatus", {
      state: { year, monthIndex, department },
    });
  }

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>OPEN SCHEDULE - {department.toUpperCase()}</h3>
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
                { title: "Select Time", className: "breadcrumb-item-active" },
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
                <button
                  className="month-card"
                  onClick={() => handleNavigate(index)}
                >
                  {month}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
