// assets/scripts/viewScheduleSecretary.js
import dayjs from "dayjs";
import { supabase } from "../../utils/supabase"; // ← adjust if your path differs

/* ===== Date context & picker helpers ===== */
export const NOW = dayjs();
export const CURRENT_YEAR = NOW.year();
export const CURRENT_MONTH = NOW.month(); // 0 = Jan

export const defaultMonthValue = dayjs(
  `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, "0")}-01`
);

export const makeDisableMonths =
  (currentYear = CURRENT_YEAR, currentMonth = CURRENT_MONTH) =>
  (date) => {
    if (!date) return false;
    const y = date.year();
    const m = date.month();
    if (y < currentYear) return true;
    if (y === currentYear && m < currentMonth) return true;
    return false;
  };

export const popupClassForYear = (panelYear, currentYear = CURRENT_YEAR) =>
  `month-select-dropdown ${
    panelYear === currentYear ? "hide-left" : "show-both"
  }`;

/* ===== Month/day utilities ===== */
export const getMonthDays = (monthValue) => {
  if (!monthValue || !dayjs.isDayjs(monthValue)) return [];
  const start = monthValue.startOf("month");
  const end = monthValue.endOf("month");
  const days = [];
  let d = start;
  while (d.isBefore(end, "day") || d.isSame(end, "day")) {
    days.push(d);
    d = d.add(1, "day");
  }
  return days;
};

export const chunkInto = (arr, size = 3) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export const groupByDate = (rows) =>
  rows.reduce((acc, r) => {
    const key = r.date; // 'YYYY-MM-DD'
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

export const formatDateHeading = (isoDate) =>
  dayjs(isoDate).format("MMMM D, YYYY");

/* ===== Fetch from Supabase ===== */
export const fetchMonthSchedules = async (monthValue) => {
  const startDate = monthValue.startOf("month").format("YYYY-MM-DD");
  const endDate = monthValue.endOf("month").format("YYYY-MM-DD");

  const { data, error } = await supabase
    .from("use-template-table")
    .select("id,scheduleID,templateID,date,time,note,clientName")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) throw error;
  return data ?? [];
};
