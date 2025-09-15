// calendar.jsx
import React, { useEffect, useState } from "react";
import { Badge, Calendar } from "antd";
import dayjs from "dayjs";
import Swal from "sweetalert2";

// 🆕 import the data helpers
import { getSchedulesByDate, getMonthCounts } from "../assets/scripts/calendar";

const CalendarPage = () => {
  // Cache counts for the currently displayed month
  const [monthCounts, setMonthCounts] = useState({});
  // Track current panel value (dayjs). AntD passes this to onPanelChange & onSelect
  const [panelValue, setPanelValue] = useState(dayjs());

  // Fetch counts whenever month/year changes
  useEffect(() => {
    const y = panelValue.year();
    const m = panelValue.month() + 1; // dayjs month is 0-based
    let cancelled = false;
    (async () => {
      try {
        const counts = await getMonthCounts(y, m);
        if (!cancelled) setMonthCounts(counts || {});
      } catch (e) {
        console.error("Failed to load month counts:", e?.message || e);
        if (!cancelled) setMonthCounts({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [panelValue]);

  // Render a few tiny items indicating how many events exist for the date
  const dateCellRender = (value /* dayjs */) => {
    const key = value.format("YYYY-MM-DD");
    const count = monthCounts[key] || 0;

    if (!count) return null;

    // Show up to 3 dots; plus a "+N" if more
    const dotsToShow = Math.min(count, 3);
    const extra = count - dotsToShow;

    return (
      <ul
        className="events"
        style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}
      >
        {Array.from({ length: dotsToShow }).map((_, idx) => (
          <li key={`${key}-${idx}`}>
            <Badge status="success" text="" />
          </li>
        ))}
        {extra > 0 && (
          <li key={`${key}-extra`} style={{ fontSize: 12, color: "#999" }}>
            +{extra} more
          </li>
        )}
      </ul>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  // When the visible panel (month/year) changes, remember it (to refetch counts)
  const handlePanelChange = (value /* dayjs */, mode) => {
    setPanelValue(value);
  };

  // Show details on day click
  const handleSelect = async (value /* dayjs */, info) => {
    // Ignore selects triggered by header/panel changes
    if (info?.source && info.source !== "date") return;

    const dateStr = value.format("YYYY-MM-DD");

    try {
      const rows = await getSchedulesByDate(dateStr);

      if (!rows.length) {
        await Swal.fire({
          icon: "info",
          title: value.format("MMMM D, YYYY"),
          text: "No events",
          confirmButtonText: "OK",
        });
        return;
      }

      // Build a neat list of entries
      const htmlList = `
        <div style="text-align:left">
          ${rows
            .map((r) => {
              const time = r.time || "";
              const note = (r.note || "").trim();
              const noteHtml = note
                ? `<div style="color:#666;margin-top:2px">Note: ${escapeHtml(
                    note
                  )}</div>`
                : "";
              return `
                <div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px dashed #e5e5e5">
                  <div><strong>Client:</strong> ${escapeHtml(
                    r.clientName || "(No name)"
                  )}</div>
                  <div><strong>Date:</strong> ${escapeHtml(
                    r.date || dateStr
                  )}</div>
                  <div><strong>Time:</strong> ${escapeHtml(time)}</div>
                  ${noteHtml}
                </div>
              `;
            })
            .join("")}
        </div>
      `;

      await Swal.fire({
        icon: "success",
        title: value.format("MMMM D, YYYY"),
        html: htmlList,
        width: 520,
        confirmButtonText: "Close",
      });
    } catch (e) {
      console.error("select day error:", e?.message || e);
      await Swal.fire({
        icon: "error",
        title: "Failed to load events",
        text: e?.message || "Please try again.",
      });
    }
  };

  return (
    <Calendar
      cellRender={cellRender}
      onPanelChange={handlePanelChange}
      onSelect={handleSelect}
      value={panelValue}
      onChange={setPanelValue}
    />
  );
};

export default CalendarPage;

/* --- tiny util for HTML escaping in the swal content --- */
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
