// assets/scripts/notification.js
import { supabase } from "../../utils/supabase";
import React from "react";
import Swal from "sweetalert2";

import {
  importToAltarServerDepartment,
  importToLectorCommentatorDepartment,
  importToEucharisticMinisterDepartment,
  importToChoirDepartment,
} from "./importMember";

import { promoteMemberToScheduler } from "./departmentSettings";

import "../styles/viewNotification.css";

const schedulerColMap = {
  "Altar Server": "altar-server-scheduler",
  "Eucharistic Minister": "eucharistic-minister-scheduler",
  Choir: "choir-scheduler",
  "Lector Commentator": "lector-commentator-scheduler",
};

/** List notifications for a user (by idNumber) */
export const fetchRequestNotification = async (idNumber) => {
  if (!idNumber) return [];

  const { data, error } = await supabase
    .from("member-request-notification")
    .select("*")
    .eq("idNumber", idNumber)
    .order("date", { ascending: false })
    .order("time", { ascending: false }); // ✅ fixed: complete object

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
};

/** Fetch a single notification by id (optionally scoped to idNumber for safety) */
export const fetchRequestNotificationById = async (id, idNumber) => {
  let q = supabase
    .from("member-request-notification")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (idNumber) {
    q = q.eq("idNumber", idNumber);
  }

  const { data, error } = await q;
  if (error) {
    console.error("Error fetching notification by id:", error);
    return null;
  }
  return data;
};

export const renderNotificationBody = (notif, handleApprove, handleDeny) => {
  if (!notif) return null;
  const type = notif["notification-type"];

  if (type === 1) {
    const dept = notif.department;
    const showGroup = dept === "Eucharistic Minister" || dept === "Choir";

    return (
      <>
        <p className="view-notification-text">
          An approval request has been created to add this member to the{" "}
          <strong>
            {dept}
            {showGroup && notif.group ? ` (${notif.group})` : ""}
          </strong>{" "}
          department.
        </p>
        <div className="view-notification-detail">
          <span className="label">Date:</span>
          <span className="value">{notif.date}</span>
        </div>
        <div className="view-notification-detail">
          <span className="label">Time:</span>
          <span className="value">{notif.time}</span>
        </div>

        <div className="view-notification-actions">
          <button className="btn-deny" onClick={handleDeny}>
            Deny
          </button>
          <button className="btn-approve" onClick={handleApprove}>
            Approve
          </button>
        </div>
      </>
    );
  }

  if (type === 2) {
    // 👇 New: scheduler transfer design
    const dept = notif.department;
    return (
      <>
        <p className="view-notification-text">
          You’ve been requested to become the <strong>{dept} Scheduler</strong>.
          Approving will transfer scheduler privileges to your account for this
          department.
        </p>
        <div className="view-notification-detail">
          <span className="label">Date:</span>
          <span className="value">{notif.date}</span>
        </div>
        <div className="view-notification-detail">
          <span className="label">Time:</span>
          <span className="value">{notif.time}</span>
        </div>

        <div className="view-notification-actions">
          <button className="btn-deny" onClick={handleDeny}>
            Deny
          </button>
          <button className="btn-approve" onClick={handleApprove}>
            Approve
          </button>
        </div>
      </>
    );
  }

  // fallback
  return (
    <>
      <p className="view-notification-text">
        You have a notification for <strong>{notif.department}</strong>.
      </p>
      <div className="view-notification-detail">
        <span className="label">Date:</span>
        <span className="value">{notif.date}</span>
      </div>
      <div className="view-notification-detail">
        <span className="label">Time:</span>
        <span className="value">{notif.time}</span>
      </div>
    </>
  );
};

export const renderNotificationTitle = (notif) => {
  if (!notif) return "";
  const type = notif["notification-type"];

  if (type === 1) {
    const dept = notif.department;
    const showGroup = dept === "Eucharistic Minister" || dept === "Choir";
    return `Approval Request to Join ${dept}${
      showGroup && notif.group ? ` (${notif.group})` : ""
    }`;
  }

  if (type === 2) {
    // 👇 New: scheduler transfer title
    return `Scheduler Transfer Request – ${notif.department}`;
  }

  return `Notification (Type ${type})`;
};

