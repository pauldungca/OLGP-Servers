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

export const promoteMemberToScheduler = async ({
  selectedRole,
  targetIdNumber,
  storedIdNumber,
  fullName,
  navigate,
}) => {
  if (!selectedRole || !roleMap[selectedRole]) {
    await Swal.fire("Error", "Unknown or empty role selected.", "error");
    return false;
  }
  if (!targetIdNumber) {
    await Swal.fire("Error", "No target member selected.", "error");
    return false;
  }

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

const formatNow = () => {
  const now = new Date();
  const date = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}-${now.getFullYear()}`;

  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const time = `${h}:${m} ${ampm}`;

  return { date, time };
};

/**
 * Sends a scheduler transfer request (notification-type = 2) to the target member.
 * The notification is stored against the TARGET member's idNumber so it shows up for them.
 */
export const requestSchedulerTransfer = async ({
  selectedRole,
  targetIdNumber,
  requesterIdNumber,
  fullName,
}) => {
  if (!selectedRole || !targetIdNumber) {
    await Swal.fire("Error", "Missing role or target member.", "error");
    return false;
  }

  try {
    // 🔎 Only check duplicates for the SAME department
    const { data: existing, error: checkErr } = await supabase
      .from("member-request-notification")
      .select("id")
      .eq("idNumber", targetIdNumber)
      .eq("department", selectedRole)
      .eq("notification-type", 2);
    if (checkErr) throw checkErr;

    if (existing && existing.length > 0) {
      await Swal.fire(
        "Duplicate",
        `There's already a pending scheduler transfer request for ${
          fullName || "this member"
        } in ${selectedRole}.`,
        "info"
      );
      return false;
    }

    const { date, time } = formatNow();

    // ✅ Insert a new row (even if another department already exists)
    const payload = {
      idNumber: targetIdNumber,
      "notification-type": 2,
      date,
      time,
      department: selectedRole,
    };

    const { error: insErr } = await supabase
      .from("member-request-notification")
      .insert([payload]);

    if (insErr) throw insErr;

    await Swal.fire(
      "Request Sent",
      `Scheduler rights transfer request sent to ${
        fullName || "the member"
      } for ${selectedRole}.`,
      "success"
    );

    return true;
  } catch (err) {
    console.error("requestSchedulerTransfer error:", err);
    await Swal.fire("Error", "Failed to send transfer request.", "error");
    return false;
  }
};
