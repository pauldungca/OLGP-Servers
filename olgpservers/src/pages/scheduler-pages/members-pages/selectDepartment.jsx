import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import {
  // createButtonCard,
  createSelectedDepartmentCard,
} from "../../../assets/scripts/member";

import "../../../assets/styles/member.css";

export default function SelectDepartment() {
  useEffect(() => {
    document.title = "OLGP Servers | Members";
  }, []);
  const navigate = useNavigate();
  // const buttonCard = createButtonCard(images, navigate);

  const location = useLocation();
  const department = location.state?.department || "Members";

  // ✅ Do NOT change member.js; it expects only (navigate)
  const SelectedDepartmentCard = createSelectedDepartmentCard(navigate);

  return (
    <div className="member-page-container">
      <div className="member-header">
        <div className="header-text-with-line">
          <h3>MEMBERS - {department.toUpperCase()}</h3>
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
                    <Link
                      to="/membersList"
                      state={{ department }}
                      className="breadcrumb-item"
                    >
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
          {/* Manual cards with conditional display so we don't show the same department */}
          {department !== "Altar Server" && (
            <SelectedDepartmentCard
              department="Altar Server"
              parish="Import a member from the Altar Server Department."
              toPage="/importMember"
              selectedDepartment="Altar Server"
              originalDepartment={department}
              icon={icon.altarServerIcon}
            />
          )}

          {department !== "Eucharistic Minister" && (
            <SelectedDepartmentCard
              department="Eucharistic Minister"
              parish="Import a member from the Eucharistic Minister Department."
              toPage="/importMember"
              selectedDepartment="Eucharistic Minister"
              originalDepartment={department}
              icon={icon.eucharisticMinisterIcon}
            />
          )}

          {department !== "Choir" && (
            <SelectedDepartmentCard
              department="Choir"
              parish="Import a member from the Choir Department."
              toPage="/importMember"
              selectedDepartment="Choir"
              originalDepartment={department}
              icon={icon.choirIcon}
            />
          )}

          {department !== "Lector Commentator" && (
            <SelectedDepartmentCard
              department="Lector Commentator"
              parish="Import a member from the Lector Commentator Department."
              toPage="/importMember"
              selectedDepartment="Lector Commentator"
              originalDepartment={department}
              icon={icon.lectorCommentatorIcon}
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
