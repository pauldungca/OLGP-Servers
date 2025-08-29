import React from "react";
import { useNavigate } from "react-router";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";

export default function ViewSchedule() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate("/cancelScheduleSecretary");
  };
  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>VIEW SCHEDULE</h3>
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
