import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Breadcrumb } from "antd";
import Footer from "../../../components/footer";
import icon from "../../../helper/icon";
import { CustomTable } from "../../../components/table";
import DropDownButton from "../../../components/dropDownButton";
import {
  fetchAltarServerMembersWithRole,
  sampleMembers,
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

  const navigate = useNavigate();
  const location = useLocation();
  const department = location.state?.department || "Members";

  // Fetch members once
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchAltarServerMembersWithRole();
        setMembers(result);
        setFilteredMembers(result);
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

      <div className="member-content">
        <div className="search-bar-container">
          <input
            type="text"
            className="form-control"
            placeholder="Search Members"
            value={searchQuery}
            onChange={(e) =>
              handleSearchChange(e, members, setSearchQuery, setFilteredMembers)
            }
          />
          <button
            className="btn btn-blue"
            onClick={navigationAddMember(navigate, { department })}
          >
            <img src={icon.addUserIcon} alt="Add Icon" className="icon-btn" />
            Add Member
          </button>
          <button
            className="btn btn-blue"
            onClick={() => navigationSelectDepartment(navigate)}
          >
            <img
              src={icon.importUserIcons}
              alt="Import Icon"
              className="icon-btn"
            />
            Import Member
          </button>
        </div>

        <div className="table-container">
          <CustomTable
            data={filteredMembers}
            loading={loading}
            onViewDetails={(member) =>
              handleViewInformation(navigate, member, department)()
            }
          />
        </div>

        <div className="action-buttons">
          <DropDownButton
            onExportPNG={() => exportTableAsPNG(sampleMembers)}
            onExportPDF={() => exportTableAsPDF(sampleMembers)}
          />
          <button
            className="btn btn-blue flex items-center gap-2"
            onClick={() => printMemberList(sampleMembers)}
          >
            <img src={icon.printIcon} alt="Print Icon" className="icon-btn" />
            Print Members List
          </button>
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