export const approveRequest = async (notif, navigate) => {
  try {
    if (!notif) throw new Error("Missing notification payload");

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "Approve Request?",
      text: "Are you sure you want to approve this request?",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!isConfirmed) return false;

    const { id, idNumber, department, group } = notif;
    const type = notif["notification-type"];

    if (type === 1) {
      // ===== TYPE 1: Import membership =====
      let ok = false;
      if (department === "Altar Server") {
        ok = await importToAltarServerDepartment(idNumber);
      } else if (department === "Lector Commentator") {
        ok = await importToLectorCommentatorDepartment(idNumber);
      } else if (department === "Eucharistic Minister") {
        ok = await importToEucharisticMinisterDepartment(
          idNumber,
          group || null
        );
      } else if (department === "Choir") {
        ok = await importToChoirDepartment(idNumber, group || null);
      } else {
        await Swal.fire(
          "Info",
          `Unsupported department: ${department}`,
          "info"
        );
        return false;
      }
      if (!ok) return false;

      // remove the request
      const { error: del1 } = await supabase
        .from("member-request-notification")
        .delete()
        .eq("id", id);
      if (del1) throw del1;

      const groupText =
        (department === "Eucharistic Minister" || department === "Choir") &&
        group
          ? ` (${group})`
          : "";

      await Swal.fire({
        icon: "success",
        title: "Approved",
        text: `Request approved. You are now a ${department}${groupText} member.`,
      });
    } else if (type === 2) {
      const schedulerCol = schedulerColMap[department];
      if (!schedulerCol) {
        await Swal.fire(
          "Info",
          `Unsupported department: ${department}`,
          "info"
        );
        return false;
      }

      // Find current scheduler
      const { data: currentSched, error: qErr } = await supabase
        .from("user-type")
        .select("idNumber")
        .eq(schedulerCol, 1)
        .limit(1);
      if (qErr) throw qErr;

      const currentSchedulerId =
        currentSched && currentSched.length > 0
          ? currentSched[0].idNumber
          : null;

      // ❗ DO NOT pass navigate here — let the caller navigate after deletion
      const ok = await promoteMemberToScheduler({
        selectedRole: department,
        targetIdNumber: idNumber,
        storedIdNumber: currentSchedulerId,
        fullName: "",
        // navigate: undefined
      });
      if (!ok) return false;

      // Now delete the request (this code will actually run)
      const { error: del2 } = await supabase
        .from("member-request-notification")
        .delete()
        .eq("id", id);

      if (del2) {
        console.error("Delete notif error:", del2);
        await Swal.fire(
          "Warning",
          "Promotion done, but failed to remove the request.",
          "warning"
        );
        return false;
      }

      // One success alert is already shown inside promoteMemberToScheduler.
      // After deletion, you can redirect wherever you want:
      if (typeof navigate === "function") {
        navigate("/dashboard");
        window.location.reload();
      }

      return true;
    } else {
      await Swal.fire("Info", `Unsupported notification type: ${type}`, "info");
      return false;
    }

    if (typeof navigate === "function") navigate("/notification");
    return true;
  } catch (err) {
    console.error("approveRequest error:", err);
    await Swal.fire("Failed", "Could not approve the request.", "error");
    return false;
  }
};

export const denyRequest = async (notif, navigate) => {
  try {
    if (!notif) throw new Error("Missing notification payload");

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "Deny Request?",
      text: "Are you sure you want to deny this request?",
      showCancelButton: true,
      confirmButtonText: "Yes, Deny",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!isConfirmed) return false;

    const { id } = notif;

    const { error } = await supabase
      .from("member-request-notification")
      .delete()
      .eq("id", id);
    if (error) throw error;

    await Swal.fire({
      icon: "warning",
      title: "Denied",
      text: "Request denied and notification removed.",
    });

    if (typeof navigate === "function") navigate("/notification");
    return true;
  } catch (err) {
    console.error("denyRequest error:", err);
    await Swal.fire("Failed", "Could not deny the request.", "error");
    return false;
  }
};
