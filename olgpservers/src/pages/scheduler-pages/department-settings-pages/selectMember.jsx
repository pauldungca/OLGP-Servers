import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import { AssignMemberTable } from "../../../components/table";
import {
  fetchAltarServerMembersWithRole,
  fetchLectorCommentatorMembersWithRole,
  fetchEucharisticMinisterMembers,
  fetchChoirMembers,
} from "../../../assets/scripts/fetchMember";

import { handleBasicSearchChange } from "../../../assets/scripts/departmentSettings";

//import "../../../assets/styles/departmentSettings.css";
import "../../../assets/styles/assignMember.css";

export default function SelectMember() {
  useEffect(() => {
    document.title = "OLGP Servers | Department Settings";
  }, []);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const department = location.state?.department || "Members";

  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let membersData = [];

        switch (department.toUpperCase()) {
          case "ALTAR SERVER":
            membersData = await fetchAltarServerMembersWithRole();
            break;
          case "LECTOR COMMENTATOR":
            membersData = await fetchLectorCommentatorMembersWithRole();
            break;
          case "EUCHARISTIC MINISTER":
            membersData = await fetchEucharisticMinisterMembers();
            break;
          case "CHOIR":
            membersData = await fetchChoirMembers();
            break;
          default:
            await Swal.fire(
              "Unsupported",
              `Importing from "${department}" isn't wired yet.`,
              "info",
            );
            membersData = [];
            break;
        }

        setMembers(membersData);
        setFilteredMembers(membersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setMembers([]);
        setFilteredMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [department]);

  const handleViewDetails = (record) => {
    navigate("/assignReplacement", {
      state: {
        department,
        member: record,
      },
    });
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
                  title: "Assign Member",
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
        <div className="search-bar-container">
          <input
            type="text"
            className="form-control"
            placeholder="Search Members"
            value={searchQuery}
            onChange={(e) =>
              handleBasicSearchChange(
                e,
                members,
                setSearchQuery,
                setFilteredMembers,
              )
            }
          />
        </div>
        <div className="table-container">
          <AssignMemberTable
            data={filteredMembers}
            loading={loading}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
