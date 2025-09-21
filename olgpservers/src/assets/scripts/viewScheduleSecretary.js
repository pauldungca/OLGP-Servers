// assets/scripts/viewScheduleSecretary.js
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";

/* ===================== Dates / UI helpers ===================== */
export const NOW = dayjs();
export const CURRENT_YEAR = NOW.year();
export const CURRENT_MONTH = NOW.month();

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

/* ===================== Data fetches ===================== */
export const fetchMonthSchedules = async (monthValue) => {
  const startDate = monthValue.startOf("month").format("YYYY-MM-DD");
  const endDate = monthValue.endOf("month").format("YYYY-MM-DD");

  const { data, error } = await supabase
    .from("use-template-table")
    .select("id,scheduleID,templateID,date,time,note,clientName") // keep scheduleID
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const fetchScheduleBasic = async (id) => {
  if (!id) return { data: null, error: new Error("Missing id") };
  const { data, error } = await supabase
    .from("use-template-table")
    .select("clientName,time,scheduleID")
    .eq("id", id)
    .single();
  return { data, error };
};

/* ===================== Cancel helpers ===================== */
export const extractBasicFromState = (state) => {
  if (!state || typeof state !== "object") return null;
  const { clientName, time, scheduleID } = state;
  if (!clientName && !time && !scheduleID) return null;
  return {
    clientName: clientName ?? "",
    time: time ?? "",
    scheduleID: scheduleID ?? null,
  };
};

export const getQueryParam = (search, key) => {
  try {
    const sp = new URLSearchParams(search || "");
    const val = sp.get(key);
    return val ?? null;
  } catch {
    return null;
  }
};

/** Delete by scheduleID (updated requirement) */
export const cancelScheduleByScheduleID = async (scheduleID) => {
  if (!scheduleID) return { error: new Error("Missing scheduleID") };
  const { error } = await supabase
    .from("use-template-table")
    .delete()
    .eq("scheduleID", scheduleID);
  return { error };
};

export const confirmAndCancelSchedule = async (scheduleID, navigate) => {
  if (!scheduleID) {
    await Swal.fire("Missing Info", "No scheduleID was provided.", "warning");
    return;
  }

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This will cancel the schedule permanently.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, cancel it!",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  const { error } = await cancelScheduleByScheduleID(scheduleID);
  if (error) {
    console.error(error);
    await Swal.fire("Error", "Failed to cancel schedule.", "error");
    return;
  }

  // Success: no buttons, auto-close after 1200ms, then navigate
  await Swal.fire({
    title: "Cancelled!",
    text: "The schedule was removed.",
    icon: "success",
    showConfirmButton: false,
    timer: 1200,
    allowOutsideClick: false,
    allowEscapeKey: false,
    timerProgressBar: true,
  });

  navigate("/viewScheduleSecretary");
};
