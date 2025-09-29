import React, { useEffect, useState, useRef } from "react";
import CalendarPage from "../../components/calendar";
import TermsModal from "../../components/termsModal";
import Footer from "../../components/footer";

import {
  fetchAuthRowByIdNumber,
  setHasAgreeTrue,
  redirectOnExit,
} from "../../assets/scripts/dashboard";

import "../../assets/styles/dashboard.css";

export default function Dashboard() {
  const [showTerms, setShowTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mountedRef = useRef(true);

  const storedIdNumber = localStorage.getItem("idNumber");

  useEffect(() => {
    document.title = "OLGP Servers | Dashboard";
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      // If we don’t have an idNumber, there’s nothing to check.
      if (!storedIdNumber) return;

      const { data, error } = await fetchAuthRowByIdNumber(storedIdNumber);
      if (error) {
        console.error("Fetch auth row error:", error);
        return;
      }

      // Show terms if hasAgree is 0/falsey.
      const needsAgreement =
        data &&
        (Number(data.hasAgree) === 0 ||
          data.hasAgree === 0 ||
          data.hasAgree === false ||
          data.hasAgree === "0");

      if (needsAgreement && mountedRef.current) {
        setShowTerms(true);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [storedIdNumber]);

  const handleAgree = async () => {
    if (!storedIdNumber || submitting) return;
    setSubmitting(true);
    const { error } = await setHasAgreeTrue(storedIdNumber);
    if (error) {
      console.error("Update hasAgree error:", error);
    } else if (mountedRef.current) {
      setShowTerms(false);
    }
    setSubmitting(false);
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
          // if your TermsModal supports disabling buttons:
          submitting={submitting}
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
