// assets/scripts/fetchSchedule.js
import { supabase } from "../../utils/supabase";

// If computeStatusForDate is used, we need these helpers:
import {
  fetchAssignmentsGrouped,
  getTemplateFlags,
  roleCountsFor,
  roleVisibilityFor,
  //fetchAssignmentsGroupedLectorCommentator,
  getTemplateFlagsLectorCommentator,
  roleCountsForLectorCommentator,
  roleVisibilityForLectorCommentator,
} from "./assignMember";

/*async function massStatusFor({ dateISO, massLabel, flags, isSunday }) {
  const grouped = await fetchAssignmentsGrouped({ dateISO, massLabel });

  // choose rules
  const counts = roleCountsFor({ flags: flags ?? null, isSunday });
  const visible = roleVisibilityFor({ flags: flags ?? null, isSunday });

  const totalAssigned = Object.values(grouped || {}).reduce(
    (s, arr) => s + (Array.isArray(arr) ? arr.length : 0),
    0
  );
  if (totalAssigned === 0) return "empty";

  let allComplete = true;
  for (const roleKey of Object.keys(visible || {})) {
    if (!visible[roleKey]) continue; // hidden role
    const need = Number(counts[roleKey] || 0);
    if (need <= 0) continue; // role not required
    const have = Array.isArray(grouped?.[roleKey])
      ? grouped[roleKey].length
      : 0;
    if (have < need) allComplete = false;
  }
  return allComplete ? "complete" : "incomplete";
}*/

export const getTemplateMassType = async (templateID) => {
  if (!templateID) return;
  try {
    const { data, error } = await supabase
      .from("template-information")
      .select('"mass-type"')
      .eq("templateID", templateID)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.["mass-type"] || "null";
  } catch (err) {
    console.error("getTemplateMassType error:", err);
    return null;
  }
};

/*export const fetchTemplateMassesForDate = async (isoDate) => {
  try {
    // get all uses for that day
    const { data: uses, error: useErr } = await supabase
      .from("use-template-table")
      .select("templateID,time")
      .eq("date", isoDate)
      .order("time", { ascending: true });

    if (useErr || !uses?.length) return [];

    // filter by templates that are needed
    const ids = Array.from(
      new Set(uses.map((u) => u.templateID).filter(Boolean))
    );

    if (!ids.length) return [];

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-altar-server")
      .select("templateID,isNeeded")
      .in("templateID", ids)
      .eq("isNeeded", 1);

    if (tmplErr) return [];

    const allowed = new Set((tmplRows || []).map((t) => t.templateID));

    // keep only needed ones
    return uses
      .filter((u) => allowed.has(u.templateID))
      .map((u) => ({
        templateID: u.templateID,
        time: u.time || "",
      }));
  } catch {
    return [];
  }
};*/

export const fetchTemplateMassesForDate = async (isoDate) => {
  try {
    const { data: uses, error: useErr } = await supabase
      .from("use-template-table")
      .select("id,templateID,time") // ← Add 'id' here
      .eq("date", isoDate)
      .order("time", { ascending: true });

    if (useErr || !uses?.length) return [];

    const ids = Array.from(
      new Set(uses.map((u) => u.templateID).filter(Boolean))
    );

    if (!ids.length) return [];

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-altar-server")
      .select("templateID,isNeeded")
      .in("templateID", ids)
      .eq("isNeeded", 1);

    if (tmplErr) return [];

    const allowed = new Set((tmplRows || []).map((t) => t.templateID));

    return uses
      .filter((u) => allowed.has(u.templateID))
      .map((u) => ({
        id: u.id, // ← Include the row ID
        templateID: u.templateID,
        time: u.time || "",
      }));
  } catch {
    return [];
  }
};

/* =========================
 * Month helpers and labels
 * ========================= */
export const MONTH_NAMES_UC = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

export const MONTH_NAMES_TC = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* =========================
 * Date utilities
 * ========================= */

// All Sundays in a (year, month) where month is 0–11
export const getSundays = (year, month) => {
  const sundays = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === 0) sundays.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return sundays;
};

export const prevMonth = (year, month) =>
  month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };

export const nextMonth = (year, month) =>
  month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

export const formatHeader = (year, month) =>
  `MONTH OF ${MONTH_NAMES_UC[month]} - ${year}`;

export const formatScheduleDate = (dateObj) => {
  const month = MONTH_NAMES_TC[dateObj.getMonth()];
  const day = dateObj.getDate();
  const weekday = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][dateObj.getDay()];
  return `${month} ${day} - ${weekday}`;
};

// Parse "YYYY-MM-DD" **as LOCAL time** to avoid month-shift bugs
const parseLocalDate = (isoDate) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
};

export const fetchAltarServerTemplateDates = async () => {
  const { data: uses, error: useErr } = await supabase
    .from("use-template-table")
    .select("id,date,time,templateID")
    .order("date", { ascending: true });

  if (useErr) {
    console.error("Supabase (use-template-table) error:", useErr);
    return [];
  }

  const templateIDs = Array.from(
    new Set((uses || []).map((u) => u.templateID).filter((v) => v != null))
  );
  if (templateIDs.length === 0) return [];

  const { data: needed, error: tmplErr } = await supabase
    .from("template-altar-server")
    .select("templateID,isNeeded")
    .in("templateID", templateIDs)
    .eq("isNeeded", 1);

  if (tmplErr) {
    console.error("Supabase (template-altar-server) error:", tmplErr);
    return [];
  }

  const allowed = new Set((needed || []).map((t) => t.templateID));

  return (uses || [])
    .filter(
      (r) =>
        typeof r.date === "string" &&
        r.date.length >= 10 &&
        allowed.has(r.templateID)
    )
    .map((r) => {
      const d = parseLocalDate(r.date); // you already have this helper
      return {
        id: r.id,
        templateID: r.templateID,
        dateStr: r.date, // "YYYY-MM-DD" local
        dateObj: d, // Date object
        time: r.time || null, // keep time for SelectMass
      };
    });
};

export const fetchAltarServerTemplateFlags = async (templateID) => {
  if (templateID == null) return null;

  const { data, error } = await supabase
    .from("template-altar-server")
    .select(
      'templateID,isNeeded,"candle-bearer","thurifer","beller","main-server","cross-bearer","incense-bearer","plate"'
    )
    .eq("templateID", templateID)
    .maybeSingle();

  if (error) {
    console.error("Supabase fetch flags error:", error);
    return null;
  }
  if (!data) return null;

  return {
    templateID: data.templateID,
    isNeeded: Number(data.isNeeded) === 1,
    roles: {
      candleBearer: Number(data["candle-bearer"] || 0),
      thurifer: Number(data["thurifer"] || 0),
      beller: Number(data["beller"] || 0),
      mainServer: Number(data["main-server"] || 0),
      crossBearer: Number(data["cross-bearer"] || 0),
      incenseBearer: Number(data["incense-bearer"] || 0),
      plate: Number(data["plate"] || 0),
    },
  };
};

