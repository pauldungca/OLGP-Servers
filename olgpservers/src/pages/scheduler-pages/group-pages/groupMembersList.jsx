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
  handleViewInformationWithGroup,
} from "../../../assets/scripts/group";

import {
  fetchEucharisticMinisterWithGroup,
  fetchChoirWithGroup,
  exportTableAsPNG,
  exportTableAsPDF,
  printMemberList,
} from "../../../assets/scripts/fetchMember";

import { handleSearchChange } from "../../../assets/scripts/member";

import "../../../assets/styles/member.css";

export default function GroupMembersList() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { department, group } = location.state || {};

  useEffect(() => {
    document.title = "OLGP Servers | Group";

    const load = async () => {
      setLoading(true);
      try {
        let rows = [];
        if (department === "Eucharistic Minister") {
          rows = await fetchEucharisticMinisterWithGroup(group);
        } else if (department === "Choir") {
          rows = await fetchChoirWithGroup(group);
        }

        setMembers(rows);
        setFilteredMembers(rows);
      } catch (e) {
        console.error("Error fetching group members:", e);
        setMembers([]);
        setFilteredMembers([]);
      } finally {
        setLoading(false);
      }
    };

    if (group) load();
  }, [group, department]);
  const formatFullName = (member) => {
    const middleInitial = member.middleName
      ? ` ${member.middleName.charAt(0).toUpperCase()}.`
      : "";
    return `${member.firstName}${middleInitial} ${member.lastName}`.trim();
  };

  const getExportData = () =>
    members.map((member) => ({
      idNumber: member.idNumber,
      name: formatFullName(member),
    }));

  return (
    <div className="group-page-container">
      <div className="group-header">
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
            value={searchQuery}
            onChange={(e) =>
              handleSearchChange(e, members, setSearchQuery, setFilteredMembers)
            }
          />
          <button
            className="btn btn-blue"
            onClick={navigationAddMember(navigate, { department, group })}
          >
            <img src={icon.addUserIcon} alt="Add Icon" className="icon-btn" />
            Add Member
          </button>
          <button
            className="btn btn-blue"
            onClick={navigationSelectDepartment(navigate, {
              department,
              group,
            })}
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
            data={filteredMembers}
            loading={loading}
            onViewDetails={(member) =>
              handleViewInformationWithGroup(
                navigate,
                member,
                department,
                group
              )()
            }
          />
        </div>

        <div className="action-buttons">
          <DropDownButton
            onExportPNG={() => exportTableAsPNG(getExportData(), department)}
            onExportPDF={() => exportTableAsPDF(getExportData(), department)}
          />
          <button
            className="btn btn-blue flex items-center gap-2"
            onClick={() => printMemberList(getExportData(), department)}
          >
            <img src={icon.printIcon} alt="Print Icon" className="icon-btn" />
            Print Members List
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
