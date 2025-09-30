import React, { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Breadcrumb } from "antd";

import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import { createSelectedDepartmentCard } from "../../../assets/scripts/member";

import "../../../assets/styles/member.css";

export default function GroupSelectDepartment() {
  useEffect(() => {
    document.title = "OLGP Servers | Group";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const { department, group } = location.state || {};

  const SelectedDepartmentCard = createSelectedDepartmentCard(navigate);

  return (
    <div className="member-page-container">
      <div className="member-header">
        <div className="header-text-with-line">
          <h3>
            GROUP - {department?.toUpperCase()} - {group?.toUpperCase()}
          </h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/group" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectGroup"
                      className="breadcrumb-item"
                      state={{ department }}
                    >
                      Select Group
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/groupMembersList"
                      state={{ department, group }}
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
          {department !== "Altar Server" && (
            <SelectedDepartmentCard
              department="Altar Server"
              parish="Import a member from the Altar Server Department."
              toPage="/groupImportMember"
              selectedDepartment="Altar Server"
              originalDepartment={department}
              group={group}
              icon={icon.altarServerIcon}
            />
          )}

          {department !== "Eucharistic Minister" && (
            <SelectedDepartmentCard
              department="Eucharistic Minister"
              parish="Import a member from the Eucharistic Minister Department."
              toPage="/groupImportMember"
              selectedDepartment="Eucharistic Minister"
              originalDepartment={department}
              group={group}
              icon={icon.eucharisticMinisterIcon}
            />
          )}

          {department !== "Choir" && (
            <SelectedDepartmentCard
              department="Choir"
              parish="Import a member from the Choir Department."
              toPage="/groupImportMember"
              selectedDepartment="Choir"
              originalDepartment={department}
              group={group}
              icon={icon.choirIcon}
            />
          )}

          {department !== "Lector Commentator" && (
            <SelectedDepartmentCard
              department="Lector Commentator"
              parish="Import a member from the Lector Commentator Department."
              toPage="/groupImportMember"
              selectedDepartment="Lector Commentator"
              originalDepartment={department}
              group={group}
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
