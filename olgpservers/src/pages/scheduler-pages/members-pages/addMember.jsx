import React, { useRef, useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import axios from "axios";
import icon from "../../../helper/icon";
import Footer from "../../../components/footer";

import "../../../assets/styles/member.css";
import "../../../assets/styles/addMember.css";

import {
  handleInputImage,
  generateUserID,
  formatContactNumber,
  addMember,
  addMemberAuthentication,
  uploadImageToSupabase,
  handleFileSize,
} from "../../../assets/scripts/addMember";

export default function AddMember() {
  const fileInputRef = useRef(null);
  const [fileAttached, setFileAttached] = useState(false);
  const [imageFile, setImageFile] = useState();

  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");

  const [houseNumber, setHouseNumber] = useState("");

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");

  const [contactNumber, setContactNumber] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [address, setAddress] = useState("");

  // Fetch provinces
  useEffect(() => {
    axios
      .get("https://psgc.gitlab.io/api/provinces/")
      .then((res) => setProvinces(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch municipalities when a province is selected
  useEffect(() => {
    if (selectedProvince) {
      axios
        .get(
          `https://psgc.gitlab.io/api/provinces/${selectedProvince}/cities-municipalities/`
        )
        .then((res) => setMunicipalities(res.data))
        .catch((err) => console.error(err));
    } else {
      setMunicipalities([]);
    }
  }, [selectedProvince]);

  // Fetch barangays when a municipality is selected
  useEffect(() => {
    if (selectedMunicipality) {
      axios
        .get(
          `https://psgc.gitlab.io/api/cities-municipalities/${selectedMunicipality}/barangays/`
        )
        .then((res) => setBarangays(res.data))
        .catch((err) => console.error(err));
    } else {
      setBarangays([]);
    }
  }, [selectedMunicipality]);

  useEffect(() => {
    const provinceName =
      provinces.find((p) => p.code === selectedProvince)?.name || "";
    const municipalityName =
      municipalities.find((m) => m.code === selectedMunicipality)?.name || "";

    const fullAddress = `${houseNumber}, ${selectedBarangay}, ${municipalityName}, ${provinceName}`;
    setAddress(fullAddress);
  }, [
    houseNumber,
    selectedBarangay,
    selectedMunicipality,
    selectedProvince,
    provinces,
    municipalities,
  ]);

  useEffect(() => {
    const today = new Date();
    const formattedDate = `${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}-${today.getFullYear()}`;

    setDateJoined(formattedDate);
    setIdNumber(generateUserID());
  }, []);

  const handleContactNumberChange = (e) => {
    const formatted = formatContactNumber(e.target.value);
    setContactNumber(formatted);
  };

  const addMemberHandler = async (e) => {
    e.preventDefault();

    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImageToSupabase(imageFile);
    }

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
      imageUrl
    );

    if (!imageUrl) {
      alert("Failed to upload image. Please try again.");
    }

    if (isAdded) {
      await addMemberAuthentication(idNumber, "olgp2025-2026", email);

      // Clear fields after success
      setFirstName("");
      setMiddleName("");
      setLastName("");
      setAddress("");
      setHouseNumber("");
      setSelectedProvince("");
      setSelectedMunicipality("");
      setSelectedBarangay("");
      setSex("");
      setEmail("");
      setContactNumber("");
      setSelectedRole("");
      setIdNumber("");
      setFileAttached(false);
      setImageFile(null); // Reset image file
    }
  };

  function handleFileChange(e) {
    e.preventDefault();
    handleInputImage(fileInputRef);
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!handleFileSize(file)) {
      e.target.value = ""; // Reset input
      return;
    }

    setImageFile(file);
    setFileAttached(true);
  };

  return (
    <div className="member-page-container">
      <div className="member-header">
        <div className="header-text-with-line">
          <h3>MEMBERS</h3>
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
                    <Link to="/membersList" className="breadcrumb-item">
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
          <button className="add-image-btn" onClick={handleFileChange}>
            <img src={icon.addImageIcon} alt="Add" className="icon-img" />
          </button>

          <div className="attachment-labels">
            <label className="file-label">Attach image here (optional)</label>
            {fileAttached && (
              <span className="file-success">
                Successfully attached a file.
              </span>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
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
              <label className="form-label">Middle Name (Optional)</label>
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

          {/* Row 2 */}
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="form-label">Province</label>
              <select
                className="form-control"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">Select Province</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Municipality</label>
              <select
                className="form-control"
                value={selectedMunicipality}
                onChange={(e) => setSelectedMunicipality(e.target.value)}
                disabled={!selectedProvince}
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
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                disabled={!selectedMunicipality}
              >
                <option value="">Select Barangay</option>
                {barangays.map((brgy) => (
                  <option key={brgy.code} value={brgy.name}>
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
                onChange={(e) => setHouseNumber(e.target.value)}
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
                onChange={handleContactNumberChange}
                maxLength={13}
                placeholder="0000 000 0000"
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

          {/* Conditional Role Options */}
          {selectedRole === "Non-Flexible" && (
            <div className="role-options mt-3">
              <label>
                <input type="checkbox" name="roles" value="CandleBearer" />{" "}
                Candle Bearer
              </label>
              <label>
                <input type="checkbox" name="roles" value="Beller" /> Beller
              </label>
              <label>
                <input type="checkbox" name="roles" value="CrossBearer" /> Cross
                Bearer
              </label>
              <label>
                <input type="checkbox" name="roles" value="Thurifer" /> Thurifer
              </label>
              <label>
                <input type="checkbox" name="roles" value="IncenseBearer" />{" "}
                Incense Bearer
              </label>
              <label>
                <input type="checkbox" name="roles" value="MainServers" /> Main
                Servers (Book and Mic)
              </label>
              <label>
                <input type="checkbox" name="roles" value="Plates" /> Plates
              </label>
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            className="btn btn-add mt-4"
            onClick={addMemberHandler}
          >
            Add Member
          </button>
        </div>
      </form>
      <div>
        <Footer />
      </div>
    </div>
  );
}
