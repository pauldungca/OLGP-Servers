import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import Swal from "sweetalert2";

import { ImportMemberTable } from "../../../components/table";
import {
  importToAltarServerDepartment,
  importToLectorCommentatorDepartment,
} from "../../../assets/scripts/importMember";

import {
  fetchAltarServerMembersWithRole,
  fetchLectorCommentatorMembersWithRole,
} from "../../../assets/scripts/fetchMember";

import "../../../assets/styles/member.css";
import "../../../assets/styles/importMember.css";

export default function ImportMember() {
  useEffect(() => {
    document.title = "OLGP Servers | Members";
  }, []);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();
  const department = location.state?.department || "Members";

  const selectedDepartment = location.state?.selectedDepartment || "None";

  function showAlert() {
    alert(selectedDepartment);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let membersData = [];

        if (selectedDepartment === "Altar Server") {
          membersData = await fetchAltarServerMembersWithRole();
        } else if (selectedDepartment === "Lector Commentator") {
          membersData = await fetchLectorCommentatorMembersWithRole();
        } else {
          membersData = []; // fallback if department not recognized
        }

        setMembers(membersData);
        setFilteredMembers(membersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDepartment]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query === "") {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(
        (member) =>
          member.firstName?.toLowerCase().includes(query.toLowerCase()) ||
          member.lastName?.toLowerCase().includes(query.toLowerCase()) ||
          member.status?.toLowerCase().includes(query.toLowerCase()) ||
          member.idNumber?.toString().includes(query)
      );
      setFilteredMembers(filtered);
    }
  };

  const handleViewDetails = async (record) => {
    const fullName = `${record.firstName} ${record.lastName}`;

    const result = await Swal.fire({
      icon: "question",
      title: "Confirm Import",
      text: `Are you sure you want to import ${fullName} to the ${
        selectedDepartment === "Altar Server"
          ? "Lector Commentator"
          : "Altar Server"
      } department?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Import",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      if (selectedDepartment === "Altar Server") {
        await importToLectorCommentatorDepartment(record.idNumber);
      } else if (selectedDepartment === "Lector Commentator") {
        await importToAltarServerDepartment(record.idNumber);
      }
    }
  };

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
                  title: (
                    <Link
                      to="/selectDepartment"
                      state={{ department }}
                      className="breadcrumb-item"
                    >
                      Select Department
                    </Link>
                  ),
                },
                {
                  title: "Import Member",
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
        <div className="search-bar-container">
          <button onClick={showAlert}>Show Selected Department</button>

          <input
            type="text"
            className="form-control"
            placeholder="Search Members"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="table-container">
          <ImportMemberTable
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
