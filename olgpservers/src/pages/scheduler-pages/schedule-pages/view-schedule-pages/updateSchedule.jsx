import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Breadcrumb, DatePicker, message } from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";
import ScheduleDropdownButton from "../../../../components/scheduleDropdownButton";
import {
  fetchUserAltarServerSchedules,
  fetchUserLectorCommentatorSchedules,
  fetchUserChoirSchedules,
  fetchUserEucharisticMinisterSchedules,
  groupSchedulesByDate,
  formatRoleName,
} from "../../../../assets/scripts/viewScheduleNormal";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/updateSchedule.css";

export default function UpdateSchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const department = location.state?.department || "Department";

  const CURRENT_YEAR = dayjs().year();
  const CURRENT_MONTH = dayjs().month();

  const [panelYear, setPanelYear] = useState(CURRENT_YEAR);
  const [monthValue, setMonthValue] = useState(dayjs());
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [idNumber, setIdNumber] = useState("");

  useEffect(() => {
    document.title = `OLGP Servers | View Schedule - ${department}`;
    const storedIdNumber = localStorage.getItem("idNumber");
    if (storedIdNumber) {
      setIdNumber(storedIdNumber);
    } else {
      message.error("User ID not found. Please log in again.");
      navigate("/login");
    }
  }, [department, navigate]);

  // Fetch schedules when month changes or component mounts
  useEffect(() => {
    if (!idNumber || !monthValue) return;

    const loadSchedules = async () => {
      setLoading(true);
      try {
        const year = monthValue.year();
        const month = monthValue.month();

        let data = [];
        switch (department.toLowerCase()) {
          case "altar server":
            data = await fetchUserAltarServerSchedules(idNumber, year, month);
            break;
          case "lector commentator":
            data = await fetchUserLectorCommentatorSchedules(
              idNumber,
              year,
              month
            );
            break;
          case "choir":
            data = await fetchUserChoirSchedules(idNumber, year, month);
            break;
          case "eucharistic minister":
            data = await fetchUserEucharisticMinisterSchedules(
              idNumber,
              year,
              month
            );
            break;
          default:
            data = [];
        }

        const grouped = groupSchedulesByDate(data);
        setSchedules(grouped);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        message.error("Failed to load schedules");
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, [idNumber, monthValue, department]);

  const handleCancel = (dateISO, mass) => {
    navigate("/cancelSchedule", {
      state: {
        department,
        selectedISO: dateISO,
        selectedMass: mass,
      },
    });
  };

  // Generate all days for selected month
  const monthDays = React.useMemo(() => {
    if (!monthValue) return [];
    const start = monthValue.startOf("month");
    const end = monthValue.endOf("month");
    const days = [];
    let d = start;
    while (d.isBefore(end, "day") || d.isSame(end, "day")) {
      days.push(d);
      d = d.add(1, "day");
    }
    return days;
  }, [monthValue]);

  const disableMonths = (date) => {
    if (!date) return false;
    const y = date.year();
    const m = date.month();
    if (y < CURRENT_YEAR) return true;
    if (y === CURRENT_YEAR && m < CURRENT_MONTH) return true;
    return false;
  };

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>VIEW SCHEDULE - {department.toUpperCase()}</h3>
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
                {
                  title: "View Schedule",
                  className: "breadcrumb-item-active",
                },
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

      <div className="schedule-content">
        <div
          className="schedule-toolbar"
          role="group"
          aria-label="Month and year filter"
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
            popupClassName={`month-select-dropdown ${
              panelYear === CURRENT_YEAR ? "hide-left" : "show-both"
            }`}
            disabledDate={disableMonths}
            onPanelChange={(val) => {
              if (val) setPanelYear(val.year());
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Loading schedules...</p>
          </div>
        ) : (
          <div className="day-list">
            {monthDays.map((d) => {
              const iso = d.format("YYYY-MM-DD");
              const daySchedules = schedules[iso] || [];

              // Group by mass
              const massList = {};
              daySchedules.forEach((s) => {
                if (!massList[s.mass]) massList[s.mass] = [];
                massList[s.mass].push(s);
              });

              const masses = Object.keys(massList);

              // If no schedule, show compact view
              if (masses.length === 0) {
                return (
                  <div
                    key={iso}
                    style={{
                      padding: "16px 0",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      {d.format("MMMM D, YYYY")} | {d.format("dddd")}
                    </div>
                  </div>
                );
              }

              // If has schedule, show full card
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
                    {d.format("MMMM D, YYYY")} | {d.format("dddd")}
                  </div>

                  <div className="update-schedule-body">
                    {masses.map((mass) => {
                      const massSchedules = massList[mass];
                      const roles = massSchedules
                        .map((s) =>
                          department.toLowerCase() === "choir"
                            ? `Group: ${s.group}`
                            : formatRoleName(s.role)
                        )
                        .join(", ");

                      return (
                        <div key={mass} className="schedule-col assigned-group">
                          <div className="assigned-box">
                            <p className="assigned-label">Your Assignment:</p>
                            <h3 className="group-name">{roles}</h3>
                          </div>

                          <p className="mass-time">{mass}</p>

                          <div
                            className="action-buttons"
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 12,
                              paddingRight: 16,
                              marginTop: 16,
                            }}
                          >
                            <ScheduleDropdownButton />

                            <button className="btn print-btn flex items-center gap-2">
                              <img
                                src={icon.printIcon}
                                alt="Print Icon"
                                className="icon-btn"
                              />
                              Print
                            </button>
                          </div>
                          {department.toLowerCase() !== "choir" && (
                            <button
                              className="btn cancel-btn"
                              onClick={() => handleCancel(iso, mass)}
                            >
                              Cancel Schedule
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
