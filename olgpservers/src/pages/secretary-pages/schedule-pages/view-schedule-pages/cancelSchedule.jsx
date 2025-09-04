import React, { useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import icon from "../../../../helper/icon";
import Footer from "../../../../components/footer";

import "../../../../assets/styles/schedule.css";
import "../../../../assets/styles/cancelSchedule.css";

export default function CancelSchedule() {
  useEffect(() => {
    document.title = "OLGP Servers | View Schedule";
  }, []);
  return (
    <div className="schedule-page-container">
      <div className="schedule-header">
        <div className="header-text-with-line">
          <h3>VIEW SCHEDULE</h3>
          <div style={{ margin: "10px 0" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link
                      to="/viewScheduleSecretary"
                      className="breadcrumb-item"
                    >
                      View Schedule
                    </Link>
                  ),
                },
                {
                  title: "Cancel Schedule",
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
      <div className="schedule-content container">
        <div className="cancel-schedule-card shadow-sm p-4 rounded">
          <h4 className="mb-4">Cancel Schedule</h4>

          <p>
            <strong>Date:</strong> April 6, 2025
          </p>
          <p>
            <strong>Mass:</strong> Sunday Mass
          </p>
          <p>
            <strong>Group:</strong> Group 2
          </p>
          <p>
            <strong>Time:</strong> 2nd Mass | 8:30 AM
          </p>

          <div className="mb-3 row align-items-center reason-row">
            <label className="col-sm-2 col-form-label">
              <strong>Reason:</strong>
            </label>
            <div className="col-sm-10 d-flex align-items-center">
              <button className="btn btn-attach">Attach File</button>
            </div>
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-confirm w-100">Confirm</button>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
