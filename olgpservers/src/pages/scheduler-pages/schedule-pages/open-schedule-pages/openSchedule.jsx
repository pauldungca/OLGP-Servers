import React from "react";
import images from "../../../../helper/images";
import { useNavigate } from "react-router-dom";
import { createButtonCard } from "../../../../assets/scripts/member";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";

export default function OpenSchedule() {
  const navigate = useNavigate();
  const buttonCard = createButtonCard(images, navigate);
  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>OPEN SCHEDULE</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="schedule-content">
        <div className="schedule-cards-container">
          {buttonCard({
            department: "Altar Server",
            parish:
              "Manage your availabilities from the schedule in the Altar Server Department.",
            toPage: "/selectTime",
          })}
          {buttonCard({
            department: "Eucharistic Minister",
            parish:
              "Manage your availabilities from the schedule in the Eucharistic Minister Department.",
            toPage: "/selectTime",
          })}
          {buttonCard({
            department: "Choir",
            parish:
              "Manage your availabilities from the schedule in the Choir Department.",
            toPage: "/selectTime",
          })}
          {buttonCard({
            department: "Lector Commentator",
            parish:
              "Manage your availabilities from the schedule in the Lector Commentator Department.",
            toPage: "/selectTime",
          })}
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