export const getTemplateFlagsForDate = async (isoDate, templateID) => {
  try {
    let tid = templateID ?? null;

    if (!tid && isoDate) {
      const { data: useRows, error: useErr } = await supabase
        .from("use-template-table")
        .select("templateID")
        .eq("date", isoDate)
        .limit(1);
      if (useErr) throw useErr;
      tid = useRows?.[0]?.templateID ?? null;
    }

    if (!tid) return null;

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-altar-server")
      .select(
        'templateID,isNeeded,"candle-bearer",thurifer,beller,"main-server","cross-bearer","incense-bearer",plate'
      )
      .eq("templateID", tid)
      .order("id", { ascending: false })
      .limit(1);

    if (tmplErr) throw tmplErr;

    const row = tmplRows?.[0];
    if (!row) return { templateID: tid, roles: {} };

    return {
      templateID: row.templateID,
      isNeeded: row.isNeeded ?? null,
      roles: {
        candleBearer: Number(row["candle-bearer"] ?? 0),
        thurifer: Number(row.thurifer ?? 0),
        beller: Number(row.beller ?? 0),
        mainServer: Number(row["main-server"] ?? 0),
        crossBearer: Number(row["cross-bearer"] ?? 0),
        incenseBearer: Number(row["incense-bearer"] ?? 0),
        plate: Number(row.plate ?? 0),
      },
    };
  } catch (err) {
    console.error("getTemplateFlagsForDate error:", err);
    return null;
  }
};

export const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* =========================
 * Filtering / merging
 * ========================= */

export const filterByMonthYear = (items, year, month) =>
  (items || []).filter(
    (it) =>
      it?.dateObj instanceof Date &&
      !isNaN(it.dateObj) &&
      it.dateObj.getFullYear() === year &&
      it.dateObj.getMonth() === month
  );

export const mergeSchedules = (sundays, templates) => {
  const map = new Map();

  // Seed Sundays using LOCAL key
  (sundays || []).forEach((d) => {
    const key = ymdLocal(d);
    map.set(key, {
      dateStr: key,
      dateObj: d,
      hasSunday: true,
      template: null,
    });
  });

  // Attach template info (same local key)
  (templates || []).forEach((t) => {
    const key =
      t.dateStr || (t.dateObj instanceof Date ? ymdLocal(t.dateObj) : "");
    if (!key) return;

    const base = map.get(key) || {
      dateStr: key,
      dateObj: t.dateObj || parseLocalDate(key),
      hasSunday: false,
      template: null,
    };

    // If multiple template rows exist for same date, prefer the one that has a time
    if (!base.template || (!base.template.time && t.time)) {
      base.template = {
        templateID: t.templateID ?? null,
        time: t.time || null,
      };
    }

    map.set(key, base);
  });

  // One combined item per date
  return Array.from(map.values()).sort((a, b) => a.dateObj - b.dateObj);
};

/* =========================
 * UI helpers moved from JSX
 * ========================= */

// Map schedule status → card visuals/text/icon keys
export const viewFor = (status, image) => {
  if (status === "complete") {
    return {
      border: "border-green",
      text: "Complete schedule",
      textClass: "green",
      dividerClass: "green",
      img: image.completeScheduleImage,
    };
  }
  if (status === "incomplete") {
    return {
      border: "border-orange",
      text: "Incomplete schedule",
      textClass: "orange",
      dividerClass: "orange",
      img: image.incompleteScheduleImage,
    };
  }
  return {
    border: "border-blue",
    text: "This Schedule is Empty.",
    textClass: "blue",
    dividerClass: "blue",
    img: image.emptyScheduleImage,
  };
};

// Loading text variants
export const getLoadingMessage = ({ loading, navigating, loadingStatus }) => {
  if (loading) return "Loading schedules...";
  if (navigating) return "Loading month schedules...";
  if (loadingStatus) return "Checking schedule statuses...";
  return "Loading...";
};

/*export async function computeStatusForDate({ dateISO, isSunday }) {
  // 1) Build the full list of masses on this date
  const labels = [];

  // Sunday masses (use Sunday rules)
  if (isSunday) {
    labels.push({ display: "1st Mass - 6:00 AM", isSunday: true });
    labels.push({ display: "2nd Mass - 8:00 AM", isSunday: true });
    labels.push({ display: "3rd Mass - 5:00 PM", isSunday: true });
  }

  // Template masses for this date (may be 0..N)
  const uses = await fetchTemplateMassesForDate(dateISO); // [{templateID, time}]
  // We’ll collect alongside the flags they need
  const tmplWithFlags = await Promise.all(
    (uses || []).map(async (u) => ({
      storageLabel: `Mass - ${u.time}`, // DB label
      flags: await getTemplateFlags(dateISO, u.templateID),
    }))
  );

  // 2) Evaluate each mass
  const massStatuses = [];

  // Sunday cards
  for (const m of labels) {
    massStatuses.push(
      await massStatusFor({
        dateISO,
        massLabel: m.display,
        flags: null,
        isSunday: true,
      })
    );
  }

  // Template cards
  for (const m of tmplWithFlags) {
    massStatuses.push(
      await massStatusFor({
        dateISO,
        massLabel: m.storageLabel,
        flags: m.flags, // template-specific visibility/counts
        isSunday: false,
      })
    );
  }

  // 3) Collapse to a single date status
  if (massStatuses.length === 0) return "empty"; // nothing that day

  const allEmpty = massStatuses.every((s) => s === "empty");
  if (allEmpty) return "empty";

  const allComplete = massStatuses.every((s) => s === "complete");
  if (allComplete) return "complete";

  return "incomplete";
}*/

