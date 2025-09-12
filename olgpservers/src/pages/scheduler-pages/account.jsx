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

import {
  getProvinces,
  getMunicipalities,
  getBarangays,
  handleContactNumberChange,
} from "../../assets/scripts/addMember";

import "../../assets/styles/account.css";

export default function Account() {
  useEffect(() => {
    document.title = "OLGP Servers | Account";
  }, []);

  const navigate = useNavigate();
  const storedIdNumber = localStorage.getItem("idNumber");

  const [isEucharisticMinister, setIsEucharisticMinister] = useState(false);
  const [isChoir, setIsChoir] = useState(false);
  const [isAltarServer, setIsAltarServer] = useState(false);
  const [isLectorCommentator, setIsLectorCommentator] = useState(false);

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const [houseNumber, setHouseNumber] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [addressDirty, setAddressDirty] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  useEffect(() => {
    const initializeMemberData = async () => {
      const eucharisticMinisterStatus = await isEucharisticMinisterScheduler(
        storedIdNumber
      );
      const choirStatus = await isChoirScheduler(storedIdNumber);
      const serverStatus = await isAltarServerScheduler(storedIdNumber);
      const lectorStatus = await isLectorCommentatorScheduler(storedIdNumber);

      setIsAltarServer(serverStatus);
      setIsLectorCommentator(lectorStatus);
      setIsEucharisticMinister(eucharisticMinisterStatus);
      setIsChoir(choirStatus);
    };
    initializeMemberData();
  }, [storedIdNumber]);

  const isAnyScheduler =
    isEucharisticMinister || isChoir || isAltarServer || isLectorCommentator;

  const canEditAll = editMode && isAnyScheduler; // schedulers in edit: full edit
  const canEditEmailOnly = editMode && !isAnyScheduler; // member-only in edit: email only

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
    } catch (err) {
      console.error("Failed to load account info:", err);
    } finally {
      setLoading(false);
    }
  }, [storedIdNumber]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  useEffect(() => {
    if (canEditAll) {
      getProvinces()
        .then(setProvinces)
        .catch(() => setProvinces([]));
    }
  }, [canEditAll]);

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

  useEffect(() => {
    if (!addressDirty) return;

    const provinceName = provinces.find((p) => p.code === province)?.name || "";
    const municipalityName =
      municipalities.find((m) => m.code === municipality)?.name || "";
    const barangayName = barangays.find((b) => b.code === barangay)?.name || "";

    const fullAddress = `${houseNumber ? houseNumber + ", " : ""}${
      barangayName ? barangayName + ", " : ""
    }${municipalityName ? municipalityName + ", " : ""}${provinceName}`.trim();

    setAddress(fullAddress);
  }, [
    houseNumber,
    barangay,
    municipality,
    province,
    provinces,
    municipalities,
    barangays,
    addressDirty,
  ]);

  const handleChangePassword = () => navigate("/verifyOTPAccount");

  const handleEdit = () => {
    setEditMode(true);
    setAddressDirty(false);
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
    setAddressDirty(false);
  };

  const handleSave = async () => {
    if (!storedIdNumber) return;

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

    if (ok) {
      await loadMember();
      setEditMode(false);
      setAddressDirty(false);
    }
  };

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
        {/* Profile */}
        <div className="d-flex align-items-center mb-4">
          <img
            src={imageUrl || images.accountImage}
            alt="Profile"
            className="profile-image"
          />
          <div>
            {!editMode && (
              <div>
                <h4 className="fw-bold fs-3 m-0">
                  {headerFullName || "Member"}
                </h4>
                <small className="text-muted">ID: {storedIdNumber}</small>
              </div>
            )}
          </div>
        </div>

        {/* FORM */}
        <form>
          {canEditAll ? (
            <>
              {/* EDIT MODE (Scheduler) */}

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
                  <label className="form-label">Middle Name</label>
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
                <div className="col-3">
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
                <div className="col-3">
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
                <div className="col-3">
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
                <div className="col-3">
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
              {/* NOT EDIT MODE (and Member-only edit layout) */}

              {/* Row 1 — Names */}
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

              {/* Row 2 — Full Address + Date Joined */}
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

              {/* Row 3 — Sex / Email / Contact (email editable only if member in edit) */}
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
