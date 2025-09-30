import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";

import dayjs from "dayjs";
import {
  fetchTemplateMassesForDate,
  getTemplateMassType,
} from "./fetchSchedule";
import {
  fetchAssignmentsGrouped,
  roleCountsFor,
  roleVisibilityFor,
  getTemplateFlags,
} from "./assignMember";

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

// In viewScheduleNormal.js, update fetchUserAltarServerSchedules:
export async function fetchUserAltarServerSchedules(idNumber, year, month) {
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, month + 1, 0);
    const endDateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      endDate.getDate()
    ).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("altar-server-placeholder")
      .select("date, mass, role, slot")
      .eq("idNumber", parseInt(idNumber, 10)) // <-- ADD THIS CONVERSION
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

export async function fetchUserChoirSchedules(idNumber, year, month) {
  if (!idNumber) return [];

  // Month bounds as text (works because your date column is text in YYYY-MM-DD)
  const mm = String(month + 1).padStart(2, "0");
  const startISO = `${year}-${mm}-01`;
  const endDay = new Date(year, month + 1, 0).getDate();
  const endISO = `${year}-${mm}-${String(endDay).padStart(2, "0")}`;

  try {
    // 1) Get the user's choir group abbreviations from choir-member-group
    const { data: memberships, error: memErr } = await supabase
      .from("choir-member-group")
      .select("choir-group-name")
      .eq("idNumber", idNumber);

    if (memErr) {
      console.error("Choir memberships error:", memErr);
      return [];
    }

    const abbrevs = Array.from(
      new Set(
        (memberships || []).map((r) => r?.["choir-group-name"]).filter(Boolean)
      )
    );

    console.log("User abbreviations:", abbrevs);

    if (abbrevs.length === 0) {
      console.log("No choir groups found for user");
      return [];
    }

    // 2) Map abbreviations → full group names using choir-groups
    const { data: groups, error: grpErr } = await supabase
      .from("choir-groups")
      .select("group-name, abbreviation")
      .in("abbreviation", abbrevs);

    if (grpErr) {
      console.error("Choir groups lookup error:", grpErr);
      return [];
    }

    console.log("Matched groups:", groups);

    const fullNames = Array.from(
      new Set((groups || []).map((g) => g?.["group-name"]).filter(Boolean))
    );

    console.log("Full group names:", fullNames);

    if (fullNames.length === 0) {
      console.log("No full group names found");
      return [];
    }

    // 3) Fetch the month's schedule rows from choir-placeholder for those full names
    const { data: rows, error: plErr } = await supabase
      .from("choir-placeholder")
      .select("date, mass, group")
      .in("group", fullNames)
      .gte("date", startISO)
      .lte("date", endISO)
      .order("date", { ascending: true })
      .order("mass", { ascending: true });

    if (plErr) {
      console.error("Choir placeholder fetch error:", plErr);
      return [];
    }

    console.log("Schedule rows found:", rows);

    // Normalize to what your UI expects
    return (rows || []).map((r) => ({
      date: r.date,
      mass: r.mass,
      group: r.group,
      role: null,
    }));
  } catch (e) {
    console.error("fetchUserChoirSchedules fatal:", e);
    return [];
  }
}

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

    // 1) Member assignments (what the user is scheduled on)
    const { data: rows, error } = await supabase
      .from("eucharistic-minister-placeholder")
      .select("date, mass, slot")
      .eq("idNumber", idNumber)
      .gte("date", startDate)
      .lte("date", endDateISO)
      .order("date", { ascending: true })
      .order("mass", { ascending: true });

    if (error) {
      console.error("Error fetching EM schedules:", error);
      return [];
    }
    if (!rows || rows.length === 0) return [];

    // 2) Group assignment per date+mass (stored separately)
    const { data: groups, error: gErr } = await supabase
      .from("eucharistic-minister-group-placeholder")
      .select("date, mass, group")
      .gte("date", startDate)
      .lte("date", endDateISO);

    if (gErr) {
      console.warn("Could not load EM groups:", gErr);
    }

    const key = (d, m) => `${d}|${m}`;
    const groupMap = new Map(
      (groups || []).map((r) => [key(r.date, r.mass), r.group || null])
    );

    // 3) Merge: add .group so the UI can show it
    return rows.map((r) => ({
      ...r,
      group: groupMap.get(key(r.date, r.mass)) || null,
    }));
  } catch (err) {
    console.error("Failed to fetch EM schedules:", err);
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
    .select("date, mass, slot, idNumber")
    .eq("date", dateISO)
    .eq("idNumber", idNumber)
    .order("mass", { ascending: true })
    .order("slot", { ascending: true });
  if (error) throw error;
  return data || [];
};