export async function computeStatusForDate({ dateISO, isSunday }) {
  // Get ALL assignments for this date
  const { data: allAssignments } = await supabase
    .from("altar-server-placeholder")
    .select("mass, role, idNumber")
    .eq("date", dateISO);

  // Get unique mass labels
  const actualMassLabels = new Set(
    (allAssignments || []).map((a) => String(a.mass).trim())
  );

  // Build expected masses
  const massesToCheck = [];

  if (isSunday) {
    massesToCheck.push({ label: "1st Mass - 6:00 AM", isSunday: true });
    massesToCheck.push({ label: "2nd Mass - 8:00 AM", isSunday: true });
    massesToCheck.push({ label: "3rd Mass - 5:00 PM", isSunday: true });
  }

  const uses = await fetchTemplateMassesForDate(dateISO);

  // Check each mass status
  const results = [];

  // Sunday masses
  for (const s of massesToCheck) {
    const massAssignments = (allAssignments || []).filter(
      (a) => a.mass === s.label
    );
    const grouped = await fetchAssignmentsGrouped({
      dateISO,
      massLabel: s.label,
    });

    const counts = roleCountsFor({ flags: null, isSunday: true });
    const visible = roleVisibilityFor({ flags: null, isSunday: true });

    let allComplete = true;
    for (const roleKey of Object.keys(visible || {})) {
      if (!visible[roleKey]) continue;
      const need = Number(counts[roleKey] || 0);
      if (need <= 0) continue;
      const have = Array.isArray(grouped?.[roleKey])
        ? grouped[roleKey].length
        : 0;
      if (have < need) allComplete = false;
    }

    const status =
      massAssignments.length === 0
        ? "empty"
        : allComplete
        ? "complete"
        : "incomplete";
    results.push(status);
  }

  // Template masses - check against actual DB labels
  for (const label of actualMassLabels) {
    // Skip if it's a Sunday mass (already checked)
    if (
      label.includes("1st Mass") ||
      label.includes("2nd Mass") ||
      label.includes("3rd Mass")
    ) {
      continue;
    }

    const massAssignments = (allAssignments || []).filter(
      (a) => a.mass === label
    );

    // Get the flags for this template
    const timeMatch = label.match(/Mass - ([^(-]+)/);
    const time = timeMatch ? timeMatch[1].trim() : "";
    const use = (uses || []).find((u) => String(u.time).trim() === time);
    const flags = use ? await getTemplateFlags(dateISO, use.templateID) : null;

    const grouped = await fetchAssignmentsGrouped({
      dateISO,
      massLabel: label,
    });
    const counts = roleCountsFor({ flags, isSunday: false });
    const visible = roleVisibilityFor({ flags, isSunday: false });

    let allComplete = true;
    for (const roleKey of Object.keys(visible || {})) {
      if (!visible[roleKey]) continue;
      const need = Number(counts[roleKey] || 0);
      if (need <= 0) continue;
      const have = Array.isArray(grouped?.[roleKey])
        ? grouped[roleKey].length
        : 0;
      if (have < need) allComplete = false;
    }

    const status =
      massAssignments.length === 0
        ? "empty"
        : allComplete
        ? "complete"
        : "incomplete";
    results.push(status);
  }

  if (results.length === 0) return "empty";
  if (results.every((s) => s === "empty")) return "empty";
  if (results.every((s) => s === "complete")) return "complete";

  return "incomplete";
}

export const getTemplateTimeForDate = async (dateISO) => {
  try {
    const { data, error } = await supabase
      .from("use-template-table")
      .select("time")
      .eq("date", dateISO)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.time || null;
  } catch (e) {
    console.error("getTemplateTimeForDate error:", e);
    return null;
  }
};

const buildFullName = (member) => {
  const first = member.firstName || member.firstname || member.first_name || "";
  const middle =
    member.middleName || member.middlename || member.middle_name || "";
  const last = member.lastName || member.lastname || member.last_name || "";

  return `${first} ${middle ? middle + " " : ""}${last}`.trim();
};

/* LECTOR COMMENTATOR */

export const fetchLectorCommentatorTemplateDates = async () => {
  const { data: uses, error: useErr } = await supabase
    .from("use-template-table")
    .select("id,date,time,templateID")
    .order("date", { ascending: true });

  if (useErr) {
    console.error("Supabase (use-template-table) error:", useErr);
    return [];
  }

  const templateIDs = Array.from(
    new Set((uses || []).map((u) => u.templateID).filter((v) => v != null))
  );
  if (templateIDs.length === 0) return [];

  const { data: needed, error: tmplErr } = await supabase
    .from("template-lector-commentator")
    .select("templateID,isNeeded")
    .in("templateID", templateIDs)
    .eq("isNeeded", 1);

  if (tmplErr) {
    console.error("Supabase (template-altar-server) error:", tmplErr);
    return [];
  }

  const allowed = new Set((needed || []).map((t) => t.templateID));

  return (uses || [])
    .filter(
      (r) =>
        typeof r.date === "string" &&
        r.date.length >= 10 &&
        allowed.has(r.templateID)
    )
    .map((r) => {
      const d = parseLocalDate(r.date); // you already have this helper
      return {
        id: r.id,
        templateID: r.templateID,
        dateStr: r.date, // "YYYY-MM-DD" local
        dateObj: d, // Date object
        time: r.time || null, // keep time for SelectMass
      };
    });
};

export const fetchLectorCommentatorAssignmentsGrouped = async (
  dateISO,
  massLabel
) => {
  const { data: rows, error } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber, role, slot")
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .order("role", { ascending: true })
    .order("slot", { ascending: true });
  if (error) throw error;
  if (!rows || rows.length === 0) return {};

  const ids = Array.from(new Set(rows.map((r) => r.idNumber).filter(Boolean)));
  let nameMap = new Map();

  if (ids.length > 0) {
    const { data: members, error: memErr } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", ids);
    if (memErr) throw memErr;
    members?.forEach((m) => nameMap.set(m.idNumber, buildFullName(m)));
  }

  const grouped = {};
  rows.forEach((r) => {
    const mass = r.mass || "Mass";
    const role =
      r.role === "reading"
        ? "reading"
        : r.role === "intercession"
        ? "intercession"
        : r.role;
    const name = nameMap.get(String(r.idNumber)) || "";
    grouped[mass] ||= {};
    (grouped[mass][role] ||= []).push(name);
  });

  Object.keys(grouped).forEach((k) =>
    grouped[k].sort((a, b) => (a.slot || 0) - (b.slot || 0))
  );
  return grouped;
};

export const checkLectorCommentatorRolesNeeded = async (templateID) => {
  try {
    const { data, error } = await supabase
      .from("template-lector-commentator")
      .select("reading, intercession")
      .eq("templateID", templateID)
      .single();

    if (error || !data) {
      console.error("Error fetching template roles:", error);
      return { reading: 0, intercession: 0 };
    }

    return {
      reading: data.reading ? 1 : 0,
      intercession: data.intercession ? 1 : 0,
    };
  } catch (error) {
    console.error("Error fetching Lector Commentator roles:", error);
    return { reading: 0, intercession: 0 };
  }
};

export const getTemplateFlagsForLectorCommentator = async (
  isoDate,
  templateID
) => {
  try {
    let tid = templateID ?? null;

    if (!tid && isoDate) {
      const { data: useRows, error: useErr } = await supabase
        .from("use-template-table")
        .select("templateID")
        .eq("date", isoDate)
        .limit(1);
      if (useErr) throw useErr;
      tid = useRows?.[0]?.templateID ?? null;
    }

    if (!tid) return null;

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-lector-commentator") // Change table name to 'template-lector-commentator'
      .select(
        "templateID,isNeeded,reading,preface" // Assuming these columns are available for Lector/Commentator
      )
      .eq("templateID", tid)
      .order("id", { ascending: false })
      .limit(1);

    if (tmplErr) throw tmplErr;

    const row = tmplRows?.[0];
    if (!row) return { templateID: tid, roles: {} };

    return {
      templateID: row.templateID,
      isNeeded: row.isNeeded ?? null,
      roles: {
        reading: Number(row.reading ?? 0), // Adjust roles based on your actual columns
        preface: Number(row.preface ?? 0),
      },
    };
  } catch (err) {
    console.error("getTemplateFlagsForLectorCommentator error:", err);
    return null;
  }
};

/*export const fetchLectorCommentatorTemplateMassesForDate = async (isoDate) => {
  try {
    // get all uses for that day
    const { data: uses, error: useErr } = await supabase
      .from("use-template-table")
      .select("templateID,time")
      .eq("date", isoDate)
      .order("time", { ascending: true });

    if (useErr || !uses?.length) return [];

    // filter by templates that are needed
    const ids = Array.from(
      new Set(uses.map((u) => u.templateID).filter(Boolean))
    );

    if (!ids.length) return [];

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-lector-commentator")
      .select("templateID,isNeeded")
      .in("templateID", ids)
      .eq("isNeeded", 1);

    if (tmplErr) return [];

    const allowed = new Set((tmplRows || []).map((t) => t.templateID));

    // keep only needed ones
    return uses
      .filter((u) => allowed.has(u.templateID))
      .map((u) => ({
        templateID: u.templateID,
        time: u.time || "",
      }));
  } catch {
    return [];
  }
};*/

export const fetchLectorCommentatorTemplateMassesForDate = async (isoDate) => {
  try {
    const { data: uses, error: useErr } = await supabase
      .from("use-template-table")
      .select("id,templateID,time") // ← Add 'id' here
      .eq("date", isoDate)
      .order("time", { ascending: true });

    if (useErr || !uses?.length) return [];

    const ids = Array.from(
      new Set(uses.map((u) => u.templateID).filter(Boolean))
    );

    if (!ids.length) return [];

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-lector-commentator")
      .select("templateID,isNeeded")
      .in("templateID", ids)
      .eq("isNeeded", 1);

    if (tmplErr) return [];

    const allowed = new Set((tmplRows || []).map((t) => t.templateID));

    return uses
      .filter((u) => allowed.has(u.templateID))
      .map((u) => ({
        id: u.id, // ← Include the row ID
        templateID: u.templateID,
        time: u.time || "",
      }));
  } catch {
    return [];
  }
};

/*export async function computeLectorCommentatorStatusForDate({
  dateISO,
  isSunday,
}) {
  // 1) Build the full list of masses on this date
  const labels = [];

  // Sunday masses (use Sunday rules)
  if (isSunday) {
    labels.push({ display: "1st Mass - 6:00 AM", isSunday: true });
    labels.push({ display: "2nd Mass - 8:00 AM", isSunday: true });
    labels.push({ display: "3rd Mass - 5:00 PM", isSunday: true });
  }

  // Template masses for this date (may be 0..N)fetchLectorCommentatorTemplateDates
  const uses = await fetchLectorCommentatorTemplateMassesForDate(dateISO); // [{templateID, time}]
  // We’ll collect alongside the flags they need
  const tmplWithFlags = await Promise.all(
    (uses || []).map(async (u) => ({
      storageLabel: `Mass - ${u.time}`, // DB label
      flags: await getTemplateFlagsLectorCommentator(dateISO, u.templateID),
    }))
  );

  // 2) Evaluate each mass
  const massStatuses = [];

  // Sunday cards
  for (const m of labels) {
    massStatuses.push(
      await massLectorCommentatorStatusFor({
        dateISO,
        massLabel: m.display,
        flags: null,
        isSunday: true,
      })
    );
  }

  // Template cards
  for (const m of tmplWithFlags) {
    massStatuses.push(
      await massLectorCommentatorStatusFor({
        dateISO,
        massLabel: m.storageLabel,
        flags: m.flags, // template-specific visibility/counts
        isSunday: false,
      })
    );
  }

  // 3) Collapse to a single date status
  if (massStatuses.length === 0) return "empty"; // nothing that day

  const allEmpty = massStatuses.every((s) => s === "empty");
  if (allEmpty) return "empty";

  const allComplete = massStatuses.every((s) => s === "complete");
  if (allComplete) return "complete";

  return "incomplete";
}*/

export async function computeLectorCommentatorStatusForDate({
  dateISO,
  isSunday,
}) {
  // Get ALL assignments for this date
  const { data: allAssignments } = await supabase
    .from("lector-commentator-placeholder")
    .select("mass, role, idNumber")
    .eq("date", dateISO);

  // Get unique mass labels
  const actualMassLabels = new Set(
    (allAssignments || []).map((a) => String(a.mass).trim())
  );

  // Build expected masses
  const massesToCheck = [];

  if (isSunday) {
    massesToCheck.push({ label: "1st Mass - 6:00 AM", isSunday: true });
    massesToCheck.push({ label: "2nd Mass - 8:00 AM", isSunday: true });
    massesToCheck.push({ label: "3rd Mass - 5:00 PM", isSunday: true });
  }

  const uses = await fetchLectorCommentatorTemplateMassesForDate(dateISO);

  // Check each mass status
  const results = [];

  // Sunday masses
  for (const s of massesToCheck) {
    const massAssignments = (allAssignments || []).filter(
      (a) => a.mass === s.label
    );

    if (massAssignments.length === 0) {
      results.push("empty");
      continue;
    }

    // Check if all required roles are filled
    const grouped = {};
    massAssignments.forEach((a) => {
      if (!grouped[a.role]) grouped[a.role] = [];
      grouped[a.role].push(a.idNumber);
    });

    const counts = roleCountsForLectorCommentator({
      flags: null,
      isSunday: true,
    });
    const visible = roleVisibilityForLectorCommentator({
      flags: null,
      isSunday: true,
    });

    let allComplete = true;
    for (const roleKey of Object.keys(visible || {})) {
      if (!visible[roleKey]) continue;
      const need = Number(counts[roleKey] || 0);
      if (need <= 0) continue;
      const have = (grouped[roleKey] || []).length;
      if (have < need) {
        allComplete = false;
        break;
      }
    }

    results.push(allComplete ? "complete" : "incomplete");
  }

  // Template masses - check against actual DB labels
  for (const label of actualMassLabels) {
    // Skip if it's a Sunday mass (already checked)
    if (
      label.includes("1st Mass") ||
      label.includes("2nd Mass") ||
      label.includes("3rd Mass")
    ) {
      continue;
    }

    const massAssignments = (allAssignments || []).filter(
      (a) => a.mass === label
    );

    if (massAssignments.length === 0) {
      results.push("empty");
      continue;
    }

    // Extract time from label format "Mass - 11:00 - 42"
    const parts = label.split(" - ");
    const time = parts.length >= 2 ? parts[1].trim() : "";
    const templateIDFromLabel = parts.length >= 3 ? parts[2].trim() : "";

    // Find matching template use
    const use = (uses || []).find(
      (u) =>
        String(u.time).trim() === time ||
        String(u.templateID).trim() === templateIDFromLabel
    );

    const flags = use
      ? await getTemplateFlagsLectorCommentator(dateISO, use.templateID)
      : null;

    // Check if all required roles are filled
    const grouped = {};
    massAssignments.forEach((a) => {
      if (!grouped[a.role]) grouped[a.role] = [];
      grouped[a.role].push(a.idNumber);
    });

    const counts = roleCountsForLectorCommentator({ flags, isSunday: false });
    const visible = roleVisibilityForLectorCommentator({
      flags,
      isSunday: false,
    });

    let allComplete = true;
    for (const roleKey of Object.keys(visible || {})) {
      if (!visible[roleKey]) continue;
      const need = Number(counts[roleKey] || 0);
      if (need <= 0) continue;
      const have = (grouped[roleKey] || []).length;
      if (have < need) {
        allComplete = false;
        break;
      }
    }

    results.push(allComplete ? "complete" : "incomplete");
  }

  if (results.length === 0) return "empty";
  if (results.every((s) => s === "empty")) return "empty";
  if (results.every((s) => s === "complete")) return "complete";

  return "incomplete";
}

/*async function massLectorCommentatorStatusFor({
  dateISO,
  massLabel,
  flags,
  isSunday,
}) {
  const grouped = await fetchAssignmentsGroupedLectorCommentator({
    dateISO,
    massLabel,
  });

  // choose rules
  const counts = roleCountsForLectorCommentator({
    flags: flags ?? null,
    isSunday,
  });
  const visible = roleVisibilityForLectorCommentator({
    flags: flags ?? null,
    isSunday,
  });

  const totalAssigned = Object.values(grouped || {}).reduce(
    (s, arr) => s + (Array.isArray(arr) ? arr.length : 0),
    0
  );
  if (totalAssigned === 0) return "empty";

  let allComplete = true;
  for (const roleKey of Object.keys(visible || {})) {
    if (!visible[roleKey]) continue; // hidden role
    const need = Number(counts[roleKey] || 0);
    if (need <= 0) continue; // role not required
    const have = Array.isArray(grouped?.[roleKey])
      ? grouped[roleKey].length
      : 0;
    if (have < need) allComplete = false;
  }
  return allComplete ? "complete" : "incomplete";
}*/

/*=========================
 Choir Functions
 *========================= */

export const fetchChoirTemplateDates = async () => {
  const { data: uses, error: useErr } = await supabase
    .from("use-template-table")
    .select("id, date, time, templateID")
    .order("date", { ascending: true });

  if (useErr) {
    console.error("Error fetching choir template dates:", useErr);
    return [];
  }

  const templateIDs = Array.from(
    new Set((uses || []).map((u) => u.templateID).filter((v) => v != null))
  );
  if (templateIDs.length === 0) return [];

  const { data: needed, error: tmplErr } = await supabase
    .from("template-choir")
    .select("templateID, isNeeded")
    .in("templateID", templateIDs)
    .eq("isNeeded", 1);

  if (tmplErr) {
    console.error("Error fetching choir templates:", tmplErr);
    return [];
  }

  const allowed = new Set((needed || []).map((t) => t.templateID));

  return (uses || [])
    .filter(
      (r) =>
        typeof r.date === "string" &&
        r.date.length >= 10 &&
        allowed.has(r.templateID)
    )
    .map((r) => {
      const d = parseLocalDate(r.date); // Helper function for date parsing
      return {
        id: r.id,
        templateID: r.templateID,
        dateStr: r.date, // "YYYY-MM-DD" local
        dateObj: d, // Date object
        time: r.time || null, // Keep time for SelectMass
      };
    });
};

export const fetchChoirGroupAssignmentsGrouped = async (dateISO, massLabel) => {
  const { data: rows, error } = await supabase
    .from("choir-placeholder")
    .select("group, groupId")
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .order("group", { ascending: true });

  if (error) throw error;
  if (!rows || rows.length === 0) return {};

  // Fetch group details based on groupId
  const groupIds = Array.from(
    new Set(rows.map((r) => r.groupId).filter(Boolean))
  );
  let groupMap = new Map();
  if (groupIds.length > 0) {
    const { data: groups, error: grpErr } = await supabase
      .from("choir-groups")
      .select("id, group-name")
      .in("id", groupIds);
    if (grpErr) throw grpErr;

    groups?.forEach((g) => groupMap.set(g.id, g["group-name"]));
  }

  const grouped = {};
  rows.forEach((r) => {
    const mass = r.mass || "Mass";
    const group = r.group || "Unknown Group";
    const groupName = groupMap.get(r.groupId) || group;
    grouped[mass] ||= {};
    (grouped[mass][groupName] ||= []).push(groupName);
  });

  Object.keys(grouped).forEach((k) =>
    grouped[k].sort((a, b) => (a.slot || 0) - (b.slot || 0))
  );
  return grouped;
};

export const checkChoirGroupNeeded = async (templateID) => {
  try {
    const { data, error } = await supabase
      .from("template-choir")
      .select("group")
      .eq("templateID", templateID)
      .single();

    if (error || !data) {
      console.error("Error fetching choir group data:", error);
      return { group: 0 };
    }

    return {
      group: data.group ? 1 : 0,
    };
  } catch (error) {
    console.error("Error fetching choir group requirements:", error);
    return { group: 0 };
  }
};

/*export const fetchChoirTemplateMassesForDate = async (isoDate) => {
  try {
    // get all uses for that day
    const { data: uses, error: useErr } = await supabase
      .from("use-template-table")
      .select("templateID,time")
      .eq("date", isoDate)
      .order("time", { ascending: true });

    if (useErr || !uses?.length) return [];

    // filter by templates that are needed
    const ids = Array.from(
      new Set(uses.map((u) => u.templateID).filter(Boolean))
    );

    if (!ids.length) return [];

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-choir")
      .select("templateID,isNeeded")
      .in("templateID", ids)
      .eq("isNeeded", 1);

    if (tmplErr) return [];

    const allowed = new Set((tmplRows || []).map((t) => t.templateID));

    // keep only needed ones
    return uses
      .filter((u) => allowed.has(u.templateID))
      .map((u) => ({
        templateID: u.templateID,
        time: u.time || "",
      }));
  } catch {
    return [];
  }
};*/

export const fetchChoirTemplateMassesForDate = async (isoDate) => {
  try {
    const { data: uses, error: useErr } = await supabase
      .from("use-template-table")
      .select("id,templateID,time") // ← Add 'id' here
      .eq("date", isoDate)
      .order("time", { ascending: true });

    if (useErr || !uses?.length) return [];

    const ids = Array.from(
      new Set(uses.map((u) => u.templateID).filter(Boolean))
    );

    if (!ids.length) return [];

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-choir")
      .select("templateID,isNeeded")
      .in("templateID", ids)
      .eq("isNeeded", 1);

    if (tmplErr) return [];

    const allowed = new Set((tmplRows || []).map((t) => t.templateID));

    return uses
      .filter((u) => allowed.has(u.templateID))
      .map((u) => ({
        id: u.id, // ← Include the row ID
        templateID: u.templateID,
        time: u.time || "",
      }));
  } catch {
    return [];
  }
};

export const getTemplateFlagsForChoir = async (selectedISO, templateID) => {
  try {
    let tid = templateID ?? null;

    // If templateID is not provided, fetch from the use-template-table for the given date
    if (!tid && selectedISO) {
      const { data: useRows, error: useErr } = await supabase
        .from("use-template-table")
        .select("templateID")
        .eq("date", selectedISO)
        .limit(1);

      if (useErr) throw useErr;
      tid = useRows?.[0]?.templateID ?? null;
    }

    if (!tid) return null;

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-choir")
      //.select("templateID, isNeeded, group")
      .select('templateID, isNeeded, "group-count"')
      .eq("templateID", tid)
      .order("id", { ascending: false })
      .limit(1);

    if (tmplErr) throw tmplErr;

    const row = tmplRows?.[0];
    if (!row) return { templateID: tid, groups: {} };

    /*return {
      templateID: row.templateID,
      isNeeded: row.isNeeded ?? null,
      groups: {
        choirGroup: Number(row.group ?? 0),
      },
    };*/
    return {
      templateID: row.templateID,
      isNeeded: row.isNeeded ?? null,
      groups: { choirGroup: Number(row["group-count"] ?? 0) },
    };
  } catch (err) {
    console.error("getTemplateFlagsForChoir error:", err);
    return null;
  }
};

export async function getTemplateChoirGroupCount({ templateID, dateISO }) {
  try {
    let tid = templateID;

    // Fallback: resolve templateID from use-template-table using the ISO date
    if (!tid && dateISO) {
      const { data: useRows, error: useErr } = await supabase
        .from("use-template-table")
        .select("templateID")
        .eq("date", dateISO)
        .limit(1);
      if (!useErr && useRows && useRows.length) {
        tid = useRows[0].templateID;
      }
    }

    if (!tid) return 1;

    const { data, error } = await supabase
      .from("template-choir")
      .select('isNeeded, "group-count"')
      .eq("templateID", tid)
      .order("id", { ascending: false })
      .limit(1);

    const row = data?.[0];
    if (error || !row) return 1;
    if (Number(row.isNeeded) !== 1) return 1;

    const count = Number(row["group-count"] ?? 1) || 1;
    return Math.max(1, count);
  } catch (e) {
    console.error("getTemplateChoirGroupCount failed:", e);
    return 1;
  }
}

/*export const computeChoirGroupStatusForDate = async ({ dateISO, isSunday }) => {
  // Get ALL assignments for this date
  const { data: allAssignments } = await supabase
    .from("choir-placeholder")
    .select("mass, group")
    .eq("date", dateISO);

  // Get unique mass labels
  const actualMassLabels = new Set(
    (allAssignments || []).map((a) => String(a.mass).trim())
  );

  // Build expected masses
  const massesToCheck = [];

  if (isSunday) {
    massesToCheck.push("1st Mass - 6:00 AM");
    massesToCheck.push("2nd Mass - 8:00 AM");
    massesToCheck.push("3rd Mass - 5:00 PM");
  }

  //const uses = await fetchChoirTemplateMassesForDate(dateISO);

  // Check each mass status
  const results = [];

  // Sunday masses
  for (const massLabel of massesToCheck) {
    const assignments = (allAssignments || []).filter(
      (a) => a.mass === massLabel
    );
    const validGroups = assignments.filter((a) => a.group && a.group.trim());
    const status = validGroups.length > 0 ? "complete" : "empty";
    results.push(status);
  }

  // Template masses - check against actual DB labels
  for (const label of actualMassLabels) {
    // Skip if it's a Sunday mass (already checked)
    if (
      label.includes("1st Mass") ||
      label.includes("2nd Mass") ||
      label.includes("3rd Mass")
    ) {
      continue;
    }

    const assignments = (allAssignments || []).filter((a) => a.mass === label);
    const validGroups = assignments.filter((a) => a.group && a.group.trim());
    const status = validGroups.length > 0 ? "complete" : "empty";
    results.push(status);
  }

  if (results.length === 0) return "empty";
  if (results.every((s) => s === "empty")) return "empty";
  if (results.every((s) => s === "complete")) return "complete";

  return "incomplete";
};*/

// fetchSchedule.js
export const computeChoirGroupStatusForDate = async ({ dateISO, isSunday }) => {
  // Get all choir rows for the date once
  const { data: allAssignments, error: aErr } = await supabase
    .from("choir-placeholder")
    .select("mass, group")
    .eq("date", dateISO);
  if (aErr) return "empty";

  const results = [];

  // --- Sunday masses (unchanged) ---
  if (isSunday) {
    const sundayMasses = [
      "1st Mass - 6:00 AM",
      "2nd Mass - 8:00 AM",
      "3rd Mass - 5:00 PM",
    ];
    for (const label of sundayMasses) {
      const assigned = (allAssignments || []).filter(
        (r) => r.mass === label && r.group && String(r.group).trim()
      ).length;
      results.push(assigned > 0 ? "complete" : "empty");
    }
  }

  // --- Template masses for this date ---
  // Pull the template instances (times + templateIDs) used on this date
  const { data: uses, error: uErr } = await supabase
    .from("use-template-table")
    .select("templateID,time")
    .eq("date", dateISO);

  if (!uErr && Array.isArray(uses) && uses.length) {
    const tids = [...new Set(uses.map((u) => u.templateID).filter(Boolean))];

    // Map templateID -> required group-count (only when isNeeded = 1)
    const requiredMap = new Map();
    if (tids.length) {
      const { data: tRows } = await supabase
        .from("template-choir")
        .select('templateID, isNeeded, "group-count"')
        .in("templateID", tids);

      (tRows || []).forEach((r) => {
        const needed = Number(r?.isNeeded) === 1;
        const count = Math.max(1, Number(r?.["group-count"] || 1));
        requiredMap.set(r.templateID, needed ? count : 0);
      });
    }

    for (const u of uses) {
      const required = requiredMap.get(u.templateID) ?? 0;
      if (required <= 0) continue; // choir not needed for this template mass

      const time = String(u.time || "").trim(); // e.g., "22:06" or "7:00 PM"
      const storageLabel = `Mass - ${time}`; // how some saves are done

      // Count any row that matches storageLabel OR simply contains the time
      const assigned = (allAssignments || []).filter((r) => {
        const m = String(r.mass || "");
        const hasTime = m.includes(` ${time}`);
        const exactStorage = m === storageLabel;
        return (hasTime || exactStorage) && r.group && String(r.group).trim();
      }).length;

      if (assigned === 0) results.push("empty");
      else if (assigned < required) results.push("incomplete");
      else results.push("complete");
    }
  }

  // --- Aggregate for the date ---
  if (results.length === 0) return "empty";
  if (results.every((s) => s === "empty")) return "empty";
  if (results.every((s) => s === "complete")) return "complete";
  return "incomplete";
};

/*async function massChoirStatusFor({ dateISO, massLabel, isSunday }) {
  console.log("Checking choir assignments for:", {
    dateISO,
    massLabel,
    isSunday,
  });

  try {
    // Use the correct function to get choir group assignments
    const { data: assignments, error } = await supabase
      .from("choir-placeholder")
      .select("group")
      .eq("date", dateISO)
      .eq("mass", massLabel);

    if (error) {
      console.error("Database error:", error);
      return "empty";
    }

    console.log("Raw choir assignments:", assignments);

    if (!assignments || assignments.length === 0) {
      console.log("No choir assignments found");
      return "empty";
    }

    // For choir, if there's at least one group assigned, consider it complete
    const validGroups = assignments.filter((a) => a.group && a.group.trim());
    console.log("Valid group assignments:", validGroups);

    return validGroups.length > 0 ? "complete" : "empty";
  } catch (error) {
    console.error("Error in massChoirStatusFor:", error);
    return "empty";
  }
}*/

export const getChoirGroupAssignments = async (dateISO, massLabel) => {
  try {
    const { data, error } = await supabase
      .from("choir-placeholder") // Using the correct table
      .select("group, groupId") // Adjust columns as per your table schema
      .eq("date", dateISO) // Filter by date
      .eq("mass", massLabel); // Filter by mass label

    if (error) {
      console.error("Error fetching choir group assignments:", error);
      return {};
    }

    if (!data || data.length === 0) return {};

    // Group assignments by the group name
    const grouped = {};
    data.forEach((row) => {
      if (!grouped[row.group]) grouped[row.group] = [];
      grouped[row.group].push(row.groupId);
    });

    return grouped;
  } catch (err) {
    console.error("Error fetching Choir group assignments:", err);
    return {};
  }
};

/* =========================
 * EUCHARISTIC MINISTER (for SelectSchedule + SelectMass)
 * ========================= */

const SUNDAY_MINISTER_COUNT = 4;

/* ---------- Template/Mass lookups ---------- */

// For month view: dates that have EM templates marked isNeeded=1
export const fetchEucharisticMinisterTemplateDates = async () => {
  const { data: uses, error: useErr } = await supabase
    .from("use-template-table")
    .select("id,date,time,templateID")
    .order("date", { ascending: true });

  if (useErr) {
    console.error("EM use-template-table error:", useErr);
    return [];
  }

  const templateIDs = Array.from(
    new Set((uses || []).map((u) => u.templateID).filter((v) => v != null))
  );
  if (templateIDs.length === 0) return [];

  const { data: needed, error: tmplErr } = await supabase
    .from("template-eucharistic-minister")
    .select("templateID,isNeeded")
    .in("templateID", templateIDs)
    .eq("isNeeded", 1);

  if (tmplErr) {
    console.error("EM template filter error:", tmplErr);
    return [];
  }

  const allowed = new Set((needed || []).map((t) => t.templateID));

  return (uses || [])
    .filter(
      (r) =>
        typeof r.date === "string" &&
        r.date.length >= 10 &&
        allowed.has(r.templateID)
    )
    .map((r) => ({
      id: r.id,
      templateID: r.templateID,
      dateStr: r.date,
      dateObj: parseLocalDate(r.date),
      time: r.time || null,
    }));
};

// For a given date: list of EM template masses (only isNeeded=1)
export const fetchEucharisticMinisterTemplateMassesForDate = async (
  isoDate
) => {
  try {
    const { data: uses, error: useErr } = await supabase
      .from("use-template-table")
      .select("id,templateID,time")
      .eq("date", isoDate)
      .order("time", { ascending: true });

    if (useErr || !uses?.length) return [];

    const ids = Array.from(
      new Set(uses.map((u) => u.templateID).filter(Boolean))
    );
    if (!ids.length) return [];

    const { data: tmplRows, error: tmplErr } = await supabase
      .from("template-eucharistic-minister")
      .select("templateID,isNeeded")
      .in("templateID", ids)
      .eq("isNeeded", 1);

    if (tmplErr) return [];

    const allowed = new Set((tmplRows || []).map((t) => t.templateID));
    return uses
      .filter((u) => allowed.has(u.templateID))
      .map((u) => ({
        id: u.id,
        templateID: u.templateID,
        time: u.time || "",
      }));
  } catch (e) {
    console.error("fetchEucharisticMinisterTemplateMassesForDate error:", e);
    return [];
  }
};

// Flags for EM: number of ministers needed (from "minister-count")
export const getTemplateFlagsForEucharisticMinister = async (
  isoDate,
  templateID
) => {
  try {
    let tid = templateID ?? null;

    if (!tid && isoDate) {
      const { data: useRow, error: useErr } = await supabase
        .from("use-template-table")
        .select("templateID")
        .eq("date", isoDate)
        .limit(1)
        .maybeSingle();
      if (useErr) throw useErr;
      tid = useRow?.templateID ?? null;
    }

    if (!tid) return null;

    const { data: row, error: tmplErr } = await supabase
      .from("template-eucharistic-minister")
      .select('templateID,isNeeded,"minister-count"')
      .eq("templateID", tid)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tmplErr) throw tmplErr;
    if (!row) return { templateID: tid, roles: {} };

    return {
      templateID: row.templateID,
      isNeeded: row.isNeeded ?? null,
      roles: { minister: Number(row["minister-count"] ?? 0) },
    };
  } catch (err) {
    console.error("getTemplateFlagsForEucharisticMinister error:", err);
    return null;
  }
};

