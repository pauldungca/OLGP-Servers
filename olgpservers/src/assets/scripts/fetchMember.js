import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";

export const fetchAltarServerMembersWithRole = async () => {
  try {
    // 1️⃣ Get all user-type entries where altar-server-member = 1
    const { data: userTypes, error: userTypeError } = await supabase
      .from("user-type")
      .select("idNumber")
      .eq('"altar-server-member"', 1);

    if (userTypeError) throw userTypeError;

    const idNumbers = userTypes.map((ut) => ut.idNumber);

    // 2️⃣ Alert if no altar server members
    if (idNumbers.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Altar Server Members",
        text: "There are currently no members marked as altar servers.",
      });
      return [];
    }

    // 3️⃣ Fetch members-information for those idNumbers
    const { data: members, error: membersError } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", idNumbers)
      .order("dateJoined", { ascending: false });

    if (membersError) throw membersError;

    // 4️⃣ Fetch altar-server-roles for these members
    const { data: rolesData, error: rolesError } = await supabase
      .from("altar-server-roles")
      .select("*")
      .in("idNumber", idNumbers);

    if (rolesError) throw rolesError;

    // 5️⃣ Merge roles and compute Flexible / Non-Flexible
    const membersWithRole = members.map((member) => {
      const roles = rolesData.find((r) => r.idNumber === member.idNumber);

      if (!roles) return { ...member, role: "Non-Flexible" };

      // all role columns except id and idNumber
      const roleFields = Object.keys(roles).filter(
        (key) => key !== "id" && key !== "idNumber"
      );

      const isFlexible = roleFields.every((key) => roles[key] === 1);

      return { ...member, role: isFlexible ? "Flexible" : "Non-Flexible" };
    });

    return membersWithRole;
  } catch (err) {
    console.error("Supabase error:", err);
    return [];
  }
};
