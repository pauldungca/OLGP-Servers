import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import images from "../../../helper/images";

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
  //const buttonCard = createButtonCard(images, navigate);

  const location = useLocation();
  const department = location.state?.department || "Members";

  const SelectedDepartmentCard = createSelectedDepartmentCard(images, navigate);

  const departments = [
    {
      department: "Altar Server",
      parish: "Import a member from the Altar Server Department.",
    },
    {
      department: "Eucharistic Minister",
      parish: "Import a member from the Eucharistic Minister Department.",
    },
    {
      department: "Choir",
      parish: "Import a member from the Choir Department.",
    },
    {
      department: "Lector Commentator",
      parish: "Import a member from the Lector Commentator Department.",
    },
  ];

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
          {departments
            .filter((d) => d.department !== department)
            .map((d) => (
              <SelectedDepartmentCard
                key={d.department}
                department={d.department}
                parish={d.parish}
                toPage="/importMember"
                selectedDepartment={d.department}
                originalDepartment={department}
              />
            ))}
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