// Optional center label for template masses in SelectMass
export const getTemplateMassTypeEM = async (templateID) => {
  if (!templateID) return null;
  try {
    const { data, error } = await supabase
      .from("template-information")
      .select('"mass-type"')
      .eq("templateID", templateID)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.["mass-type"] || null;
  } catch (e) {
    console.error("getTemplateMassTypeEM error:", e);
    return null;
  }
};

/* ---------- Group (header) + Assigned counts ---------- */

// Read the assigned group for a mass (from the header table)
export const getEMAssignedGroup = async (dateISO, massLabel) => {
  const { data, error } = await supabase
    .from("eucharistic-minister-group-placeholder")
    .select("group")
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getEMAssignedGroup error:", error);
    return null;
  }
  return data?.group ?? null;
};

// Count how many ministers are assigned for (date, mass)
export const countEMAssigned = async (dateISO, massLabel) => {
  const { data, error } = await supabase
    .from("eucharistic-minister-placeholder")
    .select("idNumber,slot")
    .eq("date", dateISO)
    .eq("mass", massLabel);
  if (error) {
    console.error("countEMAssigned error:", error);
    return 0;
  }
  return (data || []).filter((r) => r.idNumber && Number(r.slot) > 0).length;
};

/* ---------- Rules (needed/visible) ---------- */

