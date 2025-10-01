import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "antd";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";
import ScheduleDropdownButton from "../../../../components/scheduleDropdownButton";

import {
  CURRENT_YEAR,
  CURRENT_MONTH,
  defaultMonthValue,
  makeDisableMonths,
  popupClassForYear,
  getMonthDays,
  fetchMonthSchedules,
  groupByDate,
  chunkInto,
  formatDateHeading,
  exportScheduleDayAsPNG,
  exportScheduleDayAsPDF,
  printScheduleDay,
  to12Hour,
} from "../../../../assets/scripts/viewScheduleSecretary";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/updateSchedule.css";

export default function ViewSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | View Schedule";
  }, []);

  const navigate = useNavigate();
  const notAvailableText = "Cancel Schedule";

  const [panelYear, setPanelYear] = React.useState(CURRENT_YEAR);
  const disableMonths = React.useMemo(
    () => makeDisableMonths(CURRENT_YEAR, CURRENT_MONTH),
    []
  );
  const [monthValue, setMonthValue] = React.useState(defaultMonthValue);
  const monthDays = React.useMemo(() => getMonthDays(monthValue), [monthValue]);

  const [byDate, setByDate] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const rows = await fetchMonthSchedules(monthValue);
        const grouped = groupByDate(rows);
        if (!cancelled) setByDate(grouped);
      } catch (err) {
        console.error("Failed to load month schedules:", err);
        if (!cancelled) setByDate({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthValue]);

  return (
    <div className="schedule-page-container">
      {/* Header */}
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>VIEW SCHEDULE</h3>

          <div style={{ margin: "10px 0" }}></div>

          <div className="header-line"></div>
        </div>
      </div>

      {/* Content */}
      <div className="schedule-content">
        <div
          className="schedule-toolbar"
          role="group"
          aria-label="Month and year filters"
        >
          <DatePicker
            picker="month"
            value={monthValue}
            onChange={(val) => val && setMonthValue(val)}
            format="MMMM - YYYY"
            allowClear={false}
            inputReadOnly
            suffixIcon={null}
            className="month-select"
            popupClassName={popupClassForYear(panelYear, CURRENT_YEAR)}
            disabledDate={disableMonths}
            onPanelChange={(val) => {
              if (val) setPanelYear(val.year());
            }}
          />
        </div>

        {loading ? (
          <div className="text-center text-muted my-3">Loading schedules…</div>
        ) : (
          <div className="day-list">
            {monthDays.map((d) => {
              const iso = d.format("YYYY-MM-DD");
              const dayItems = byDate[iso] || [];

              if (dayItems.length === 0) {
                return (
                  <div
                    key={iso}
                    className="update-schedule-wrapper"
                    style={{
                      paddingTop: 12,
                      paddingBottom: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      className="update-schedule-header"
                      style={{ marginBottom: 0 }}
                    >
                      {formatDateHeading(iso)}
                    </div>
                  </div>
                );
              }

              const rows = chunkInto(dayItems, 3);

              return (
                <div
                  key={iso}
                  className="update-schedule-wrapper"
                  style={{
                    paddingTop: 12,
                    paddingBottom: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    className="update-schedule-header"
                    style={{ marginBottom: 0 }}
                  >
                    {formatDateHeading(iso)}
                  </div>

                  {rows.map((row, rIdx) => (
                    <div key={rIdx} className="update-schedule-body">
                      {row.map((item, cIdx) => (
                        <div key={cIdx} className="schedule-col">
                          <div
                            className="col-inner"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              height: "100%",
                            }}
                          >
                            <div
                              style={{
                                display: "inline-block",
                                padding: "14px 18px",
                                border: "1px solid #000",
                                borderRadius: 6,
                                minWidth: 300,
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  color: "#666",
                                  fontSize: 16,
                                }}
                              >
                                Client:
                              </p>
                              <h3
                                style={{ margin: "6px 0 0 0", fontWeight: 700 }}
                              >
                                {item.clientName || "—"}
                              </h3>
                            </div>

                            {/* ✅ 12-hour time display */}
                            <p style={{ marginTop: 14, color: "#666" }}>
                              {to12Hour(item.time) || "—"}
                            </p>

                            <div style={{ marginTop: "auto", width: "100%" }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  marginTop: 12,
                                }}
                              >
                                <button
                                  className="btn cancel-btn"
                                  onClick={() =>
                                    navigate("/cancelScheduleSecretary", {
                                      state: {
                                        id: item.id,
                                        scheduleID: item.scheduleID,
                                        clientName: item.clientName,
                                        time: item.time,
                                      },
                                    })
                                  }
                                >
                                  {notAvailableText}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div
                    className="action-buttons"
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 16,
                      paddingRight: 16,
                    }}
                  >
                    {/* Export PNG for this day */}
                    <ScheduleDropdownButton
                      onExportPNG={() => exportScheduleDayAsPNG(iso, dayItems)}
                      onExportPDF={() => exportScheduleDayAsPDF(iso, dayItems)}
                    />

                    {/* Print will be wired next step */}
                    <button
                      className="btn print-btn flex items-center gap-2"
                      onClick={() => printScheduleDay(iso, dayItems)}
                    >
                      <img
                        src={icon.printIcon}
                        alt="Print Icon"
                        className="icon-btn"
                      />
                      Print Schedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
