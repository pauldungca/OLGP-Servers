// src/pages/account/account.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import images from "../../helper/images";
import Footer from "../../components/footer";

import {
  fetchMemberInformation,
  editMemberInfo,
} from "../../assets/scripts/account";

import {
  isEucharisticMinisterScheduler,
  isChoirScheduler,
} from "../../assets/scripts/group";

import {
  isAltarServerScheduler,
  isLectorCommentatorScheduler,
} from "../../assets/scripts/member";

// From addMember helpers
import {
  handleContactNumberChange,
  handleFileInputChange,
  handleFileChange,
  handleRemoveImage,
  getProvinces,
  getMunicipalities,
  getBarangays,
} from "../../assets/scripts/addMember";

// From viewMember.js (your attachment logic)
import {
  uploadAndSaveMemberImage,
  updateMemberImage,
  clearMemberImage,
  deleteMemberImageFromBucket,
} from "../../assets/scripts/viewMember";

import "../../assets/styles/account.css";

export default function Account() {
  useEffect(() => {
    document.title = "OLGP Servers | Account";
  }, []);

  const navigate = useNavigate();
  const storedIdNumber = localStorage.getItem("idNumber");

  // role gates
  const [isEucharisticMinister, setIsEucharisticMinister] = useState(false);
  const [isChoir, setIsChoir] = useState(false);
  const [isAltarServer, setIsAltarServer] = useState(false);
  const [isLectorCommentator, setIsLectorCommentator] = useState(false);

  // ui
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // member fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  // PSGC fields
  const [houseNumber, setHouseNumber] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [addressDirty, setAddressDirty] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // image attach state
  const fileInputRef = React.useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [fileAttached, setFileAttached] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [, setOriginalImageUrl] = useState(null);

  // figure out scheduler roles
  useEffect(() => {
    const init = async () => {
      const euch = await isEucharisticMinisterScheduler(storedIdNumber);
      const choir = await isChoirScheduler(storedIdNumber);
      const altar = await isAltarServerScheduler(storedIdNumber);
      const lector = await isLectorCommentatorScheduler(storedIdNumber);

      setIsEucharisticMinister(euch);
      setIsChoir(choir);
      setIsAltarServer(altar);
      setIsLectorCommentator(lector);
    };
    init();
  }, [storedIdNumber]);

  const isAnyScheduler =
    isEucharisticMinister || isChoir || isAltarServer || isLectorCommentator;

  const canEditAll = editMode && isAnyScheduler; // schedulers: full edit (incl. image)
  const canEditEmailOnly = editMode && !isAnyScheduler; // non-schedulers: email only

  // Load member
  const loadMember = useCallback(async () => {
    if (!storedIdNumber) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const info = await fetchMemberInformation(storedIdNumber);
      if (!info) return;

      setFirstName(info.firstName || "");
      setMiddleName(info.middleName || "");
      setLastName(info.lastName || "");
      setSex(info.sex || "");
      setEmail(info.email || "");
      setContactNumber(info.contactNumber || "");
      setAddress(info.address || "");
      setDateJoined(info.dateJoined || "");
      setImageUrl(info.imageUrl || null);
      setOriginalImageUrl(info.imageUrl || null);

      // reset local image state
      setImageFile(null);
      setFileAttached(false);
      setDeleteRequested(false);
    } catch (err) {
      console.error("Failed to load account info:", err);
    } finally {
      setLoading(false);
    }
  }, [storedIdNumber]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  // PSGC fetch chains
  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() => setProvinces([]));
  }, []);
  useEffect(() => {
    if (province) {
      getMunicipalities(province)
        .then(setMunicipalities)
        .catch(() => setMunicipalities([]));
    } else {
      setMunicipalities([]);
      setMunicipality("");
      setBarangays([]);
      setBarangay("");
    }
  }, [province]);
  useEffect(() => {
    if (municipality) {
      getBarangays(municipality)
        .then(setBarangays)
        .catch(() => setBarangays([]));
    } else {
      setBarangays([]);
      setBarangay("");
    }
  }, [municipality]);

  // build full address from PSGC bits
  useEffect(() => {
    if (!addressDirty) return;
    const provinceName = provinces.find((p) => p.code === province)?.name || "";
    const municipalityName =
      municipalities.find((m) => m.code === municipality)?.name || "";
    const barangayName = barangays.find((b) => b.code === barangay)?.name || "";

    const fullAddress = `${houseNumber ? houseNumber + ", " : ""}${
      street ? street + ", " : ""
    }${barangayName ? barangayName + ", " : ""}${
      municipalityName ? municipalityName + ", " : ""
    }${provinceName}`;
    setAddress(fullAddress);
  }, [
    houseNumber,
    street,
    barangay,
    municipality,
    province,
    provinces,
    municipalities,
    barangays,
    addressDirty,
  ]);

  // actions
  const handleEdit = () => {
    setEditMode(true);
    setDeleteRequested(false);
  };

  const handleCancelEdit = async () => {
    const cancel = await Swal.fire({
      title: "Cancel Editing?",
      text: "Discard your changes?",
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: "Yes, cancel",
    });
    if (!cancel.isConfirmed) return;

    await loadMember();
    setEditMode(false);
    setDeleteRequested(false);
  };

  const handleSave = async () => {
    if (!storedIdNumber) return;

    try {
      // Save textual fields first
      const ok = await editMemberInfo(
        storedIdNumber,
        firstName,
        middleName,
        lastName,
        address,
        sex,
        email,
        contactNumber
      );
      if (!ok) return;

      if (deleteRequested) {
        await clearMemberImage(storedIdNumber);
        await deleteMemberImageFromBucket(storedIdNumber);
        setImageUrl(null);
      }

      if (imageFile) {
        const publicUrl = await uploadAndSaveMemberImage(
          storedIdNumber,
          imageFile
        );
        await updateMemberImage(storedIdNumber, publicUrl);

        if (!publicUrl) {
          await Swal.fire({
            icon: "error",
            title: "Upload failed",
            text: "Please try again.",
          });
          return;
        }
        await updateMemberImage(storedIdNumber, publicUrl);
        setImageUrl(publicUrl);
      }

      await Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Your information was updated.",
      });

      window.location.reload();
    } catch (err) {
      console.error("Image save error:", err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update your profile photo.",
      });
    }
  };

  const handleChangePassword = () => navigate("/verifyOTPAccount");

  const headerFullName = [
    firstName || "",
    middleName ? `${middleName[0].toUpperCase()}.` : "",
    lastName || "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (loading) {
    return (
      <div
        className="account-page-container d-flex align-items-center justify-content-center"
        style={{ minHeight: 300 }}
      >
        Loading account…
      </div>
    );
  }

  return (
    <div className="account-page-container">
      <div className="account-header">
        <div className="header-text-with-line">
          <h3>ACCOUNT</h3>
          <div className="header-line"></div>
        </div>
      </div>

      <div className="account-content">
        {/* View header only when NOT editing */}
        {!editMode && (
          <div className="d-flex align-items-center mb-4">
            <img
              src={imageUrl || images.accountImage}
              alt="Profile"
              className="profile-image"
            />
            <div className="ms-3">
              <h4 className="fw-bold fs-3 m-0">{headerFullName || "Member"}</h4>
              <small className="text-muted">ID: {storedIdNumber}</small>
            </div>
          </div>
        )}

        {/* Image attach controls — only schedulers in edit mode */}
        {editMode && isAnyScheduler && (
          <div className="attachment-container mb-4">
            {(imageFile || imageUrl) && (
              <div className="preview-container mt-2">
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                  alt="Preview"
                  className="preview-img"
                />
                <button
                  type="button"
                  className="preview-btn"
                  aria-label="Remove selected image"
                  onClick={() => {
                    if (imageFile) {
                      // just clear pending file
                      handleRemoveImage(setImageFile, setFileAttached);
                      return;
                    }
                    // mark existing image for deletion and clear preview
                    setDeleteRequested(true);
                    setImageUrl(null);
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Round Add/Change button */}
            <button
              type="button"
              className="add-image-btn"
              onClick={(e) => handleFileChange(e, fileInputRef)}
              title={imageUrl || imageFile ? "Change Photo" : "Add Photo"}
              aria-label={imageUrl || imageFile ? "Change Photo" : "Add Photo"}
            >
              <svg viewBox="0 0 24 24" className="icon-img" aria-hidden="true">
                <path d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5V6a1 1 0 0 1 1-1z"></path>
              </svg>
            </button>

            {/* Labels */}
            <div className="attachment-labels">
              <span className="file-label">Attach file here</span>
              {fileAttached && (
                <span className="file-success">File attached!</span>
              )}
              {deleteRequested && (
                <span className="text-danger" style={{ marginTop: 2 }}>
                  Photo will be deleted on Save
                </span>
              )}
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) =>
                handleFileInputChange(e, setImageFile, setFileAttached)
              }
              accept=".jpg,.jpeg,.png,.webp"
              style={{ display: "none" }}
            />
          </div>
        )}

        {/* FORM */}
        <form>
          {canEditAll ? (
            <>
              {/* Row 1 — Names */}
              <div className="row mb-3">
                <div className="col">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="col">
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
                <div className="col">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2 — PSGC pickers */}
              <div className="row mb-3">
                <div className="col-md-2">
                  <label className="form-label">Province</label>
                  <select
                    className="form-control"
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      setAddressDirty(true);
                    }}
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
                    value={municipality}
                    onChange={(e) => {
                      setMunicipality(e.target.value);
                      setAddressDirty(true);
                    }}
                    disabled={!province}
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
                    value={barangay}
                    onChange={(e) => {
                      setBarangay(e.target.value);
                      setAddressDirty(true);
                    }}
                    disabled={!municipality}
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map((b) => (
                      <option key={b.code} value={b.code}>
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
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">House Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={houseNumber}
                    onChange={(e) => {
                      setHouseNumber(e.target.value);
                      setAddressDirty(true);
                    }}
                  />
                </div>
              </div>

              {/* Row 3 — Full Address + Date Joined */}
              <div className="row mb-3">
                <div className="col-8">
                  <label className="form-label">Full Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={address}
                    disabled
                  />
                </div>
                <div className="col-4">
                  <label className="form-label">Date Joined</label>
                  <input
                    type="text"
                    className="form-control"
                    value={dateJoined}
                    disabled
                  />
                </div>
              </div>

              {/* Row 4 — Sex / Email / Contact */}
              <div className="row mb-4">
                <div className="col-3">
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
                <div className="col-5">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={contactNumber}
                    onChange={(e) =>
                      handleContactNumberChange(e, setContactNumber)
                    }
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={13}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* VIEW MODE / non-scheduler */}
              <div className="row mb-3">
                <div className="col">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={firstName}
                    disabled
                  />
                </div>
                <div className="col">
                  <label className="form-label">Middle Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={middleName}
                    disabled
                  />
                </div>
                <div className="col">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={lastName}
                    disabled
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-8">
                  <label className="form-label">Full Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={address}
                    disabled
                  />
                </div>
                <div className="col-4">
                  <label className="form-label">Date Joined</label>
                  <input
                    type="text"
                    className="form-control"
                    value={dateJoined}
                    disabled
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-3">
                  <label className="form-label">Sex</label>
                  <input
                    type="text"
                    className="form-control"
                    value={sex}
                    disabled
                  />
                </div>
                <div className="col-5">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!canEditEmailOnly}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={contactNumber}
                    onChange={(e) =>
                      handleContactNumberChange(e, setContactNumber)
                    }
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={13}
                    disabled
                  />
                </div>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-2">
            {!editMode ? (
              <>
                <button
                  type="button"
                  className="btn btn-action"
                  onClick={handleChangePassword}
                >
                  Change Password
                </button>
                <button
                  type="button"
                  className="btn btn-action"
                  onClick={handleEdit}
                >
                  Edit Information
                </button>
                <button type="button" className="btn btn-action">
                  Backup Data
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-action"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-action"
                  onClick={handleSave}
                >
                  Save
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
