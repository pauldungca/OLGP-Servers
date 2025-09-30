import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";

export const isEucharisticMinisterMember = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`eucharistic-minister-member`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching eucharistic minister status:", error);
      return false;
    }

    return data["eucharistic-minister-member"] === 1;
  } catch (err) {
    console.error("Error in fetchEucharisticMinisterStatus:", err);
    return false;
  }
};

export const isChoirMember = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`choir-member`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching choir status:", error);
      return false;
    }

    return data["choir-member"] === 1;
  } catch (err) {
    console.error("Error in fetchChoirStatus:", err);
    return false;
  }
};

export const isAltarServerMember = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`altar-server-member`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching altar server status:", error);
      return false;
    }

    return data["altar-server-member"] === 1;
  } catch (err) {
    console.error("Error in fetchAltarServerStatus:", err);
    return false;
  }
};

export const isLectorCommentatorMember = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`lector-commentator-member`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching lector commentator status:", error);
      return false;
    }

    return data["lector-commentator-member"] === 1;
  } catch (err) {
    console.error("Error in fetchLectorCommentatorStatus:", err);
    return false;
  }
};

// NEW: Fetch user's altar server schedules
export async function fetchUserAltarServerSchedules(idNumber, year, month) {
  try {
    // Calculate date range for the selected month
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, month + 1, 0);
    const endDateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      endDate.getDate()
    ).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("altar-server-placeholder")
      .select("date, mass, role, slot")
      .eq("idNumber", idNumber)
      .gte("date", startDate)
      .lte("date", endDateISO)
      .order("date", { ascending: true })
      .order("mass", { ascending: true });

    if (error) {
      console.error("Error fetching altar server schedules:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch schedules:", err);
    return [];
  }
}

// NEW: Fetch user's lector-commentator schedules
export async function fetchUserLectorCommentatorSchedules(
  idNumber,
  year,
  month
) {
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, month + 1, 0);
    const endDateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      endDate.getDate()
    ).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("lector-commentator-placeholder")
      .select("date, mass, role, slot")
      .eq("idNumber", idNumber)
      .gte("date", startDate)
      .lte("date", endDateISO)
      .order("date", { ascending: true })
      .order("mass", { ascending: true });

    if (error) {
      console.error("Error fetching lector-commentator schedules:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch schedules:", err);
    return [];
  }
}

// NEW: Fetch user's choir schedules (different logic - group-based)
export async function fetchUserChoirSchedules(idNumber, year, month) {
  try {
    // First, find which group(s) the user belongs to
    const { data: groupData, error: groupError } = await supabase
      .from("choir-group")
      .select("group-name")
      .eq("idNumber", idNumber);

    if (groupError || !groupData || groupData.length === 0) {
      return [];
    }

    const userGroups = groupData.map((g) => g["group-name"]);

    // Then find schedules for those groups
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, month + 1, 0);
    const endDateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      endDate.getDate()
    ).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("choir-placeholder")
      .select("date, mass, group")
      .in("group", userGroups)
      .gte("date", startDate)
      .lte("date", endDateISO)
      .order("date", { ascending: true })
      .order("mass", { ascending: true });

    if (error) {
      console.error("Error fetching choir schedules:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch schedules:", err);
    return [];
  }
}

// NEW: Fetch user's eucharistic minister schedules
export async function fetchUserEucharisticMinisterSchedules(
  idNumber,
  year,
  month
) {
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, month + 1, 0);
    const endDateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      endDate.getDate()
    ).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("eucharistic-minister-placeholder")
      .select("date, mass, slot")
      .eq("idNumber", idNumber)
      .gte("date", startDate)
      .lte("date", endDateISO)
      .order("date", { ascending: true })
      .order("mass", { ascending: true });

    if (error) {
      console.error("Error fetching eucharistic minister schedules:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch schedules:", err);
    return [];
  }
}

// Helper: Group schedules by date
export function groupSchedulesByDate(schedules) {
  const grouped = {};

  schedules.forEach((schedule) => {
    if (!grouped[schedule.date]) {
      grouped[schedule.date] = [];
    }
    grouped[schedule.date].push(schedule);
  });

  return grouped;
}

// Helper: Format role names nicely
export function formatRoleName(role) {
  const roleMap = {
    candleBearer: "Candle Bearer",
    thurifer: "Thurifer",
    beller: "Beller",
    mainServer: "Book and Mic",
    crossBearer: "Cross Bearer",
    incenseBearer: "Incense Bearer",
    plate: "Plate",
    reading: "Reading",
    preface: "Preface",
  };

  return roleMap[role] || role;
}