export const roleCountsForEucharisticMinister = ({ flags, isSunday }) => {
  if (flags && flags.roles && typeof flags.roles.minister === "number") {
    return { minister: flags.roles.minister };
  }
  // Sunday default if no template flags
  return { minister: SUNDAY_MINISTER_COUNT };
};

export const roleVisibilityForEucharisticMinister = ({ flags, isSunday }) => {
  const counts = roleCountsForEucharisticMinister({ flags, isSunday });
  return { minister: (counts.minister || 0) > 0 };
};

/* ---------- Status (per-mass + per-date) ---------- */

// Exported so SelectMass can compute each card's status if you want
/*export const massStatusEucharisticMinister = async ({
  dateISO,
  massLabel,
  flags, // null for Sunday; template flags for template mass
  isSunday, // boolean
}) => {
  const assigned = await countEMAssigned(dateISO, massLabel);
  const counts = roleCountsForEucharisticMinister({
    flags: flags ?? null,
    isSunday,
  });
  const visible = roleVisibilityForEucharisticMinister({
    flags: flags ?? null,
    isSunday,
  });

  if (!visible.minister || (counts.minister || 0) <= 0) {
    // role hidden/not needed: treat as complete
    return "complete";
  }
  if (assigned === 0) return "empty";
  return assigned >= (counts.minister || 0) ? "complete" : "incomplete";
};*/

