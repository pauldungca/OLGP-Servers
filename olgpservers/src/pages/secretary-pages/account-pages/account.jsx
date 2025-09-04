import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import images from "../../../helper/images";
import Footer from "../../../components/footer";

import "../../../assets/styles/account.css";

export default function Account() {
  useEffect(() => {
    document.title = "OLGP Servers | Account";
  }, []);
  const navigate = useNavigate();

  const handleChangePassword = () => {
    navigate("/verifyOTPAccountSecretary");
  };
  return (
    <div className="account-page-container">
      <div className="account-header">
        <div className="header-text-with-line">
          <h3>ACCOUNT</h3>
          <div className="header-line"></div>
        </div>
      </div>
      <div className="account-content">
        {/* Profile section */}
        <div className="d-flex align-items-center mb-4">
          <img
            src={images.accountImage}
            alt="Profile"
            className="profile-image"
          />
          <div>
            <h4 className="fw-bold fs-3 m-0">Juan Dela Cruz</h4>
            <small className="text-muted">ID: 200890522</small>
          </div>
        </div>

        {/* Form Section */}
        <form>
          {/* Row 1 */}
          <div className="row mb-3">
            <div className="col">
              <label className="form-label">First Name</label>
              <input type="text" className="form-control" disabled />
            </div>
            <div className="col">
              <label className="form-label">Middle Name</label>
              <input type="text" className="form-control" disabled />
            </div>
            <div className="col">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-control" disabled />
            </div>
          </div>

          {/* Row 2 */}
          <div className="row mb-3">
            <div className="col-9">
              <label className="form-label">Address</label>
              <input type="text" className="form-control" disabled />
            </div>
            <div className="col-3">
              <label className="form-label">Sex</label>
              <input type="text" className="form-control" disabled />
            </div>
          </div>

          {/* Row 3 */}
          <div className="row mb-4">
            <div className="col-4">
              <label className="form-label">Contact Number</label>
              <input type="text" className="form-control" disabled />
            </div>
            <div className="col-8">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" disabled />
            </div>
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-action"
              onClick={handleChangePassword}
            >
              Change Password
            </button>
            <button type="button" className="btn btn-action">
              Edit Information
            </button>
            <button type="button" className="btn btn-action">
              Backup Data
            </button>
          </div>
        </form>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
