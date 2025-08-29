import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../../components/footer";

import "../../../assets/styles/account.css";

export default function Account() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate("/verifyOTPAccountSecretary");
  };
  return (
    <div className="account-page-container">
      <div className="account-header">
        <div className="header-text-with-line">
          <h3>ACCOUNT</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="account-content">
        <button onClick={handleCardClick}>Next Page</button>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
