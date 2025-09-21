import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";
import { sendWelcomeEmail } from "../../utils/emails";
import bcrypt from "bcryptjs";

import {
  fetchProvinces,
  fetchMunicipalities,
  fetchBarangays,
} from "../../utils/axios";

export const getProvinces = () => fetchProvinces();
export const getMunicipalities = (provinceCode) =>
  fetchMunicipalities(provinceCode);
export const getBarangays = (municipalityCode) =>
  fetchBarangays(municipalityCode);

export const generateUserID = () => {
  const prefix = "2025";
  const suffix = Math.floor(1000 + Math.random() * 90000);
  return prefix + suffix;
};

export const formatContactNumber = (value) => {
  let digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length > 11) digitsOnly = digitsOnly.slice(0, 11);

  if (digitsOnly.length <= 4) {
    return digitsOnly;
  } else if (digitsOnly.length <= 7) {
    return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4)}`;
  } else {
    return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(
      4,
      7
    )} ${digitsOnly.slice(7)}`;
  }
};

export const handleContactNumberChange = (e, setContactNumber) => {
  const formatted = formatContactNumber(e.target.value);
  setContactNumber(formatted);
};

function insertMemberAuthentication(idNumber, password, email) {
  return supabase
    .from("authentication")
    .insert([{ idNumber, password, email }])
    .then(({ error }) => {
      if (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message });
        throw new Error(error.message);
      }
    });
}

export const addMemberAuthentication = async (idNumber, password, email) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  return await insertMemberAuthentication(idNumber, hashedPassword, email);
};

export const insertMemberInformation = async (
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
) => {
  const { data, error } = await supabase.from("members-information").insert([
    {
      idNumber: idNumber,
      firstName: firstName,
      middleName: middleName || null,
      lastName: lastName,
      address: address,
      dateJoined: dateJoined,
      sex: sex,
      email: email,
      contactNumber: contactNumber,
      imageUrl: imageUrl || null,
    },
  ]);

  if (error) {
    alert("Supabase insert error:", error);
    throw new Error(error.message);
  }

  return data;
};

