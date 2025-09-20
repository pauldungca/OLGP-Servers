// viewSchedule.jsx
import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Breadcrumb, DatePicker } from "antd";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";

import {
  CURRENT_YEAR,
  CURRENT_MONTH,
  defaultMonthValue,
  makeDisableMonths,
  popupClassForYear,
  getMonthDays,
} from "../../../../assets/scripts/viewScheduleSecretary";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/updateSchedule.css";

export default function ViewSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | View Schedule";
  }, []);

  const navigate = useNavigate();
  // const navToCancel = () => navigate("/cancelScheduleSecretary");

  // --- Month picker state / rules ---
  const [panelYear, setPanelYear] = React.useState(CURRENT_YEAR);
  const disableMonths = React.useMemo(
    () => makeDisableMonths(CURRENT_YEAR, CURRENT_MONTH),
    []
  );

  // Controlled month value (start with current month)
  const [monthValue, setMonthValue] = React.useState(defaultMonthValue);
  const monthDays = React.useMemo(() => getMonthDays(monthValue), [monthValue]);

  return (
    <div className="schedule-page-container">
      {/* Header */}
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>VIEW SCHEDULE</h3>

          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/viewSchedule" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                { title: "View Schedule", className: "breadcrumb-item-active" },
              ]}
              separator={
                <img
                  src={icon.chevronIcon}
                  alt="Chevron Icon"
                  style={{ width: 15, height: 15 }}
                />
              }
              className="customized-breadcrumb"
            />
          </div>

          <div className="header-line"></div>
        </div>
      </div>

      {/* Content */}
      <div className="schedule-content">
        {/* Month picker */}
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

        {/* List all days in the selected month */}
        <div className="day-list">
          {monthDays.map((d) => (
            <div
              key={d.format("YYYY-MM-DD")}
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
                {d.format("MMMM D, YYYY")}
              </div>
              {/* You can render each day's schedules under here later */}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
