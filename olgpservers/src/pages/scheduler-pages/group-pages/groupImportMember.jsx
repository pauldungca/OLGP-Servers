import React, { useEffect, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import { ImportMemberTable } from "../../../components/table";

import "../../../assets/styles/member.css";
import "../../../assets/styles/importMember.css";

export default function GroupImportMember() {
  useEffect(() => {
    document.title = "OLGP Servers | Group Members";
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const department = location.state?.department || "Group Members";
  const selectedDepartment = location.state?.selectedDepartment || "None";

  // Temporary static sample data for now
  const sampleMembers = [
    {
      idNumber: "200890522",
      firstName: "John",
      lastName: "Dungca",
      group: "Group 1",
    },
    {
      idNumber: "200890523",
      firstName: "Jane",
      lastName: "Doe",
      group: "Group 2",
    },
  ];

  // Filtering logic (but no backend)
  const filteredMembers = sampleMembers.filter(
    (member) =>
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.idNumber.includes(searchQuery)
  );

  return (
    <div className="member-page-container">
      <div className="member-header">
        <div className="header-text-with-line">
          <h3>GROUP - {department.toUpperCase()}</h3>
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
                      to="/groupSelectDepartment"
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
            placeholder={`Search ${selectedDepartment} Members`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="table-container">
          <ImportMemberTable
            data={filteredMembers}
            loading={false} // no loading state needed
            onViewDetails={() => {}} // disable functionality for now
          />
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
