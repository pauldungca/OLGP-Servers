import React, { useState } from "react";
import { Dropdown, Menu } from "antd";
import icon from "../helper/icon";

// Accept export handlers as props
const ScheduleDropdownButton = ({ onExportPDF, onExportPNG }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const menu = (
    <Menu className="export-options">
      <Menu.Item key="1" className="menu-item">
        <button
          className="menu-link"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            margin: 0,
            color: "inherit",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
          onClick={() => {
            setDropdownVisible(false);
            if (onExportPDF) onExportPDF();
          }}
        >
          PDF
        </button>
      </Menu.Item>
      <Menu.Item key="2" className="menu-item">
        <button
          className="menu-link"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            margin: 0,
            color: "inherit",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
          onClick={() => {
            setDropdownVisible(false);
            if (onExportPNG) onExportPNG();
          }}
        >
          PNG
        </button>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown
      overlay={menu}
      trigger={["hover"]}
      placement="top"
      onVisibleChange={(visible) => setDropdownVisible(visible)}
      visible={dropdownVisible}
    >
      <button className="btn btn-blue">
        <img src={icon.exportIcon} alt="Export Icon" className="icon-btn" />
        Export Schedule
        <img
          src={icon.arrowLogo}
          alt="Arrow Icon"
          className={`arrow-icon-btn ${dropdownVisible ? "rotated" : ""}`}
        />
      </button>
    </Dropdown>
  );
};

export default ScheduleDropdownButton;
