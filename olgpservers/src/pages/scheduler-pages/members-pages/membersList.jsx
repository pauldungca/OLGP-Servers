import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Breadcrumb } from "antd";
import Footer from "../../../components/footer";
import icon from "../../../helper/icon";
import { CustomTable } from "../../../components/table";
import DropDownButton from "../../../components/dropDownButton";
import {
  fetchAltarServerMembersWithRole,
  fetchLectorCommentatorMembersWithRole,
  exportTableAsPNG,
  exportTableAsPDF,
  printMemberList,
} from "../../../assets/scripts/fetchMember";
import {
  navigationAddMember,
  navigationSelectDepartment,
  handleViewInformation,
  handleSearchChange,
} from "../../../assets/scripts/member";

import "../../../assets/styles/member.css";

export default function MembersList() {
  useEffect(() => {
    document.title = "OLGP Servers | Members";
  }, []);

  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navigate = useNavigate();
  const location = useLocation();
  const department = location.state?.department || "Members";

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch members once
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let result = [];
        if (department === "Altar Server") {
          result = await fetchAltarServerMembersWithRole();
        } else if (department === "Lector Commentator") {
          result = await fetchLectorCommentatorMembersWithRole();
        }
        setMembers(result);
        setFilteredMembers(result);
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [department]);

  const formatFullName = (member) => {
    const middleInitial = member.middleName
      ? ` ${member.middleName.charAt(0).toUpperCase()}.`
      : "";
    return `${member.firstName}${middleInitial} ${member.lastName}`.trim();
  };

  const getExportData = () => {
    return members.map((member) => ({
      idNumber: member.idNumber,
      name: formatFullName(member),
    }));
  };

  return (
    <div className="member-page-container">
      {/* Header Section */}
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
                  title: "Members",
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

      {/* Main Content */}
      <div className="member-content">
        {/* Search and Action Buttons */}
        <div className="search-bar-container">
          <input
            type="text"
            className="form-control"
            placeholder="Search Members"
            value={searchQuery}
            onChange={(e) =>
              handleSearchChange(e, members, setSearchQuery, setFilteredMembers)
            }
            aria-label="Search members"
          />
          <button
            className="btn btn-blue"
            onClick={navigationAddMember(navigate, { department })}
            aria-label="Add new member"
          >
            <img
              src={icon.addUserIcon}
              alt=""
              className="icon-btn"
              aria-hidden="true"
            />
            <span>{isMobile ? "Add" : "Add Member"}</span>
          </button>
          <button
            className="btn btn-blue"
            onClick={navigationSelectDepartment(navigate, { department })}
            aria-label="Import member"
          >
            <img
              src={icon.importUserIcons}
              alt=""
              className="icon-btn"
              aria-hidden="true"
            />
            <span>{isMobile ? "Import" : "Import Member"}</span>
          </button>
        </div>

        {/* Table Section */}
        <div className="table-container">
          <CustomTable
            data={filteredMembers}
            loading={loading}
            onViewDetails={(member) =>
              handleViewInformation(navigate, member, department)()
            }
          />
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <DropDownButton
            onExportPNG={() => exportTableAsPNG(getExportData(), department)}
            onExportPDF={() => exportTableAsPDF(getExportData(), department)}
          />
          <button
            className="btn btn-blue"
            onClick={() => printMemberList(getExportData(), department)}
            aria-label="Print members list"
          >
            <img
              src={icon.printIcon}
              alt=""
              className="icon-btn"
              aria-hidden="true"
            />
            <span>Print Members List</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div>
        <Footer />
      </div>
    </div>
  );
}
