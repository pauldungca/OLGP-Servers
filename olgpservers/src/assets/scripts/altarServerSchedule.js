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

export const fetchTemplateDates = async () => {
  const { data, error } = await supabase
    .from("use-template-table")
    .select("id,date")
    .order("date", { ascending: true });

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  // Normalize to objects with Date and a source tag
  return (data || [])
    .filter((r) => typeof r.date === "string" && r.date.length >= 10)
    .map((r) => {
      const d = new Date(`${r.date}T00:00:00`);
      return {
        id: r.id,
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
