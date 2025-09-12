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

import "../styles/viewNotification.css";

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

        {/* ✅ Action buttons */}
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

  return `Notification (Type ${type})`;
};

export const approveRequest = async (notif, navigate) => {
  try {
    if (!notif) throw new Error("Missing notification payload");

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "Approve Request?",
      text: "Are you sure you want to approve this request and import the member?",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!isConfirmed) return false;

    const { id, idNumber, department, group } = notif;

    // 1) Import based on department
    let ok = false;
    if (department === "Altar Server") {
      ok = await importToAltarServerDepartment(idNumber);
    } else if (department === "Lector Commentator") {
      ok = await importToLectorCommentatorDepartment(idNumber);
    } else if (department === "Eucharistic Minister") {
      ok = await importToEucharisticMinisterDepartment(idNumber, group || null);
    } else if (department === "Choir") {
      ok = await importToChoirDepartment(idNumber, group || null);
    } else {
      await Swal.fire({
        icon: "info",
        title: "Unsupported Department",
        text: `No import handler for department: ${department}`,
      });
      return false;
    }
    if (!ok) return false; // import helper already alerted on failure

    // 2) Remove the request
    const { error: delErr } = await supabase
      .from("member-request-notification")
      .delete()
      .eq("id", id);
    if (delErr) throw delErr;

    await Swal.fire({
      icon: "success",
      title: "Approved",
      text: `Request approved. You are now a ${department} member.`,
    });

    if (typeof navigate === "function") navigate("/notification");
    return true;
  } catch (err) {
    console.error("approveRequest error:", err);
    await Swal.fire({
      icon: "error",
      title: "Failed",
      text: "Could not approve the request.",
    });
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
    await Swal.fire({
      icon: "error",
      title: "Failed",
      text: "Could not deny the request.",
    });
    return false;
  }
};
