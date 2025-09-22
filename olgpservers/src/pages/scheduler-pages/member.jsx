import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import icons from "../../helper/icon";

import {
  createButtonCard,
  isAltarServerScheduler,
  isLectorCommentatorScheduler,
} from "../../assets/scripts/member";

import "../../assets/styles/member.css";

import Footer from "../../components/footer";

export default function Member() {
  useEffect(() => {
    document.title = "OLGP Servers | Members";
  }, []);
  const [, setIdNumber] = useState("");
  
  const [isAltarServer, setIsAltarServer] = useState(false);
  const [isLectorCommentator, setIsLectorCommentator] = useState(false);

  const navigate = useNavigate();
  const ButtonCard = createButtonCard(navigate, icons);

  useEffect(() => {
    const initializeMemberData = async () => {
      document.title = "OLGP Servers | Members";
      const storedIdNumber = localStorage.getItem("idNumber");

      if (storedIdNumber) {
        setIdNumber(storedIdNumber);
        const serverStatus = await isAltarServerScheduler(storedIdNumber);
        const lectorStatus = await isLectorCommentatorScheduler(storedIdNumber);
        setIsAltarServer(serverStatus);
        setIsLectorCommentator(lectorStatus);
      } else {
        setIdNumber("No ID found");
        setIsAltarServer(false);
      }
    };

    initializeMemberData();
  }, []);

  return (
    <div className="member-page-container">
      <div className="member-header">
        <div className="header-text-with-line">
          <h3>MEMBERS</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="member-content">
        <div className="member-cards-container">
          {/* if the user is altar server scheduler */}
          {isAltarServer && (
            <ButtonCard
              department="Altar Server"
              parish="Pass the admin controls to a member from the Altar Server Department."
              toPage="/membersList"
              icon={icons.altarServerIcon}
            />
          )}

          {/* if the user is lector commentator scheduler */}
          {isLectorCommentator && (
            <ButtonCard
              department="Lector Commentator"
              parish="Pass the admin controls to a member from the Lector Commentator Department."
              toPage="/membersList"
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
