import React, { useEffect, useRef, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import Footer from "../../../components/footer";
import icon from "../../../helper/icon";
import Swal from "sweetalert2";

import {
  // UI helpers
  generateUserID,
  handleContactNumberChange,
  handleFileChange,
  handleFileInputChange,
  handleRemoveImage,
  // PSGC via axios.js
  getProvinces as fetchProvinces,
  getMunicipalities as fetchMunicipalities,
  getBarangays as fetchBarangays,
  // DB helpers (same flow as AddMember.jsx)
  addMember,
  addMemberAuthentication,
  defineUserType,
  saveEucharisticMinisterGroup,
  saveChoirMemberGroup,
  // ⬇️ image helpers copied from your addMember flow
  uploadAndSaveMemberImage,
  updateMemberImage,
} from "../../../assets/scripts/addMember";

import "../../../assets/styles/member.css";
import "../../../assets/styles/addMember.css";

export default function GroupAddMember() {
  useEffect(() => {
    document.title = "OLGP Servers | Groups";
  }, []);

  const location = useLocation();
  const { department, group } = location.state || {};

  // File/image UI state
  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [fileAttached, setFileAttached] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Address state
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [address, setAddress] = useState("");

  // Meta fields
  const [dateJoined, setDateJoined] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // ---- PSGC (via addMember.js -> axios.js)
  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .catch((e) => console.error("Provinces error:", e));
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetchMunicipalities(selectedProvince)
        .then(setMunicipalities)
        .catch((e) => console.error("Municipalities error:", e));
    } else {
      setMunicipalities([]);
      setSelectedMunicipality("");
      setBarangays([]);
      setSelectedBarangay("");
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedMunicipality) {
      fetchBarangays(selectedMunicipality)
        .then(setBarangays)
        .catch((e) => console.error("Barangays error:", e));
    } else {
      setBarangays([]);
      setSelectedBarangay("");
    }
  }, [selectedMunicipality]);

  // ---- Build full address (includes Street)
  useEffect(() => {
    const provinceName =
      provinces.find((p) => p.code === selectedProvince)?.name || "";
    const municipalityName =
      municipalities.find((m) => m.code === selectedMunicipality)?.name || "";
    const barangayName =
      barangays.find((b) => b.name === selectedBarangay)?.name ||
      selectedBarangay ||
      "";

    const parts = [];
    if (houseNumber) parts.push(houseNumber);
    if (street) parts.push(street);
    if (barangayName) parts.push(barangayName);
    if (municipalityName) parts.push(municipalityName);
    if (provinceName) parts.push(provinceName);

    setAddress(parts.join(", ").trim());
  }, [
    houseNumber,
    street,
    selectedBarangay,
    selectedMunicipality,
    selectedProvince,
    provinces,
    municipalities,
    barangays,
  ]);

  // ---- Default date & generated ID
  useEffect(() => {
    const today = new Date();
    const formattedDate = `${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}-${today.getFullYear()}`;
    setDateJoined(formattedDate);
    setIdNumber(generateUserID());
  }, []);

  // ---- Submit handler (DB flow like AddMember.jsx + group save + image upload)
  const handleAdd = async (e) => {
    e.preventDefault();

    const isAdded = await addMember(
      idNumber,
      firstName,
      middleName,
      lastName,
      address,
      dateJoined,
      sex,
      email,
      contactNumber,
      null
    );

    if (!isAdded) return;

    try {
      // Auth + user type
      await addMemberAuthentication(idNumber, "olgp2025-2026", email);
      await defineUserType(idNumber, department);

      // Save group depending on department
      if (department === "Eucharistic Minister") {
        await saveEucharisticMinisterGroup(idNumber, group || "Group 1");
      } else if (department === "Choir") {
        await saveChoirMemberGroup(idNumber, group || "Group 1");
      }

      // Upload image (optional) then update DB with public URL
      if (imageFile) {
        const url = await uploadAndSaveMemberImage(idNumber, imageFile);
        if (!url) {
          await Swal.fire({
            icon: "error",
            title: "Upload failed",
            text: "Please try again.",
          });
          return;
        }
        await updateMemberImage(idNumber, url);
      }

      // Reset UI
      setFirstName("");
      setMiddleName("");
      setLastName("");
      setSex("");
      setEmail("");
      setContactNumber("");
      setHouseNumber("");
      setStreet("");
      setSelectedProvince("");
      setSelectedMunicipality("");
      setSelectedBarangay("");
      setAddress("");
      setImageFile(null);
      setFileAttached(false);
      setIdNumber(generateUserID());
    } catch (err) {
      console.error("Group add flow error:", err);
      await Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Operation failed: " + err.message,
      });
    }
  };

  return (
    <div className="member-page-container">
      <div className="member-header">
        <div className="header-text-with-line">
          <h3>
            GROUP - {department?.toUpperCase()} -{" "}
            {String(group || "").toUpperCase()}
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
                  title: (
                    <Link
                      to="/groupMembersList"
                      state={{ department, group }}
                      className="breadcrumb-item"
                    >
                      Members
                    </Link>
                  ),
                },
                { title: "Add Member", className: "breadcrumb-item-active" },
              ]}
              separator={
                <img
                  src={icon.chevronIcon}
                  alt="Chevron Icon"
                  style={{ width: 15, height: 15 }}
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
          {imageFile && (
            <div
              className="preview-container mt-3"
              style={{ position: "relative", display: "inline-block" }}
            >
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="preview-img"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(setImageFile, setFileAttached)}
                className="preview-btn"
              >
                ×
              </button>
            </div>
          )}

          <button
            type="button"
            className="add-image-btn"
            onClick={(e) => handleFileChange(e, fileInputRef)}
          >
            <img src={icon.addImageIcon} alt="Add" className="icon-img" />
          </button>

          <div className="attachment-labels">
            <label className="file-label">Attach image here</label>
            {fileAttached && (
              <span className="file-success">File attached!</span>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) =>
              handleFileInputChange(e, setImageFile, setFileAttached)
            }
            accept=".jpg,.jpeg,.png"
            style={{ display: "none" }}
          />
        </div>

        {/* Main Form */}
        <div className="member-form mt-4">
          {/* Row 1 */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Middle Name <span className="text-muted">(Optional)</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2 (Province - Municipality - Barangay - Street - House Number) */}
          <div className="row mb-3">
            <div className="col-md-2">
              <label className="form-label">Province</label>
              <select
                className="form-control"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">Select Province</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Municipality</label>
              <select
                className="form-control"
                value={selectedMunicipality}
                onChange={(e) => setSelectedMunicipality(e.target.value)}
                disabled={!selectedProvince}
              >
                <option value="">Select Municipality</option>
                {municipalities.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Barangay</label>
              <select
                className="form-control"
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                disabled={!selectedMunicipality}
              >
                <option value="">Select Barangay</option>
                {barangays.map((b) => (
                  <option key={b.code} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Street</label>
              <input
                type="text"
                className="form-control"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g., Mabini St."
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">House Number</label>
              <input
                type="text"
                className="form-control"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="e.g., 123-B"
              />
            </div>
          </div>

          {/* Row 3 */}
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

          {/* Row 4 */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Sex</label>
              <select
                className="form-control"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-control"
                value={contactNumber}
                onChange={(e) => handleContactNumberChange(e, setContactNumber)}
                maxLength={13}
                placeholder="0000 000 0000"
              />
            </div>
          </div>

          {/* Row 5 */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Group Number</label>
              <input
                type="text"
                className="form-control"
                value={group || ""}
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

          <button
            type="button"
            className="btn btn-add mt-4"
            onClick={handleAdd}
          >
            Add Member
          </button>
        </div>
      </form>

      <Footer />
    </div>
  );
}