export const massStatusEucharisticMinister = async ({
  dateISO,
  massLabel,
  flags, // null for Sunday; template flags for template mass
  isSunday, // boolean
}) => {
  // normalize the input label
  const canonical = normalizeMassLabel(massLabel);

  // fetch all assigned rows for that date
  const { data: rows, error } = await supabase
    .from("eucharistic-minister-placeholder")
    .select("mass")
    .eq("date", dateISO);

  if (error) {
    console.error("Error counting EM assigned:", error);
    return "empty";
  }

  // normalize each DB row and count matches
  const assigned = (rows || []).filter(
    (r) => normalizeMassLabel(r.mass) === canonical
  ).length;

  const counts = roleCountsForEucharisticMinister({
    flags: flags ?? null,
    isSunday,
  });
  const visible = roleVisibilityForEucharisticMinister({
    flags: flags ?? null,
    isSunday,
  });

  if (!visible.minister || (counts.minister || 0) <= 0) {
    // role hidden/not needed: treat as complete
    return "complete";
  }
  if (assigned === 0) return "empty";
  return assigned >= (counts.minister || 0) ? "complete" : "incomplete";
};

export const computeEucharisticMinisterStatusForDate = async ({
  dateISO,
  isSunday,
}) => {
  // Get ALL assignments for this date
  const { data: allAssignments } = await supabase
    .from("eucharistic-minister-placeholder")
    .select("mass, idNumber")
    .eq("date", dateISO);

  (allAssignments || []).forEach((a) => {
    console.log(`Mass: "${a.mass}", Member: ${a.idNumber}`);
  });

  // Get unique mass labels
  const actualMassLabels = new Set(
    (allAssignments || []).map((a) => String(a.mass).trim())
  );

  actualMassLabels.forEach((label) => console.log(`"${label}"`));

  // Build expected masses
  const massesToCheck = [];

  if (isSunday) {
    massesToCheck.push({ label: "1st Mass - 6:00 AM", isSunday: true });
    massesToCheck.push({ label: "2nd Mass - 8:00 AM", isSunday: true });
    massesToCheck.push({ label: "3rd Mass - 5:00 PM", isSunday: true });
  }

  const uses = await fetchEucharisticMinisterTemplateMassesForDate(dateISO);

  (uses || []).forEach((u) => {
    console.log(`templateID: ${u.templateID}, time: ${u.time}, id: ${u.id}`);
  });

  // Check each mass status
  const results = [];

  // Sunday masses
  for (const s of massesToCheck) {
    const count = (allAssignments || []).filter(
      (a) => a.mass === s.label
    ).length;
    console.log(`Sunday mass "${s.label}": ${count} assignments`);

    const status =
      count === 0 ? "empty" : count >= 6 ? "complete" : "incomplete";
    results.push(status);
  }

  // Template masses - check against actual DB labels
  for (const label of actualMassLabels) {
    // Skip if it's a Sunday mass (already checked)
    if (
      label.includes("1st Mass") ||
      label.includes("2nd Mass") ||
      label.includes("3rd Mass")
    ) {
      continue;
    }

    const count = (allAssignments || []).filter((a) => a.mass === label).length;

    // Get the flags for this template
    const timeMatch = label.match(/Mass - ([^(]+)/);
    const time = timeMatch ? timeMatch[1].trim() : "";
    const use = (uses || []).find((u) => String(u.time).trim() === time);
    const flags = use
      ? await getTemplateFlagsForEucharisticMinister(dateISO, use.templateID)
      : null;
    const needed = flags?.roles?.minister || 6;

    const status =
      count === 0 ? "empty" : count >= needed ? "complete" : "incomplete";
    results.push(status);
  }

  if (results.length === 0) return "empty";
  if (results.every((s) => s === "empty")) return "empty";
  if (results.every((s) => s === "complete")) return "complete";

  return "incomplete";
};

/** ---------------------------
 * EUCHARISTIC MINISTER: status helpers
 * --------------------------- */

/**
 * Returns "empty" | "incomplete" | "complete" for a single (date, mass).
 *  - empty:      no group & no members
 *  - incomplete: group exists but 0 members
 *  - complete:   >= 1 member
 */
export async function getEMAssignmentStatus(dateISO, massLabel) {
  try {
    // Check group
    const { data: groupRow, error: groupErr } = await supabase
      .from("eucharistic-minister-group-placeholder")
      .select("group")
      .eq("date", dateISO)
      .eq("mass", massLabel)
      .maybeSingle();

    if (groupErr && groupErr.code !== "PGRST116") {
      console.error("getEMAssignmentStatus groupErr:", groupErr);
    }
    const hasGroup = !!groupRow;

    // Check at least one member
    const { data: memberRows, error: memErr } = await supabase
      .from("eucharistic-minister-placeholder")
      .select("idNumber", { count: "exact", head: true })
      .eq("date", dateISO)
      .eq("mass", massLabel);

    if (memErr) {
      console.error("getEMAssignmentStatus memErr:", memErr);
    }
    // For head:true, data is null; use count from response
    const hasMembers =
      (memberRows?.length ?? 0) > 0 ||
      (memberRows === null && typeof memErr === "undefined");
    // NOTE: Some Supabase clients return count via response.count; if your setup does:
    // const hasMembers = (count ?? 0) > 0;

    if (!hasGroup) return "empty";
    // group exists
    return hasMembers ? "complete" : "incomplete";
  } catch (e) {
    console.error("getEMAssignmentStatus failed:", e);
    // Fail-safe: don't mark green accidentally
    return "empty";
  }
}

export async function getEMStatusesForDate(dateISO, massLabels = []) {
  try {
    // Fetch rows for the date once
    const [
      { data: groupRows, error: gErr },
      { data: memberRows, error: mErr },
    ] = await Promise.all([
      supabase
        .from("eucharistic-minister-group-placeholder")
        .select("mass, group")
        .eq("date", dateISO),
      supabase
        .from("eucharistic-minister-placeholder")
        .select("mass, idNumber")
        .eq("date", dateISO),
    ]);

    if (gErr) console.error("getEMStatusesForDate group error:", gErr);
    if (mErr) console.error("getEMStatusesForDate member error:", mErr);

    const groupSet = new Set((groupRows || []).map((r) => String(r.mass)));
    const memberSet = new Set((memberRows || []).map((r) => String(r.mass)));

    const out = new Map();
    for (const label of massLabels) {
      const hasGroup = groupSet.has(String(label));
      const hasMembers = memberSet.has(String(label));
      if (!hasGroup) out.set(label, "empty");
      else out.set(label, hasMembers ? "complete" : "incomplete");
    }
    return out;
  } catch (e) {
    console.error("getEMStatusesForDate failed:", e);
    const out = new Map();
    for (const label of massLabels) out.set(label, "empty");
    return out;
  }
}

/* ------   Counters  --------- */

const countByUserTypeFlag = async (flagColumn) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select("idNumber")
      .eq(flagColumn, 1);

    if (error) throw error;
    return { total: (data || []).length };
  } catch (err) {
    console.error("countByUserTypeFlag error:", err);
    return { total: 0, error: err.message };
  }
};

