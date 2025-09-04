import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import images from "../../helper/images";
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
  const buttonCard = createButtonCard(images, navigate);

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
          {isAltarServer &&
            buttonCard({
              department: "Altar Server",
              parish: "Manage the members of the Altar Server Department.",
              toPage: "/membersList",
            })}

          {/* if the user is lector commentator scheduler */}
          {isLectorCommentator &&
            buttonCard({
              department: "Lector Commentator",
              parish:
                "Manage the members of the Lector Commentator Department.",
            })}
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
