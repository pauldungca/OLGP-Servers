import React, { useEffect, useState } from "react";
import { Breadcrumb, Spin } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";
import Swal from "sweetalert2";

import {
  getProvinces as fetchProvinces,
  getMunicipalities as fetchMunicipalities,
  getBarangays as fetchBarangays,
} from "../../../assets/scripts/addMember";

import {
  formatContactNumber,
  fetchMemberData,
  editEucharisticMinisterGroup,
  editMemberInfo,
  ensureValidGroupSelection,
  removeEucharisticMinister,
} from "../../../assets/scripts/viewMember";

import { fetchEucharisticMinisterGroups } from "../../../assets/scripts/group";

import "../../../assets/styles/member.css";
import "../../../assets/styles/viewMemberInformation.css";

export default function GroupViewMemberInformation() {
  useEffect(() => {
    document.title = "OLGP Servers | Group Member";
  }, []);

  const location = useLocation();
  const { department, group } = location.state || {};
  const idNumber = location.state?.idNumber;
  const navigate = new useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const [groupNumber, setGroupNumber] = useState(group || "");
  const [emGroups, setEmGroups] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [addressDirty, setAddressDirty] = useState(false);

  const [houseNumber, setHouseNumber] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");

  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

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

        // Basic info
        setFirstName(info.firstName || "");
        setMiddleName(info.middleName || "");
        setLastName(info.lastName || "");
        setSex(info.sex || "");
        setEmail(info.email || "");
        setContactNumber(info.contactNumber || "");
        setDateJoined(info.dateJoined || "");
        setAddress(info.address || "");
        setImageUrl(info.imageUrl || null);

        // Address codes (if stored)
        setProvince(info.province || "");
        setMunicipality(info.municipality || "");
        setBarangay(info.barangay || "");
        setHouseNumber(info.houseNumber || "");

        // EM group name
        setGroupNumber(groupName || group || "");
      } catch (e) {
        console.error("Failed to fetch EM member:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [idNumber, department, group]);

  // Load list of EM groups on mount and when department is EM
  useEffect(() => {
    let mounted = true;

    const loadGroups = async () => {
      if (department !== "Eucharistic Minister") return;
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
    };

    loadGroups();
    return () => {
      mounted = false;
    };
  }, [department]);

  useEffect(() => {
    let mounted = true;
    const maybeReloadGroups = async () => {
      if (editMode && department === "Eucharistic Minister") {
        try {
          const groups = await fetchEucharisticMinisterGroups();
          if (!mounted) return;
          const list = Array.isArray(groups) ? groups : [];
          setEmGroups(list);
          setGroupNumber((prev) => ensureValidGroupSelection(list, prev));
        } catch (e) {
          console.error("Failed to reload EM groups:", e);
          if (mounted) setEmGroups([]);
        }
      }
    };
    maybeReloadGroups();
    return () => {
      mounted = false;
    };
  }, [editMode, department]);

  useEffect(() => {
    if (!addressDirty) return;

    const provinceName = provinces.find((p) => p.code === province)?.name || "";
    const municipalityName =
      municipalities.find((m) => m.code === municipality)?.name || "";
    const barangayName = barangays.find((b) => b.code === barangay)?.name || "";

    const fullAddress = `${houseNumber ? houseNumber + ", " : ""}${
      barangayName ? barangayName + ", " : ""
    }${municipalityName ? municipalityName + ", " : ""}${provinceName}`;

    setAddress(fullAddress.trim());
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

  // Load provinces only when entering edit mode
  useEffect(() => {
    if (editMode) {
      fetchProvinces()
        .then(setProvinces)
        .catch(() => setProvinces([]));
    }
  }, [editMode]);

  // Load municipalities when province changes
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

  // Load barangays when municipality changes
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

    const confirm = await Swal.fire({
      icon: "question",
      title: "Save changes?",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);

      // normalize phone: digits only up to 11
      const normalizedContact = String(contactNumber || "")
        .replace(/\D/g, "")
        .slice(0, 11);

      // 1) save basic member info
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

      // 2) save EM group mapping (upsert) — validate group is from DB
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
      }

      if (infoOk && groupOk) {
        await Swal.fire({
          icon: "success",
          title: "Saved",
          text: "Member information updated successfully.",
        });
        setEditMode(false);
        setAddressDirty(false);
      } else {
        await Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not save member information or group. Please try again.",
        });
      }
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

  const handleCancel = () => {
    setEditMode(false);
    setAddressDirty(false);
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
              <div className="col-md-3">
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
              <div className="col-md-3">
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
              <div className="col-md-3">
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

          {/* Row 5 (Group Number + User ID) */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Group Number</label>

              {/* Dropdown for EM groups (stores group name in state) */}
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
              ) : (
                // Fallback to read-only input for other departments
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
                  onClick={handleCancel}
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
