import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Breadcrumb } from "antd";
import icon from "../../../helper/icon";
import images from "../../../helper/images";
import Footer from "../../../components/footer";

import "../../../assets/styles/group.css";
import "../../../assets/styles/selectGroup.css";

import {
  fetchEucharisticMinisterGroups,
  addEucharisticMinisterGroup,
  deleteEucharisticMinisterGroup,
} from "../../../assets/scripts/group";

export default function SelectGroup() {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const department = location.state?.department || "Members";

  useEffect(() => {
    document.title = "OLGP Servers | Groups";

    const loadGroups = async () => {
      const data = await fetchEucharisticMinisterGroups();
      setGroups(data);
    };

    loadGroups();
  }, []);

  const handleViewGroup = (groupName, department) => {
    navigate("/groupMembersList", {
      state: { group: groupName, department },
    });
  };

  const handleAddGroup = async () => {
    const newGroup = await addEucharisticMinisterGroup();
    if (newGroup) {
      setGroups((prev) => [...prev, newGroup]);
    }
  };

  const handleDeleteGroup = async (group) => {
    const deleted = await deleteEucharisticMinisterGroup(group.id, group.name);
    if (deleted) {
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    }
  };

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
                  title: "Select Group",
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
      <div className="group-content">
        <h4 className="available-groups-heading">Available Groups</h4>
        <div className="group-cards-container">
          {groups.map((group) => (
            <div key={group.id} className="group-card">
              <div className="group-title-container">
                <img
                  src={images.viewGroupImage}
                  alt="Group icon"
                  className="group-icon"
                />
                <h4 className="group-title">{group.name}</h4>
              </div>
              <div className="group-actions d-flex gap-2">
                <button
                  className="btn-view-group"
                  onClick={() => handleViewGroup(group.name, department)}
                >
                  VIEW GROUP
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteGroup(group)}
                >
                  DELETE GROUP
                </button>
              </div>
            </div>
          ))}
          <div className="add-group-section">
            <div className="add-group-card" onClick={handleAddGroup}>
              <div className="add-group-content">
                <img
                  src={images.addGroupImage}
                  alt="Add group icon"
                  className="add-group-icon"
                />
                <h4>Add Group</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
