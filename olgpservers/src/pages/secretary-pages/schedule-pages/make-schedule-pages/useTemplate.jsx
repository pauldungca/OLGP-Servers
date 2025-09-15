import React, { useState, useEffect } from "react";
import { Breadcrumb, DatePicker, TimePicker } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import image from "../../../../helper/images";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";

import {
  getTemplateDetails,
  addUseTemplate,
  confirmCancelUseTemplate,
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

  const handleNoteChange = (e) => {
    if (e.target.value.length <= 150) setNote(e.target.value);
  };

  const handleAddSchedule = async () => {
    if (!dateVal || !timeVal) {
      alert("Please select a date and time.");
      return;
    }

    // ✅ Use timestamp as numeric scheduleID
    const scheduleID = Date.now(); // fits in int8

    const dateStr = dayjs(dateVal).format("YYYY-MM-DD");
    const timeStr = dayjs(timeVal).format("HH:mm:ss");

    const ok = await addUseTemplate({
      scheduleID,
      templateID: Number(templateID), // ensure bigint
      clientName,
      date: dateStr,
      time: timeStr,
      note,
    });

    if (ok) navigate("/selectTemplate");
  };

  const handleCancel = async () => {
    const ok = await confirmCancelUseTemplate();
    if (ok) navigate("/selectTemplate");
  };

  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>MAKE SCHEDULE</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/selectTemplate" className="breadcrumb-item">
                      Select Template
                    </Link>
                  ),
                },
                {
                  title: "Use Mass Schedule Template",
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
                onChange={(d) => setDateVal(d)}
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
                className="w-100"
                popupClassName="timepicker-down"
                placement="bottomLeft"
                value={timeVal}
                onChange={(t) => setTimeVal(t)}
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
                onChange={handleNoteChange}
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
            onClick={handleCancel}
          >
            <img src={image.noButtonImage} alt="Cancel" className="btn-icon" />
            Cancel
          </button>
          <button
            type="button"
            className="btn add-schedule-btn action-btn"
            onClick={handleAddSchedule}
            disabled={!templateID}
          >
            <img src={image.addScheduleButton} alt="Add" className="btn-icon" />
            Add Schedule
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
