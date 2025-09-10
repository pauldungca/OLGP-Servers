import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";

const roleMap = {
  "Altar Server": {
    schedulerCol: "altar-server-scheduler",
  },
  "Eucharistic Minister": {
    schedulerCol: "eucharistic-minister-scheduler",
  },
  Choir: {
    schedulerCol: "choir-scheduler",
  },
  "Lector Commentator": {
    schedulerCol: "lector-commentator-scheduler",
  },
};

/**
 * Ask confirmation, then demote current scheduler and promote the target member.
 * Only updates scheduler col, no member flag and no inserts.
 */
export const promoteMemberToScheduler = async ({
  selectedRole,
  targetIdNumber,
  storedIdNumber,
  fullName, // optional, for confirmation message
  navigate, // pass navigate() from react-router
}) => {
  if (!selectedRole || !roleMap[selectedRole]) {
    await Swal.fire("Error", "Unknown or empty role selected.", "error");
    return false;
  }
  if (!targetIdNumber) {
    await Swal.fire("Error", "No target member selected.", "error");
    return false;
  }

  // ✅ Ask for confirmation
  const confirm = await Swal.fire({
    title: "Confirm Promotion?",
    text: `Are you sure you want to assign ${
      fullName || "this member"
    } as the ${selectedRole} scheduler?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, promote",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  if (!confirm.isConfirmed) return false;

  const { schedulerCol } = roleMap[selectedRole];

  try {
    // 1) Demote old scheduler (if different from target)
    if (storedIdNumber && String(storedIdNumber) !== String(targetIdNumber)) {
      const { error: demoteErr } = await supabase
        .from("user-type")
        .update({ [schedulerCol]: 0 })
        .eq("idNumber", storedIdNumber);

      if (demoteErr) throw demoteErr;
    }

    // 2) Promote target to scheduler=1
    const { error: promoteErr } = await supabase
      .from("user-type")
      .update({ [schedulerCol]: 1 })
      .eq("idNumber", targetIdNumber);

    if (promoteErr) throw promoteErr;

    await Swal.fire(
      "Success",
      `${fullName || "Member"} is now the ${selectedRole} scheduler.`,
      "success"
    );

    // 🔹 Navigate to dashboard and refresh page
    if (navigate) {
      navigate("/dashboard");
      window.location.reload(); // force refresh so new scheduler role applies
    }

    return true;
  } catch (err) {
    console.error("promoteMemberToScheduler error:", err);
    await Swal.fire(
      "Error",
      "Failed to promote member. Please try again.",
      "error"
    );
    return false;
  }
};

export const handleBasicSearchChange = (
  e,
  members,
  setSearchQuery,
  setFilteredMembers
) => {
  const query = e.target.value;
  setSearchQuery(query);

  if (query === "") {
    setFilteredMembers(members);
  } else {
    const filtered = members.filter((member) => {
      const firstName = member.firstName?.toLowerCase() || "";
      const lastName = member.lastName?.toLowerCase() || "";
      const idNumber = member.idNumber?.toString() || "";

      return (
        firstName.includes(query.toLowerCase()) ||
        lastName.includes(query.toLowerCase()) ||
        idNumber.includes(query)
      );
    });

    setFilteredMembers(filtered);
  }
};
