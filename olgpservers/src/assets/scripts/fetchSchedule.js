import { supabase } from "../../utils/supabase";

// UPPERCASE month names for the header
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

// Title-case month names for card labels (e.g., "April 6 - Sunday")
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

// Get all Sundays (Date objects) for a given month/year
export const getSundays = (year, month /* 0=Jan */) => {
  const sundays = [];
  const d = new Date(year, month, 1);

  while (d.getMonth() === month) {
    if (d.getDay() === 0) {
      sundays.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return sundays;
};

// Previous month/year
export const prevMonth = (year, month) => {
  return month === 0
    ? { year: year - 1, month: 11 }
    : { year, month: month - 1 };
};

// Next month/year
export const nextMonth = (year, month) => {
  return month === 11
    ? { year: year + 1, month: 0 }
    : { year, month: month + 1 };
};

// Header: "MONTH OF APRIL - 2025"
export const formatHeader = (year, month) =>
  `MONTH OF ${MONTH_NAMES_UC[month]} - ${year}`;

// Card label: "April 6 - Sunday"
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

export const fetchAltarServerTemplateDates = async () => {
  // 1) Read uses (dates) with their templateID
  const { data: uses, error: useErr } = await supabase
    .from("use-template-table")
    .select("id,date,templateID")
    .order("date", { ascending: true });

  if (useErr) {
    console.error("Supabase fetch (use-template-table) error:", useErr);
    return [];
  }

  // Unique templateIDs referenced by the uses
  const templateIDs = Array.from(
    new Set((uses || []).map((u) => u.templateID).filter((v) => v != null))
  );

  if (templateIDs.length === 0) return [];

  // 2) Read template flags and keep only those with isNeeded=1
  const { data: needed, error: tmplErr } = await supabase
    .from("template-altar-server")
    .select("templateID,isNeeded")
    .in("templateID", templateIDs)
    .eq("isNeeded", 1);

  if (tmplErr) {
    console.error("Supabase fetch (template-altar-server) error:", tmplErr);
    return [];
  }

  const allowed = new Set((needed || []).map((t) => t.templateID));

  // 3) Return normalized rows only for allowed templateIDs
  return (uses || [])
    .filter(
      (r) =>
        typeof r.date === "string" &&
        r.date.length >= 10 &&
        allowed.has(r.templateID)
    )
    .map((r) => {
      const d = new Date(`${r.date}T00:00:00`);
      return {
        id: r.id,
        templateID: r.templateID,
        dateStr: r.date, // "YYYY-MM-DD"
        dateObj: d,
        source: "template", // mark as template-sourced
      };
    });
};

// Keep only items that match the visible month/year
export const filterByMonthYear = (items, year, month /* 0=Jan */) =>
  (items || []).filter(
    (it) =>
      it.dateObj instanceof Date &&
      !isNaN(it.dateObj) &&
      it.dateObj.getFullYear() === year &&
      it.dateObj.getMonth() === month
  );

// Merge Sundays + Templates -> sort asc by date; keep type/source
export const mergeSchedules = (sundays, templates) => {
  // Tag Sundays
  const sundayItems = (sundays || []).map((d) => ({
    id: `sun-${d.toISOString()}`,
    dateStr: d.toISOString().slice(0, 10),
    dateObj: d,
    source: "sunday",
  }));

  // Combine
  const combined = [...sundayItems, ...(templates || [])];

  // Sort by date ascending
  combined.sort((a, b) => a.dateObj - b.dateObj);

  return combined;
};

// Get role flags/counts for a given templateID from `template-altar-server`
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
    console.error("Supabase fetch (template-altar-server) error:", error);
    return null;
  }
  if (!data) return null;

  // Normalize to camelCase keys for the UI
  return {
    templateID: data.templateID,
    isNeeded: Number(data.isNeeded) === 1,
    roles: {
      candleBearer: Number(data["candle-bearer"] || 0),
      thurifer: Number(data["thurifer"] || 0),
      beller: Number(data["beller"] || 0),
      mainServer: Number(data["main-server"] || 0), // mapped to "Book and Mic" in UI
      crossBearer: Number(data["cross-bearer"] || 0),
      incenseBearer: Number(data["incense-bearer"] || 0),
      plate: Number(data["plate"] || 0),
    },
  };
};

// Convenience: resolve templateID by date (YYYY-MM-DD) then return flags
// Find template flags for a given ISO date (YYYY-MM-DD)
export const getTemplateFlagsForDate = async (isoDate) => {
  if (!isoDate) return null;

  // 1) Look up the templateID for this date
  const { data: useRows, error: useErr } = await supabase
    .from("use-template-table")
    .select("templateID")
    .eq("date", isoDate)
    .order("id", { ascending: false })
    .limit(1);

  if (useErr) {
    console.error("Supabase (use-template-table by date) error:", useErr);
    return null;
  }
  const templateID = useRows?.[0]?.templateID;
  if (!templateID) return null;

  // 2) Fetch flags for that templateID ONLY if isNeeded = 1
  const { data: tmplRows, error: tmplErr } = await supabase
    .from("template-altar-server")
    .select(
      'templateID,isNeeded,"candle-bearer",thurifer,beller,"main-server","cross-bearer","incense-bearer",plate'
    )
    .eq("templateID", templateID)
    .eq("isNeeded", 1)
    .limit(1);

  if (tmplErr) {
    console.error("Supabase (template-altar-server) error:", tmplErr);
    return null;
  }
  const row = tmplRows?.[0];
  if (!row) return null; // not needed or no row

  // Normalize to camelCase keys for the UI
  return {
    templateID: row.templateID,
    isNeeded: true,
    roles: {
      candleBearer: Number(row["candle-bearer"] || 0),
      thurifer: Number(row.thurifer || 0),
      beller: Number(row.beller || 0),
      mainServer: Number(row["main-server"] || 0), // maps to "Book and Mic"
      crossBearer: Number(row["cross-bearer"] || 0),
      incenseBearer: Number(row["incense-bearer"] || 0),
      plate: Number(row.plate || 0),
    },
  };
};
