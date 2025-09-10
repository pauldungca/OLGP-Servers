import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";

// ✅ Import member into Altar Server Department
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

    // ✅ Success alert
    Swal.fire({
      icon: "success",
      title: "Import Successful",
      text: "Member has been imported to Altar Server Department.",
      confirmButtonText: "OK",
    });

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

// ✅ Import member into Lector Commentator Department
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

    // ✅ Success alert
    Swal.fire({
      icon: "success",
      title: "Import Successful",
      text: "Member has been imported to Lector Commentator Department.",
      confirmButtonText: "OK",
    });

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

    await Swal.fire({
      icon: "success",
      title: "Import Successful",
      text: "Member has been imported to Eucharistic Minister and assigned to the group.",
    });
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

    await Swal.fire({
      icon: "success",
      title: "Import Successful",
      text: "Member has been imported to Choir and assigned to the group.",
    });
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
