import React from "react";
import images from "../../../../helper/images";
import { useNavigate } from "react-router-dom";
import { createButtonCard } from "../../../../assets/scripts/member";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";

export default function MakeSchedule() {
  const navigate = useNavigate();
  const buttonCard = createButtonCard(images, navigate);
  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="schedule-content">
        <div className="schedule-cards-container">
          {buttonCard({
            department: "Altar Server",
            parish: "Manage the schedule in the Altar Server Department.",
            toPage: "/selectScheduleAltarServer",
          })}
          {buttonCard({
            department: "Eucharistic Minister",
            parish:
              "Manage the schedule in the Eucharistic Minister Department.",
            toPage: "/selectScheduleEucharisticMinister",
          })}
          {buttonCard({
            department: "Choir",
            parish: "Manage the schedule in the Choir Department.",
            toPage: "/selectScheduleChoir",
          })}
          {buttonCard({
            department: "Lector Commentator",
            parish: "Manage the schedule in the Lector Commentator Department.",
            toPage: "/selectScheduleLectorCommentator",
          })}
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
