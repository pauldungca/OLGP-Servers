import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import {
  isAltarServerScheduler,
  isLectorCommentatorScheduler,
} from "../../../assets/scripts/member";

import {
  isEucharisticMinisterScheduler,
  isChoirScheduler,
} from "../../../assets/scripts/group";

import { requestSchedulerTransfer } from "../../../assets/scripts/departmentSettings";

import "../../../assets/styles/departmentSettings.css";
import "../../../assets/styles/assignReplacement.css";

export default function AssignReplacement() {
  useEffect(() => {
    document.title = "OLGP Servers | Department Settings";
  }, []);

  const [selectedRole, setSelectedRole] = useState(null);

  const location = useLocation();
  const storedIdNumber = localStorage.getItem("idNumber");

  const department = location.state?.department || "Members";
  const member = location.state?.member;
  const idNumber = member.idNumber || "";

  const [isEucharisticMinister, setIsEucharisticMinister] = useState(false);
  const [isChoir, setIsChoir] = useState(false);
  const [isAltarServer, setIsAltarServer] = useState(false);
  const [isLectorCommentator, setIsLectorCommentator] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const initializeMemberData = async () => {
      const eucharisticMinisterStatus = await isEucharisticMinisterScheduler(
        storedIdNumber
      );
      const choirStatus = await isChoirScheduler(storedIdNumber);
      const serverStatus = await isAltarServerScheduler(storedIdNumber);
      const lectorStatus = await isLectorCommentatorScheduler(storedIdNumber);

      setIsAltarServer(serverStatus);
      setIsLectorCommentator(lectorStatus);
      setIsEucharisticMinister(eucharisticMinisterStatus);
      setIsChoir(choirStatus);
    };
    initializeMemberData();
  }, [storedIdNumber]);

  const fullName = [
    member.firstName || "",
    member.middleName ? `${member.middleName.charAt(0).toUpperCase()}.` : "",
    member.lastName || "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const handleConfirm = async () => {
    if (!selectedRole) return;

    await requestSchedulerTransfer({
      selectedRole,
      targetIdNumber: idNumber, // the member you're assigning to
      requesterIdNumber: storedIdNumber,
      fullName,
    });

    navigate("/selectMember", { state: { department } });
  };

  return (
    <div className="department-settings-page-container">
      <div className="department-settings-header">
        <div className="header-text-with-line">
          <h3>DEPARTMENT SETTINGS - {department.toUpperCase()}</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/departmentSettings" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectMember"
                      className="breadcrumb-item"
                      state={{ department }}
                    >
                      Assign Member
                    </Link>
                  ),
                },
                {
                  title: "Assign Replacement",
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
      <div className="department-settings-content">
        <h1>Assign Replacement</h1>
        <p>
          By confirming, you acknowledge that you are transferring department
          scheduler privileges to <strong>{fullName}</strong>, authorizing them
          to manage and update the schedule as needed.
        </p>

        <div className="assign-replacement-role-container">
          {isAltarServer && (
            <button
              className={`assign-replacement-role-btn ${
                selectedRole === "Altar Server" ? "selected" : ""
              }`}
              onClick={() =>
                setSelectedRole(
                  selectedRole === "Altar Server" ? null : "Altar Server"
                )
              }
            >
              Altar Server
            </button>
          )}

          {isEucharisticMinister && (
            <button
              className={`assign-replacement-role-btn ${
                selectedRole === "Eucharistic Minister" ? "selected" : ""
              }`}
              onClick={() =>
                setSelectedRole(
                  selectedRole === "Eucharistic Minister"
                    ? null
                    : "Eucharistic Minister"
                )
              }
            >
              Eucharistic Minister
            </button>
          )}

          {isChoir && (
            <button
              className={`assign-replacement-role-btn ${
                selectedRole === "Choir" ? "selected" : ""
              }`}
              onClick={() =>
                setSelectedRole(selectedRole === "Choir" ? null : "Choir")
              }
            >
              Choir
            </button>
          )}

          {isLectorCommentator && (
            <button
              className={`assign-replacement-role-btn ${
                selectedRole === "Lector Commentator" ? "selected" : ""
              }`}
              onClick={() =>
                setSelectedRole(
                  selectedRole === "Lector Commentator"
                    ? null
                    : "Lector Commentator"
                )
              }
            >
              Lector Commentator
            </button>
          )}
        </div>

        <div>
          <button
            className="assign-replacement-confirm-btn"
            //onClick={() => alert(`Selected Role: ${selectedRole}`)}
            onClick={handleConfirm}
            disabled={!selectedRole}
          >
            Confirm
          </button>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
