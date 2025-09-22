import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import icons from "../../helper/images";
import Footer from "../../components/footer";

import { createButtonCard } from "../../assets/scripts/member";

import "../../assets/styles/departmentSettings.css";

export default function DepartmentSettings() {
  useEffect(() => {
    document.title = "OLGP Servers | Department Settings";
  }, []);

  const navigate = useNavigate();
  const ButtonCard = createButtonCard(navigate, icons);

  return (
    <div className="department-settings-page-container">
      <div className="department-settings-header">
        <div className="header-text-with-line">
          <h3>DEPARTMENT SETTINGS</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="department-settings-content">
        <div className="department-settings-cards-container">
          <ButtonCard
            department="Altar Server"
            parish="Pass the admin controls to a member from the Altar Server Department."
            toPage="/selectMember"
            icon={icons.altarServerIcon}
          />
          <ButtonCard
            department="Eucharistic Minister"
            parish="Pass the admin controls to a member from the Eucharistic Minister Department."
            toPage="/selectMember"
            icon={icons.eucharisticMinisterIcon}
          />
          <ButtonCard
            department="Choir"
            parish="Pass the admin controls to a member from the Choir Department."
            toPage="/selectMember"
            icon={icons.choirIcon}
          />
          <ButtonCard
            department="Lector Commentator"
            parish="Pass the admin controls to a member from the Lector Commentator Department."
            toPage="/selectMember"
            icon={icons.lectorCommentatorIcon}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
