import React from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";

export default function Createtemplate() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate("/useTemplate");
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
                    <Link to="/selectTemplate" className="breadcrumb-item">
                      Select Template
                    </Link>
                  ),
                },
                {
                  title: "Create Mass Schedule Template",
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
        <button onClick={handleCardClick}>Next Page</button>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
