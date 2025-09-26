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

// Resolve a friendly full name by idNumber from members-information
const resolveMemberFullName = async (idNumber) => {
  const safeId = String(idNumber || "");
  if (!safeId) return "A member";

  const { data, error } = await supabase
    .from("members-information")
    .select("firstName, middleName, lastName")
    .eq("idNumber", safeId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error("resolveMemberFullName error:", error);
    return "A member";
  }

  const first = data.firstName || "";
  const last = data.lastName || "";
  const mid = (data.middleName || "").trim();
  const middleInitial = mid ? ` ${mid.charAt(0).toUpperCase()}.` : "";

  const fullName = `${first}${middleInitial} ${last}`.trim();
  return fullName || "A member";
};

/* ===========================
   PERSONAL (member-request-notification)
   =========================== */

export const fetchRequestNotification = async (idNumber) => {
  if (!idNumber) return [];

  const { data, error } = await supabase
    .from("member-request-notification")
    .select("*")
    .eq("idNumber", idNumber)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  // tag them so UI can route delete appropriately
  return (data || []).map((row) => ({ _kind: "personal", ...row }));
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
      // ===== TYPE 2: Transfer scheduler rights =====
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

      // 🔎 Resolve display name (with middle initial if any)
      const displayName = await resolveMemberFullName(idNumber);

      // Promote (no navigate here; we will delete then caller can navigate)
      const ok = await promoteMemberToScheduler({
        selectedRole: department,
        targetIdNumber: idNumber,
        storedIdNumber: currentSchedulerId,
        fullName: displayName,
      });
      if (!ok) return false;

      // delete the request
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

      // 📣 create a global (broadcast) message visible to all users
      try {
        const bcOk = await createSchedulerBroadcast({
          department,
          memberName: displayName,
        });
        if (!bcOk) {
          await Swal.fire(
            "Warning",
            "Scheduler transfer succeeded, but broadcast notification failed.",
            "warning"
          );
        }
      } catch (err) {
        console.error("Broadcast error:", err);
        await Swal.fire(
          "Error",
          "Scheduler transfer succeeded, but broadcast notification threw an error.",
          "error"
        );
      }

      // Optional redirect
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

export const deleteNotification = async (notifId, setNotifications) => {
  const result = await Swal.fire({
    icon: "question",
    title: "Delete Notification?",
    text: "Are you sure you want to delete this notification?",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return false;

  try {
    const { error } = await supabase
      .from("member-request-notification")
      .delete()
      .eq("id", notifId);

    if (error) throw error;

    if (typeof setNotifications === "function") {
      setNotifications((prev) =>
        prev.filter((n) => !(n._kind === "personal" && n.id === notifId))
      );
    }

    await Swal.fire({
      icon: "success",
      title: "Deleted",
      text: "Notification has been deleted.",
    });
    return true;
  } catch (err) {
    console.error("deleteNotification error:", err);
    await Swal.fire("Error", "Failed to delete the notification.", "error");
    return false;
  }
};

/* ===========================
   GLOBAL (user_notifications + user_notification_receipts)
   =========================== */

/** Create a global broadcast when a scheduler transfer is approved */
export const createSchedulerBroadcast = async ({ department, memberName }) => {
  try {
    const { error } = await supabase.from("user_notifications").insert([
      {
        title: "Scheduler Transfer Approved",
        message: `${memberName} is now the ${department} scheduler.`,
        level: "success",
      },
    ]);

    if (error) {
      console.error("createSchedulerBroadcast error:", error);
      await Swal.fire("Error", `Broadcast failed: ${error.message}`, "error");
      return false;
    }
    return true;
  } catch (err) {
    console.error("createSchedulerBroadcast exception:", err);
    await Swal.fire("Error", "Broadcast failed (exception).", "error");
    return false;
  }
};

/** Fetch global broadcasts that the current user hasn't dismissed */
export const fetchGlobalNotificationsForUser = async (idNumber) => {
  try {
    // 1) Fetch broadcasts
    const { data: broadcasts, error: bErr } = await supabase
      .from("user_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (bErr) {
      console.error("[Global] SELECT user_notifications failed:", bErr);
      await Swal.fire(
        "Error",
        `Cannot load broadcasts: ${bErr.message}`,
        "error"
      );
      return [];
    }

    // If no broadcasts, return early (but log for debugging)
    if (!broadcasts || broadcasts.length === 0) {
      console.log("[Global] No broadcasts found");
      return [];
    }

    // 2) Receipts are optional; if idNumber is falsy, skip filtering
    if (!idNumber) {
      console.warn(
        "[Global] No idNumber provided; returning all broadcasts (undismissed filter skipped)."
      );
      return broadcasts.map((n) => ({
        _kind: "global",
        id: n.id,
        title: n.title,
        message: n.message,
        level: n.level,
        created_at: n.created_at,
      }));
    }

    const { data: receipts, error: rErr } = await supabase
      .from("user_notification_receipts")
      .select("notification_id, dismissed_at")
      .eq("idNumber", String(idNumber || ""));

    if (rErr) {
      console.error("[Global] SELECT receipts failed:", rErr);
      // Don’t fail the entire list; show broadcasts anyway
      return broadcasts.map((n) => ({
        _kind: "global",
        id: n.id,
        title: n.title,
        message: n.message,
        level: n.level,
        created_at: n.created_at,
      }));
    }

    const dismissedIds = new Set(
      (receipts || [])
        .filter((r) => r.dismissed_at)
        .map((r) => r.notification_id)
    );

    const visible = (broadcasts || []).filter((n) => !dismissedIds.has(n.id));

    return visible.map((n) => ({
      _kind: "global",
      id: n.id,
      title: n.title,
      message: n.message,
      level: n.level,
      created_at: n.created_at,
    }));
  } catch (err) {
    console.error("[Global] Unexpected error:", err);
    await Swal.fire(
      "Error",
      "Failed to load broadcasts (unexpected).",
      "error"
    );
    return [];
  }
};

/** Dismiss a global broadcast for this user only */
export const dismissGlobalNotification = async (
  notificationId,
  idNumber,
  setNotifications
) => {
  try {
    const res = await Swal.fire({
      icon: "question",
      title: "Delete Notification?",
      text: "Are you sure you want to delete this notification?",
      showCancelButton: true,
      confirmButtonText: "Hide",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!res.isConfirmed) return false;

    const safeIdNum = String(idNumber || "");
    const now = new Date().toISOString();

    // 1) Try update first
    const { data: updData, error: updErr } = await supabase
      .from("user_notification_receipts")
      .update({ dismissed_at: now })
      .eq("idNumber", safeIdNum)
      .eq("notification_id", notificationId)
      .select(); // select so we can see affected rows for supabase-js

    if (updErr) {
      console.error("[GlobalDismiss] update error:", updErr);
    }

    const updatedCount = Array.isArray(updData) ? updData.length : 0;

    // 2) If nothing updated, insert
    if (updatedCount === 0) {
      const { error: insErr } = await supabase
        .from("user_notification_receipts")
        .insert([
          {
            idNumber: safeIdNum,
            notification_id: notificationId,
            dismissed_at: now,
          },
        ]);
      if (insErr) {
        console.error("[GlobalDismiss] insert error:", insErr);
        await Swal.fire(
          "Error",
          `Could not hide broadcast. ${insErr.message || ""}`,
          "error"
        );
        return false;
      }
    }

    // 3) Update local list
    if (typeof setNotifications === "function") {
      setNotifications((prev) =>
        prev.filter((n) => !(n._kind === "global" && n.id === notificationId))
      );
    }

    await Swal.fire({
      icon: "success",
      title: "Deleted",
      text: "Notification deleted.",
    });
    return true;
  } catch (err) {
    console.error("dismissGlobalNotification error:", err);
    await Swal.fire("Error", "Could not hide broadcast.", "error");
    return false;
  }
};

/** Fetch a single GLOBAL (broadcast) notification by id */
export const fetchGlobalNotificationById = async (id) => {
  const { data, error } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching global notification by id:", error);
    return null;
  }

  // tag for UI
  return data ? { _kind: "global", ...data } : null;
};

export const insertUserSpecificNotifications = async ({
  dateISO,
  time = "",
  assignments = {},
}) => {
  try {
    if (!dateISO) {
      await Swal.fire("Missing date", "No date was provided.", "error");
      return 0;
    }

    // 🔹 Ask confirmation first
    /*const { isConfirmed } = await Swal.fire({
      title: "Send Notifications?",
      text: "Are you sure you want to send notifications to the assigned members?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });*/

    //if (!isConfirmed) return 0;

    const rows = [];
    const roleKeys = Object.keys(assignments || {});

    for (const roleKey of roleKeys) {
      const members = assignments[roleKey];
      if (!Array.isArray(members)) continue; // skip metadata like .status

      for (const m of members) {
        const idNumber = String(m?.idNumber || "").trim();
        if (!idNumber) continue;
        rows.push({
          idNumber,
          date: dateISO,
          time: time || "",
          role: roleKey,
        });
      }
    }

    if (rows.length === 0) {
      await Swal.fire(
        "Nothing to insert",
        "No assigned members found.",
        "info"
      );
      return 0;
    }

    const { data, error } = await supabase
      .from("user-specific-notification")
      .insert(rows)
      .select();

    if (error) throw error;

    await Swal.fire({
      icon: "success",
      title: "Inserted",
      text: `Added ${data?.length || rows.length} notification record(s).`,
      timer: 1400,
      showConfirmButton: false,
    });

    return data?.length || rows.length;
  } catch (err) {
    console.error("insertUserSpecificNotifications error:", err);
    await Swal.fire("Failed", "Could not insert notifications.", "error");
    return 0;
  }
};
