import React, { useEffect, useState } from "react"; // "/selectTime"
import icons from "../../../../helper/icon";
import { useNavigate } from "react-router-dom";
import { createButtonCard } from "../../../../assets/scripts/member";
import Footer from "../../../../components/footer";

import {
  isAltarServerMember,
  isEucharisticMinisterMember,
  isLectorCommentatorMember,
} from "../../../../assets/scripts/viewScheduleNormal";

import "../../../../assets/styles/schedule.css";

export default function OpenSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | Open Schedule";
  }, []);

  const navigate = useNavigate();
  const ButtonCard = createButtonCard(navigate, icons);

  const [isEucharisticMinister, setIsEucharisticMinister] = useState(false);
  const [isAltarServer, setIsAltarServer] = useState(false);
  const [isLectorCommentator, setIsLectorCommentator] = useState(false);

  const [, setIdNumber] = useState("");

  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";

    const initializeGroupData = async () => {
      const storedIdNumber = localStorage.getItem("idNumber");

      if (storedIdNumber) {
        setIdNumber(storedIdNumber);

        const eucharisticMinisterStatus = await isEucharisticMinisterMember(
          storedIdNumber
        );
        const serverStatus = await isAltarServerMember(storedIdNumber);
        const lectorStatus = await isLectorCommentatorMember(storedIdNumber);

        setIsEucharisticMinister(eucharisticMinisterStatus);
        setIsAltarServer(serverStatus);
        setIsLectorCommentator(lectorStatus);
      } else {
        setIdNumber("No ID found");
        setIsEucharisticMinister(false);
        setIsAltarServer(false);
        setIsLectorCommentator(false);
      }
    };

    initializeGroupData();
  }, []);

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
          {isAltarServer && (
            <ButtonCard
              department="Altar Server"
              parish="Manage the schedules in the Altar Server Department."
              toPage={{
                pathname: "/selectTime",
                state: { department: "Altar Server" },
              }}
              icon={icons.altarServerIcon}
            />
          )}

          {isEucharisticMinister && (
            <ButtonCard
              department="Eucharistic Minister"
              parish="Manage the schedules in the Eucharistic Minister Department."
              toPage={{
                pathname: "/selectTime",
                state: { department: "Altar Server" },
              }}
              icon={icons.eucharisticMinisterIcon}
            />
          )}

          {isLectorCommentator && (
            <ButtonCard
              department="Lector Commentator"
              parish="Manage the schedules in the Lector Commentator Department."
              toPage={{
                pathname: "/selectTime",
                state: { department: "Altar Server" },
              }}
              icon={icons.lectorCommentatorIcon}
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