export const altarServerMemberCounts = async () =>
  countByUserTypeFlag('"altar-server-member"');

export const lectorCommentatorMemberCounts = async () =>
  countByUserTypeFlag('"lector-commentator-member"');

export const eucharisticMinisterMemberCounts = async () =>
  countByUserTypeFlag('"eucharistic-minister-member"');

export const choirMemberCounts = async () =>
  countByUserTypeFlag('"choir-member"');

// ===== Group counts (simple row counts) =====

/*export const eucharisticMinisterGroupCounts = async () => {
  try {
    const { count, error } = await supabase
      .from("eucharistic-minister-groups")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return { total: count ?? 0 };
  } catch (err) {
    console.error("eucharisticMinisterGroupCounts error:", err);
    return { total: 0, error: err.message };
  }
};*/

export const eucharisticMinisterGroupCounts = async () => {
  try {
    const { data, error } = await supabase
      .from("eucharistic-minister-groups")
      .select("id");

    if (error) throw error;

    const ids = Array.isArray(data) ? data.map((row) => row.id) : [];
    const total = ids.length;

    return { total, ids };
  } catch (err) {
    console.error("eucharisticMinisterGroupCounts error:", err);
    return { total: 0, ids: [], error: err.message };
  }
};

export const choirGroupCounts = async () => {
  try {
    const { data, error } = await supabase
      .from("choir-groups") // quotes needed because of the hyphen
      .select("id"); // fetch all ids

    if (error) throw error;

    const ids = Array.isArray(data) ? data.map((row) => row.id) : [];
    const total = ids.length;

    return { total, ids };
  } catch (err) {
    console.error("choirGroupCounts error:", err);
    return { total: 0, ids: [], error: err.message };
  }
};

// Accept both "(No. X)" and "- X" styles
function normalizeMassLabel(label) {
  if (!label) return label;
  return String(label).replace("(No. ", "- ").replace(")", "").trim();
}
