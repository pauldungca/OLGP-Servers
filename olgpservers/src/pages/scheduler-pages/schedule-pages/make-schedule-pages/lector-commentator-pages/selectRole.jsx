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
    navigate("/assignMemberLectorCommentator");
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
                      to="/selectScheduleLectorCommentator"
                      className="breadcrumb-item"
                    >
                      Select Schedule
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectMassLectorCommentator"
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
            <p className="role-card-title">Preface</p>
          </div>
          <div className="role-card">
            <div className="assigned-member">Argie Tapic</div>
            <div className="assigned-member">Argie Tapic</div>
            <div className="role-card-divider"></div>
            <p className="role-card-title">Readings</p>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
