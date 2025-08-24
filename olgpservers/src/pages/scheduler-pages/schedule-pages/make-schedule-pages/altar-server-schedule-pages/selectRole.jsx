import React from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import Footer from "../../../../../components/footer";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectRole.css";

export default function SelectRole() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate("/assignMemberAltarServer");
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
                  title: (
                    <Link
                      to="/selectMassAltarServer"
                      className="breadcrumb-item"
                    >
                      Select Mass
                    </Link>
                  ),
                },
                {
                  title: "Select Role",
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
        <div className="role-cards-grid">
          <div className="role-card" onClick={handleCardClick}>
            <div className="role-card-divider"></div>
            <p className="role-card-title">Thurifer</p>
          </div>
          <div className="role-card">
            <div className="role-card-divider"></div>
            <p className="role-card-title">Bellers</p>
          </div>
          <div className="role-card">
            <div className="role-card-divider"></div>
            <p className="role-card-title">Book and Mic</p>
          </div>
          <div className="role-card">
            <div className="role-card-divider"></div>
            <p className="role-card-title">Candle Bearers</p>
          </div>
          <div className="role-card">
            <div className="role-card-divider"></div>
            <p className="role-card-title">Incense Bearer</p>
          </div>
          <div className="role-card">
            <div className="role-card-divider"></div>
            <p className="role-card-title">Cross Bearer</p>
          </div>
        </div>

        {/* Big card at the bottom */}
        <div className="role-card big-role-card">
          <div className="role-card-divider"></div>
          <p className="role-card-title">Plates</p>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
