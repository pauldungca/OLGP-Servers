import { supabase } from "../../utils/supabase";

export const getSchedulesByDate = async (dateStr) => {
  // dateStr must be "YYYY-MM-DD"
  const { data, error } = await supabase
    .from("use-template-table")
    .select("id, scheduleID, templateID, date, time, note, clientName")
    .eq("date", dateStr)
    .order("time", { ascending: true });

  if (error) {
    console.error("getSchedulesByDate error:", error);
    throw error;
  }
  return data || [];
};

// For monthly badges: count how many entries per date in the given month (1-12)
export const getMonthCounts = async (year, month) => {
  // month = 1..12
  const mm = String(month).padStart(2, "0");
  const likePrefix = `${year}-${mm}-%`; // "YYYY-MM-%"

  const { data, error } = await supabase
    .from("use-template-table")
    .select("date") // just need dates
    .like("date", likePrefix);

  if (error) {
    console.error("getMonthCounts error:", error);
    throw error;
  }

  // Build counts by exact date string
  const counts = {};
  (data || []).forEach((row) => {
    const d = row.date; // already "YYYY-MM-DD"
    counts[d] = (counts[d] || 0) + 1;
  });
  return counts; // { "2025-09-16": 3, ... }
};
