import React, { useEffect, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import "../../../assets/styles/member.css";
import "../../../assets/styles/viewMemberInformation.css";

export default function GroupViewMemberInformation() {
  useEffect(() => {
    document.title = "OLGP Servers | Group Member";
  }, []);

  const location = useLocation();
  const department = location.state?.department || "Group Members";
  const idNumber = location.state?.idNumber || "200890522";

  // 🔹 Dummy static data for now
  const [firstName, setFirstName] = useState("John");
  const [middleName, setMiddleName] = useState("Paul");
  const [lastName, setLastName] = useState("Doe");
  const [sex, setSex] = useState("Male");
  const [email, setEmail] = useState("john.doe@email.com");
  const [contactNumber, setContactNumber] = useState("09123456789");
  const [dateJoined, setDateJoined] = useState("2024-01-15");
  const [address, setAddress] = useState(
    "123 Sample St, Barangay, Municipality, Province"
  );
  const [selectedRole, setSelectedRole] = useState("Flexible");
  const [imageUrl, setImageUrl] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [selectedRolesArray, setSelectedRolesArray] = useState([
    "CandleBearer",
  ]);

  return (
    <div className="member-page-container">
      {/* Header */}
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
                  title: "View Member",
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

      {/* Content */}
      <form className="form-content">
        {/* Image preview */}
        <div className="attachment-container">
          <div
            className="preview-container mt-3"
            style={{ position: "relative", display: "inline-block" }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="preview-img" />
            ) : (
              <img
                src={icon.addImageIcon}
                alt="Default"
                className="preview-img"
              />
            )}
          </div>
          <div className="attachment-labels">
            <label className="file-label">Group Member Image</label>
          </div>
        </div>

        {/* Member Information */}
        <div className="member-form mt-4">
          {/* Row 1 */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                value={firstName}
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Middle Name</label>
              <input
                type="text"
                className="form-control"
                value={middleName}
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={lastName}
                disabled
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="row mb-3">
            <div className="col-md-8">
              <label className="form-label">Full Address</label>
              <input
                type="text"
                className="form-control"
                value={address}
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Date Joined</label>
              <input
                type="text"
                className="form-control"
                value={dateJoined}
                disabled
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Sex</label>
              <input
                type="text"
                className="form-control"
                value={sex}
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-control"
                value={contactNumber}
                disabled
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Role</label>
              <input
                type="text"
                className="form-control"
                value={selectedRole}
                disabled
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">User ID</label>
              <input
                type="text"
                className="form-control"
                value={idNumber}
                disabled
              />
            </div>
          </div>

          {/* Roles checkboxes */}
          <div className="role-options mt-3">
            {[
              { label: "Candle Bearer", value: "CandleBearer" },
              { label: "Beller", value: "Beller" },
              { label: "Cross Bearer", value: "CrossBearer" },
              { label: "Thurifer", value: "Thurifer" },
              { label: "Incense Bearer", value: "IncenseBearer" },
              { label: "Main Servers", value: "MainServers" },
              { label: "Plates", value: "Plates" },
            ].map((role) => (
              <label key={role.value} className="me-3">
                <input
                  type="checkbox"
                  checked={selectedRolesArray.includes(role.value)}
                  disabled
                />{" "}
                {role.label}
              </label>
            ))}
          </div>

          {/* Buttons */}
          <div className="d-flex gap-3 mt-4">
            <button type="button" className="btn btn-danger flex-fill">
              Remove Member
            </button>
            <button type="button" className="btn btn-view flex-fill">
              Edit Member
            </button>
          </div>
        </div>
      </form>

      <div>
        <Footer />
      </div>
    </div>
  );
}