const schedulerColMap = {
  "Altar Server": "altar-server-scheduler",
  "Eucharistic Minister": "eucharistic-minister-scheduler",
  Choir: "choir-scheduler",
  "Lector Commentator": "lector-commentator-scheduler",
};

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

export async function cancelSchedule({
  department,
  idNumber,
  dateISO,
  mass,
  reason,
}) {
  try {
    const dep = (department || "").toLowerCase();

    // Map non-EM tables (these DO have "role" in your design)
    const placeholderTableMap = {
      "altar server": "altar-server-placeholder",
      "lector commentator": "lector-commentator-placeholder",
      // choir intentionally omitted from cancel flow
    };

    if (dep.includes("euchar")) {
      // ===== EUCHARISTIC MINISTER: delete from BOTH tables, no "role" filter =====
      // 1) Delete individual member rows
      const { error: delMembersErr } = await supabase
        .from("eucharistic-minister-placeholder")
        .delete()
        .eq("idNumber", parseInt(idNumber, 10))
        .eq("date", dateISO)
        .eq("mass", mass);

      if (delMembersErr) {
        console.error("EM cancel: delete member rows failed:", delMembersErr);
        await Swal.fire(
          "Failed",
          "Could not cancel the schedule. Please try again.",
          "error"
        );
        return false;
      }

      // 2) Delete grouped row for that mass (one group per mass)
      const { error: delGroupErr } = await supabase
        .from("eucharistic-minister-group-placeholder")
        .delete()
        .eq("date", dateISO)
        .eq("mass", mass);

      if (delGroupErr) {
        console.error("EM cancel: delete group row failed:", delGroupErr);
        await Swal.fire(
          "Failed",
          "Could not clear the group assignment. Please try again.",
          "error"
        );
        return false;
      }

      // 3) Get scheduler's idNumber and notify them
      const schedulerIdNumber = await getSchedulerIdNumber(
        "Eucharistic Minister"
      );

      if (schedulerIdNumber) {
        await supabase.from("user-specific-notification").insert([
          {
            idNumber: schedulerIdNumber, // Scheduler's ID, not member's
            role: "Schedule Cancellation",
            date: dateISO,
            time: new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            reason: reason || "No reason provided",
          },
        ]);
      }

      await Swal.fire(
        "Cancelled",
        "Your schedule has been cancelled.",
        "success"
      );
      return true;
    }

    if (dep.includes("choir")) {
      await Swal.fire(
        "Not available",
        "Choir cancellation is disabled.",
        "info"
      );
      return false;
    }

    // ===== ALTAR SERVER / LC: existing single-table delete =====
    const tableName =
      placeholderTableMap[department.toLowerCase()] ||
      "altar-server-placeholder";

    // IMPORTANT: "mass" must be the FULL label (e.g., "2nd Mass - 8:00 AM")
    const { data: deletedRows, error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq("idNumber", parseInt(idNumber, 10))
      .eq("date", dateISO)
      .eq("mass", mass)
      .select();

    if (deleteError) {
      console.error("Cancel error:", deleteError);
      await Swal.fire(
        "Failed",
        "Could not cancel the schedule. Please try again.",
        "error"
      );
      return false;
    }

    if (!deletedRows || deletedRows.length === 0) {
      await Swal.fire(
        "Not Found",
        "No matching schedule row was found to cancel. Please refresh and try again.",
        "warning"
      );
      return false;
    }

    // Get scheduler's idNumber and send notification
    const schedulerIdNumber = await getSchedulerIdNumber(department);

    if (schedulerIdNumber) {
      await supabase.from("user-specific-notification").insert([
        {
          idNumber: schedulerIdNumber, // Scheduler's ID, not member's
          role: "Schedule Cancellation",
          date: dateISO,
          time: new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          reason: reason || "No reason provided",
        },
      ]);
    } else {
      console.warn("Scheduler not found for department:", department);
    }

    await Swal.fire(
      "Cancelled",
      "Your schedule has been cancelled.",
      "success"
    );
    return true;
  } catch (e) {
    console.error("cancelSchedule fatal:", e);
    await Swal.fire("Error", "Unexpected error while cancelling.", "error");
    return false;
  }
}

// helper: compute if ALL masses (Sunday + template) are complete for a given date
export async function altarServerAllMassesCompleteForDate(iso) {
  const isSunday = dayjs(iso).day() === 0;

  // 1) Build the display card list exactly like SelectMass
  const sundayMasses = isSunday
    ? ["1st Mass - 6:00 AM", "2nd Mass - 8:00 AM", "3rd Mass - 5:00 PM"]
    : [];

  const uses = await fetchTemplateMassesForDate(iso); // [{ id, templateID, time }]
  // Resolve each template’s mass-type and create the same labels used in SelectMass
  const entries = await Promise.all(
    (uses || []).map(async (u) => {
      const type = (await getTemplateMassType(u.templateID)) || "Mass";
      const display = `${type} - ${u.time} (No. ${u.id})`;
      const storage = `Mass - ${u.time} - ${u.id}`; // DB storage label
      return { display, storage, templateID: u.templateID };
    })
  );

  const massLabels = [
    ...sundayMasses.map((display) => ({
      display,
      storage: display,
      templateID: null,
    })),
    ...entries,
  ];

  // 2) Precompute Sunday and per-template rules, like in SelectMass
  const sundayCounts = roleCountsFor({ flags: null, isSunday: true });
  const sundayVisible = roleVisibilityFor({ flags: null, isSunday: true });

  // Cache template flags by templateID for this date
  const tmplIds = Array.from(new Set(entries.map((e) => e.templateID)));
  const tmplFlagsById = {};
  for (const id of tmplIds) {
    try {
      tmplFlagsById[id] = await getTemplateFlags(iso, id);
    } catch {
      tmplFlagsById[id] = null;
    }
  }

  // 3) Evaluate each mass card
  const statuses = [];
  for (const m of massLabels) {
    const grouped = await fetchAssignmentsGrouped({
      dateISO: iso,
      massLabel: m.storage,
    });

    // Decide rule set
    const isSundayCard = m.templateID == null;
    const counts = isSundayCard
      ? sundayCounts
      : roleCountsFor({ flags: tmplFlagsById[m.templateID], isSunday: false });
    const visible = isSundayCard
      ? sundayVisible
      : roleVisibilityFor({
          flags: tmplFlagsById[m.templateID],
          isSunday: false,
        });

    // If truly nothing assigned to any visible role, treat as "empty"
    const totalAssigned = Object.values(grouped || {}).reduce(
      (s, arr) => s + (Array.isArray(arr) ? arr.length : 0),
      0
    );
    if (totalAssigned === 0) {
      statuses.push("empty");
      continue;
    }

    // Check every visible role meets its needed count
    let complete = true;
    for (const roleKey of Object.keys(visible || {})) {
      if (!visible[roleKey]) continue;
      const need = Number(counts[roleKey] || 0);
      const have = Array.isArray(grouped?.[roleKey])
        ? grouped[roleKey].length
        : 0;
      if (have < need) {
        complete = false;
        break;
      }
    }
    statuses.push(complete ? "complete" : "incomplete");
  }

  if (statuses.length === 0) return "empty";
  if (statuses.every((s) => s === "empty")) return "empty";
  if (statuses.every((s) => s === "complete")) return "complete";
  return "incomplete";
}
