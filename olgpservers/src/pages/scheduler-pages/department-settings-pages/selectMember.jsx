import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import { AssignMemberTable } from "../../../components/table";
import { fetchAltarServerMembers } from "../../../assets/scripts/fetchMember";

import "../../../assets/styles/departmentSettings.css";
import "../../../assets/styles/assignMember.css";

export default function SelectMember() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const membersData = await fetchAltarServerMembers();
        setMembers(membersData);
        setFilteredMembers(membersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
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
          member.status.toLowerCase().includes(query.toLowerCase()) ||
          member.idNumber.toString().includes(query)
      );
      setFilteredMembers(filtered);
    }
  };

  const handleViewDetails = (record) => {
    console.log("View details for:", record);
    alert(record.idNumber);
  };

  return (
    <div className="department-settings-page-container">
      <div className="department-settings-header">
        <div className="header-text-with-line">
          <h3>DEPARTMENT SETTINGS</h3>
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
            onChange={handleSearchChange}
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
