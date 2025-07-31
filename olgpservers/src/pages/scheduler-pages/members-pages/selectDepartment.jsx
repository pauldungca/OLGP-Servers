import React from "react";
import { useNavigate } from "react-router-dom";

import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import images from "../../../helper/images";
import { createButtonCard } from "../../../assets/scripts/member";

import "../../../assets/styles/member.css";

export default function SelectDepartment() {
  const navigate = useNavigate();
  const buttonCard = createButtonCard(images, navigate);

  return (
    <div className="member-page-container">
      <div className="member-header">
        <div className="header-text-with-line">
          <h3>MEMBERS</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/members" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link to="/membersList" className="breadcrumb-item">
                      Members
                    </Link>
                  ),
                },
                {
                  title: "Select Department",
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
      <div className="member-content">
        <div className="member-cards-container">
          {buttonCard({
            department: "Altar Server",
            parish: "Import a member from the Altar Server Department.",
          })}
          {buttonCard({
            department: "Eucharisic Minister",
            parish: "Import a member from the Eucharisic Minister Department.",
          })}
          {buttonCard({
            department: "Choir",
            parish: "Import a member from the Choir Department.",
          })}
          {buttonCard({
            department: "Lector Commentator",
            parish: "Import a member from the Lector Commentator Department.",
          })}
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
