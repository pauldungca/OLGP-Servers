import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";
import React from "react";

export const MASS_TIMES = ["6:00 AM", "8:00 AM", "5:00 PM"];
export const MASS_ORDINALS = ["1st Mass", "2nd Mass", "3rd Mass"];

function pad(n) {
  return String(n).padStart(2, "0");
}

export function formatYMD(d) {
  const yr = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const da = pad(d.getDate());
  return `${yr}-${mo}-${da}`;
}

export function formatLong(d) {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function toMassDBLabel(ordinal, massTime) {
  // Always save as "1st Mass - 6:00 AM"
  return `${ordinal} - ${massTime}`;
}

export function parseMassFromDB(raw) {
  // Accept either "6:00 AM" (legacy) or "1st Mass - 6:00 AM" (new)
  const s = String(raw || "").trim();
  const m = /^(.*?Mass)\s*-\s*(\d{1,2}:\d{2}\s?(AM|PM))$/i.exec(s);
  if (m) {
    return { ordinal: m[1].trim(), massTime: m[2].trim() };
  }
  const idx = MASS_TIMES.findIndex((t) => t === s);
  return {
    ordinal: idx >= 0 ? MASS_ORDINALS[idx] : "",
    massTime: s,
  };
}

function rowsToSelected(rows) {
  return (rows || [])
    .map((r) => {
      const d = new Date(r.date);
      const dateISO = formatYMD(d);
      const longLabel = formatLong(d);
      const { ordinal, massTime } = parseMassFromDB(r.mass);
      const idx = MASS_TIMES.findIndex((t) => t === massTime);
      if (idx === -1) return null;
      return {
        dateISO,
        longLabel,
        massTime,
        ordinal: ordinal || MASS_ORDINALS[idx],
      };
    })
    .filter(Boolean);
}

function selectedToRows(selected, userIdNumber) {
  // selected[] -> DB insert rows
  return (selected || []).map((s) => ({
    idNumber: userIdNumber,
    date: s.dateISO,
    mass: toMassDBLabel(s.ordinal, s.massTime),
  }));
}

async function submitUnavailableGeneric(tableName, { userIdNumber, selected }) {
  const rows = selectedToRows(selected, userIdNumber);
  if (!rows.length) {
    await Swal.fire("Nothing to save", "Please add at least one item.", "info");
    return { inserted: 0 };
  }

  // Build a readable confirmation list (sorted by date then mass order)
  const byDateThenOrdinal = [...selected].sort((a, b) => {
    const d = (a.dateISO || "").localeCompare(b.dateISO || "");
    if (d !== 0) return d;
    const ia = MASS_ORDINALS.indexOf(a.ordinal || "");
    const ib = MASS_ORDINALS.indexOf(b.ordinal || "");
    return ia - ib;
  });

  const listHtml = byDateThenOrdinal
    .map((s) => {
      const dateText = s.longLabel || formatLong(new Date(s.dateISO));
      const line = `${s.ordinal} - ${s.massTime}`;
      return `<li style="margin:4px 0">${dateText} — <b>${line}</b></li>`;
    })
    .join("");

  const { isConfirmed } = await Swal.fire({
    title: "Confirm save?",
    html: `
      <div style="text-align:left">
        <p>You will not be scheduled on this day/s. You can only do this one time.</p>
        <ul style="margin:8px 0 0 18px; padding:0">${listHtml}</ul>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    allowOutsideClick: false,
  });

  if (!isConfirmed) {
    return;
  }

  const { data, error } = await supabase
    .from(tableName)
    .insert(rows)
    .select("id");

  if (error) {
    console.error("submitUnavailableGeneric error:", error);
    await Swal.fire("Error", "Failed to save your unavailable times.", "error");
    throw error;
  }

  await Swal.fire({
    icon: "success",
    title: "Saved",
    text: `Saved ${data?.length || 0} item(s).`,
    timer: 1200,
    showConfirmButton: false,
  });

  return { inserted: data?.length || 0 };
}

async function preloadUnavailableGeneric(tableName, { userIdNumber }) {
  const { data, error } = await supabase
    .from(tableName)
    .select("date,mass")
    .eq("idNumber", userIdNumber)
    .order("date", { ascending: true });

  if (error) {
    console.error("preloadUnavailableGeneric error:", error);
    await Swal.fire(
      "Error",
      "Failed to load your saved unavailable times.",
      "error"
    );
    throw error;
  }

  // Return selected[] shape so the UI can filter by month easily
  return rowsToSelected(data || []);
}

/* ===================== DEPARTMENT WRAPPERS (exported) ===================== */

export async function submitUnavailableAltarServer(args) {
  return submitUnavailableGeneric("altar-server-unavailable", args);
}
export async function preloadUnavailableAltarServer(args) {
  return preloadUnavailableGeneric("altar-server-unavailable", args);
}

export async function submitUnavailableLectorCommentator(args) {
  return submitUnavailableGeneric("lector-commentator-unavailable", args);
}
export async function preloadUnavailableLectorCommentator(args) {
  return preloadUnavailableGeneric("lector-commentator-unavailable", args);
}

export async function submitUnavailableEucharisticMinister(args) {
  return submitUnavailableGeneric("eucharistic-minister-unavailable", args);
}
export async function preloadUnavailableEucharisticMinister(args) {
  return preloadUnavailableGeneric("eucharistic-minister-unavailable", args);
}

/* ===================== API SELECTOR (exported) ===================== */

export function apiForUnavailable(departmentLabel = "") {
  const dep = String(departmentLabel || "")
    .trim()
    .toLowerCase();
  if (dep === "altar server" || dep === "altar servers") {
    return {
      preload: preloadUnavailableAltarServer,
      submit: submitUnavailableAltarServer,
      title: "Altar Server",
    };
  }
  if (dep === "lector commentator" || dep === "lector-commentator") {
    return {
      preload: preloadUnavailableLectorCommentator,
      submit: submitUnavailableLectorCommentator,
      title: "Lector/Commentator",
    };
  }
  return {
    preload: preloadUnavailableEucharisticMinister,
    submit: submitUnavailableEucharisticMinister,
    title: "Eucharistic Minister",
  };
}

/* ===================== STATE MANAGER HOOK (exported) ===================== */
/* Keeps UI logic out of .jsx. The component just calls this hook. */

export function useUnavailableManager() {
  const [selected, setSelected] = React.useState([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Preload with selected[] directly
  const preloadSelected = React.useCallback((selectedArr = []) => {
    // Deduplicate by dateISO|massTime
    const seen = new Set();
    const next = [];
    for (const s of selectedArr) {
      const key = `${s.dateISO}|${s.massTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        next.push(s);
      }
    }
    setSelected(next);
  }, []);

  // For UI checks
  const isUnavailable = React.useCallback(
    (dateISO, massTime) =>
      selected.some((x) => x.dateISO === dateISO && x.massTime === massTime),
    [selected]
  );

  // Mark one unavailable by Sunday Date and mass index (0..2)
  const markUnavailable = React.useCallback((sundayDateObj, massIndex) => {
    const dateISO = formatYMD(sundayDateObj);
    const massTime = MASS_TIMES[massIndex];
    const ordinal = MASS_ORDINALS[massIndex];
    const longLabel = formatLong(sundayDateObj);
    const key = `${dateISO}|${massTime}`;
    setSelected((prev) => {
      if (prev.some((x) => `${x.dateISO}|${x.massTime}` === key)) return prev;
      return [...prev, { dateISO, longLabel, ordinal, massTime }];
    });
  }, []);

  const resetAll = React.useCallback(() => setSelected([]), []);

  return {
    selected,
    preloadSelected, // <— call this with selected[] to seed state
    isUnavailable,
    markUnavailable,
    resetAll,
    submitted,
    setSubmitted,
    loading,
    setLoading,
  };
}
