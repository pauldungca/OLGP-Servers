import React, { useState, useEffect } from "react";
import { DatePicker, TimePicker } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import image from "../../../../helper/images";
import Footer from "../../../../components/footer";

import {
  getTemplateDetails,
  disablePastDates,
  disablePastTimes,
  handleNoteChange,
  handleAddSchedule,
  handleCancel,
} from "../../../../assets/scripts/template";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/useTemplate.css";

export default function UseTemplate() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const templateID = state?.templateID || state?.id || null;

  // Prefill name from router; fallback to fetch
  const [templateName, setTemplateName] = useState(state?.templateName || "");
  const [note, setNote] = useState("");

  // AntD pickers (dayjs instances)
  const [dateVal, setDateVal] = useState(null); // dayjs | null
  const [timeVal, setTimeVal] = useState(null); // dayjs | null

  const [clientName, setClientName] = useState("");

  useEffect(() => {
    document.title = "OLGP Servers | Make Schedule";
  }, []);

  // Fallback: fetch header if name wasn't passed
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!templateName && templateID) {
        try {
          const { header } = await getTemplateDetails(templateID);
          if (!cancelled && header)
            setTemplateName(header["template-name"] || "");
        } catch (e) {
          console.error("Failed to load template header:", e?.message || e);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [templateName, templateID]);

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE</h3>
          <div style={{ margin: "10px 0" }}></div>
          <div className="header-line"></div>
        </div>
      </div>

      {/* Main form */}
      <div className="schedule-content">
        {/* Template name */}
        <div className="row mb-3">
          <div className="col-12">
            <span className="form-label me-2 fw-bold">Template Name:</span>
            <span className="template-name">
              {templateName || <span className="text-muted">Loading…</span>}
            </span>
          </div>
        </div>

        {/* Client name (not part of DB insert, you can extend later) */}
        <div className="form-row">
          <label className="form-label">Client Name:</label>
          <input
            type="text"
            className="form-control"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Enter client name"
          />
        </div>

        {/* Date, Time, Note */}
        <div className="row g-4 mb-4">
          {/* Date */}
          <div className="col-md-4">
            <div className="custom-box">
              <label className="form-label fw-bold">Select Date:</label>
              <DatePicker
                className="w-100 form-control"
                placement="bottomLeft"
                value={dateVal}
                onChange={(d) => {
                  setDateVal(d);
                  if (
                    d?.isSame(dayjs(), "day") &&
                    timeVal &&
                    timeVal.isBefore(dayjs())
                  ) {
                    setTimeVal(null);
                  }
                }}
                disabledDate={disablePastDates}
              />
            </div>
          </div>

          {/* Time */}
          <div className="col-md-4">
            <div className="custom-box">
              <label className="form-label fw-bold">Select Time:</label>
              <TimePicker
                use12Hours
                format="h:mm A"
                minuteStep={30}
                className="w-100 form-control"
                popupClassName="timepicker-down"
                placement="bottomLeft"
                value={timeVal}
                onChange={(t) => setTimeVal(t)}
                defaultOpenValue={dayjs()}
                disabledTime={() => disablePastTimes(dateVal)}
                onSelect={(val) => {
                  if (dateVal?.isSame(dayjs(), "day") && val.isBefore(dayjs()))
                    return;
                  setTimeVal(val);
                }}
              />
            </div>
          </div>

          {/* Note */}
          <div className="col-md-4">
            <div className="custom-box">
              <label className="form-label fw-bold">Note:</label>
              <textarea
                className="form-control note-textarea"
                rows="6"
                value={note}
                onChange={(e) => handleNoteChange(e, setNote)}
                placeholder="Write a note (max 150 characters)"
              />
              <div className="note-counter text-end">{note.length}/150</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="btn cancel-schedule-btn action-btn"
            onClick={() => handleCancel(navigate)}
          >
            <img src={image.noButtonImage} alt="Cancel" className="btn-icon" />
            Cancel
          </button>
          <button
            type="button"
            className="btn add-schedule-btn action-btn"
            onClick={() =>
              handleAddSchedule({
                dateVal,
                timeVal,
                templateID,
                clientName,
                note,
                navigate,
              })
            }
            disabled={!templateID}
          >
            Add Schedule
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
