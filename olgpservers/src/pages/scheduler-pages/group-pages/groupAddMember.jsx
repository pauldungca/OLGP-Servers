import React, { useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import Footer from "../../../components/footer";
import icon from "../../../helper/icon";

import "../../../assets/styles/member.css";
import "../../../assets/styles/addMember.css";

export default function GroupAddMember() {
  useEffect(() => {
    document.title = "OLGP Servers | Groups";
  }, []);

  const location = useLocation();
  const department = location.state?.department || "Members";

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
                  title: "Add Member",
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

      <form className="form-content">
        {/* File Attachment */}
        <div className="attachment-container">
          <div
            className="preview-container mt-3"
            style={{ position: "relative", display: "inline-block" }}
          >
            <img
              src="https://via.placeholder.com/150"
              alt="Preview"
              className="preview-img"
            />
            <button type="button" className="preview-btn">
              ×
            </button>
          </div>

          <button type="button" className="add-image-btn">
            <img src={icon.addImageIcon} alt="Add" className="icon-img" />
          </button>

          <div className="attachment-labels">
            <label className="file-label">Attach image here</label>
            <span className="file-success">File attached!</span>
          </div>
        </div>

        {/* Main Form */}
        <div className="member-form mt-4">
          {/* Row 1 */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">First Name</label>
              <input type="text" className="form-control" />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Middle Name <span className="text-muted">(Optional)</span>
              </label>
              <input type="text" className="form-control" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-control" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="form-label">Province</label>
              <select className="form-control">
                <option value="">Select Province</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Municipality</label>
              <select className="form-control" disabled>
                <option value="">Select Municipality</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Barangay</label>
              <select className="form-control" disabled>
                <option value="">Select Barangay</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">House Number</label>
              <input type="text" className="form-control" />
            </div>
          </div>

          {/* Row 3 */}
          <div className="row mb-3">
            <div className="col-md-8">
              <label className="form-label">Full Address</label>
              <input type="text" className="form-control" disabled />
            </div>
            <div className="col-md-4">
              <label className="form-label">Date Joined</label>
              <input type="text" className="form-control" disabled />
            </div>
          </div>

          {/* Row 4 */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Sex</label>
              <select className="form-control">
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="0000 000 0000"
              />
            </div>
          </div>

          {/* Row 5 */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Role</label>
              <select className="form-control">
                <option value="">Select Role</option>
                <option value="Flexible">Flexible</option>
                <option value="Non-Flexible">Non-Flexible</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">User ID</label>
              <input type="text" className="form-control" disabled />
            </div>
          </div>

          {/* Non-Flexible Role Options */}
          <div className="role-options mt-3">
            <label style={{ marginRight: "15px" }}>
              <input type="checkbox" value="CandleBearer" /> Candle Bearer
            </label>
            <label style={{ marginRight: "15px" }}>
              <input type="checkbox" value="CrossBearer" /> Cross Bearer
            </label>
            <label style={{ marginRight: "15px" }}>
              <input type="checkbox" value="Thurifer" /> Thurifer
            </label>
          </div>

          <button type="button" className="btn btn-add mt-4">
            Add Member
          </button>
        </div>
      </form>
      <Footer />
    </div>
  );
}
