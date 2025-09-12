import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";

export const importToAltarServerDepartment = async (idNumber) => {
  try {
    // Step 1: Update user-type → set altar-server-member = 1
    const { error: userTypeError } = await supabase
      .from("user-type")
      .update({ "altar-server-member": 1 })
      .eq("idNumber", idNumber);

    if (userTypeError) throw userTypeError;

    // Step 2: Insert a new row into altar-server-roles → all roles set to 0
    const resetRoles = {
      idNumber: idNumber,
      CandleBearer: 0,
      Beller: 0,
      CrossBearer: 0,
      Thurifer: 0,
      IncenseBearer: 0,
      MainServers: 0,
      Plates: 0,
    };

    const { error: roleError } = await supabase
      .from("altar-server-roles")
      .insert([resetRoles]);

    if (roleError) throw roleError;

    return true;
  } catch (err) {
    console.error("Import to Altar Server error:", err.message);

    // ❌ Error alert
    Swal.fire({
      icon: "error",
      title: "Import Failed",
      text: "Something went wrong while importing to Altar Server.",
    });

    return false;
  }
};

export const importToLectorCommentatorDepartment = async (idNumber) => {
  try {
    // Step 1: Update user-type → set lector-commentator-member = 1
    const { error: userTypeError } = await supabase
      .from("user-type")
      .update({ "lector-commentator-member": 1 })
      .eq("idNumber", idNumber);

    if (userTypeError) throw userTypeError;

    // Step 2: Insert new row in lector-commentator-roles with all roles set to 0
    const resetRoles = {
      idNumber: idNumber,
      preface: 0,
      reading: 0,
    };

    const { error: roleError } = await supabase
      .from("lector-commentator-roles")
      .insert([resetRoles]);

    if (roleError) throw roleError;

    return true;
  } catch (err) {
    console.error("Import to Lector Commentator error:", err.message);

    // ❌ Error alert
    Swal.fire({
      icon: "error",
      title: "Import Failed",
      text: "Something went wrong while importing to Lector Commentator.",
    });

    return false;
  }
};

export const importToEucharisticMinisterDepartment = async (
  idNumber,
  groupName
) => {
  try {
    // 1) mark as EM member
    const { error: userTypeError } = await supabase
      .from("user-type")
      .update({ "eucharistic-minister-member": 1 })
      .eq("idNumber", idNumber);
    if (userTypeError) throw userTypeError;

    // 2) upsert group mapping
    // try update first
    const { data: updated, error: updErr } = await supabase
      .from("eucharistic-minister-group")
      .update({ "group-name": groupName || null })
      .eq("idNumber", idNumber)
      .select();
    if (updErr) throw updErr;

    const nothingUpdated =
      !updated || (Array.isArray(updated) && updated.length === 0);
    if (nothingUpdated) {
      const { error: insErr } = await supabase
        .from("eucharistic-minister-group")
        .insert([{ idNumber, "group-name": groupName || null }]);
      if (insErr) throw insErr;
    }

    return true;
  } catch (err) {
    console.error("Import to Eucharistic Minister error:", err);
    await Swal.fire({
      icon: "error",
      title: "Import Failed",
      text: "Something went wrong while importing to Eucharistic Minister.",
    });
    return false;
  }
};

export const importToChoirDepartment = async (idNumber, choirAbbreviation) => {
  try {
    // 1) mark as Choir member
    const { error: userTypeError } = await supabase
      .from("user-type")
      .update({ "choir-member": 1 })
      .eq("idNumber", idNumber);
    if (userTypeError) throw userTypeError;

    // 2) upsert choir group mapping (column is "choir-group-name")
    const { data: updated, error: updErr } = await supabase
      .from("choir-member-group")
      .update({ "choir-group-name": choirAbbreviation || null })
      .eq("idNumber", idNumber)
      .select();
    if (updErr) throw updErr;

    const nothingUpdated =
      !updated || (Array.isArray(updated) && updated.length === 0);
    if (nothingUpdated) {
      const { error: insErr } = await supabase
        .from("choir-member-group")
        .insert([{ idNumber, "choir-group-name": choirAbbreviation || null }]);
      if (insErr) throw insErr;
    }

    return true;
  } catch (err) {
    console.error("Import to Choir error:", err);
    await Swal.fire({
      icon: "error",
      title: "Import Failed",
      text: "Something went wrong while importing to Choir.",
    });
    return false;
  }
};

export const createImportRequestNotification = async (
  idNumber,
  department,
  fullName = "",
  groupName = null
) => {
  try {
    const deptNeedingGroup =
      department === "Eucharistic Minister" || department === "Choir";

    // 🔍 Step 1: Duplicate check
    let checkQuery = supabase
      .from("member-request-notification")
      .select('idNumber, department, "group"') // quote "group" (reserved word)
      .eq("idNumber", idNumber)
      .eq("department", department);

    if (deptNeedingGroup) {
      checkQuery = checkQuery.eq("group", groupName || null);
    }

    const { data: existing, error: checkError } = await checkQuery;
    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Duplicate Request",
        text:
          `A request has already been made for ${fullName || "this member"} ` +
          `in the ${department}` +
          (deptNeedingGroup && groupName ? ` (${groupName})` : "") +
          ` department.`,
      });
      return false; // 🚫 stop here
    }

    // Step 2: Format date → MM-DD-YYYY
    const now = new Date();
    const date = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}-${now.getFullYear()}`;

    // Step 3: Format time → h:mm AM/PM
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const time = `${hours}:${minutes} ${ampm}`;

    // Step 4: Insert new request
    const payload = {
      idNumber,
      "notification-type": 1, // 1 = import/approval request
      date, // e.g. "09-11-2025"
      time, // e.g. "8:10 AM"
      department,
      ...(deptNeedingGroup ? { group: groupName || null } : {}), // only include when needed
    };

    const { error } = await supabase
      .from("member-request-notification")
      .insert([payload]);
    if (error) throw error;

    await Swal.fire({
      icon: "success",
      title: "Request Submitted",
      text:
        `The approval request for ${fullName || "this member"} ` +
        `to join ${department}` +
        (deptNeedingGroup && groupName ? ` (${groupName})` : "") +
        ` has been sent.`,
    });

    return true;
  } catch (err) {
    console.error("Insert notification error:", err);
    await Swal.fire({
      icon: "error",
      title: "Failed",
      text: "Could not create the import request notification.",
    });
    return false;
  }
};
