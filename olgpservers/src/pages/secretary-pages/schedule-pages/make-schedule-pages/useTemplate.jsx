import React, { useState } from "react";
import { Breadcrumb, DatePicker, TimePicker } from "antd";
import { Link } from "react-router-dom";
import image from "../../../../helper/images";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/useTemplate.css";

export default function UseTemplate() {
  const [note, setNote] = useState("");

  const handleNoteChange = (e) => {
    if (e.target.value.length <= 150) {
      setNote(e.target.value);
    }
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
                  style={{ width: "15px", height: "15px" }}
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
            <span className="template-name">Christening Mass</span>
          </div>
        </div>

        {/* Client name inline */}
        <div className="form-row">
          <label className="form-label">Client Name:</label>
          <input type="text" className="form-control" />
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
          <button type="button" className="btn cancel-schedule-btn action-btn">
            <img src={image.noButtonImage} alt="Cancel" className="btn-icon" />
            Cancel
          </button>
          <button type="button" className="btn add-schedule-btn action-btn">
            <img src={image.addScheduleButton} alt="Add" className="btn-icon" />
            Add Schedule
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
