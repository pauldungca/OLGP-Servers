import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import images from "../../helper/images";
import { createButtonCard } from "../../assets/scripts/member";
import "../../assets/styles/group.css";

import Footer from "../../components/footer";

export default function Group() {
  useEffect(() => {
    document.title = "OLGP Servers | Groups";
  }, []);
  const navigate = useNavigate();
  const buttonCard = createButtonCard(images, navigate);

  return (
    <div className="group-page-container">
      <div className="group-header">
        <div className="header-text-with-line">
          <h3>GROUP</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="group-content">
        <div className="group-cards-container">
          {buttonCard({
            department: "Eucharistic Minister",
            parish:
              "Manage the groups and members of the Eucharistic Minister Department.",
            toPage: "/selectGroup",
          })}

          {buttonCard({
            department: "Choir",
            parish: "Manage the groups and members of the Choir Department.",
            toPage: "/selectGroup",
          })}
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
