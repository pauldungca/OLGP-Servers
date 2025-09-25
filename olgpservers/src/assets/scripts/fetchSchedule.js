// assets/scripts/fetchSchedule.js
import { supabase } from "../../utils/supabase";

// If computeStatusForDate is used, we need these helpers:
import {
  fetchAssignmentsGrouped,
  getTemplateFlags,
  roleCountsFor,
  roleVisibilityFor,
} from "./assignMember";

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

/* =========================
 * Supabase fetchers
 * ========================= */

// 1) All template uses (dates) that are marked as needed
export const fetchAltarServerTemplateDates = async () => {
  const { data: uses, error: useErr } = await supabase
    .from("use-template-table")
    .select("id,date,templateID")
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
      const d = parseLocalDate(r.date);
      return {
        id: r.id,
        templateID: r.templateID,
        dateStr: r.date,
        dateObj: d,
        source: "template",
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
  const sundayItems = (sundays || []).map((d) => ({
    id: `sun-${d.toISOString()}`,
    dateStr: d.toISOString().slice(0, 10),
    dateObj: d,
    source: "sunday",
  }));
  const combined = [...sundayItems, ...(templates || [])];
  combined.sort((a, b) => a.dateObj - b.dateObj);
  return combined;
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

// Compute status for one date (async)
export const computeStatusForDate = async ({
  dateISO,
  isSunday,
  templateID,
}) => {
  const masses = isSunday
    ? ["1st Mass - 6:00 AM", "2nd Mass - 8:00 AM", "3rd Mass - 5:00 PM"]
    : ["Mass"];

  let flags = null;
  if (!isSunday && dateISO) {
    flags = await getTemplateFlags(dateISO);
  }
  const counts = roleCountsFor({ flags, isSunday });
  const visible = roleVisibilityFor({ flags, isSunday });

  let allEmpty = true;
  let allComplete = true;

  for (const massLabel of masses) {
    const grouped = await fetchAssignmentsGrouped({ dateISO, massLabel });
    const totalAssigned = Object.values(grouped || {}).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );
    if (totalAssigned > 0) allEmpty = false;

    for (const roleKey of Object.keys(visible || {})) {
      if (!visible[roleKey]) continue;
      const need = Number(counts[roleKey] || 0);
      if (need <= 0) continue;
      const have = Array.isArray(grouped[roleKey])
        ? grouped[roleKey].length
        : 0;
      if (have < need) allComplete = false;
    }
  }

  if (allEmpty) return "empty";
  return allComplete ? "complete" : "incomplete";
};