// Per-user fetchers for the Cancel page
export const fetchAltarServerScheduleByDateForUser = async (
  dateISO,
  idNumber
) => {
  const { data, error } = await supabase
    .from("altar-server-placeholder")
    .select("date, mass, role, slot, idNumber")
    .eq("date", dateISO)
    .eq("idNumber", idNumber)
    .order("mass", { ascending: true })
    .order("role", { ascending: true })
    .order("slot", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const fetchLectorCommentatorScheduleByDateForUser = async (
  dateISO,
  idNumber
) => {
  const { data, error } = await supabase
    .from("lector-commentator-placeholder")
    .select("date, mass, role, slot, idNumber")
    .eq("date", dateISO)
    .eq("idNumber", idNumber)
    .order("mass", { ascending: true })
    .order("role", { ascending: true })
    .order("slot", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const fetchEucharisticScheduleByDateForUser = async (
  dateISO,
  idNumber
) => {
  const { data, error } = await supabase
    .from("eucharistic-minister-placeholder")
    .select("date, mass, role, slot, idNumber")
    .eq("date", dateISO)
    .eq("idNumber", idNumber)
    .order("mass", { ascending: true })
    .order("role", { ascending: true })
    .order("slot", { ascending: true });
  if (error) throw error;
  return data || [];
};

// Map department names to their scheduler column names
const schedulerColMap = {
  "Altar Server": "altar-server-scheduler",
  "Eucharistic Minister": "eucharistic-minister-scheduler",
  Choir: "choir-scheduler",
  "Lector Commentator": "lector-commentator-scheduler",
};

// Map department names to their placeholder table names
const placeholderTableMap = {
  "Altar Server": "altar-server-placeholder",
  "Eucharistic Minister": "eucharistic-minister-placeholder",
  Choir: "choir-placeholder",
  "Lector Commentator": "lector-commentator-placeholder",
};

/**
 * Get the scheduler's idNumber for a specific department
 */
export const getSchedulerIdNumber = async (department) => {
  try {
    const schedulerCol = schedulerColMap[department];
    if (!schedulerCol) {
      console.error(`Unsupported department: ${department}`);
      return null;
    }

    const { data, error } = await supabase
      .from("user-type")
      .select("idNumber")
      .eq(schedulerCol, 1)
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching scheduler:", error);
      return null;
    }

    return data?.idNumber || null;
  } catch (err) {
    console.error("getSchedulerIdNumber error:", err);
    return null;
  }
};

/**
 * Cancel a schedule: remove from placeholder table and notify scheduler
 */
export const cancelSchedule = async ({
  department,
  idNumber,
  dateISO,
  mass,
  reason = "",
}) => {
  try {
    // Validate inputs
    if (!department || !idNumber || !dateISO || !mass) {
      await Swal.fire(
        "Missing Information",
        "Required information is missing.",
        "error"
      );
      return false;
    }

    // Get the appropriate placeholder table
    const tableName = placeholderTableMap[department];
    if (!tableName) {
      await Swal.fire(
        "Invalid Department",
        `Department "${department}" is not supported.`,
        "error"
      );
      return false;
    }

    // Step 1: Delete from placeholder table
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq("idNumber", idNumber)
      .eq("date", dateISO)
      .eq("mass", mass);

    if (deleteError) {
      console.error("Error deleting schedule:", deleteError);
      await Swal.fire(
        "Failed",
        "Could not cancel the schedule. Please try again.",
        "error"
      );
      return false;
    }

    // Step 2: Get scheduler's idNumber
    const schedulerIdNumber = await getSchedulerIdNumber(department);

    if (!schedulerIdNumber) {
      await Swal.fire(
        "Warning",
        "Schedule cancelled, but could not notify scheduler (scheduler not found).",
        "warning"
      );
      return true; // Still return true since schedule was deleted
    }

    // Step 3: Send notification to scheduler
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const { error: notifError } = await supabase
      .from("user-specific-notification")
      .insert([
        {
          idNumber: schedulerIdNumber,
          date: dateISO,
          time: currentTime,
          role: "Schedule Cancellation",
          reason: reason || "No reason provided",
        },
      ]);

    if (notifError) {
      console.error("Error sending notification:", notifError);
      await Swal.fire(
        "Warning",
        "Schedule cancelled, but failed to notify scheduler.",
        "warning"
      );
      return true; // Still return true since schedule was deleted
    }

    // Success
    await Swal.fire({
      icon: "success",
      title: "Schedule Cancelled",
      text: "Your schedule has been cancelled and the scheduler has been notified.",
      timer: 2000,
      showConfirmButton: false,
    });

    return true;
  } catch (err) {
    console.error("cancelSchedule error:", err);
    await Swal.fire(
      "Error",
      "An unexpected error occurred while cancelling the schedule.",
      "error"
    );
    return false;
  }
};
