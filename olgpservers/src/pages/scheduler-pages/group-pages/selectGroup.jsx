import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Breadcrumb } from "antd";
import icon from "../../../helper/icon";

import "../../../assets/styles/group.css";
import "../../../assets/styles/selectGroup.css";

import images from "../../../helper/images";
import Footer from "../../../components/footer";

export default function SelectGroup() {
  useEffect(() => {
    document.title = "OLGP Servers | Groups";
  }, []);
  const navigate = useNavigate();
  const groups = ["GROUP 1", "GROUP 2", "GROUP 3"];

  const handleViewGroup = (groupName) => {
    navigate("/membersList");
  };

  const handleAddGroup = () => {
    alert("Add Group clicked");
  };

  return (
    <div className="group-page-container">
      <div className="group-header">
        <div className="header-text-with-line">
          <h3>GROUP</h3>
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
          {groups.map((group, index) => (
            <div key={index} className="group-card">
              <div className="group-title-container">
                <img
                  src={images.viewGroupImage}
                  alt="Group icon"
                  className="group-icon"
                />
                <h4 className="group-title">{group}</h4>
              </div>
              <button
                className="btn-view-group"
                onClick={() => handleViewGroup(group)}
              >
                VIEW GROUP
              </button>
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