export const addMember = async (
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
) => {
  if (await isEmailAlreadyUsed(email)) {
    Swal.fire({
      icon: "error",
      title: "Duplicate Email",
      text: "This Gmail address is already registered. Please use a different one.",
    });
    return false;
  }
  email = email.trim();

  const missingFields = [];
  if (!idNumber) missingFields.push("ID Number");
  if (!firstName) missingFields.push("First Name");
  if (!lastName) missingFields.push("Last Name");
  if (!address) missingFields.push("Address");
  if (!dateJoined) missingFields.push("Date Joined");
  if (!sex) missingFields.push("Sex");
  if (!email) missingFields.push("Email");
  if (!contactNumber) missingFields.push("Contact Number");

  if (missingFields.length > 0) {
    Swal.fire({
      icon: "error",
      title: "Missing Fields",
      html: `Please fill in the following required field(s):<br><strong>${missingFields.join(
        ", "
      )}</strong>`,
    });
    return false;
  }

  if (!isValidGmail(email)) {
    Swal.fire({
      icon: "error",
      title: "Inavlid Format",
      html: `Please put "@gmail.com" in your email input.`,
    });
    return false;
  }

  const result = await Swal.fire({
    icon: "question",
    title: "Are you sure to add this member?",
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return false;

  try {
    // 🔹 Show loading alert
    Swal.fire({
      title: "Processing...",
      text: "Please wait a moment.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // 🔹 Try sending welcome email first
    await sendWelcomeEmail({
      email,
      firstName,
      middleName,
      lastName,
      idNumber,
    });

    // 🔹 Only insert member if email succeeded
    await insertMemberInformation(
      idNumber,
      firstName,
      middleName || null,
      lastName,
      address,
      dateJoined,
      sex,
      email,
      contactNumber,
      imageUrl
    );

    Swal.fire({
      icon: "success",
      title: "Member Added",
      text: "The member was successfully added.",
    });

    return true;
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed",
      text: "Operation failed: " + err.message,
    });
    return false;
  }
};

export const updateMemberImage = async (idNumber, imageUrl) => {
  try {
    const { error } = await supabase
      .from("members-information")
      .update({ imageUrl })
      .eq("idNumber", idNumber);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("updateMemberImage error:", err.message);
    return false;
  }
};

export const defineUserType = async (idNumber, department) => {
  const departmentMap = {
    "ALTAR SERVER": "altar-server-member",
    "EUCHARISTIC MINISTER": "eucharistic-minister-member",
    CHOIR: "choir-member",
    "LECTOR COMMENTATOR": "lector-commentator-member",
  };

  const userTypeData = {
    idNumber: idNumber,
    "parish-secretary": 0,
    "altar-server-scheduler": 0,
    "eucharistic-minister-scheduler": 0,
    "choir-scheduler": 0,
    "lector-commentator-scheduler": 0,
    "altar-server-member": 0,
    "eucharistic-minister-member": 0,
    "choir-member": 0,
    "lector-commentator-member": 0,
  };

  const key = departmentMap[department.toUpperCase()];
  if (key) {
    userTypeData[key] = 1;
  }

  try {
    const { data, error } = await supabase
      .from("user-type")
      .insert([userTypeData])
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("User type creation failed:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "User type definition failed: " + err.message,
    });
    throw new Error("User type definition failed: " + err.message);
  }
};

export const saveAltarServerRoles = async (
  idNumber,
  selectedRole,
  selectedRoles = []
) => {
  if (!idNumber || !selectedRole) return;

  // Default roles object
  const rolesData = {
    idNumber,
    "candle-bearer": 0,
    beller: 0,
    "cross-bearer": 0,
    "incense-bearer": 0,
    thurifer: 0,
    "main-server": 0,
    plate: 0,
  };

  if (selectedRole === "Flexible") {
    Object.keys(rolesData).forEach((key) => {
      if (key !== "idNumber") rolesData[key] = 1;
    });
  } else if (selectedRole === "Non-Flexible") {
    selectedRoles.forEach((role) => {
      if (role === "CandleBearer") rolesData["candle-bearer"] = 1;
      else if (role === "Beller") rolesData.beller = 1;
      else if (role === "CrossBearer") rolesData["cross-bearer"] = 1;
      else if (role === "IncenseBearer") rolesData["incense-bearer"] = 1;
      else if (role === "Thurifer") rolesData.thurifer = 1;
      else if (role === "MainServers") rolesData["main-server"] = 1;
      else if (role === "Plates") rolesData.plate = 1;
      // default: do nothing
    });
  }

  // Insert into Supabase
  await supabase.from("altar-server-roles").insert([rolesData]);

  // Always return true (or false if needed)
  return true;
};

export const saveLectorCommentatorRoles = async (
  idNumber,
  selectedRole,
  selectedRoles = []
) => {
  if (!idNumber || !selectedRole) return;

  // Default roles object
  const rolesData = {
    idNumber,
    reading: 0,
    preface: 0,
  };

  if (selectedRole === "Flexible") {
    rolesData.reading = 1;
    rolesData.preface = 1;
  } else if (selectedRole === "Non-Flexible") {
    selectedRoles.forEach((role) => {
      if (role === "Reading") rolesData.reading = 1;
      else if (role === "Preface") rolesData.preface = 1;
    });
  }

  // Insert into Supabase
  await supabase.from("lector-commentator-roles").insert([rolesData]);

  return true;
};

export const saveEucharisticMinisterGroup = async (idNumber, groupName) => {
  try {
    const { data, error } = await supabase
      .from("eucharistic-minister-group")
      .insert([
        {
          idNumber: idNumber,
          "group-name": groupName, // hyphenated column name must be quoted as a key
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to save Eucharistic Minister group:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Saving group failed: " + err.message,
    });
    throw err;
  }
};

export const saveChoirMemberGroup = async (idNumber, groupName) => {
  try {
    const { data, error } = await supabase
      .from("choir-member-group")
      .insert([
        {
          idNumber: idNumber,
          "choir-group-name": groupName, // must match the column name exactly
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to save Choir member group:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Saving Choir group failed: " + err.message,
    });
    throw err;
  }
};

export const handleFileSize = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    Swal.fire({
      icon: "error",
      title: "File Too Large",
      text: "The file size exceeds the 5MB limit. Please choose a smaller image.",
    });
    return false;
  }
  return true;
};

export const uploadAndSaveMemberImage = async (idNumber, file) => {
  const fileExt = file.name.split(".").pop().toLowerCase();
  const fileName = `${idNumber}.${fileExt}`;

  try {
    const { data, error } = await supabase.storage
      .from("user-image")
      .upload(fileName, file, { upsert: true });

    if (!data || error) throw error;

    const { data: urlData, error: urlError } = supabase.storage
      .from("user-image")
      .getPublicUrl(fileName);

    if (urlError) throw urlError;

    return urlData.publicUrl;
  } catch (err) {
    console.error("Upload failed:", err);
    alert("Upload failed: " + err.message);
    return null;
  }
};

export const handleFileInputChange = (e, setImageFile, setFileAttached) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!handleFileSize(file)) {
    e.target.value = "";
    return;
  }

  setImageFile(file);
  setFileAttached(true);
};

export const handleFileChange = (e, fileInputRef) => {
  e.preventDefault();
  fileInputRef.current.click();
};

export const handleRemoveImage = (setImageFile, setFileAttached) => {
  setImageFile(null);
  setFileAttached(false);
};

export const isValidGmail = (email) => {
  if (!email) return false; // empty check
  return email.toLowerCase().endsWith("@gmail.com");
};

export const isEmailAlreadyUsed = async (email) => {
  if (!email) return false;

  const { data, error } = await supabase
    .from("members-information")
    .select("idNumber")
    .eq("email", email.trim())
    .maybeSingle();

  if (error) {
    console.error("Error checking email:", error.message);
    throw new Error("Error checking email: " + error.message);
  }

  return !!data; // true if found
};
