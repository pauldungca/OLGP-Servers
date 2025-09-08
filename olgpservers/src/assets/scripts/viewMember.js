import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";
import axios from "axios";

// ✅ Fetch provinces
export const fetchProvinces = async () => {
  try {
    const response = await axios.get("https://psgc.gitlab.io/api/provinces/");
    return response.data;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return [];
  }
};

// ✅ Fetch municipalities based on province code
export const fetchMunicipalities = async (provinceCode) => {
  try {
    const response = await axios.get(
      `https://psgc.gitlab.io/api/provinces/${provinceCode}/municipalities/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching municipalities:", error);
    return [];
  }
};

// ✅ Fetch barangays based on municipality code
export const fetchBarangays = async (municipalityCode) => {
  try {
    const response = await axios.get(
      `https://psgc.gitlab.io/api/municipalities/${municipalityCode}/barangays/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching barangays:", error);
    return [];
  }
};

export const formatContactNumber = (value) => {
  const digitsOnly = (value || "").toString().replace(/\D/g, "").slice(0, 11); // limit to 11 digits

  if (digitsOnly.length <= 4) return digitsOnly;
  if (digitsOnly.length <= 7) {
    return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4)}`;
  }
  return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(
    4,
    7
  )} ${digitsOnly.slice(7)}`;
};

export const fetchMemberData = async (idNumber, department) => {
  if (!idNumber) return null;

  try {
    // Fetch member info
    const { data: info, error: infoError } = await supabase
      .from("members-information")
      .select("*")
      .eq("idNumber", idNumber)
      .single();
    if (infoError) throw infoError;

    let roleType = "";
    if (department === "Altar Server") {
      // Fetch altar server roles
      const { data: roleData, error: roleError } = await supabase
        .from("altar-server-roles")
        .select("*")
        .eq("idNumber", idNumber)
        .single();
      if (roleError) throw roleError;

      const allRoles = [
        "candle-bearer",
        "beller",
        "cross-bearer",
        "incense-bearer",
        "thurifer",
        "main-server",
        "plate",
      ];
      const isFlexible = allRoles.every((role) => roleData[role] === 1);
      roleType = isFlexible ? "Flexible" : "Non-Flexible";
    } else if (department === "Lector Commentator") {
      // Fetch lector commentator roles
      const { data: roleData, error: roleError } = await supabase
        .from("lector-commentator-roles")
        .select("*")
        .eq("idNumber", idNumber)
        .single();
      if (roleError) throw roleError;

      const allRoles = ["preface", "reading"];
      const isFlexible = allRoles.every((role) => roleData[role] === 1);
      roleType = isFlexible ? "Flexible" : "Non-Flexible";
    }

    return { info, roleType };
  } catch (err) {
    console.error("Error fetching member data:", err.message);
    throw err;
  }
};

// ✅ Cancel edit confirmation
export const confirmCancelEdit = async () => {
  const result = await Swal.fire({
    title: "Cancel Editing?",
    text: "Are you sure you want to cancel your changes?",
    icon: "warning",
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonColor: "#dc3545", // red
    cancelButtonColor: "#6c757d", // gray
    confirmButtonText: "Yes, cancel",
    cancelButtonText: "No, stay",
  });

  return result.isConfirmed;
};

// Fetch altar server roles for a specific member
export const fetchMemberRoles = async (idNumber) => {
  try {
    const { data: rolesData, error } = await supabase
      .from("altar-server-roles")
      .select("*")
      .eq("idNumber", idNumber)
      .single(); // fetch only one record

    if (error) throw error;
    if (!rolesData) return [];

    // Map the database columns to checkbox values
    const roleMap = {
      "candle-bearer": "CandleBearer",
      beller: "Beller",
      "cross-bearer": "CrossBearer",
      thurifer: "Thurifer",
      "incense-bearer": "IncenseBearer",
      "main-server": "MainServers",
      plate: "Plates",
    };

    // Only include the roles where value = 1
    const selectedRoles = Object.keys(roleMap)
      .filter((col) => rolesData[col] === 1)
      .map((col) => roleMap[col]);

    return selectedRoles;
  } catch (err) {
    console.error("Error fetching member roles:", err);
    return [];
  }
};

