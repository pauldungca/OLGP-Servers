import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "antd";
import Footer from "../../../components/footer";
import "../../../assets/styles/member.css";
import "../../../assets/styles/header.css";
import icon from "../../../helper/icon";

import CustomTable from "../../../components/table";
import DropDownButton from "../../../components/dropDownButton";

import { fetchAltarServerMembers } from "../../../assets/scripts/fetchMember";

export default function MembersList() {
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
    alert(record.firstName);
  };

  return (
    <div className="member-page-container">
      <div className="member-header">
        <div className="header-text-with-line">
          <h3>MEMBERS</h3>
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
                  style={{
                    width: "15px",
                    height: "15px",
                  }}
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
          <button className="btn">Search</button>
          <button className="btn btn-blue">
            <img src={icon.addUserIcon} alt="Add Icon" className="icon-btn" />
            Add Member
          </button>
          <button className="btn btn-blue">
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
          <DropDownButton />
          <button className="btn btn-blue">
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
