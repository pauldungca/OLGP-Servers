import React from "react";
import { useNavigate, Link } from "react-router-dom";
import icon from "../../../helper/icon";
import { Breadcrumb } from "antd";

import Footer from "../../../components/footer";

import "../../../assets/styles/account.css";

export default function VerifyOTP() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate("/changePasswordAccountSecretary");
  };
  return (
    <div className="account-page-container">
      <div className="account-header">
        <div className="header-text-with-line">
          <h3>ACCOUNT</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/secretaryAccount" className="breadcrumb-item">
                      Account
                    </Link>
                  ),
                },
                {
                  title: "Verify OTP",
                  className: "breadcrumb-item-active",
                },
              ]}
              separator={
                <img
                  src={icon.chevronIcon}
                  alt="Chevron Icon"
                  style={{ width: "15px", height: "15px" }}
                />
              }
              className="customized-breadcrumb"
            />
          </div>
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
