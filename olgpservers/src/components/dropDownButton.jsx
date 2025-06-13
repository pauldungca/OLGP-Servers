import React, { useState } from "react";
import { Dropdown, Menu } from "antd";
import icon from "../helper/icon";

const DropdownButton = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const menu = (
    <Menu className="export-options">
      <Menu.Item key="1" className="menu-item">
        <a target="_blank" rel="noopener noreferrer" href="/path-to-pdf">
          PDF
        </a>
      </Menu.Item>
      <Menu.Item key="2" className="menu-item">
        <a target="_blank" rel="noopener noreferrer" href="/path-to-png">
          PNG
        </a>
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
        Export Members List
        <img
          src={icon.arrowLogo}
          alt="Arrow Icon"
          className={`arrow-icon-btn ${dropdownVisible ? "rotated" : ""}`}
        />
      </button>
    </Dropdown>
  );
};

export default DropdownButton;
