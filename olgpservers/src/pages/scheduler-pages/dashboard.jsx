import React, { useEffect, useState } from "react";
import images from "../../helper/images";
import CalendarPage from "../../components/calendar";
import TermsModal from "../../components/termsModal";
import Footer from "../../components/footer";

import {
  fetchAuthRowByIdNumber,
  setHasAgreeTrue,
  redirectOnExit,
  countSchedulesAssigned,
  getDepartmentCardInfo,
} from "../../assets/scripts/dashboard";

import "../../assets/styles/dashboard.css";

export default function Dashboard() {
  const storedIdNumber = localStorage.getItem("idNumber");

  const [showTerms, setShowTerms] = useState(false);
  const [handlesCount, setHandlesCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [deptLabel, setDeptLabel] = useState("Department Handled");

  useEffect(() => {
    document.title = "OLGP Servers | Dashboard";
  }, []);

  useEffect(() => {
    (async () => {
      if (!storedIdNumber) return;

      const [{ count, label }, assigned] = await Promise.all([
        getDepartmentCardInfo(storedIdNumber),
        countSchedulesAssigned(storedIdNumber),
      ]);

      setHandlesCount(count);
      setDeptLabel(label);
      setAssignedCount(assigned);
    })();
  }, [storedIdNumber]);

  // Terms modal flow (unchanged)
  useEffect(() => {
    (async () => {
      if (!storedIdNumber) return;
      const { data, error } = await fetchAuthRowByIdNumber(storedIdNumber);
      if (error) {
        console.error("Fetch auth row error:", error);
        return;
      }
      if (data && Number(data.hasAgree) === 0) {
        setShowTerms(true);
      }
    })();
  }, [storedIdNumber]);

  const handleAgree = async () => {
    const { error } = await setHasAgreeTrue(storedIdNumber);
    if (error) console.error("Update hasAgree error:", error);
    setShowTerms(false);
  };

  const handleExit = () => {
    redirectOnExit();
  };

  return (
    <div className="dashboard-page-container">
      {showTerms && (
        <TermsModal
          open={showTerms}
          onAgree={handleAgree}
          onExit={handleExit}
        />
      )}

      <div className="dashboard-header">
        <div className="header-text-with-line">
          <h3>DASHBOARD</h3>
          <div className="header-line"></div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="row g-3">
          {/* Card 1 */}
          <div className="col-md-6">
            <div className="d-flex align-items-center p-3 rounded card-style">
              <img
                src={images.departmentHandlesImages}
                alt="Department Handles"
                className="img-people"
              />
              <div>
                <h4 className="mb-0 fw-bold fs-3">{handlesCount}</h4>
                <small>{deptLabel}</small>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="col-md-6">
            <div className="d-flex align-items-center p-3 rounded card-style">
              <img
                src={images.massCompletedImage}
                alt="Mass Completed"
                className="img-checkIcon"
              />
              <div>
                <h4 className="mb-0 fw-bold fs-3">{assignedCount}</h4>
                <small>Schedules Assigned</small>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="calendar-container p-3 rounded">
              <CalendarPage />
            </div>
          </div>
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
