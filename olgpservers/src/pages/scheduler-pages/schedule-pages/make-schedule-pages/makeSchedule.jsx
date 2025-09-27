import React, { useEffect, useState } from "react";
import icons from "../../../../helper/icon";
import { useNavigate } from "react-router-dom";
import { createButtonCard } from "../../../../assets/scripts/member";
import Footer from "../../../../components/footer";

import {
  isEucharisticMinisterScheduler,
  isChoirScheduler,
} from "../../../../assets/scripts/group";

import {
  isAltarServerScheduler,
  isLectorCommentatorScheduler,
} from "../../../../assets/scripts/member";

import "../../../../assets/styles/schedule.css";

export default function MakeSchedule() {
  const navigate = useNavigate();
  const ButtonCard = createButtonCard(navigate, icons);

  const [isEucharisticMinister, setIsEucharisticMinister] = useState(false);
  const [isChoir, setIsChoir] = useState(false);
  const [isAltarServer, setIsAltarServer] = useState(false);
  const [isLectorCommentator, setIsLectorCommentator] = useState(false);

  const [, setIdNumber] = useState("");

  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";

    const initializeGroupData = async () => {
      const storedIdNumber = localStorage.getItem("idNumber");

      if (storedIdNumber) {
        setIdNumber(storedIdNumber);

        const eucharisticMinisterStatus = await isEucharisticMinisterScheduler(
          storedIdNumber
        );
        const choirStatus = await isChoirScheduler(storedIdNumber);
        const serverStatus = await isAltarServerScheduler(storedIdNumber);
        const lectorStatus = await isLectorCommentatorScheduler(storedIdNumber);

        setIsEucharisticMinister(eucharisticMinisterStatus);
        setIsChoir(choirStatus);
        setIsAltarServer(serverStatus);
        setIsLectorCommentator(lectorStatus);
      } else {
        setIdNumber("No ID found");
        setIsEucharisticMinister(false);
        setIsChoir(false);
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
          <h3>MAKE SCHEDULE</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="schedule-content">
        <div className="schedule-cards-container">
          {isAltarServer && (
            <ButtonCard
              department="Altar Server"
              parish="Manage the schedules in the Altar Server Department."
              toPage="/selectScheduleAltarServer"
              icon={icons.altarServerIcon}
            />
          )}

          {isEucharisticMinister && (
            <ButtonCard
              department="Eucharistic Minister"
              parish="Manage the schedules in the Eucharistic Minister Department."
              toPage="/selectScheduleEucharisticMinister"
              icon={icons.eucharisticMinisterIcon}
            />
          )}

          {isChoir && (
            <ButtonCard
              department="Choir"
              parish="Manage the schedules in the Choir Department."
              toPage="/selectScheduleChoir"
              icon={icons.choirIcon}
            />
          )}

          {isLectorCommentator && (
            <ButtonCard
              department="Lector Commentator"
              parish="Manage the schedules in the Lector Commentator Department."
              toPage="/selectScheduleLectorCommentator"
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
