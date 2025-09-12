// calendar.jsx
import React from "react";
import { Badge, Calendar } from "antd";
import Swal from "sweetalert2";

const getListData = (value) => {
  let listData = [];
  switch (value.date()) {
    case 8:
      listData = [
        { type: "warning", content: "This is warning event." },
        { type: "success", content: "This is usual event." },
      ];
      break;
    case 10:
      listData = [
        { type: "warning", content: "This is warning event." },
        { type: "success", content: "This is usual event." },
        { type: "error", content: "This is error event." },
      ];
      break;
    case 15:
      listData = [
        { type: "warning", content: "This is warning event" },
        { type: "success", content: "This is very long usual event......" },
        { type: "error", content: "This is error event 1." },
        { type: "error", content: "This is error event 2." },
        { type: "error", content: "This is error event 3." },
        { type: "error", content: "This is error event 4." },
      ];
      break;
    default:
  }
  return listData || [];
};

const CalendarPage = () => {
  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item, idx) => (
          <li key={`${value.format("YYYY-MM-DD")}-${idx}`}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  // NEW: handle day clicks
  const handleSelect = (value /* dayjs */, info) => {
    // Ignore selects triggered by header/panel changes
    if (info?.source && info.source !== "date") return;

    const listData = getListData(value);
    if (!listData.length) {
      Swal.fire({
        icon: "info",
        title: value.format("MMMM D, YYYY"),
        text: "No event",
        confirmButtonText: "OK",
      });
      return;
    }

    const htmlList = `
      <ul style="text-align:left;margin:0;padding-left:1rem;">
        ${listData
          .map(
            (e) =>
              `<li><strong>${e.type.toUpperCase()}</strong>: ${e.content}</li>`
          )
          .join("")}
      </ul>
    `;

    Swal.fire({
      icon: "success",
      title: value.format("MMMM D, YYYY"),
      html: htmlList,
      confirmButtonText: "Got it",
    });
  };

  return <Calendar cellRender={cellRender} onSelect={handleSelect} />;
};

export default CalendarPage;
