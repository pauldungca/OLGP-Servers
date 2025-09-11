import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";
import axios from "axios";

export const fetchProvinces = async () => {
  try {
    const response = await axios.get("https://psgc.gitlab.io/api/provinces/");
    return response.data;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return [];
  }
};

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

export const ensureValidGroupSelection = (groups, current) => {
  const names = (groups || []).map((g) => g.name);
  if (names.length === 0) return "";
  if (!current || !names.includes(current)) {
    return names[0];
  }
  return current;
};

export const fetchMemberData = async (idNumber, department) => {
  if (!idNumber) return null;

  try {
    // 1) Basic member info
    const { data: info, error: infoError } = await supabase
      .from("members-information")
      .select("*")
      .eq("idNumber", idNumber)
      .single();
    if (infoError) throw infoError;

    let roleType = "";
    let groupName = null;

    // 2) Department-specific extras
    if (department === "Altar Server") {
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
      const isFlexible = allRoles.every((r) => roleData[r] === 1);
      roleType = isFlexible ? "Flexible" : "Non-Flexible";
    } else if (department === "Lector Commentator") {
      const { data: roleData, error: roleError } = await supabase
        .from("lector-commentator-roles")
        .select("*")
        .eq("idNumber", idNumber)
        .single();
      if (roleError) throw roleError;

      const allRoles = ["preface", "reading"];
      const isFlexible = allRoles.every((r) => roleData[r] === 1);
      roleType = isFlexible ? "Flexible" : "Non-Flexible";
    } else if (department === "Eucharistic Minister") {
      // 3) Fetch group for Eucharistic Minister
      const { data: groupRow, error: groupError } = await supabase
        .from("eucharistic-minister-group")
        .select('"group-name"')
        .eq("idNumber", idNumber)
        .single();

      // Ignore "no rows" error; surface any other error
      if (groupError && groupError.code !== "PGRST116") throw groupError;

      groupName = groupRow ? groupRow["group-name"] : null;
    }

    return { info, roleType, groupName };
  } catch (err) {
    console.error("Error fetching member data:", err.message);
    throw err;
  }
};

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

      // 🔎 Step 1: Fetch user-type record to check membership
      const { data: userType, error: fetchError } = await supabase
        .from("user-type")
        .select("*")
        .eq("idNumber", idNumber)
        .single();

      if (fetchError) throw fetchError;

      if (!userType) throw new Error("User not found in user-type table.");

      // Count how many department memberships are active (value = 1)
      const departmentMemberships = Object.values(userType).filter(
        (val) => val === 1
      ).length;

      if (
        departmentMemberships === 1 &&
        userType["altar-server-member"] === 1
      ) {
        // ✅ Case 1: Member ONLY belongs to Altar Server → remove completely

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
          text: "The member has been fully removed from all records.",
        });
      } else {
        // ✅ Case 2: Member belongs to other departments → only remove Altar Server membership

        // 1️⃣ Update user-type → set altar-server-member = 0
        let { error: errorUpdate } = await supabase
          .from("user-type")
          .update({ "altar-server-member": 0 })
          .eq("idNumber", idNumber);
        if (errorUpdate) throw errorUpdate;

        // 2️⃣ Remove altar-server roles (clear the record for that idNumber)
        let { error: errorRoles } = await supabase
          .from("altar-server-roles")
          .delete()
          .eq("idNumber", idNumber);
        if (errorRoles) throw errorRoles;

        Swal.fire({
          icon: "success",
          title: "Altar Server Removed",
          text: "The member has been removed from Altar Server but remains in other departments.",
        });
      }

      // Optional: navigate back
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
    text: "Do you really want to remove this member from Lector Commentator?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    try {
      setLoading(true);

      // 🔍 Step 1: Fetch user-type record
      const { data: userTypeData, error: userTypeFetchError } = await supabase
        .from("user-type")
        .select("*")
        .eq("idNumber", idNumber)
        .single();

      if (userTypeFetchError) throw userTypeFetchError;

      if (!userTypeData) throw new Error("User not found in user-type");

      // 🔎 Step 2: Check if the member belongs to other departments
      const { idNumber: _, ...departments } = userTypeData;
      const activeDepartments = Object.values(departments).filter(
        (val) => val === 1
      );

      if (
        activeDepartments.length === 1 &&
        userTypeData["lector-commentator-member"] === 1
      ) {
        // ✅ Member only in Lector Commentator → full delete

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
      } else {
        // 🔄 Member has other departments → just set lector-commentator-member = 0
        const { error: updateError } = await supabase
          .from("user-type")
          .update({ "lector-commentator-member": 0 })
          .eq("idNumber", idNumber);

        if (updateError) throw updateError;

        // also clean roles from lector-commentator-roles
        const { error: roleError } = await supabase
          .from("lector-commentator-roles")
          .delete()
          .eq("idNumber", idNumber);

        if (roleError) throw roleError;
      }

      Swal.fire({
        icon: "success",
        title: "Member Removed",
        text: "The member has been successfully removed from Lector Commentator.",
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

export const removeEucharisticMinister = async (
  idNumber,
  setLoading,
  navigate,
  department,
  group
) => {
  if (!idNumber) return;

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to remove this member from Eucharistic Minister?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    setLoading(true);

    // 1) Fetch user-type record
    const { data: userType, error: fetchError } = await supabase
      .from("user-type")
      .select("*")
      .eq("idNumber", idNumber)
      .single();
    if (fetchError) throw fetchError;
    if (!userType) throw new Error("User not found in user-type table.");

    // Count active department memberships (value === 1)
    const departmentMemberships = Object.values(userType).filter(
      (val) => val === 1
    ).length;

    if (
      departmentMemberships === 1 &&
      userType["eucharistic-minister-member"] === 1
    ) {
      // ✅ Only in EM → full delete across related tables

      // a) Delete EM group mapping (ignore 'no rows' cases)
      const { error: errorGroup } = await supabase
        .from("eucharistic-minister-group")
        .delete()
        .eq("idNumber", idNumber);
      if (errorGroup && errorGroup.code !== "PGRST116") throw errorGroup;

      // b) Remove from members-information
      const { error: errorMembers } = await supabase
        .from("members-information")
        .delete()
        .eq("idNumber", idNumber);
      if (errorMembers) throw errorMembers;

      // c) Remove from authentication
      const { error: errorAuth } = await supabase
        .from("authentication")
        .delete()
        .eq("idNumber", idNumber);
      if (errorAuth) throw errorAuth;

      // d) Remove from user-type
      const { error: errorUserType } = await supabase
        .from("user-type")
        .delete()
        .eq("idNumber", idNumber);
      if (errorUserType) throw errorUserType;

      await Swal.fire({
        icon: "success",
        title: "Member Removed",
        text: "The member has been fully removed from all records.",
      });
    } else {
      // ✅ Member has other departments → just remove EM membership

      // a) Update user-type flag
      const { error: updateError } = await supabase
        .from("user-type")
        .update({ "eucharistic-minister-member": 0 })
        .eq("idNumber", idNumber);
      if (updateError) throw updateError;

      // b) Clear EM group mapping
      const { error: roleError } = await supabase
        .from("eucharistic-minister-group")
        .delete()
        .eq("idNumber", idNumber);
      if (roleError && roleError.code !== "PGRST116") throw roleError;

      await Swal.fire({
        icon: "success",
        title: "Eucharistic Minister Removed",
        text: "The member has been removed from Eucharistic Minister but remains in other departments.",
      });
    }

    // Optional: navigate back to list
    if (navigate) {
      navigate("/groupMembersList", {
        state: { department, group },
      });
    }
  } catch (err) {
    console.error("Error removing Eucharistic Minister:", err);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to remove the member. Please try again.",
    });
  } finally {
    setLoading(false);
  }
};

