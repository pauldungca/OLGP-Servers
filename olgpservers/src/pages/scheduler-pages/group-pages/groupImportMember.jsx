// GroupImportMember.jsx
import React, { useEffect, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import { ImportMemberTable } from "../../../components/table";

import {
  fetchAltarServerMembersWithRole,
  fetchLectorCommentatorMembersWithRole,
  fetchEucharisticMinisterMembers,
  fetchChoirMembers,
} from "../../../assets/scripts/fetchMember";

import { createImportRequestNotification } from "../../../assets/scripts/importMember";

import "../../../assets/styles/member.css";
import "../../../assets/styles/importMember.css";

export default function GroupImportMember() {
  useEffect(() => {
    document.title = "OLGP Servers | Group";
  }, []);

  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();
  const department = location.state?.department || "Group Members";
  const selectedDepartment = location.state?.selectedDepartment || "None";
  const group = location.state?.group || "None";

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

  // simple search filter
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (!q) {
      setFilteredMembers(members);
      return;
    }

    const query = q.toLowerCase();
    const filtered = members.filter((m) => {
      const first = m.firstName?.toLowerCase() || "";
      const last = m.lastName?.toLowerCase() || "";
      const role = m.role?.toLowerCase() || "";
      const id = String(m.idNumber || "");
      return (
        first.includes(query) ||
        last.includes(query) ||
        role.includes(query) ||
        id.includes(q)
      );
    });

    setFilteredMembers(filtered);
  };

  const handleImport = async (record) => {
    const fullName = `${record.firstName} ${record.lastName}`;
    const deptNeedingGroup =
      department === "Eucharistic Minister" || department === "Choir";

    // Guard: require a valid group for EM/Choir
    if (deptNeedingGroup && (!group || group === "None")) {
      await Swal.fire({
        icon: "info",
        title: "Select a Group",
        text: `Please select a ${
          department === "Choir" ? "choir group" : "minister group"
        } first.`,
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Send Approval Request",
      text:
        `Do you want to send a request for ${fullName} to join the ${department}` +
        (deptNeedingGroup ? ` (${group})` : "") +
        ` department?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Send Request",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      // pass: idNumber, department, fullName, groupName (only for EM/Choir)
      await createImportRequestNotification(
        record.idNumber,
        department,
        fullName,
        deptNeedingGroup ? group : null
      );
    }
  };

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
                  title: (
                    <Link
                      to="/groupSelectDepartment"
                      state={{ department, group }}
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
            placeholder={`Search ${selectedDepartment} Members`}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="table-container">
          <ImportMemberTable
            data={filteredMembers}
            loading={loading}
            onViewDetails={handleImport}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
