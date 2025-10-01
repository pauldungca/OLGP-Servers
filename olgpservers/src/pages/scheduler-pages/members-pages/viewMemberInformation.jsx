import React, { useEffect, useState, useCallback, useRef } from "react";
import { Breadcrumb, Spin } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import Swal from "sweetalert2";
import {
  formatContactNumber,
  fetchMemberData,
  confirmCancelEdit,
  fetchProvinces,
  fetchMunicipalities,
  fetchBarangays,
  removeAltarServer,
  removeLectorCommentator,
  editMemberInfo,
  editAltarServerRoles,
  editLectorCommentatorRoles,
  fetchAltarServerRoles,
  fetchLectorCommentatorRoles,
  deleteMemberImageFromBucket,
  clearMemberImage,
  updateMemberImage,
  uploadAndSaveMemberImage,
} from "../../../assets/scripts/viewMember";

// ⬇️ reuse the same UI helpers your addMember.jsx uses (UI-only)
import {
  handleFileChange,
  handleFileInputChange,
  handleRemoveImage,
} from "../../../assets/scripts/addMember";

import "../../../assets/styles/member.css";
import "../../../assets/styles/viewMemberInformation.css";

export default function ViewMemberInformation() {
  useEffect(() => {
    document.title = "OLGP Servers | Member";
  }, []);

  // ✅ fix wrong usage (`new useNavigate()` → `useNavigate()`)
  const navigate = useNavigate();

  const location = useLocation();
  const department = location.state?.department || "Members";
  const idNumber = location.state?.idNumber;

  const [imageRemoved, setImageRemoved] = useState(false);

  // States for member info
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRolesArray, setSelectedRolesArray] = useState([]);

  // Address compose flag
  const [addressDirty, setAddressDirty] = useState(false);

  // ⬇️ UI-only attachment state to mirror addMember.jsx
  const [imageFile, setImageFile] = useState(null);
  const [fileAttached, setFileAttached] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch member data
  // 1) loadMemberData (with cache-busted imageUrl for immediate refresh)
  const loadMemberData = useCallback(async () => {
    if (!idNumber) return;
    try {
      const { info, roleType } = await fetchMemberData(idNumber, department);

      let roles = [];
      if (department === "Altar Server") {
        roles = await fetchAltarServerRoles(idNumber);
      } else if (department === "Lector Commentator") {
        roles = await fetchLectorCommentatorRoles(idNumber);
      }

      setSelectedRolesArray(roles);
      setFirstName(info.firstName);
      setMiddleName(info.middleName || "");
      setLastName(info.lastName);
      setSex(info.sex);
      setEmail(info.email);
      setContactNumber(info.contactNumber || "");
      setDateJoined(info.dateJoined);
      setAddress(info.address);
      setSelectedRole(roleType);

      const uiImageUrl = info.imageUrl
        ? `${info.imageUrl}?t=${Date.now()}`
        : null;
      setImageUrl(uiImageUrl);

      setProvince(info.province || "");
      setMunicipality(info.municipality || "");
      setBarangay(info.barangay || "");
      setStreet(info.street || "");
      setHouseNumber(info.houseNumber || "");
    } catch (err) {
      console.error("Failed to load member:", err.message);
    } finally {
      setLoading(false);
    }
  }, [idNumber, department]);

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

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

    setAddress(fullAddress.trim());
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

  useEffect(() => {
    if (editMode) {
      fetchProvinces().then(setProvinces);
    }
  }, [editMode]);

  useEffect(() => {
    if (province) {
      fetchMunicipalities(province).then(setMunicipalities);
    } else {
      setMunicipalities([]);
    }
  }, [province]);

  useEffect(() => {
    if (municipality) {
      fetchBarangays(municipality).then(setBarangays);
    } else {
      setBarangays([]);
    }
  }, [municipality]);

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading member details..." />
      </div>
    );
  }

  // 2) handleSaveChanges (save info/roles first, then image; bust cache in UI)
  const handleSaveChanges = async () => {
    if (!selectedRole || selectedRole === "") {
      await Swal.fire({
        icon: "warning",
        title: "Role Required",
        text: "Please select a role before adding the member.",
      });
      return;
    }

    try {
      const infoSuccess = await editMemberInfo(
        idNumber,
        firstName,
        middleName,
        lastName,
        address,
        sex,
        email,
        contactNumber
      );
      if (!infoSuccess) return;

      let rolesSuccess = true;
      if (department === "Altar Server") {
        rolesSuccess = await editAltarServerRoles(idNumber, selectedRolesArray);
      } else if (department === "Lector Commentator") {
        rolesSuccess = await editLectorCommentatorRoles(
          idNumber,
          selectedRolesArray
        );
      }
      if (!rolesSuccess) return;

      if (imageRemoved && !imageFile) {
        await deleteMemberImageFromBucket(idNumber);
        await clearMemberImage(idNumber);
        setImageUrl(null);
      } else if (imageFile) {
        const newUrl = await uploadAndSaveMemberImage(idNumber, imageFile);
        if (!newUrl) return;

        const ok = await updateMemberImage(idNumber, newUrl);
        if (!ok) return;

        const cacheBuster = `${newUrl}${
          newUrl.includes("?") ? "&" : "?"
        }t=${Date.now()}`;
        setImageUrl(cacheBuster);

        setImageFile(null);
        setFileAttached(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

      setSelectedRolesArray((prev) => [...prev]);
      setEditMode(false);
      setAddressDirty(false);
      setImageRemoved(false);

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Member changes saved successfully.",
        confirmButtonText: "OK",
        reverseButtons: true,
      });
    } catch (err) {
      console.error("Error saving changes:", err);
    }
  };

  return (
    <div className="member-page-container">
      {/* Header */}
      <div className="member-header">
        <div className="header-text-with-line">
          <h3>VIEW MEMBER - {department.toUpperCase()}</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/members" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/membersList"
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
        <div className="attachment-container">
          {editMode ? (
            <>
              {(imageFile || (imageUrl && imageUrl.trim() !== "")) && (
                <div
                  className="preview-container mt-3"
                  style={{ position: "relative", display: "inline-block" }}
                >
                  <img
                    src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                    alt="Preview"
                    className="preview-img"
                  />

                  {/* show × button for BOTH new file & fetched image */}
                  <button
                    type="button"
                    onClick={() => {
                      if (imageFile) {
                        // user picked a new file → just clear that selection
                        handleRemoveImage(setImageFile, setFileAttached);
                        setImageRemoved(false); // not removing stored image
                      } else {
                        // user removed the fetched image → mark for deletion on Save
                        setImageUrl(null);
                        setImageRemoved(true);
                      }
                    }}
                    className="preview-btn"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* add/change button stays */}
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
                onChange={(e) => {
                  handleFileInputChange(e, setImageFile, setFileAttached);
                  setImageRemoved(false); // selecting a new file means not deleting on save
                }}
                accept=".jpg,.jpeg,.png"
                style={{ display: "none" }}
              />
            </>
          ) : (
            imageUrl &&
            imageUrl.trim() !== "" && (
              <div
                className="preview-container mt-3"
                style={{ position: "relative", display: "inline-block" }}
              >
                <img src={imageUrl} alt="Preview" className="preview-img" />
                <div className="attachment-labels">
                  <label className="file-label">Member Image</label>
                </div>
              </div>
            )
          )}
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
                onChange={(e) => setFirstName(e.target.value)}
                disabled={!editMode}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Middle Name</label>
              <input
                type="text"
                className="form-control"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                disabled={!editMode}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={!editMode}
              />
            </div>
          </div>

          {/* Row 2 - Only in Edit Mode */}
          {editMode && (
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
                  {provinces.map((prov) => (
                    <option key={prov.code} value={prov.code}>
                      {prov.name}
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
                  {municipalities.map((mun) => (
                    <option key={mun.code} value={mun.code}>
                      {mun.name}
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
                  {barangays.map((brgy) => (
                    <option key={brgy.code} value={brgy.code}>
                      {brgy.name}
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
                  onChange={(e) => {
                    setStreet(e.target.value);
                    setAddressDirty(true);
                  }}
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
          )}

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
                disabled={!editMode}
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
                disabled={!editMode}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-control"
                value={formatContactNumber(contactNumber)}
                onChange={(e) => setContactNumber(e.target.value)}
                disabled={!editMode}
              />
            </div>
          </div>

          {/* Row 5 */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Role</label>
              <select
                className="form-control"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={!editMode}
              >
                <option value="">Select Role</option>
                <option value="Flexible">Flexible</option>
                <option value="Non-Flexible">Non-Flexible</option>
              </select>
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

          {/* Role checkboxes */}
          <div className="role-options mt-3">
            {(department === "Altar Server"
              ? [
                  { label: "Candle Bearer", value: "CandleBearer" },
                  { label: "Beller", value: "Beller" },
                  { label: "Cross Bearer", value: "CrossBearer" },
                  { label: "Thurifer", value: "Thurifer" },
                  { label: "Incense Bearer", value: "IncenseBearer" },
                  {
                    label: "Main Servers (Book and Mic)",
                    value: "MainServers",
                  },
                  { label: "Plates", value: "Plates" },
                ]
              : [
                  { label: "Preface", value: "preface" },
                  { label: "Reading", value: "reading" },
                ]
            ).map((role) => (
              <label key={role.value}>
                <input
                  type="checkbox"
                  value={role.value}
                  disabled={!editMode}
                  checked={selectedRolesArray.includes(role.value)}
                  onChange={(e) => {
                    let updatedRoles;
                    if (e.target.checked) {
                      updatedRoles = [...selectedRolesArray, role.value];
                    } else {
                      updatedRoles = selectedRolesArray.filter(
                        (r) => r !== role.value
                      );
                    }

                    setSelectedRolesArray(updatedRoles);

                    const allRoles =
                      department === "Altar Server"
                        ? [
                            "CandleBearer",
                            "Beller",
                            "CrossBearer",
                            "Thurifer",
                            "IncenseBearer",
                            "MainServers",
                            "Plates",
                          ]
                        : ["preface", "reading"];

                    if (updatedRoles.length === allRoles.length) {
                      setSelectedRole("Flexible");
                    } else {
                      setSelectedRole("Non-Flexible");
                    }
                  }}
                />
                {role.label}
              </label>
            ))}
          </div>

          {/* Buttons */}
          <div className="d-flex gap-3 mt-4">
            {editMode ? (
              <>
                <button
                  type="button"
                  className="btn btn-danger flex-fill"
                  onClick={async () => {
                    const confirmed = await confirmCancelEdit();
                    if (confirmed) {
                      setEditMode(false);
                      setAddressDirty(false);
                      // clear the UI-only file picker
                      setImageFile(null);
                      setFileAttached(false);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }
                  }}
                >
                  Cancel Edit
                </button>
                <button
                  type="button"
                  className="btn btn-view flex-fill"
                  onClick={handleSaveChanges}
                >
                  Save Edit
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-danger flex-fill"
                  onClick={() => {
                    if (department === "Altar Server") {
                      removeAltarServer(
                        idNumber,
                        setLoading,
                        navigate,
                        department
                      );
                    } else if (department === "Lector Commentator") {
                      removeLectorCommentator(
                        idNumber,
                        setLoading,
                        navigate,
                        department
                      );
                    }
                  }}
                >
                  Remove Member
                </button>
                <button
                  type="button"
                  className="btn btn-view flex-fill"
                  onClick={() => setEditMode(true)}
                >
                  Edit Member
                </button>
              </>
            )}
          </div>
        </div>
      </form>

      <Footer />
    </div>
  );
}
