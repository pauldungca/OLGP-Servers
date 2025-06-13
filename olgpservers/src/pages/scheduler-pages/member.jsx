import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import images from "../../helper/images";
import {
  createButtonCard,
  isAltarServerScheduler,
  isLectorCommentatorScheduler,
} from "../../assets/scripts/member";
import Footer from "../../components/footer";
import "../../assets/styles/member.css";
import "../../assets/styles/header.css";

export default function Member() {
  const [idNumber, setIdNumber] = useState("");
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
              parish: "Our Lady of Guadalupe",
              idNumber: idNumber,
              toPage: "/membersList",
            })}

          {/* if the user is lector commentator scheduler */}
          {isLectorCommentator &&
            buttonCard({
              department: "Lector Commentator",
              parish: "Our Lady of Guadalupe Parish",
              idNumber: idNumber,
              onClick: () => {
                // Add your click handler here
                console.log("Lector Commentator clicked");
              },
            })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
