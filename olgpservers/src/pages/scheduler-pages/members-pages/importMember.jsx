// ImportMember.jsx
import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import Swal from "sweetalert2";

import { ImportMemberTable } from "../../../components/table";
import { createImportRequestNotification } from "../../../assets/scripts/importMember";

import {
  fetchAltarServerMembersWithRole,
  fetchLectorCommentatorMembersWithRole,
  fetchEucharisticMinisterMembers,
  fetchChoirMembers,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let data = [];
        switch (selectedDepartment) {
          case "Altar Server":
            data = await fetchAltarServerMembersWithRole();
            break;
          case "Lector Commentator":
            data = await fetchLectorCommentatorMembersWithRole();
            break;
          case "Eucharistic Minister":
            data = await fetchEucharisticMinisterMembers();
            break;
          case "Choir":
            data = await fetchChoirMembers();
            break;
          default:
            await Swal.fire(
              "Unsupported",
              `Importing from "${selectedDepartment}" isn't wired yet.`,
              "info"
            );
            data = [];
        }

        setMembers(data);
        setFilteredMembers(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        await Swal.fire("Error", "Failed to load members to import.", "error");
        setMembers([]);
        setFilteredMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDepartment]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query) {
      setFilteredMembers(members);
      return;
    }

    const q = query.toLowerCase();
    const filtered = members.filter(
      (m) =>
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.status?.toLowerCase().includes(q) ||
        String(m.idNumber || "").includes(query)
    );
    setFilteredMembers(filtered);
  };

  const handleViewDetails = async (record) => {
    const fullName = `${record.firstName} ${record.lastName}`;

    const result = await Swal.fire({
      icon: "question",
      title: "Send Approval Request",
      text: `Send a request for ${fullName} to join the ${department} department?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Send Request",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      // pass: (idNumber, department, fullName, groupName=null)
      await createImportRequestNotification(
        record.idNumber,
        department,
        fullName,
        null
      );
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
      <Footer />
    </div>
  );
}
