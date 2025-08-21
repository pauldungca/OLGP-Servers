import React from "react";
import images from "../../../../helper/images";
import { useNavigate } from "react-router-dom";
import { createButtonCard } from "../../../../assets/scripts/member";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";

export default function ViewSchedule() {
  const navigate = useNavigate();
  const buttonCard = createButtonCard(images, navigate);
  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>VIEW SCHEDULE</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="schedule-content">
        <div className="schedule-cards-container">
          {buttonCard({
            department: "Altar Server",
            parish: "View your schedule in the Altar Server Department.",
            toPage: "/updateSchedule",
          })}
          {buttonCard({
            department: "Eucharistic Minister",
            parish:
              "View your schedule in the Eucharistic Minister Department.",
            toPage: "/updateSchedule",
          })}
          {buttonCard({
            department: "Choir",
            parish: "View your schedule in the Choir Department.",
            toPage: "/updateSchedule",
          })}
          {buttonCard({
            department: "Lector Commentator",
            parish: "View your schedule in the Lector Commentator Department.",
            toPage: "/updateSchedule",
          })}
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
