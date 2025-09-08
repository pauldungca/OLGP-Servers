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
