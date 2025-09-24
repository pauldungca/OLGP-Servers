import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import icon from "../../../../../helper/icon";
import Footer from "../../../../../components/footer";

import { getTemplateFlagsForDate } from "../../../../../assets/scripts/fetchSchedule";

import "../../../../../assets/styles/schedule.css";
import "../../../../../assets/styles/selectRole.css";

export default function SelectRole() {
  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Context from SelectMass
  const selectedDate = location.state?.selectedDate || "No date selected";
  const selectedISO = location.state?.selectedISO || null;
  const selectedMass = location.state?.selectedMass || "No mass selected";
  const source = location.state?.source || null;
  const passedIsSunday = location.state?.isSunday;
  const templateID = location.state?.templateID ?? null; // ← read templateID

  // Robust Sunday detection (trust flag, else source, else compute)
  const isSunday = useMemo(() => {
    if (typeof passedIsSunday === "boolean") return passedIsSunday;
    if (source === "sunday") return true;
    if (selectedISO) {
      const [y, m, d] = selectedISO.split("-").map(Number);
      return new Date(y, m - 1, d).getDay() === 0;
    }
    return false;
  }, [passedIsSunday, source, selectedISO]);

  // Fetch template flags for non-Sunday days
  const needTemplateFlags = useMemo(
    () => !isSunday && !!selectedISO,
    [isSunday, selectedISO]
  );

  const [flags, setFlags] = useState(null);
  const [loadingFlags, setLoadingFlags] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!needTemplateFlags) {
        setFlags(null);
        return;
      }
      setLoadingFlags(true);
      const res = await getTemplateFlagsForDate(selectedISO);
      if (!cancelled) {
        setFlags(res); // null if not needed or not found
        setLoadingFlags(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needTemplateFlags, selectedISO]);

  // Helpers
  const showAll = isSunday === true;
  const roleOn = (count) => Number(count || 0) > 0;

  const showThurifer = showAll || roleOn(flags?.roles?.thurifer);
  const showBellers = showAll || roleOn(flags?.roles?.beller);
  const showBookAndMic = showAll || roleOn(flags?.roles?.mainServer); // "main-server"
  const showCandleBearers = showAll || roleOn(flags?.roles?.candleBearer);
  const showIncense = showAll || roleOn(flags?.roles?.incenseBearer);
  const showCross = showAll || roleOn(flags?.roles?.crossBearer);
  const showPlates = showAll || roleOn(flags?.roles?.plate);

  const handleRoleClick = () => {
    navigate("/assignMemberAltarServer", {
      state: { selectedDate, selectedISO, selectedMass, source, isSunday },
    });
  };

  const handleReset = () => {
    // TODO: clear selections for this screen, if you store any
  };

  const handleSubmit = () => {
    navigate("/assignMemberAltarServer", {
      state: {
        selectedDate,
        selectedISO,
        selectedMass,
        source,
        isSunday,
        submit: true,
      },
    });
  };

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE - ALTAR SERVER</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/makeSchedule" className="breadcrumb-item">
                      Department
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectScheduleAltarServer"
                      className="breadcrumb-item"
                    >
                      Select Schedule
                    </Link>
                  ),
                },
                {
                  title: (
                    <Link
                      to="/selectMassAltarServer"
                      className="breadcrumb-item"
                      state={{
                        selectedDate,
                        selectedISO,
                        selectedMass,
                        source,
                        isSunday,
                        templateID, // ← pass templateID back to Select Mass
                      }}
                    >
                      Select Mass
                    </Link>
                  ),
                },
                {
                  title: "Select Role",
                  className: "breadcrumb-item-active",
                },
              ]}
              separator={
                <img
                  src={icon.chevronIcon}
                  alt="Chevron Icon"
                  style={{ width: "15px", height: "15px" }}
                />
              }
              className="customized-breadcrumb"
            />
          </div>
          <div className="header-line"></div>
        </div>
      </div>

      <div className="schedule-content">
        <h4 style={{ marginBottom: "1rem" }}>
          Selected Date: {selectedDate} &nbsp;|&nbsp; Selected Mass:{" "}
          {selectedMass}
        </h4>

        {/* Loading state for template lookup */}
        {needTemplateFlags && loadingFlags && (
          <div style={{ padding: "8px 2px", opacity: 0.8 }}>
            Loading template…
          </div>
        )}

        <div className="role-cards-grid">
          {showThurifer && (
            <div className="role-card" onClick={handleRoleClick}>
              <div className="role-card-divider"></div>
              <p className="role-card-title">Thurifer</p>
            </div>
          )}

          {showBellers && (
            <div className="role-card">
              <div className="role-card-divider"></div>
              <p className="role-card-title">Bellers</p>
            </div>
          )}

          {showBookAndMic && (
            <div className="role-card">
              <div className="role-card-divider"></div>
              <p className="role-card-title">Book and Mic</p>
            </div>
          )}

          {showCandleBearers && (
            <div className="role-card">
              {/* sample assigned preview */}
              <div className="assigned-member">Argie Tapic</div>
              <div className="assigned-member">Argie Tapic</div>
              <div className="role-card-divider"></div>
              <p className="role-card-title">Candle Bearers</p>
            </div>
          )}

          {showIncense && (
            <div className="role-card">
              <div className="role-card-divider"></div>
              <p className="role-card-title">Incense Bearer</p>
            </div>
          )}

          {showCross && (
            <div className="role-card">
              <div className="role-card-divider"></div>
              <p className="role-card-title">Cross Bearer</p>
            </div>
          )}
        </div>

        {/* Big card at the bottom */}
        {showPlates && (
          <div className="role-card big-role-card">
            <div className="role-card-divider"></div>
            <p className="role-card-title">Plates</p>
          </div>
        )}
      </div>

      {/* Actions under the grid (Reset / Submit) */}
      <div className="role-card-actions">
        <button
          type="button"
          className="btn-reset-schedule"
          onClick={handleReset}
        >
          Reset
        </button>
        <button
          type="button"
          className="btn-submit-schedule"
          onClick={handleSubmit}
        >
          Submit Schedule
        </button>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
