import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import icons from "../../helper/icon";
import { createButtonCard } from "../../assets/scripts/member";
import {
  isEucharisticMinisterScheduler,
  isChoirScheduler,
} from "../../assets/scripts/group";

import "../../assets/styles/group.css";
import Footer from "../../components/footer";

export default function Group() {
  const [isEucharisticMinister, setIsEucharisticMinister] = useState(false);
  const [isChoir, setIsChoir] = useState(false);
  const [, setIdNumber] = useState("");

  const navigate = useNavigate();
  const ButtonCard = createButtonCard(navigate, icons);

  useEffect(() => {
    document.title = "OLGP Servers | Groups";

    const initializeGroupData = async () => {
      const storedIdNumber = localStorage.getItem("idNumber");

      if (storedIdNumber) {
        setIdNumber(storedIdNumber);

        const eucharisticMinisterStatus =
          await isEucharisticMinisterScheduler(storedIdNumber);
        const choirStatus = await isChoirScheduler(storedIdNumber);

        setIsEucharisticMinister(eucharisticMinisterStatus);
        setIsChoir(choirStatus);
      } else {
        setIdNumber("No ID found");
        setIsEucharisticMinister(false);
        setIsChoir(false);
      }
    };

    initializeGroupData();
  }, []);

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
          {/* Show only if the user is Eucharistic Minister scheduler */}
          {isEucharisticMinister && (
            <ButtonCard
              department="Eucharistic Minister"
              parish="Manage the Members in the Eucharistic Minister Department."
              toPage="/selectGroup"
              icon={icons.eucharisticMinisterIcon}
            />
          )}

          {/* Show only if the user is Choir scheduler */}
          {isChoir && (
            <ButtonCard
              department="Choir"
              parish="Manage the Members in the Choir Department."
              toPage="/selectGroup"
              icon={icons.choirIcon}
            />
          )}
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
