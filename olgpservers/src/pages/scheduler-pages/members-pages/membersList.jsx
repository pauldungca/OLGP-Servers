import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Breadcrumb } from "antd";
import Footer from "../../../components/footer";
import icon from "../../../helper/icon";
//import image from "../../../helper/images";
import ExportMemberList from "../../../components/exportMemberList";

import { CustomTable } from "../../../components/table";
import DropDownButton from "../../../components/dropDownButton";
import {
  fetchAltarServerMembersWithRole,
  sampleMembers,
  exportTableAsPNG,
  exportTableAsPDF,
} from "../../../assets/scripts/fetchMember";
import {
  navigationAddMember,
  navigationSelectDepartment,
} from "../../../assets/scripts/member";

import "../../../assets/styles/member.css";

export default function MembersList() {
  const exportRef = useRef();
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

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query === "") {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(
        (member) =>
          member.firstName.toLowerCase().includes(query.toLowerCase()) ||
          member.lastName.toLowerCase().includes(query.toLowerCase()) ||
          member.role.toLowerCase().includes(query.toLowerCase()) ||
          member.idNumber.toString().includes(query)
      );
      setFilteredMembers(filtered);
    }
  };

  const handleViewDetails = (record) => {
    console.log("View details for:", record);
    alert(record.firstName);
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
            onChange={handleSearchChange}
          />
          <button
            className="btn btn-blue"
            onClick={() => navigationAddMember(navigate, { department })}
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
            onViewDetails={handleViewDetails}
          />
        </div>

        <div className="action-buttons">
          <DropDownButton
            onExportPNG={() => exportTableAsPNG(exportRef)}
            /*onExportPDF={() =>
              exportTableAsPDF(exportRef.current, image.OLGPlogo)
            }*/
            onExportPDF={() => exportTableAsPDF(sampleMembers)}
          />
          <button className="btn btn-blue">Print Members List</button>
        </div>

        {/* Hidden export-only component */}
        <div
          style={{
            position: "absolute",
            top: "-9999px", // push it off screen
            left: "-9999px", // out of viewport
          }}
        >
          <ExportMemberList ref={exportRef} members={sampleMembers} />
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
