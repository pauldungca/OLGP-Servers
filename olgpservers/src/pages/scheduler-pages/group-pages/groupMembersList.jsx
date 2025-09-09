import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Breadcrumb } from "antd";
import Footer from "../../../components/footer";
import icon from "../../../helper/icon";
import { GroupTable } from "../../../components/table";
import DropDownButton from "../../../components/dropDownButton";

import {
  navigationAddMember,
  navigationSelectDepartment,
  handleViewInformation,
} from "../../../assets/scripts/group";

import "../../../assets/styles/member.css";

export default function GroupMembersList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const location = useLocation();
  const department = location.state?.department || "Members";

  useEffect(() => {
    document.title = "OLGP Servers | Group";

    // Static dummy members
    const dummyMembers = [
      {
        idNumber: "200890522",
        firstName: "John",
        middleName: "P",
        lastName: "Dungca",
        group: "Group 1", // <--- this is needed
      },
      {
        idNumber: "200890523",
        firstName: "Jane",
        middleName: "A",
        lastName: "Doe",
        group: "Group 2",
      },
      {
        idNumber: "200890524",
        firstName: "Mark",
        middleName: "",
        lastName: "Smith",
        group: "Group 1",
      },
    ];

    setMembers(dummyMembers);
    setLoading(false);
  }, []);

  /*const formatFullName = (member) => {
    const middleInitial = member.middleName
      ? ` ${member.middleName.charAt(0).toUpperCase()}.`
      : "";
    return `${member.firstName}${middleInitial} ${member.lastName}`.trim();
  };*/

  /*const getExportData = () => {
    return members.map((member) => ({
      idNumber: member.idNumber,
      name: formatFullName(member),
    }));
  };*/

  return (
    <div className="group-page-container">
      <div className="group-header">
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

      <div className="group-content">
        <div className="search-bar-container">
          <input
            type="text"
            className="form-control"
            placeholder="Search Members"
            value="" // static, no functionality
            readOnly
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
            onClick={navigationSelectDepartment(navigate, { department })}
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
          <GroupTable
            data={members}
            loading={loading}
            onViewDetails={(member) =>
              handleViewInformation(navigate, member, department)()
            }
          />
        </div>

        <div className="action-buttons">
          <DropDownButton
            onExportPNG={() => {}} // no functionality
            onExportPDF={() => {}} // no functionality
          />
          <button className="btn btn-blue flex items-center gap-2">
            <img src={icon.printIcon} alt="Print Icon" className="icon-btn" />
            Print Members List
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
