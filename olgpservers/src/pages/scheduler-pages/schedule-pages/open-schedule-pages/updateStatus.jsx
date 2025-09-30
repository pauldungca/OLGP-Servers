import React, { useEffect, useMemo, useCallback } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";

import icon from "../../../../helper/icon";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import {
  apiForUnavailable,
  formatYMD,
  MASS_TIMES,
  MASS_ORDINALS,
  useUnavailableManager,
} from "../../../../assets/scripts/updateStatus";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/updateStatus.css";

export default function UpdateStatus() {
  useEffect(() => {
    document.title = "OLGP Servers | Open Schedule";
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const department = location.state?.department || "Department";

  const now = new Date();
  const selectedYear =
    typeof location.state?.year === "number"
      ? location.state.year
      : now.getFullYear();
  const selectedMonthIndex =
    typeof location.state?.monthIndex === "number"
      ? location.state.monthIndex
      : now.getMonth();

  // Sundays of the chosen month
  const sundays = useMemo(() => {
    const days = [];
    const d = new Date(selectedYear, selectedMonthIndex, 1);
    while (d.getMonth() === selectedMonthIndex) {
      if (d.getDay() === 0) days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [selectedYear, selectedMonthIndex]);

  const fmtLong = (date) =>
    date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const monthName = new Date(
    selectedYear,
    selectedMonthIndex,
    1
  ).toLocaleString(undefined, {
    month: "long",
  });

  // State + handlers come from the JS hook
  const {
    isUnavailable,
    markUnavailable,
    resetAll,
    submitted,
    loading,
    selected,
    preloadSelected,
    setSubmitted,
    setLoading,
  } = useUnavailableManager();

  // Backend API pair chosen by department
  const api = useMemo(() => apiForUnavailable(department), [department]);

  // Preload selected[] for this user, then filter to current month
  const preloadFromDB = useCallback(async () => {
    setLoading(true);
    try {
      const userIdNumber = localStorage.getItem("idNumber");
      if (!userIdNumber) {
        preloadSelected([]);
        setSubmitted(false);
        return;
      }

      const saved = await api.preload({ userIdNumber }); // selected[]

      // Filter to this month
      const monthStart = new Date(selectedYear, selectedMonthIndex, 1);
      const monthEnd = new Date(selectedYear, selectedMonthIndex + 1, 0);
      const startISO = formatYMD(monthStart);
      const endISO = formatYMD(monthEnd);

      const monthSelected = (saved || []).filter(
        (s) => s.dateISO >= startISO && s.dateISO <= endISO
      );

      preloadSelected(monthSelected);
      setSubmitted((monthSelected || []).length > 0);
    } catch (e) {
      console.error("preloadFromDB failed:", e);
      preloadSelected([]);
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  }, [
    api,
    preloadSelected,
    selectedYear,
    selectedMonthIndex,
    setLoading,
    setSubmitted,
  ]);

  useEffect(() => {
    preloadFromDB();
  }, [preloadFromDB]);

  const question = "Are you available in this mass?";
  const buttonLabel = "Not Available";

  // Submit to chosen department table
  const submitToSupabase = useCallback(
    async ({ department }) => {
      try {
        const userIdNumber = localStorage.getItem("idNumber") || "";
        if (!userIdNumber) {
          console.error("Missing idNumber in localStorage");
          return { ok: false, inserted: 0 };
        }
        if (!selected || selected.length === 0) {
          return { ok: false, inserted: 0 };
        }

        const result = await api.submit({ userIdNumber, selected });

        // ✅ Only mark submitted if something was really saved
        if (result.inserted > 0) {
          setSubmitted(true);
        }

        return { ok: result.inserted > 0, inserted: result.inserted };
      } catch (e) {
        console.error("submitToSupabase failed:", e);
        return { ok: false, inserted: 0 };
      }
    },
    [api, selected, setSubmitted]
  );

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>OPEN SCHEDULE - {department.toUpperCase()}</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/openSchedule" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <span
                      className="breadcrumb-item"
                      role="button"
                      onClick={() =>
                        navigate("/selectTime", { state: { department } })
                      }
                    >
                      Select Time
                    </span>
                  ),
                },
                { title: "Update Status", className: "breadcrumb-item-active" },
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
        {loading ? (
          <div className="update-schedule-wrapper">
            <div className="update-schedule-header">Loading...</div>
          </div>
        ) : sundays.length === 0 ? (
          <div className="update-schedule-wrapper">
            <div className="update-schedule-header">
              No Sundays for {monthName} {selectedYear}
            </div>
          </div>
        ) : (
          sundays.map((sun) => (
            <div className="update-schedule-wrapper" key={sun.toISOString()}>
              <div className="update-schedule-header">
                {fmtLong(sun)} | Sunday Mass
              </div>

              <div className="update-schedule-body">
                {[0, 1, 2].map((idx) => {
                  const massTime = MASS_TIMES[idx];
                  const ordinal = MASS_ORDINALS[idx];
                  const dateISO = formatYMD(sun);
                  const alreadyMarked = isUnavailable(dateISO, massTime);
                  const disabled = alreadyMarked || submitted;

                  return (
                    <div className="schedule-col no-schedule" key={idx}>
                      <h5 className="mass-time">
                        {ordinal} - {massTime}
                      </h5>
                      <img
                        src={image.updateStatusImage}
                        alt="No Schedule"
                        className="img-no-schedule"
                      />
                      <p>{question}</p>
                      <button
                        className="btn cancel-btn"
                        onClick={() => markUnavailable(sun, idx)}
                        disabled={disabled}
                        title={
                          submitted
                            ? "This month is already submitted."
                            : alreadyMarked
                            ? "Already marked as Not Available."
                            : ""
                        }
                      >
                        {buttonLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <div className="action-buttons">
          <button
            className="reset-button"
            onClick={resetAll}
            disabled={submitted || loading}
          >
            Reset
          </button>

          <button
            className="submit-button"
            onClick={() => submitToSupabase({ department })}
            disabled={submitted || loading}
          >
            Submit Schedule
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