export const removeChoirMember = async (
  idNumber,
  setLoading,
  navigate,
  department,
  group
) => {
  if (!idNumber) return;

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to remove this member from Choir?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    setLoading(true);

    // 1) Fetch user-type record
    const { data: userType, error: fetchError } = await supabase
      .from("user-type")
      .select("*")
      .eq("idNumber", idNumber)
      .single();
    if (fetchError) throw fetchError;
    if (!userType) throw new Error("User not found in user-type table.");

    const departmentMemberships = Object.values(userType).filter(
      (val) => val === 1
    ).length;

    if (departmentMemberships === 1 && userType["choir-member"] === 1) {
      // ✅ Only in Choir → full delete
      await supabase
        .from("choir-member-group")
        .delete()
        .eq("idNumber", idNumber);
      await supabase
        .from("members-information")
        .delete()
        .eq("idNumber", idNumber);
      await supabase.from("authentication").delete().eq("idNumber", idNumber);
      await supabase.from("user-type").delete().eq("idNumber", idNumber);

      await Swal.fire({
        icon: "success",
        title: "Member Removed",
        text: "The member has been fully removed from all records.",
      });
    } else {
      // ✅ Choir + other dept → just remove Choir membership
      await supabase
        .from("user-type")
        .update({ "choir-member": 0 })
        .eq("idNumber", idNumber);

      await supabase
        .from("choir-member-group")
        .delete()
        .eq("idNumber", idNumber);

      await Swal.fire({
        icon: "success",
        title: "Choir Removed",
        text: "The member has been removed from Choir but remains in other departments.",
      });
    }

    if (navigate) {
      navigate("/groupMembersList", {
        state: { department, group },
      });
    }
  } catch (err) {
    console.error("Error removing Choir member:", err);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to remove the member. Please try again.",
    });
  } finally {
    setLoading(false);
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
      if (data["candle-bearer"] === 1) roles.push("CandleBearer");
      if (data["beller"] === 1) roles.push("Beller");
      if (data["cross-bearer"] === 1) roles.push("CrossBearer");
      if (data["thurifer"] === 1) roles.push("Thurifer");
      if (data["incense-bearer"] === 1) roles.push("IncenseBearer");
      if (data["main-server"] === 1) roles.push("MainServers"); // ← singular
      if (data["plate"] === 1) roles.push("Plates"); // ← singular
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

export const editEucharisticMinisterGroup = async (memberId, newGroupName) => {
  try {
    // 1) Try update first
    const { data: updated, error: updErr } = await supabase
      .from("eucharistic-minister-group")
      .update({ "group-name": newGroupName || null })
      .eq("idNumber", memberId)
      .select();

    if (updErr) throw updErr;

    const noRows = !updated || (Array.isArray(updated) && updated.length === 0);

    // 2) If nothing was updated, insert (create the row)
    if (noRows) {
      const { data: inserted, error: insErr } = await supabase
        .from("eucharistic-minister-group")
        .insert([{ idNumber: memberId, "group-name": newGroupName || null }])
        .select();

      if (insErr) throw insErr;
      if (!inserted || (Array.isArray(inserted) && inserted.length === 0)) {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("editEucharisticMinisterGroup error:", err);
    return false;
  }
};

export const editChoirMemberGroup = async (memberId, newGroupName) => {
  try {
    // 1) Try update first
    const { data: updated, error: updErr } = await supabase
      .from("choir-member-group")
      .update({ "choir-group-name": newGroupName || null })
      .eq("idNumber", memberId)
      .select();

    if (updErr) throw updErr;

    const noRows = !updated || (Array.isArray(updated) && updated.length === 0);

    // 2) If nothing was updated, insert (create the row)
    if (noRows) {
      const { data: inserted, error: insErr } = await supabase
        .from("choir-member-group")
        .insert([
          { idNumber: memberId, "choir-group-name": newGroupName || null },
        ])
        .select();

      if (insErr) throw insErr;
      if (!inserted || (Array.isArray(inserted) && inserted.length === 0)) {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("editChoirMemberGroup error:", err);
    return false;
  }
};
