import React, { useEffect, useState, useRef } from "react";
import { Breadcrumb, Spin } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import Swal from "sweetalert2";

import {
  getProvinces as fetchProvinces,
  getMunicipalities as fetchMunicipalities,
  getBarangays as fetchBarangays,
  // ⬇️ UI-only helpers reused for image picker UX
  handleFileChange,
  handleFileInputChange,
  handleRemoveImage,
} from "../../../assets/scripts/addMember";

import {
  formatContactNumber,
  fetchMemberData,
  editEucharisticMinisterGroup,
  editChoirMemberGroup,
  editMemberInfo,
  ensureValidGroupSelection,
  removeEucharisticMinister,
  removeChoirMember,
  confirmCancelEdit,
  // ⬇️ image storage helpers (delete/clear/update/upload)
  deleteMemberImageFromBucket,
  clearMemberImage,
  updateMemberImage,
  uploadAndSaveMemberImage,
} from "../../../assets/scripts/viewMember";

import {
  fetchEucharisticMinisterGroups,
  fetchChoirGroups,
} from "../../../assets/scripts/group";

import "../../../assets/styles/member.css";
import "../../../assets/styles/viewMemberInformation.css";

export default function GroupViewMemberInformation() {
  useEffect(() => {
    document.title = "OLGP Servers | Group Member";
  }, []);

  const location = useLocation();
  const { department, group } = location.state || {};
  const idNumber = location.state?.idNumber;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Member info
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  // Group drop-down
  const [groupNumber, setGroupNumber] = useState(group || "");
  const [emGroups, setEmGroups] = useState([]);
  const [choirGroups, setChoirGroups] = useState([]);

  // Address edit states
  const [editMode, setEditMode] = useState(false);
  const [addressDirty, setAddressDirty] = useState(false);
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");

  // PSGC lists
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Image edit state
  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [fileAttached, setFileAttached] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false);

  // Fetch member data
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!idNumber || !department) {
        setLoading(false);
        return;
      }

      try {
        const { info, groupName } = await fetchMemberData(idNumber, department);
        if (!mounted || !info) {
          setLoading(false);
          return;
        }

        setFirstName(info.firstName || "");
        setMiddleName(info.middleName || "");
        setLastName(info.lastName || "");
        setSex(info.sex || "");
        setEmail(info.email || "");
        setContactNumber(info.contactNumber || "");
        setDateJoined(info.dateJoined || "");
        setAddress(info.address || "");

        // cache-buster for immediate refresh after save
        const uiUrl = info.imageUrl ? `${info.imageUrl}?t=${Date.now()}` : null;
        setImageUrl(uiUrl);

        setProvince(info.province || "");
        setMunicipality(info.municipality || "");
        setBarangay(info.barangay || "");
        setStreet(info.street || "");
        setHouseNumber(info.houseNumber || "");

        setGroupNumber(groupName || group || "");
      } catch (e) {
        console.error("Failed to fetch group member:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [idNumber, department, group]);

  // Load EM groups
  useEffect(() => {
    let mounted = true;
    const loadEmGroups = async () => {
      if (department === "Eucharistic Minister") {
        try {
          const groups = await fetchEucharisticMinisterGroups();
          if (!mounted) return;
          const list = Array.isArray(groups) ? groups : [];
          setEmGroups(list);
          setGroupNumber((prev) => ensureValidGroupSelection(list, prev));
        } catch (e) {
          console.error("Failed to load EM groups:", e);
          if (mounted) setEmGroups([]);
        }
      }
    };
    loadEmGroups();
    return () => {
      mounted = false;
    };
  }, [department]);

  // Load Choir groups
  useEffect(() => {
    let mounted = true;
    const loadChoirGroups = async () => {
      if (department === "Choir") {
        try {
          const groups = await fetchChoirGroups();
          if (!mounted) return;
          const list = Array.isArray(groups) ? groups : [];
          setChoirGroups(list);

          // Ensure groupNumber stores an abbreviation
          setGroupNumber((prev) => {
            const abbrs = list.map((g) => g.abbreviation);
            if (abbrs.includes(prev)) return prev;
            const match = list.find((g) => g.name === prev);
            if (match) return match.abbreviation;
            return abbrs[0] || "";
          });
        } catch (e) {
          console.error("Failed to load Choir groups:", e);
          if (mounted) setChoirGroups([]);
        }
      }
    };
    loadChoirGroups();
    return () => {
      mounted = false;
    };
  }, [department]);

  // Address recompute (includes Street)
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

  // PSGC loads
  useEffect(() => {
    if (editMode) {
      fetchProvinces()
        .then(setProvinces)
        .catch(() => setProvinces([]));
    }
  }, [editMode]);

  useEffect(() => {
    if (province) {
      fetchMunicipalities(province)
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
      fetchBarangays(municipality)
        .then(setBarangays)
        .catch(() => setBarangays([]));
    } else {
      setBarangays([]);
      setBarangay("");
    }
  }, [municipality]);

  const handleSave = async () => {
    if (!idNumber) return;

    try {
      setSaving(true);

      const normalizedContact = String(contactNumber || "")
        .replace(/\D/g, "")
        .slice(0, 11);

      // 1) Basic info save
      const infoOk = await editMemberInfo(
        idNumber,
        firstName,
        middleName,
        lastName,
        address,
        sex,
        email,
        normalizedContact
      );
      if (!infoOk) {
        setSaving(false);
        return;
      }

      // 2) Group mapping save
      let groupOk = true;
      if (department === "Eucharistic Minister") {
        const validNames = emGroups.map((g) => g.name);
        if (!groupNumber || !validNames.includes(groupNumber)) {
          await Swal.fire({
            icon: "error",
            title: "Invalid Group",
            text: "Please select a valid group from the list.",
          });
          setSaving(false);
          return;
        }
        groupOk = await editEucharisticMinisterGroup(idNumber, groupNumber);
      } else if (department === "Choir") {
        const validAbbrs = choirGroups.map((g) => g.abbreviation);
        if (!groupNumber || !validAbbrs.includes(groupNumber)) {
          await Swal.fire({
            icon: "error",
            title: "Invalid Group",
            text: "Please select a valid group from the list.",
          });
          setSaving(false);
          return;
        }
        groupOk = await editChoirMemberGroup(idNumber, groupNumber);
      }

      if (!groupOk) {
        setSaving(false);
        return;
      }

      // 3) Image operations
      if (imageRemoved && !imageFile) {
        // delete any existing from bucket + clear DB
        await deleteMemberImageFromBucket(idNumber);
        await clearMemberImage(idNumber);
        setImageUrl(null);
      } else if (imageFile) {
        const newUrl = await uploadAndSaveMemberImage(idNumber, imageFile);
        if (!newUrl) {
          setSaving(false);
          return;
        }
        const ok = await updateMemberImage(idNumber, newUrl);
        if (!ok) {
          setSaving(false);
          return;
        }
        // cache-bust so the preview refreshes immediately
        const bust = `${newUrl}${
          newUrl.includes("?") ? "&" : "?"
        }t=${Date.now()}`;
        setImageUrl(bust);
        setImageFile(null);
        setFileAttached(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

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
      console.error("Save error:", err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unexpected error while saving. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading group member..." />
      </div>
    );
  }

  return (
    <div className="member-page-container">
      {/* Header */}
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
                { title: "View Member", className: "breadcrumb-item-active" },
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
        {/* Image area */}
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
                  <button
                    type="button"
                    onClick={() => {
                      if (imageFile) {
                        handleRemoveImage(setImageFile, setFileAttached);
                        setImageRemoved(false);
                      } else {
                        // mark for deletion on save
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
                  setImageRemoved(false);
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
                  <label className="file-label">Group Member Image</label>
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

          {/* Row 2 — Address pickers only in edit mode */}
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

          {/* Row 5 — Group Number + User ID */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Group Number</label>
              {department === "Eucharistic Minister" ? (
                <select
                  className="form-control"
                  value={groupNumber || ""}
                  onChange={(e) => setGroupNumber(e.target.value)}
                  disabled={!editMode}
                  required
                >
                  <option value="" disabled>
                    — Select Group —
                  </option>
                  {emGroups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              ) : department === "Choir" ? (
                <select
                  className="form-control"
                  value={groupNumber || ""}
                  onChange={(e) => setGroupNumber(e.target.value)}
                  disabled={!editMode}
                  required
                >
                  <option value="" disabled>
                    — Select Group —
                  </option>
                  {choirGroups.map((g) => (
                    <option key={g.id} value={g.abbreviation}>
                      {g.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={groupNumber || ""}
                  disabled
                />
              )}
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
                      // reset image edit state too
                      setEditMode(false);
                      setAddressDirty(false);
                      setImageRemoved(false);
                      setImageFile(null);
                      setFileAttached(false);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }
                  }}
                  disabled={saving}
                >
                  Cancel Edit
                </button>
                <button
                  type="button"
                  className="btn btn-view flex-fill"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Edit"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-danger flex-fill"
                  onClick={() => {
                    if (department === "Eucharistic Minister") {
                      removeEucharisticMinister(
                        idNumber,
                        setLoading,
                        navigate,
                        department,
                        group
                      );
                    } else if (department === "Choir") {
                      removeChoirMember(
                        idNumber,
                        setLoading,
                        navigate,
                        department,
                        group
                      );
                    } else {
                      Swal.fire({
                        icon: "error",
                        title: "Unknown Department",
                        text: "Cannot remove member: unsupported department.",
                      });
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
