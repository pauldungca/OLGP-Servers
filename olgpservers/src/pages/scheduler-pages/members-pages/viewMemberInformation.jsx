import React, { useEffect, useState, useCallback } from "react";
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
  fetchMemberRoles,
  removeMember,
  editMemberInfo,
  editMemberRoles,
} from "../../../assets/scripts/viewMember";

import "../../../assets/styles/member.css";
import "../../../assets/styles/viewMemberInformation.css";

export default function ViewMemberInformation() {
  useEffect(() => {
    document.title = "OLGP Servers | Member";
  }, []);

  const navigate = new useNavigate();

  const location = useLocation();
  const department = location.state?.department || "Members";
  const idNumber = location.state?.idNumber;

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
  const [houseNumber, setHouseNumber] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRolesArray, setSelectedRolesArray] = useState([]);

  // ✅ Flag to detect user changed address inputs
  const [addressDirty, setAddressDirty] = useState(false);

  // ✅ Fetch member data
  const loadMemberData = useCallback(async () => {
    if (!idNumber) return;
    try {
      const { info, roleType } = await fetchMemberData(idNumber);
      const roles = await fetchMemberRoles(idNumber);

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
      setImageUrl(info.imageUrl || null);

      setProvince(info.province || "");
      setMunicipality(info.municipality || "");
      setBarangay(info.barangay || "");
      setHouseNumber(info.houseNumber || "");
    } catch (err) {
      console.error("Failed to load member:", err.message);
    } finally {
    }
  }, [idNumber]); // ✅ include idNumber as dependency

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

  const handleSaveChanges = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "Are you sure to save changes?",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

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

    const rolesSuccess = await editMemberRoles(idNumber, selectedRolesArray);

    if (infoSuccess && rolesSuccess) {
      await loadMemberData();
      Swal.fire({
        icon: "success",
        title: "Member Updated",
        text: "Member information and roles were successfully updated!",
      });
      setEditMode(false);
      setAddressDirty(false);
    } else {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Failed to update member information or roles.",
      });
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
        {/* Image preview */}
        <div className="attachment-container">
          <div
            className="preview-container mt-3"
            style={{ position: "relative", display: "inline-block" }}
          >
            {imageUrl && imageUrl.trim() !== "" ? (
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
            <label className="file-label">Member Image</label>
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

          {/* Row 2 - Only in Edit Mode */}
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
                  {provinces.map((prov) => (
                    <option key={prov.code} value={prov.code}>
                      {prov.name}
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
                  {municipalities.map((mun) => (
                    <option key={mun.code} value={mun.code}>
                      {mun.name}
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
                  {barangays.map((brgy) => (
                    <option key={brgy.code} value={brgy.code}>
                      {brgy.name}
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
                disabled // ✅ cannot edit directly
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Date Joined</label>
              <input
                type="text"
                className="form-control"
                value={dateJoined}
                disabled // ✅ always disabled
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
                disabled={!editMode} // ✅ only editable in edit mode
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
                disabled // ✅ always disabled
              />
            </div>
          </div>

          <div className="role-options mt-3">
            {[
              { label: "Candle Bearer", value: "CandleBearer" },
              { label: "Beller", value: "Beller" },
              { label: "Cross Bearer", value: "CrossBearer" },
              { label: "Thurifer", value: "Thurifer" },
              { label: "Incense Bearer", value: "IncenseBearer" },
              { label: "Main Servers (Book and Mic)", value: "MainServers" },
              { label: "Plates", value: "Plates" },
            ].map((role) => (
              <label key={role.value}>
                <input
                  type="checkbox"
                  value={role.value}
                  disabled={!editMode}
                  checked={selectedRolesArray.includes(role.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRolesArray([
                        ...selectedRolesArray,
                        role.value,
                      ]);
                    } else {
                      setSelectedRolesArray(
                        selectedRolesArray.filter((r) => r !== role.value)
                      );
                    }
                  }}
                />{" "}
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
                      setAddressDirty(false); // reset
                    }
                  }}
                >
                  Cancel Edit
                </button>
                <button
                  type="button"
                  className="btn btn-view flex-fill"
                  onClick={handleSaveChanges}
                  //onClick={sampleIdNumber()}
                >
                  Save Edit
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-danger flex-fill"
                  onClick={() => removeMember(idNumber, setLoading, navigate)}
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

      <div>
        <Footer />
      </div>
    </div>
  );
}
