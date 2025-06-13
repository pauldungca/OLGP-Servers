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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const membersData = await fetchAltarServerMembers();
        setMembers(membersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
            >
              <Breadcrumb.Item>
                <Link to="/members" className="breadcrumb-item">
                  Department
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item className="breadcrumb-item-active">
                Members
              </Breadcrumb.Item>
            </Breadcrumb>
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
          />
          <button className="btn">Search</button>
          {/* Add Member & Import Member Buttons */}
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
            data={members}
            loading={loading}
            onViewDetails={handleViewDetails}
          />
        </div>
        {/* Export and Print Buttons */}
        <div className="action-buttons">
          <DropDownButton />
          <button className="btn btn-blue">
            <img src={icon.printIcon} alt="Print Icon" className="icon-btn" />
            Print Members List
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
