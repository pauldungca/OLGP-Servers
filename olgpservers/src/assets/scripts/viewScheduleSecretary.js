// monthPickerUtils.js
import dayjs from "dayjs";

/** Snapshot of "now" when module loads */
export const NOW = dayjs();

/** Current year & month (0-based month) */
export const CURRENT_YEAR = NOW.year();
export const CURRENT_MONTH = NOW.month();

/** Default value for the AntD month DatePicker (1st day of current month) */
export const defaultMonthValue = dayjs(
  `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, "0")}-01`
);

/** Disabled-date rule: block months before the current month in the current year */
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

/** Popup className: hide left arrow when viewing the current year */
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
