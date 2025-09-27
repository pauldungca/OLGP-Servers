// assets/scripts/fetchSchedule.js
import { supabase } from "../../utils/supabase";

// If computeStatusForDate is used, we need these helpers:
import {
  fetchAssignmentsGrouped,
  getTemplateFlags,
  roleCountsFor,
  roleVisibilityFor,
  fetchAssignmentsGroupedLectorCommentator,
  getTemplateFlagsLectorCommentator,
  roleCountsForLectorCommentator,
  roleVisibilityForLectorCommentator,
} from "./assignMember";

async function massStatusFor({ dateISO, massLabel, flags, isSunday }) {
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
}

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

export const fetchTemplateMassesForDate = async (isoDate) => {
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

export async function computeStatusForDate({ dateISO, isSunday }) {
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

// Check if roles are needed for Lector Commentator
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

export const fetchLectorCommentatorTemplateMassesForDate = async (isoDate) => {
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
};

export async function computeLectorCommentatorStatusForDate({
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
}

async function massLectorCommentatorStatusFor({
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
}