export const removeAltarServer = async (
  idNumber,
  setLoading,
  navigate,
  department
) => {
  if (!idNumber) return;

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to remove this member? This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    try {
      setLoading(true);

      // 1️⃣ Remove from members-information
      let { error: errorMembers } = await supabase
        .from("members-information")
        .delete()
        .eq("idNumber", idNumber);
      if (errorMembers) throw errorMembers;

      // 2️⃣ Remove from authentication
      let { error: errorAuth } = await supabase
        .from("authentication")
        .delete()
        .eq("idNumber", idNumber);
      if (errorAuth) throw errorAuth;

      // 3️⃣ Remove from user-type
      let { error: errorUserType } = await supabase
        .from("user-type")
        .delete()
        .eq("idNumber", idNumber);
      if (errorUserType) throw errorUserType;

      // 4️⃣ Remove from altar-server-roles
      let { error: errorRoles } = await supabase
        .from("altar-server-roles")
        .delete()
        .eq("idNumber", idNumber);
      if (errorRoles) throw errorRoles;

      Swal.fire({
        icon: "success",
        title: "Member Removed",
        text: "The member has been successfully removed from all records.",
      });

      // Optional: navigate back to members list
      if (navigate) {
        navigate("/membersList", {
          state: { department },
        });
      }
    } catch (err) {
      console.error("Error removing member:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to remove the member. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }
};

export const removeLectorCommentator = async (
  idNumber,
  setLoading,
  navigate,
  department
) => {
  if (!idNumber) return;

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to remove this member? This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    try {
      setLoading(true);

      // 1️⃣ Remove from members-information
      let { error: errorMembers } = await supabase
        .from("members-information")
        .delete()
        .eq("idNumber", idNumber);
      if (errorMembers) throw errorMembers;

      // 2️⃣ Remove from authentication
      let { error: errorAuth } = await supabase
        .from("authentication")
        .delete()
        .eq("idNumber", idNumber);
      if (errorAuth) throw errorAuth;

      // 3️⃣ Remove from user-type
      let { error: errorUserType } = await supabase
        .from("user-type")
        .delete()
        .eq("idNumber", idNumber);
      if (errorUserType) throw errorUserType;

      // 4️⃣ Remove from lector-commentator-roles
      let { error: errorRoles } = await supabase
        .from("lector-commentator-roles")
        .delete()
        .eq("idNumber", idNumber);
      if (errorRoles) throw errorRoles;

      Swal.fire({
        icon: "success",
        title: "Member Removed",
        text: "The member has been successfully removed from all records.",
      });

      if (navigate) {
        navigate("/membersList", {
          state: { department },
        });
      }
    } catch (err) {
      console.error("Error removing member:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to remove the member. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }
};

export const editMemberInfo = async (
  idNumber,
  firstName,
  middleName,
  lastName,
  address,
  sex,
  email,
  contactNumber
) => {
  if (!idNumber) return false;

  try {
    const { data, error } = await supabase
      .from("members-information")
      .update({
        firstName,
        middleName: middleName || null,
        lastName,
        address,
        sex,
        email,
        contactNumber,
      })
      .eq("idNumber", idNumber)
      .select();

    if (error || !data || data.length === 0) return false;
    return true;
  } catch (err) {
    console.error("Edit member info error:", err);
    return false;
  }
};

export const editAltarServerRoles = async (idNumber, selectedRolesArray) => {
  if (!idNumber) return false;

  try {
    const roleColumns = {
      CandleBearer: "candle-bearer",
      Beller: "beller",
      CrossBearer: "cross-bearer",
      Thurifer: "thurifer",
      IncenseBearer: "incense-bearer",
      MainServers: "main-server",
      Plates: "plate",
    };

    const roleData = {};
    Object.keys(roleColumns).forEach((key) => {
      roleData[roleColumns[key]] = selectedRolesArray.includes(key) ? 1 : 0;
    });

    const { data, error } = await supabase
      .from("altar-server-roles")
      .update(roleData)
      .eq("idNumber", idNumber)
      .select();

    if (error || !data || data.length === 0) return false;
    return true;
  } catch (err) {
    console.error("Edit member roles error:", err);
    return false;
  }
};

export const editLectorCommentatorRoles = async (
  idNumber,
  selectedRolesArray
) => {
  if (!idNumber) return false;

  try {
    // normalize to lowercase so UI values and DB checks match
    const normalized = (selectedRolesArray || []).map((r) =>
      String(r).toLowerCase()
    );

    const roleData = {
      preface: normalized.includes("preface") ? 1 : 0,
      reading: normalized.includes("reading") ? 1 : 0,
    };

    // try update first
    const { data, error } = await supabase
      .from("lector-commentator-roles")
      .update(roleData)
      .eq("idNumber", idNumber)
      .select();

    if (error) throw error;

    // if update returned no rows, insert a new row
    const updatedEmpty = !data || (Array.isArray(data) && data.length === 0);

    if (updatedEmpty) {
      const { data: inserted, error: insertError } = await supabase
        .from("lector-commentator-roles")
        .insert([{ idNumber, ...roleData }])
        .select();

      if (insertError) throw insertError;
      if (!inserted || (Array.isArray(inserted) && inserted.length === 0)) {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("Edit lector-commentator roles error:", err);
    return false;
  }
};

export const fetchAltarServerRoles = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("altar-server-roles")
      .select("*")
      .eq("idNumber", idNumber)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    const roles = [];
    if (data) {
      if (data.CandleBearer === 1) roles.push("CandleBearer");
      if (data.Beller === 1) roles.push("Beller");
      if (data.CrossBearer === 1) roles.push("CrossBearer");
      if (data.Thurifer === 1) roles.push("Thurifer");
      if (data.IncenseBearer === 1) roles.push("IncenseBearer");
      if (data.MainServers === 1) roles.push("MainServers");
      if (data.Plates === 1) roles.push("Plates");
    }

    return roles;
  } catch (err) {
    console.error("Error fetching altar server roles:", err.message);
    return [];
  }
};

export const fetchLectorCommentatorRoles = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("lector-commentator-roles")
      .select("*")
      .eq("idNumber", idNumber)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    const roles = [];
    if (data) {
      if (data.preface === 1) roles.push("preface"); // ✅ lowercase
      if (data.reading === 1) roles.push("reading"); // ✅ lowercase
    }

    return roles;
  } catch (err) {
    console.error("Error fetching lector commentator roles:", err.message);
    return [];
  }
};
