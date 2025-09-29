import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";
import {
  fetchAltarServerMembersWithRole,
  fetchLectorCommentatorMembersWithRole,
} from "./fetchMember";
import {
  getTemplateFlagsForDate,
  getTemplateFlagsForLectorCommentator,
  getTemplateFlagsForChoir,
} from "./fetchSchedule";

import { fetchChoirGroups } from "./group";

export const ROLE_COLUMN_MAP = {
  candleBearer: "candle-bearer",
  thurifer: "thurifer",
  beller: "beller",
  mainServer: "main-server",
  crossBearer: "cross-bearer",
  incenseBearer: "incense-bearer",
  plate: "plate",
};

export async function buildEligibilityMaps() {
  const selectCols =
    'idNumber,"candle-bearer","beller","cross-bearer","thurifer","incense-bearer","main-server","plate"';

  const { data, error } = await supabase
    .from("altar-server-roles")
    .select(selectCols);

  if (error) {
    console.error("buildEligibilityMaps error:", error);
    return { perRoleAllowed: new Map(), perMemberAllowed: new Map() };
  }

  const perRoleAllowed = new Map();
  const perMemberAllowed = new Map();

  Object.keys(ROLE_COLUMN_MAP).forEach((k) => perRoleAllowed.set(k, new Set()));

  for (const row of data || []) {
    const id = String(row.idNumber).trim();
    const allowedRoles = new Set();

    for (const [roleKey, col] of Object.entries(ROLE_COLUMN_MAP)) {
      if (Number(row[col] || 0) === 1) {
        perRoleAllowed.get(roleKey).add(id);
        allowedRoles.add(roleKey);
      }
    }
    perMemberAllowed.set(id, allowedRoles);
  }

  return { perRoleAllowed, perMemberAllowed };
}

export function isEligibleForRole(perRoleAllowed, idNumber, roleKey) {
  return perRoleAllowed.get(roleKey)?.has(String(idNumber).trim()) === true;
}

export const replacePlaceholderRoleAssignments = async ({
  dateISO,
  massLabel,
  templateID,
  roleKey,
  members, // [{ idNumber, fullName? }]
}) => {
  const { error: delErr } = await supabase
    .from("altar-server-placeholder")
    .delete()
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .eq("role", roleKey);
  if (delErr) throw delErr;

  if (!members || members.length === 0) return { inserted: 0 };

  const rows = members.map((m, i) => ({
    date: dateISO,
    mass: massLabel,
    templateID: templateID ?? null,
    role: roleKey,
    slot: i + 1,
    idNumber: m.idNumber,
  }));

  const { data, error } = await supabase
    .from("altar-server-placeholder")
    .insert(rows)
    .select();
  if (error) throw error;
  return { inserted: data?.length ?? 0 };
};

export const getAssignmentsForCards = async (dateISO, massLabel) => {
  const { data: rows, error } = await supabase
    .from("altar-server-placeholder")
    .select("idNumber, role, slot")
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .order("role", { ascending: true })
    .order("slot", { ascending: true });
  if (error) throw error;
  if (!rows || rows.length === 0) return {};

  const ids = Array.from(new Set(rows.map((r) => r.idNumber).filter(Boolean)));
  let nameMap = new Map();

  if (ids.length > 0) {
    const { data: members, error: memErr } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", ids);
    if (memErr) throw memErr;
    members?.forEach((m) => nameMap.set(m.idNumber, buildFullName(m)));
  }

  const grouped = {};
  rows.forEach((r) => {
    if (!grouped[r.role]) grouped[r.role] = [];
    grouped[r.role].push({
      idNumber: r.idNumber,
      fullName: nameMap.get(r.idNumber) || String(r.idNumber),
      slot: r.slot,
    });
  });

  Object.keys(grouped).forEach((k) =>
    grouped[k].sort((a, b) => (a.slot || 0) - (b.slot || 0))
  );
  return grouped;
};

export const clearAssignmentsFor = async (dateISO, massLabel) => {
  try {
    const result = await Swal.fire({
      icon: "question",
      title: "Reset this schedule?",
      text: "All assigned members for this date & mass will be cleared.",
      showCancelButton: true,
      confirmButtonText: "Yes, reset",
      cancelButtonText: "No",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return false;

    const { error } = await supabase
      .from("altar-server-placeholder")
      .delete()
      .eq("date", dateISO)
      .eq("mass", massLabel);
    if (error) throw error;

    await Swal.fire({
      icon: "success",
      title: "Schedule reset",
      timer: 1100,
      showConfirmButton: false,
    });
    return true;
  } catch (e) {
    console.error("clearAssignmentsFor error:", e);
    await Swal.fire({
      icon: "error",
      title: "Couldn't reset",
      text: "Please try again.",
    });
    return false;
  }
};

export const getMemberNameById = async (idNumber) => {
  if (!idNumber) return null;

  const { data, error } = await supabase
    .from("members-information")
    .select("firstName, middleName, lastName")
    .eq("idNumber", idNumber)
    .single();

  if (error || !data) {
    console.error("getMemberNameById error:", error);
    return String(idNumber); // fallback to ID if not found
  }

  const { firstName, middleName, lastName } = data;
  return [firstName, middleName, lastName]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(" ");
};

export const calculateRotationScore = (
  memberId,
  targetRole,
  historicalAssignments,
  targetDate
) => {
  if (!historicalAssignments || historicalAssignments.length === 0) {
    return -5000; // New member gets high priority
  }

  // Filter assignments for this member
  const memberAssignments = historicalAssignments.filter(
    (assignment) =>
      String(assignment.idNumber).trim() === String(memberId).trim()
  );

  if (memberAssignments.length === 0) {
    return -5000; // No history = high priority
  }

  // Count role occurrences
  const roleCount = memberAssignments.filter(
    (assignment) => assignment.role === targetRole
  ).length;

  // Find most recent assignment in target role
  const roleAssignments = memberAssignments
    .filter((assignment) => assignment.role === targetRole)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const lastRoleDate =
    roleAssignments.length > 0 ? new Date(roleAssignments[0].date) : null;
  const daysSinceLastRole = lastRoleDate
    ? Math.floor((new Date(targetDate) - lastRoleDate) / (1000 * 60 * 60 * 24))
    : Infinity;

  // Calculate total assignments across all roles
  const totalAssignments = memberAssignments.length;

  // Calculate rotation balance - how evenly distributed are their roles?
  const roleCounts = new Map();
  memberAssignments.forEach((assignment) => {
    roleCounts.set(assignment.role, (roleCounts.get(assignment.role) || 0) + 1);
  });

  const roleCountsArray = Array.from(roleCounts.values());
  const averageRoleCount = totalAssignments / roleCounts.size;
  const roleBalance =
    roleCountsArray.reduce(
      (sum, count) => sum + Math.abs(count - averageRoleCount),
      0
    ) / roleCounts.size;

  // Scoring algorithm
  let score = 0;

  // Heavy penalty for recent assignments in same role
  if (daysSinceLastRole < 7) score += 5000;
  else if (daysSinceLastRole < 30) score += 2000;
  else if (daysSinceLastRole < 90) score += 500;

  // Penalty for high role count (encourage rotation)
  score += roleCount * 1000;

  // Slight penalty for having many total assignments (give others chances)
  score += totalAssignments * 10;

  // Bonus for good role balance (they rotate well)
  score -= roleBalance * 50;

  // Major bonus for never doing this role
  if (roleCount === 0) score -= 10000;

  return score;
};

export const getMemberRotationStats = (memberId, historicalAssignments) => {
  const memberAssignments = historicalAssignments.filter(
    (assignment) =>
      String(assignment.idNumber).trim() === String(memberId).trim()
  );

  if (memberAssignments.length === 0) {
    return {
      totalAssignments: 0,
      roleDistribution: {},
      lastAssignmentDate: null,
      isNewMember: true,
    };
  }

  const roleDistribution = {};
  let lastAssignmentDate = null;

  memberAssignments.forEach((assignment) => {
    roleDistribution[assignment.role] =
      (roleDistribution[assignment.role] || 0) + 1;

    const assignmentDate = new Date(assignment.date);
    if (!lastAssignmentDate || assignmentDate > lastAssignmentDate) {
      lastAssignmentDate = assignmentDate;
    }
  });

  return {
    totalAssignments: memberAssignments.length,
    roleDistribution,
    lastAssignmentDate,
    isNewMember: false,
  };
};

export const shouldPrioritizeForRotation = (
  memberId,
  targetRole,
  historicalAssignments,
  targetDate
) => {
  const stats = getMemberRotationStats(memberId, historicalAssignments);

  if (stats.isNewMember) return true;

  const roleCount = stats.roleDistribution[targetRole] || 0;

  // Never done this role
  if (roleCount === 0) return true;

  // Done this role much less than others
  const avgRoleCount =
    stats.totalAssignments / Object.keys(stats.roleDistribution).length;
  if (roleCount < avgRoleCount * 0.7) return true;

  // Haven't done this role in a long time
  const roleAssignments = historicalAssignments
    .filter(
      (assignment) =>
        String(assignment.idNumber).trim() === String(memberId).trim() &&
        assignment.role === targetRole
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (roleAssignments.length > 0) {
    const daysSinceLastRole = Math.floor(
      (new Date(targetDate) - new Date(roleAssignments[0].date)) /
        (1000 * 60 * 60 * 24)
    );
    return daysSinceLastRole > 30;
  }

  return false;
};

export const normalizeMembers = (rows = []) =>
  rows
    .map((m) => ({
      idNumber: String(m.idNumber ?? "").trim(),
      fullName: buildFullName(m),
      role: m.role || "Non-Flexible",
      sex: m.sex || "Unknown", // Include sex field
    }))
    .filter((x) => x.idNumber && x.fullName);

export const buildFullName = (m) => {
  const first =
    m.firstName ||
    m.firstname ||
    m.first_name ||
    m.givenName ||
    m.given_name ||
    "";
  const middle =
    m.middleName || m.middlename || m.middle_name || m.middle || "";
  const last =
    m.lastName ||
    m.lastname ||
    m.last_name ||
    m.surname ||
    m.familyName ||
    m.family_name ||
    "";
  const explicit = m.fullName || m.fullname || m.full_name || m.name || "";
  const composed = [first, middle, last]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(" ");
  const finalName = (explicit || composed || "").trim();
  return finalName || String(m.idNumber || "").trim();
};

export const fetchMembersNormalized = async (dateISO, massLabel, role) => {
  const { perRoleAllowed } = await buildEligibilityMaps();
  const allowedSet = perRoleAllowed.get(role) || new Set();

  const { data: allAssignedMembers, error: allAssignedError } = await supabase
    .from("altar-server-placeholder")
    .select("idNumber, role, mass")
    .eq("date", dateISO);

  if (allAssignedError) {
    console.error("Error fetching assigned members:", allAssignedError);
    return [];
  }

  const allAssignedIds = new Set(
    (allAssignedMembers || []).map((m) => String(m.idNumber).trim())
  );

  const assignedByRole = new Map();
  (allAssignedMembers || []).forEach((m) => {
    const k = m.role;
    if (!assignedByRole.has(k)) assignedByRole.set(k, new Set());
    assignedByRole.get(k).add(String(m.idNumber).trim());
  });

  // last 6 months history
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString().split("T")[0];

  const { data: historicalAssignments } = await supabase
    .from("altar-server-placeholder")
    .select("idNumber, role, date, mass")
    .gte("date", sixMonthsAgoISO)
    .order("date", { ascending: false });

  const rows = await fetchAltarServerMembersWithRole();

  const normalized = (rows || [])
    .map((m) => ({
      idNumber: String(m.idNumber ?? "").trim(),
      fullName: buildFullName(m),
      role: m.role || "Non-Flexible",
      sex: m.sex || "Unknown",
    }))
    .filter((m) => {
      if (!m.idNumber || !m.fullName) return false;

      // keep already-assigned-to-this-role so you can unassign
      const assignedToCurrentRole = assignedByRole.get(role)?.has(m.idNumber);
      if (assignedToCurrentRole) return true;

      // eligibility gate
      if (!allowedSet.has(m.idNumber)) return false;

      // not available if already in any mass that day
      if (allAssignedIds.has(m.idNumber)) return false;

      return true;
    })
    .map((m) => {
      const rotationScore = calculateRotationScore(
        m.idNumber,
        role,
        historicalAssignments || [],
        dateISO
      );

      // compute roleCount and daysSinceLastRole
      const memberHistory = (historicalAssignments || []).filter(
        (a) => String(a.idNumber).trim() === m.idNumber
      );
      const roleCount = memberHistory.filter((a) => a.role === role).length;

      const lastRoleAssignment = memberHistory
        .filter((a) => a.role === role)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      const daysSinceLastRole = lastRoleAssignment
        ? Math.floor(
            (new Date(dateISO) - new Date(lastRoleAssignment.date)) /
              (1000 * 60 * 60 * 24)
          )
        : Infinity;

      // convenience flag (like you showed)
      const isPriority =
        roleCount === 0 ||
        (Number.isFinite(daysSinceLastRole) && daysSinceLastRole > 30);

      return {
        ...m,
        rotationScore,
        roleCount,
        daysSinceLastRole,
        isPriority,
      };
    })
    .sort((a, b) => {
      if (a.rotationScore !== b.rotationScore) {
        return a.rotationScore - b.rotationScore;
      }
      return a.fullName.localeCompare(b.fullName);
    });

  return normalized;
};

export const slotBaseLabelFor = (roleKey, fallbackLabel = "") => {
  const singular = {
    candleBearer: "Candle Bearer",
    thurifer: "Thurifer",
    beller: "Beller",
    mainServer: "Book and Mic",
    crossBearer: "Cross Bearer",
    incenseBearer: "Incense Bearer",
    plate: "Plate",
  };
  return singular[roleKey] || fallbackLabel || roleKey || "Role";
};

export const ensureArraySize = (arr = [], size = 1) =>
  Array.from({ length: size }, (_, i) => arr[i] || null);

export const preloadAssignedForRole = async ({
  dateISO,
  massLabel,
  roleKey,
  slotsCount,
}) => {
  // Get assignments for this specific role
  const { data: assignments, error } = await supabase
    .from("altar-server-placeholder")
    .select("idNumber, slot")
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .eq("role", roleKey)
    .order("slot", { ascending: true });

  if (error) {
    console.error("Error fetching assignments:", error);
    return ensureArraySize([], slotsCount);
  }

  if (!assignments || assignments.length === 0) {
    return ensureArraySize([], slotsCount);
  }

  // Get the member details for all assigned IDs
  const assignedIds = assignments.map((a) => a.idNumber).filter(Boolean);

  if (assignedIds.length === 0) {
    return ensureArraySize([], slotsCount);
  }

  const { data: members, error: memberError } = await supabase
    .from("members-information")
    .select("*")
    .in("idNumber", assignedIds);

  if (memberError) {
    console.error("Error fetching member details:", memberError);
    return ensureArraySize([], slotsCount);
  }

  // Create a map of ID to full name
  const memberMap = new Map();
  members?.forEach((m) => {
    memberMap.set(String(m.idNumber), buildFullName(m));
  });

  // Build the result array with proper full names
  const result = assignments.map((assignment) => ({
    idNumber: String(assignment.idNumber),
    fullName:
      memberMap.get(String(assignment.idNumber)) ||
      `Member ${assignment.idNumber}`,
    slot: assignment.slot,
  }));

  return ensureArraySize(result, slotsCount);
};

export const isMemberChecked = (assigned, member) => {
  // Check if this member is already in the assigned list for the selected role
  return assigned.some(
    (assignedMember) =>
      assignedMember && assignedMember.idNumber === member.idNumber
  );
};

export const placeMember = (prevAssigned, member) => {
  const id = String(member?.idNumber ?? "").trim();
  const alreadyIdx = prevAssigned.findIndex((m) =>
    m ? String(m.idNumber) === id : false
  );
  if (alreadyIdx >= 0) {
    const next = prevAssigned.slice();
    next[alreadyIdx] = null;
    return next;
  }
  const emptyIndex = prevAssigned.findIndex((m) => !m);
  if (emptyIndex !== -1) {
    const next = prevAssigned.slice();
    next[emptyIndex] = { idNumber: id, fullName: member.fullName };
    return next;
  }
  const next = prevAssigned.slice();
  next[0] = { idNumber: id, fullName: member.fullName };
  return next;
};

export const deepResetRoleAssignments = async ({
  dateISO,
  massLabel,
  templateID,
  roleKey,
  slotsCount,
}) => {
  await replacePlaceholderRoleAssignments({
    dateISO,
    massLabel,
    templateID,
    roleKey,
    members: [],
  });
  return ensureArraySize([], slotsCount);
};

export const saveRoleAssignments = async ({
  dateISO,
  massLabel,
  templateID,
  roleKey,
  assigned,
}) => {
  const chosen = (assigned || []).filter(Boolean);

  // ðŸ” Eligibility check
  const { perRoleAllowed } = await buildEligibilityMaps();
  const allowedSet = perRoleAllowed.get(roleKey) || new Set();
  const invalid = chosen.filter(
    (m) => !allowedSet.has(String(m.idNumber).trim())
  );

  if (invalid.length > 0) {
    const who = invalid.map((m) => m.fullName || m.idNumber).join(", ");
    await Swal.fire({
      icon: "warning",
      title: "Not eligible",
      text: `The following member(s) cannot be assigned to ${roleKey}: ${who}`,
    });
  }

  const valid = chosen.filter((m) => allowedSet.has(String(m.idNumber).trim()));

  return replacePlaceholderRoleAssignments({
    dateISO,
    massLabel,
    templateID,
    roleKey,
    members: valid,
  });
};

export const isSundayFor = ({ passedIsSunday, source, selectedISO }) => {
  if (typeof passedIsSunday === "boolean") return passedIsSunday;
  if (source === "sunday") return true;
  if (selectedISO) {
    const [y, m, d] = selectedISO.split("-").map(Number);
    return new Date(y, m - 1, d).getDay() === 0;
  }
  return false;
};

export const needTemplateFlagsFor = ({ isSunday, selectedISO }) =>
  !isSunday && !!selectedISO;

export const getTemplateFlags = async (selectedISO) =>
  getTemplateFlagsForDate(selectedISO);

export const roleCountsFor = ({ flags, isSunday }) => {
  const showAll = isSunday === true;
  return {
    candleBearer: showAll ? 2 : Number(flags?.roles?.candleBearer || 0),
    thurifer: showAll ? 1 : Number(flags?.roles?.thurifer || 0),
    beller: showAll ? 2 : Number(flags?.roles?.beller || 0),
    mainServer: showAll ? 2 : Number(flags?.roles?.mainServer || 0),
    crossBearer: showAll ? 1 : Number(flags?.roles?.crossBearer || 0),
    incenseBearer: showAll ? 1 : Number(flags?.roles?.incenseBearer || 0),
    plate: showAll ? 10 : Number(flags?.roles?.plate || 0),
  };
};

export const roleVisibilityFor = ({ flags, isSunday }) => {
  const showAll = isSunday === true;
  const roleOn = (count) => Number(count || 0) > 0;
  return {
    candleBearer: showAll || roleOn(flags?.roles?.candleBearer),
    thurifer: showAll || roleOn(flags?.roles?.thurifer),
    beller: showAll || roleOn(flags?.roles?.beller),
    mainServer: showAll || roleOn(flags?.roles?.mainServer),
    crossBearer: showAll || roleOn(flags?.roles?.crossBearer),
    incenseBearer: showAll || roleOn(flags?.roles?.incenseBearer),
    plate: showAll || roleOn(flags?.roles?.plate),
  };
};

export const fetchAssignmentsGrouped = async ({ dateISO, massLabel }) =>
  getAssignmentsForCards(dateISO, massLabel);

export const resetAllAssignments = async ({ dateISO, massLabel }) =>
  clearAssignmentsFor(dateISO, massLabel);

export const buildAssignNavState = ({
  selectedDate,
  selectedISO,
  selectedMass,
  source,
  isSunday,
  templateID,
  roleKey,
  label,
  counts,
}) => ({
  selectedDate,
  selectedISO,
  selectedMass,
  source,
  isSunday,
  templateID,
  selectedRoleKey: roleKey,
  selectedRoleLabel: label,
  slotsCount: Math.max(1, counts[roleKey] || 1),
});

const AssignProgress = (() => {
  let el, nodes;
  let lastPaint = 0;

  const html = (monthText) => `
    <div id="assign-overlay" style="
      position:fixed; inset:0; z-index:99999;
      background: rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
      <div style="
        width:min(520px, 92vw); border-radius:10px; padding:18px 20px 22px;
        background:#fff; color:#222; box-shadow:0 10px 30px rgba(0,0,0,.25)">
        <div style="font-size:22px; font-weight:700; margin-bottom:8px">Auto-assigning schedules...</div>
        <div style="margin-bottom:10px"><strong>Month:</strong> ${monthText}</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px 16px; font-size:14px; line-height:1.35">
          <div><strong>Sundays:</strong> <span id="ap-sun">0</span>/<span id="ap-sunTotal">0</span></div>
          <div><strong>Masses:</strong> <span id="ap-mass">0</span>/<span id="ap-massTotal">0</span></div>
          <div><strong>Assignments:</strong> <span id="ap-assign">0</span></div>
          <div><strong>Errors:</strong> <span id="ap-err">0</span></div>
        </div>
        <div style="margin-top:10px;height:10px;background:#e9ecef;border-radius:6px;overflow:hidden;">
          <div id="ap-bar" style="height:100%;width:0%;background:#4e79ff;transition:width .15s ease"></div>
        </div>
        <div id="ap-pct" style="font-size:12px;margin-top:6px;opacity:.8">0% complete</div>
      </div>
    </div>
  `;

  const mount = (monthText) => {
    unmount();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html(monthText);
    el = wrapper.firstElementChild;
    document.body.appendChild(el);

    nodes = {
      sun: el.querySelector("#ap-sun"),
      sunTotal: el.querySelector("#ap-sunTotal"),
      mass: el.querySelector("#ap-mass"),
      massTotal: el.querySelector("#ap-massTotal"),
      assign: el.querySelector("#ap-assign"),
      err: el.querySelector("#ap-err"),
      bar: el.querySelector("#ap-bar"),
      pct: el.querySelector("#ap-pct"),
    };
  };

  const paint = (ui) => {
    nodes.sun.textContent = String(ui.sundaysProcessed);
    nodes.sunTotal.textContent = String(ui.totalSundays);
    nodes.mass.textContent = String(ui.massesProcessed);
    nodes.massTotal.textContent = String(ui.totalMasses);
    nodes.assign.textContent = String(ui.membersAssigned);
    nodes.err.textContent = String(ui.errors);
    const pct = ui.totalMasses
      ? Math.round((ui.massesProcessed / ui.totalMasses) * 100)
      : 0;
    nodes.bar.style.width = pct + "%";
    nodes.pct.textContent = `${pct}% complete`;
  };

  const maybePaint = (ui) => {
    const now = performance.now();
    if (now - lastPaint > 120) {
      paint(ui);
      lastPaint = now;
    }
  };

  const unmount = () => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = null;
    nodes = null;
  };

  return { mount, maybePaint, paint, unmount };
})();

export const autoAssignSundaySchedules = async (year, month) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthText = `${monthNames[month]} - ${year}`;

  const result = await Swal.fire({
    icon: "question",
    title: "Automate Scheduling?",
    text: `Do you want to automate the process of scheduling on all Sunday schedules for ${monthText}?`,
    showCancelButton: true,
    confirmButtonText: "Yes, automate",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  if (!result.isConfirmed) return;

  const ui = {
    sundaysProcessed: 0,
    totalSundays: 0,
    massesProcessed: 0,
    totalMasses: 0,
    membersAssigned: 0,
    errors: 0,
  };

  const counters = { totalAssignments: 0 };
  const handleAssign = () => {
    counters.totalAssignments += 1;
    ui.membersAssigned = counters.totalAssignments;
    AssignProgress.maybePaint(ui);
  };

  try {
    AssignProgress.mount(monthText);

    const sundays = getSundaysInMonth(year, month);
    ui.totalSundays = sundays.length;

    const sundayMasses = [
      "1st Mass - 6:00 AM",
      "2nd Mass - 8:00 AM",
      "3rd Mass - 5:00 PM",
    ];
    ui.totalMasses = sundays.length * sundayMasses.length;
    AssignProgress.paint(ui);

    if (sundays.length === 0) {
      AssignProgress.unmount();
      await Swal.fire(
        "No Sundays Found",
        "No Sundays found in the selected month.",
        "info"
      );
      return { success: false, message: "No Sundays", stats: {} };
    }

    // Prefetch eligibility map once for the whole run
    const { perRoleAllowed } = await buildEligibilityMaps();

    // Historical assignments (6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoISO = sixMonthsAgo.toISOString().split("T")[0];

    const { data: historicalAssignments, error: histError } = await supabase
      .from("altar-server-placeholder")
      .select("idNumber, role, date, mass")
      .gte("date", sixMonthsAgoISO)
      .order("date", { ascending: false });
    if (histError) {
      console.error("Error fetching historical assignments:", histError);
      ui.errors += 1;
      AssignProgress.maybePaint(ui);
    }

    const availableMembers = await fetchAltarServerMembersWithRole();
    const normalizedMembers = normalizeMembers(availableMembers);

    const stats = {
      sundaysProcessed: 0,
      massesProcessed: 0,
      membersAssigned: 0,
      errors: [],
    };

    for (const sunday of sundays) {
      const dateISO = ymdLocal(sunday);
      try {
        const sundayAssignments = new Set();

        for (const massLabel of sundayMasses) {
          try {
            await autoAssignSingleMass({
              dateISO,
              massLabel,
              availableMembers: normalizedMembers,
              historicalAssignments: historicalAssignments || [],
              sundayAssignments,
              templateID: null,
              perRoleAllowed,
              onAssign: handleAssign,
            });

            stats.massesProcessed += 1;
            ui.massesProcessed = stats.massesProcessed;

            const { data: newAssignments } = await supabase
              .from("altar-server-placeholder")
              .select("idNumber")
              .eq("date", dateISO)
              .eq("mass", massLabel);

            newAssignments?.forEach((a) =>
              sundayAssignments.add(String(a.idNumber))
            );

            AssignProgress.maybePaint(ui);
          } catch (massError) {
            console.error(
              `Error assigning ${massLabel} on ${dateISO}:`,
              massError
            );
            stats.errors.push(`${dateISO} ${massLabel}: ${massError.message}`);
            ui.errors = stats.errors.length;

            stats.massesProcessed += 1;
            ui.massesProcessed = stats.massesProcessed;
            AssignProgress.maybePaint(ui);
          }
        }

        stats.sundaysProcessed += 1;
        ui.sundaysProcessed = stats.sundaysProcessed;
        AssignProgress.maybePaint(ui);
      } catch (sundayError) {
        console.error(`Error processing Sunday ${dateISO}:`, sundayError);
        stats.errors.push(`${dateISO}: ${sundayError.message}`);
        ui.errors = stats.errors.length;
        AssignProgress.maybePaint(ui);
      }
    }

    stats.membersAssigned = counters.totalAssignments;
    AssignProgress.unmount();

    const successMessage =
      `Successfully auto-assigned schedules!\n\n` +
      `Sundays processed: ${stats.sundaysProcessed}\n` +
      `Masses processed: ${stats.massesProcessed}\n` +
      `Total assignments: ${stats.membersAssigned}\n` +
      (stats.errors.length ? `Errors: ${stats.errors.length}` : ``);

    if (stats.errors.length) {
      await Swal.fire({
        icon: "warning",
        title: "Partial Success",
        text: successMessage,
        footer: `Errors: ${stats.errors.length}`,
      });
    } else {
      await Swal.fire({
        icon: "success",
        title: "Auto-Assignment Complete!",
        text: successMessage,
      });
      window.location.reload();
    }

    return { success: true, message: successMessage, stats };
  } catch (error) {
    console.error("Auto-assignment failed:", error);
    AssignProgress.unmount();
    await Swal.fire({
      icon: "error",
      title: "Auto-Assignment Failed",
      text: `An error occurred: ${error.message}`,
    });
    return {
      success: false,
      message: `Auto-assignment failed: ${error.message}`,
      stats: {},
    };
  }
};

const autoAssignSingleMass = async ({
  dateISO,
  massLabel,
  availableMembers,
  historicalAssignments,
  sundayAssignments,
  templateID,
  perRoleAllowed, // eligibility map from altar-server-roles
  onAssign, // optional per-member callback
}) => {
  const { data: existingAssignments } = await supabase
    .from("altar-server-placeholder")
    .select("role, slot, idNumber")
    .eq("date", dateISO)
    .eq("mass", massLabel);

  const existingByRole = {};
  (existingAssignments || []).forEach((assignment) => {
    const k = assignment.role;
    if (!existingByRole[k]) existingByRole[k] = [];
    existingByRole[k].push({
      slot: assignment.slot,
      idNumber: assignment.idNumber,
    });
  });

  const roleRequirements = {
    thurifer: 1,
    beller: 2,
    mainServer: 2,
    candleBearer: 2,
    incenseBearer: 1,
    crossBearer: 1,
    plate: 10,
  };

  let totalNewAssignments = 0;

  for (const [roleKey, requiredCount] of Object.entries(roleRequirements)) {
    const existing = existingByRole[roleKey] || [];
    const needToAssign = requiredCount - existing.length;
    if (needToAssign <= 0) continue;

    try {
      const allowedSet = perRoleAllowed.get(roleKey) || new Set();

      const candidatesForRole = availableMembers
        .filter((member) => {
          const id = String(member.idNumber).trim();

          // eligibility from altar-server-roles
          if (!allowedSet.has(id)) return false;

          // not already assigned this Sunday
          if (sundayAssignments.has(id)) return false;

          // not already in this mass
          const inMass = (existingAssignments || []).some(
            (a) => String(a.idNumber).trim() === id
          );
          if (inMass) return false;

          return true;
        })
        .map((member) => ({
          ...member,
          rotationScore: calculateRotationScore(
            member.idNumber,
            roleKey,
            historicalAssignments || [],
            dateISO
          ),
        }))
        .sort((a, b) => a.rotationScore - b.rotationScore);

      let filteredCandidates = candidatesForRole;

      if (roleKey === "candleBearer" || roleKey === "beller") {
        if (existing.length > 0) {
          const existingMember = availableMembers.find(
            (m) =>
              String(m.idNumber).trim() === String(existing[0].idNumber).trim()
          );
          if (existingMember?.sex) {
            filteredCandidates = candidatesForRole.filter(
              (c) => c.sex === existingMember.sex
            );
          }
        }
      }

      const selectedMembers = filteredCandidates.slice(0, needToAssign);
      if (selectedMembers.length === 0) continue;

      const assignments = selectedMembers.map((member, index) => ({
        date: dateISO,
        mass: massLabel,
        templateID: templateID,
        role: roleKey,
        slot: existing.length + index + 1,
        idNumber: String(member.idNumber).trim(),
      }));

      const { data: inserted, error } = await supabase
        .from("altar-server-placeholder")
        .insert(assignments)
        .select("idNumber");

      if (error)
        throw new Error(`Failed to assign ${roleKey}: ${error.message}`);

      (inserted || []).forEach((row) => {
        const id = String(row.idNumber).trim();
        sundayAssignments.add(id);
        if (typeof onAssign === "function") onAssign(id);
      });

      totalNewAssignments += selectedMembers.length;
    } catch (roleError) {
      console.error(`Error assigning role ${roleKey}:`, roleError);
      throw roleError;
    }
  }

  return totalNewAssignments;
};

const getSundaysInMonth = (year, month) => {
  const sundays = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (date.getDay() === 0) {
      sundays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return sundays;
};

const ymdLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SUNDAY_MASSES = [
  "1st Mass - 6:00 AM",
  "2nd Mass - 8:00 AM",
  "3rd Mass - 5:00 PM",
];

const ROLE_REQUIREMENTS = {
  thurifer: 1,
  beller: 2,
  mainServer: 2,
  candleBearer: 2,
  incenseBearer: 1,
  crossBearer: 1,
  plate: 10,
};

export async function isMonthFullyScheduled(year, month) {
  const sundays = getSundaysInMonth(year, month);
  const totalMasses = sundays.length * SUNDAY_MASSES.length;
  if (totalMasses === 0)
    return { isComplete: false, totalMasses: 0, completeMasses: 0 };

  const startISO = ymdLocal(new Date(year, month, 1));
  const endISO = ymdLocal(new Date(year, month + 1, 0));

  const { data, error } = await supabase
    .from("altar-server-placeholder")
    .select("date,mass,role")
    .gte("date", startISO)
    .lte("date", endISO);

  if (error) {
    console.error("isMonthFullyScheduled error:", error);
    return { isComplete: false, totalMasses, completeMasses: 0 };
  }

  const sundaySet = new Set(sundays.map(ymdLocal));
  const perMassRoleCount = new Map(); // key: `${date}|${mass}` -> Map(role -> count)

  (data || []).forEach((row) => {
    const dateISO = String(row.date);
    const mass = String(row.mass);
    if (!sundaySet.has(dateISO)) return;
    if (!SUNDAY_MASSES.includes(mass)) return;

    const key = `${dateISO}|${mass}`;
    if (!perMassRoleCount.has(key)) perMassRoleCount.set(key, new Map());
    const roleMap = perMassRoleCount.get(key);
    roleMap.set(row.role, (roleMap.get(row.role) || 0) + 1);
  });

  let completeMasses = 0;

  sundays.forEach((s) => {
    const dateISO = ymdLocal(s);
    SUNDAY_MASSES.forEach((mass) => {
      const key = `${dateISO}|${mass}`;
      const roleMap = perMassRoleCount.get(key) || new Map();

      // A mass is complete if for every required role, count >= required
      const allRolesMet = Object.entries(ROLE_REQUIREMENTS).every(
        ([role, req]) => {
          const have = roleMap.get(role) || 0;
          return have >= req;
        }
      );

      if (allRolesMet) completeMasses += 1;
    });
  });

  return {
    isComplete: completeMasses === totalMasses,
    totalMasses,
    completeMasses,
  };
}

/*----------------------------------

LECTOR COMMENTATOR FUNCTIONS

------------------------------------*/
const ROLE_REQUIREMENTS_LectorCommentator = {
  reading: 2,
  preface: 1,
};

export const LECTOR_COMMENTATOR_ROLE_COLUMN_MAP = {
  reading: "reading",
  preface: "preface",
};

export async function fetchLectorCommentatorMembers({ dateISO, massLabel }) {
  const { data, error } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber, role, mass")
    .eq("date", dateISO)
    .eq("mass", massLabel);

  if (error) {
    console.error("Error fetching Lector/Commentator members:", error);
    return [];
  }

  return data || [];
}

export const replaceLectorCommentatorRoleAssignments = async ({
  dateISO,
  massLabel,
  roleKey,
  members, // [{ idNumber, fullName }]
}) => {
  // Using ROLE_COLUMN_MAP to reference the role
  const role = LECTOR_COMMENTATOR_ROLE_COLUMN_MAP[roleKey];

  // Delete existing assignments for the role
  const { error: delErr } = await supabase
    .from("lector-commentator-placeholder")
    .delete()
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .eq("role", role);
  if (delErr) throw delErr;

  // If no members are provided, return early
  if (!members || members.length === 0) return { inserted: 0 };

  // Insert new role assignments for the members
  const rows = members.map((m, i) => ({
    date: dateISO,
    mass: massLabel,
    role,
    slot: i + 1,
    idNumber: m.idNumber,
  }));

  const { data, error } = await supabase
    .from("lector-commentator-placeholder")
    .insert(rows)
    .select();
  if (error) throw error;
  return { inserted: data?.length ?? 0 };
};

export const getLectorCommentatorAssignments = async (dateISO, massLabel) => {
  const { data: rows, error } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber, role, slot")
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .order("role", { ascending: true })
    .order("slot", { ascending: true });

  if (error) throw error;

  if (!rows || rows.length === 0) return {};

  // Fetch member names based on the idNumbers
  const ids = Array.from(new Set(rows.map((r) => r.idNumber).filter(Boolean)));
  let nameMap = new Map();
  if (ids.length > 0) {
    const { data: members, error: memErr } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", ids);
    if (memErr) throw memErr;

    members?.forEach((m) =>
      nameMap.set(m.idNumber, `${m.firstName} ${m.lastName}`)
    );
  }

  const grouped = {};
  rows.forEach((r) => {
    if (!grouped[r.role]) grouped[r.role] = [];
    grouped[r.role].push({
      idNumber: r.idNumber,
      fullName: nameMap.get(r.idNumber) || String(r.idNumber),
      slot: r.slot,
    });
  });

  Object.keys(grouped).forEach((k) =>
    grouped[k].sort((a, b) => (a.slot || 0) - (b.slot || 0))
  );
  return grouped;
};

export const clearLectorCommentatorAssignments = async (dateISO, massLabel) => {
  try {
    const result = await Swal.fire({
      icon: "question",
      title: "Reset this schedule?",
      text: "All assigned members for this date & mass will be cleared.",
      showCancelButton: true,
      confirmButtonText: "Yes, reset",
      cancelButtonText: "No",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return false;

    const { error } = await supabase
      .from("lector-commentator-placeholder")
      .delete()
      .eq("date", dateISO)
      .eq("mass", massLabel);

    if (error) throw error;

    await Swal.fire({
      icon: "success",
      title: "Schedule reset",
      timer: 1100,
      showConfirmButton: false,
    });
    return true;
  } catch (e) {
    console.error("clearLectorCommentatorAssignments error:", e);
    await Swal.fire({
      icon: "error",
      title: "Couldn't reset",
      text: "Please try again.",
    });
    return false;
  }
};

export async function buildLectorCommentatorEligibilityMaps() {
  const selectCols = 'idNumber,"reading","preface"'; // Adjust column names to match your table

  const { data, error } = await supabase
    .from("lector-commentator-roles") // Adjust table name to match your database
    .select(selectCols);

  if (error) {
    console.error("buildLectorCommentatorEligibilityMaps error:", error);
    return { perRoleAllowed: new Map(), perMemberAllowed: new Map() };
  }

  const perRoleAllowed = new Map();
  const perMemberAllowed = new Map();

  Object.keys(LECTOR_COMMENTATOR_ROLE_COLUMN_MAP).forEach((k) =>
    perRoleAllowed.set(k, new Set())
  );

  for (const row of data || []) {
    const id = String(row.idNumber).trim();
    const allowedRoles = new Set();

    for (const [roleKey, col] of Object.entries(
      LECTOR_COMMENTATOR_ROLE_COLUMN_MAP
    )) {
      if (Number(row[col] || 0) === 1) {
        perRoleAllowed.get(roleKey).add(id);
        allowedRoles.add(roleKey);
      }
    }
    perMemberAllowed.set(id, allowedRoles);
  }

  return { perRoleAllowed, perMemberAllowed };
}

export const fetchLectorCommentatorMembersNormalized = async (
  dateISO,
  massLabel,
  role
) => {
  const { perRoleAllowed } = await buildLectorCommentatorEligibilityMaps();
  const allowedSet = perRoleAllowed.get(role) || new Set();

  // Fetch assigned members for the Lector/Commentator roles
  const { data: allAssignedMembers, error: allAssignedError } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber, role, mass")
    .eq("date", dateISO);

  if (allAssignedError) {
    console.error(
      "Error fetching assigned Lector/Commentator members:",
      allAssignedError
    );

    return [];
  }

  const allAssignedIds = new Set(
    (allAssignedMembers || []).map((m) => String(m.idNumber).trim())
  );

  const assignedByRole = new Map();
  (allAssignedMembers || []).forEach((m) => {
    const k = m.role;
    if (!assignedByRole.has(k)) assignedByRole.set(k, new Set());
    assignedByRole.get(k).add(String(m.idNumber).trim());
  });

  // Fetch historical assignments for Lector/Commentator roles in the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString().split("T")[0];

  const { data: historicalAssignments } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber, role, date, mass")
    .gte("date", sixMonthsAgoISO)
    .order("date", { ascending: false });

  console.log("Fetched Historical Assignments: ", historicalAssignments);

  const rows = await fetchLectorCommentatorMembersWithRole();

  const normalized = (rows || [])
    .map((m) => ({
      idNumber: String(m.idNumber ?? "").trim(),
      fullName: buildFullName(m),
      role: m.role || "Non-Flexible",
      sex: m.sex || "Unknown",
    }))
    .filter((m) => {
      console.log("Filtering member: ", m);
      if (!m.idNumber || !m.fullName) return false;

      // Eligibility check
      if (!allowedSet.has(m.idNumber)) {
        console.log("Not eligible: ", m.idNumber);
        return false;
      }

      // Already assigned to this role
      if (allAssignedIds.has(m.idNumber)) {
        console.log("Already assigned: ", m.idNumber);
        return false;
      }

      return true;
    })
    .map((m) => {
      const rotationScore = calculateRotationScore(
        m.idNumber,
        role,
        historicalAssignments || [],
        dateISO
      );

      // Compute roleCount and daysSinceLastRole
      const memberHistory = (historicalAssignments || []).filter(
        (a) => String(a.idNumber).trim() === m.idNumber
      );
      const roleCount = memberHistory.filter((a) => a.role === role).length;

      const lastRoleAssignment = memberHistory
        .filter((a) => a.role === role)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      const daysSinceLastRole = lastRoleAssignment
        ? Math.floor(
            (new Date(dateISO) - new Date(lastRoleAssignment.date)) /
              (1000 * 60 * 60 * 24)
          )
        : Infinity;

      const isPriority =
        roleCount === 0 ||
        (Number.isFinite(daysSinceLastRole) && daysSinceLastRole > 30);

      return {
        ...m,
        rotationScore,
        roleCount,
        daysSinceLastRole,
        isPriority,
      };
    })
    .sort((a, b) => {
      if (a.rotationScore !== b.rotationScore) {
        return a.rotationScore - b.rotationScore;
      }
      return a.fullName.localeCompare(b.fullName);
    });

  return normalized;
};

export const preloadAssignedForLectorCommentatorRole = async ({
  dateISO,
  massLabel,
  roleKey,
  slotsCount,
}) => {
  // Get assignments for this specific role
  const { data: assignments, error } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber, slot")
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .eq("role", roleKey)
    .order("slot", { ascending: true });

  if (error) {
    console.error("Error fetching assignments:", error);
    return ensureArraySize([], slotsCount);
  }

  if (!assignments || assignments.length === 0) {
    return ensureArraySize([], slotsCount);
  }

  // Get the member details for all assigned IDs
  const assignedIds = assignments.map((a) => a.idNumber).filter(Boolean);

  if (assignedIds.length === 0) {
    return ensureArraySize([], slotsCount);
  }

  const { data: members, error: memberError } = await supabase
    .from("members-information")
    .select("*")
    .in("idNumber", assignedIds);

  if (memberError) {
    console.error("Error fetching member details:", memberError);
    return ensureArraySize([], slotsCount);
  }

  // Create a map of ID to full name
  const memberMap = new Map();
  members?.forEach((m) => {
    memberMap.set(String(m.idNumber), buildFullName(m));
  });

  // Build the result array with proper full names
  const result = assignments.map((assignment) => ({
    idNumber: String(assignment.idNumber),
    fullName:
      memberMap.get(String(assignment.idNumber)) ||
      `Member ${assignment.idNumber}`,
    slot: assignment.slot,
  }));

  return ensureArraySize(result, slotsCount);
};

export const deepResetLectorCommentatorRoleAssignments = async ({
  dateISO,
  massLabel,
  templateID,
  roleKey,
  slotsCount,
}) => {
  await replaceLectorCommentatorRoleAssignments({
    dateISO,
    massLabel,
    templateID,
    roleKey,
    members: [],
  });
  return ensureArraySize([], slotsCount);
};

export const saveLectorCommentatorRoleAssignments = async ({
  dateISO,
  massLabel,
  templateID,
  roleKey,
  assigned,
}) => {
  const chosen = (assigned || []).filter(Boolean);

  return replaceLectorCommentatorRoleAssignments({
    dateISO,
    massLabel,
    templateID,
    roleKey,
    members: chosen,
  });
};

export const getTemplateFlagsLectorCommentator = async (selectedISO) =>
  getTemplateFlagsForLectorCommentator(selectedISO);

export const roleCountsForLectorCommentator = ({ flags, isSunday }) => {
  const showAll = isSunday === true;
  return {
    reading: showAll ? 2 : Number(flags?.roles?.reading || 0),
    preface: showAll ? 1 : Number(flags?.roles?.preface || 0),
  };
};

export const roleVisibilityForLectorCommentator = ({ flags, isSunday }) => {
  const showAll = isSunday === true;
  const roleOn = (count) => Number(count || 0) > 0;
  return {
    reading: showAll || roleOn(flags?.roles?.reading),
    preface: showAll || roleOn(flags?.roles?.preface),
  };
};

export const getAssignmentsForCardsLectorCommentator = async (
  dateISO,
  massLabel
) => {
  const { data: rows, error } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber, role, slot")
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .order("role", { ascending: true })
    .order("slot", { ascending: true });
  if (error) throw error;
  if (!rows || rows.length === 0) return {};

  const ids = Array.from(new Set(rows.map((r) => r.idNumber).filter(Boolean)));
  let nameMap = new Map();

  if (ids.length > 0) {
    const { data: members, error: memErr } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", ids);
    if (memErr) throw memErr;
    members?.forEach((m) => nameMap.set(m.idNumber, buildFullName(m)));
  }

  const grouped = {};
  rows.forEach((r) => {
    if (!grouped[r.role]) grouped[r.role] = [];
    grouped[r.role].push({
      idNumber: r.idNumber,
      fullName: nameMap.get(r.idNumber) || String(r.idNumber),
      slot: r.slot,
    });
  });

  Object.keys(grouped).forEach((k) =>
    grouped[k].sort((a, b) => (a.slot || 0) - (b.slot || 0))
  );
  return grouped;
};

export const clearAssignmentsForLectorCommentator = async (
  dateISO,
  massLabel
) => {
  try {
    const result = await Swal.fire({
      icon: "question",
      title: "Reset this schedule?",
      text: "All assigned members for this date & mass will be cleared.",
      showCancelButton: true,
      confirmButtonText: "Yes, reset",
      cancelButtonText: "No",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return false;

    const { error } = await supabase
      .from("lector-commentator-placeholder")
      .delete()
      .eq("date", dateISO)
      .eq("mass", massLabel);
    if (error) throw error;

    await Swal.fire({
      icon: "success",
      title: "Schedule reset",
      timer: 1100,
      showConfirmButton: false,
    });
    return true;
  } catch (e) {
    console.error("clearAssignmentsFor error:", e);
    await Swal.fire({
      icon: "error",
      title: "Couldn't reset",
      text: "Please try again.",
    });
    return false;
  }
};

export const fetchAssignmentsGroupedLectorCommentator = async ({
  dateISO,
  massLabel,
}) => getAssignmentsForCardsLectorCommentator(dateISO, massLabel);

export const resetAllAssignmentsLectorCommentator = async ({
  dateISO,
  massLabel,
}) => clearAssignmentsForLectorCommentator(dateISO, massLabel);

export async function isMonthFullyScheduledLectorCommentator(year, month) {
  const sundays = getSundaysInMonth(year, month);
  const totalMasses = sundays.length * SUNDAY_MASSES.length;
  if (totalMasses === 0)
    return { isComplete: false, totalMasses: 0, completeMasses: 0 };

  const startISO = ymdLocal(new Date(year, month, 1));
  const endISO = ymdLocal(new Date(year, month + 1, 0));

  const { data, error } = await supabase
    .from("lector-commentator-placeholder")
    .select("date,mass,role")
    .gte("date", startISO)
    .lte("date", endISO);

  if (error) {
    console.error("isMonthFullyScheduled error:", error);
    return { isComplete: false, totalMasses, completeMasses: 0 };
  }

  const sundaySet = new Set(sundays.map(ymdLocal));
  const perMassRoleCount = new Map(); // key: `${date}|${mass}` -> Map(role -> count)

  (data || []).forEach((row) => {
    const dateISO = String(row.date);
    const mass = String(row.mass);
    if (!sundaySet.has(dateISO)) return;
    if (!SUNDAY_MASSES.includes(mass)) return;

    const key = `${dateISO}|${mass}`;
    if (!perMassRoleCount.has(key)) perMassRoleCount.set(key, new Map());
    const roleMap = perMassRoleCount.get(key);
    roleMap.set(row.role, (roleMap.get(row.role) || 0) + 1);
  });

  let completeMasses = 0;

  sundays.forEach((s) => {
    const dateISO = ymdLocal(s);
    SUNDAY_MASSES.forEach((mass) => {
      const key = `${dateISO}|${mass}`;
      const roleMap = perMassRoleCount.get(key) || new Map();

      // A mass is complete if for every required role, count >= required
      const allRolesMet = Object.entries(
        ROLE_REQUIREMENTS_LectorCommentator
      ).every(([role, req]) => {
        const have = roleMap.get(role) || 0;
        return have >= req;
      });

      if (allRolesMet) completeMasses += 1;
    });
  });

  return {
    isComplete: completeMasses === totalMasses,
    totalMasses,
    completeMasses,
  };
}

/*export const autoAssignLectorCommentatorSchedules = async (year, month) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthText = `${monthNames[month]} - ${year}`;

  const result = await Swal.fire({
    icon: "question",
    title: "Automate Scheduling?",
    text: `Do you want to automate the process of scheduling for Lector Commentator roles in ${monthText}?`,
    showCancelButton: true,
    confirmButtonText: "Yes, automate",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  if (!result.isConfirmed) return;

  const ui = {
    sundaysProcessed: 0,
    totalSundays: 0,
    massesProcessed: 0,
    totalMasses: 0,
    membersAssigned: 0,
    errors: 0,
  };

  const counters = { totalAssignments: 0 };
  const handleAssign = () => {
    counters.totalAssignments += 1;
    ui.membersAssigned = counters.totalAssignments;
    AssignProgress.maybePaint(ui);
  };

  try {
    AssignProgress.mount(monthText);

    const sundays = getSundaysInMonth(year, month);
    ui.totalSundays = sundays.length;

    const sundayMasses = [
      "1st Mass - 6:00 AM",
      "2nd Mass - 8:00 AM",
      "3rd Mass - 5:00 PM",
    ];
    ui.totalMasses = sundays.length * sundayMasses.length;
    AssignProgress.paint(ui);

    if (sundays.length === 0) {
      AssignProgress.unmount();
      await Swal.fire(
        "No Sundays Found",
        "No Sundays found in the selected month.",
        "info"
      );
      return { success: false, message: "No Sundays", stats: {} };
    }

    // Prefetch eligibility map for lector-commentators
    const { perRoleAllowed } = await buildLectorCommentatorEligibilityMaps();

    // Historical assignments
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoISO = sixMonthsAgo.toISOString().split("T")[0];

    const { data: historicalAssignments, error: histError } = await supabase
      .from("lector-commentator-placeholder")
      .select("idNumber, role, date, mass")
      .gte("date", sixMonthsAgoISO)
      .order("date", { ascending: false });
    if (histError) {
      console.error("Error fetching historical assignments:", histError);
      ui.errors += 1;
      AssignProgress.maybePaint(ui);
    }

    const availableMembers = await fetchLectorCommentatorMembersWithRole();
    const normalizedMembers = normalizeMembers(availableMembers);

    const stats = {
      sundaysProcessed: 0,
      massesProcessed: 0,
      membersAssigned: 0,
      errors: [],
    };

    for (const sunday of sundays) {
      const dateISO = ymdLocal(sunday);
      try {
        const sundayAssignments = new Set();

        for (const massLabel of sundayMasses) {
          try {
            await autoAssignLectorCommentatorSingleMass({
              dateISO,
              massLabel,
              availableMembers: normalizedMembers,
              historicalAssignments: historicalAssignments || [],
              sundayAssignments,
              perRoleAllowed,
              onAssign: handleAssign,
            });

            stats.massesProcessed += 1;
            ui.massesProcessed = stats.massesProcessed;

            const { data: newAssignments } = await supabase
              .from("lector-commentator-placeholder")
              .select("idNumber")
              .eq("date", dateISO)
              .eq("mass", massLabel);

            newAssignments?.forEach((a) =>
              sundayAssignments.add(String(a.idNumber))
            );

            AssignProgress.maybePaint(ui);
          } catch (massError) {
            console.error(
              `Error assigning ${massLabel} on ${dateISO}:`,
              massError
            );
            stats.errors.push(`${dateISO} ${massLabel}: ${massError.message}`);
            ui.errors = stats.errors.length;

            stats.massesProcessed += 1;
            ui.massesProcessed = stats.massesProcessed;
            AssignProgress.maybePaint(ui);
          }
        }

        stats.sundaysProcessed += 1;
        ui.sundaysProcessed = stats.sundaysProcessed;
        AssignProgress.maybePaint(ui);
      } catch (sundayError) {
        console.error(`Error processing Sunday ${dateISO}:`, sundayError);
        stats.errors.push(`${dateISO}: ${sundayError.message}`);
        ui.errors = stats.errors.length;
        AssignProgress.maybePaint(ui);
      }
    }

    stats.membersAssigned = counters.totalAssignments;
    AssignProgress.unmount();

    const successMessage =
      `Successfully auto-assigned schedules!\n\n` +
      `Sundays processed: ${stats.sundaysProcessed}\n` +
      `Masses processed: ${stats.massesProcessed}\n` +
      `Total assignments: ${stats.membersAssigned}\n` +
      (stats.errors.length ? `Errors: ${stats.errors.length}` : ``);

    if (stats.errors.length) {
      await Swal.fire({
        icon: "warning",
        title: "Partial Success",
        text: successMessage,
        footer: `Errors: ${stats.errors.length}`,
      });
    } else {
      await Swal.fire({
        icon: "success",
        title: "Auto-Assignment Complete!",
        text: successMessage,
      });
      window.location.reload();
    }

    return { success: true, message: successMessage, stats };
  } catch (error) {
    console.error("Auto-assignment failed:", error);
    AssignProgress.unmount();
    await Swal.fire({
      icon: "error",
      title: "Auto-Assignment Failed",
      text: `An error occurred: ${error.message}`,
    });
    return {
      success: false,
      message: `Auto-assignment failed: ${error.message}`,
      stats: {},
    };
  }
};

const autoAssignLectorCommentatorSingleMass = async ({
  dateISO,
  massLabel,
  availableMembers,
  historicalAssignments,
  sundayAssignments,
  perRoleAllowed,
  onAssign,
}) => {
  const roleRequirements = {
    reading: 2, // Two members for Readings
    preface: 1, // One member for Preface
  };

  let totalNewAssignments = 0;

  // Fetch existing assignments for this mass
  const { data: existingAssignments, error: existingError } = await supabase
    .from("lector-commentator-placeholder")
    .select("role, slot, idNumber")
    .eq("date", dateISO)
    .eq("mass", massLabel);

  if (existingError) {
    console.error("Error fetching existing assignments:", existingError);
    throw existingError;
  }

  // Convert existing assignments into a role-based structure
  const existingByRole = {};
  (existingAssignments || []).forEach((assignment) => {
    const k = assignment.role;
    if (!existingByRole[k]) existingByRole[k] = [];
    existingByRole[k].push({
      slot: assignment.slot,
      idNumber: assignment.idNumber,
    });
  });

  // Create a set of all members already assigned to this specific mass
  const membersInThisMass = new Set();
  (existingAssignments || []).forEach((assignment) => {
    membersInThisMass.add(String(assignment.idNumber).trim());
  });

  // Process each role and try to assign members
  for (const [roleKey, requiredCount] of Object.entries(roleRequirements)) {
    // Calculate how many are already assigned to this role
    const alreadyAssigned = existingByRole[roleKey]?.length || 0;
    const needToAssign = requiredCount - alreadyAssigned;

    if (needToAssign <= 0) continue;

    try {
      const allowedSet = perRoleAllowed.get(roleKey) || new Set();

      const candidatesForRole = availableMembers
        .filter((member) => {
          const id = String(member.idNumber).trim();

          // Eligibility from lector-commentator-roles
          if (!allowedSet.has(id)) return false;

          // Not already assigned this Sunday
          if (sundayAssignments.has(id)) return false;

          // FIXED: Not already assigned to ANY role in this mass (not just the same role)
          if (membersInThisMass.has(id)) return false;

          return true;
        })
        .map((member) => ({
          ...member,
          rotationScore: calculateRotationScore(
            member.idNumber,
            roleKey,
            historicalAssignments || [],
            dateISO
          ),
        }))
        .sort((a, b) => a.rotationScore - b.rotationScore);

      const selectedMembers = candidatesForRole.slice(0, needToAssign);
      if (selectedMembers.length === 0) continue;

      // Calculate the starting slot number based on existing assignments
      const startingSlot = alreadyAssigned + 1;

      const assignments = selectedMembers.map((member, index) => ({
        date: dateISO,
        mass: massLabel,
        role: roleKey,
        slot: startingSlot + index,
        idNumber: String(member.idNumber).trim(),
      }));

      const { data: inserted, error } = await supabase
        .from("lector-commentator-placeholder")
        .insert(assignments)
        .select("idNumber");

      if (error)
        throw new Error(`Failed to assign ${roleKey}: ${error.message}`);

      (inserted || []).forEach((row) => {
        const id = String(row.idNumber).trim();
        sundayAssignments.add(id);
        membersInThisMass.add(id); // Add to the mass-specific set isMonthFullyScheduled
        if (typeof onAssign === "function") onAssign(id);
      });

      totalNewAssignments += selectedMembers.length;
    } catch (roleError) {
      console.error(`Error assigning role ${roleKey}:`, roleError);
      throw roleError;
    }
  }

  return totalNewAssignments;
};*/

// =================== LECTOR–COMMENTATOR: AUTO-ASSIGN with HARD ROTATION + ANTI-TRIO ===================

const LC_SUNDAY_MASSES = [
  "1st Mass - 6:00 AM",
  "2nd Mass - 8:00 AM",
  "3rd Mass - 5:00 PM",
];
const MASS_INDEX2 = (label) => LC_SUNDAY_MASSES.findIndex((s) => s === label);
const nextMassIdx2 = (idx) => ((idx ?? 0) + 1) % 3;

const ymdLocal2 = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const getSundaysInMonth2 = (year, month) => {
  const out = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === 0) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
};
const getPrevSunday2 = (iso) => {
  const d = new Date(iso);
  for (let i = 1; i <= 7; i++) {
    const back = new Date(d);
    back.setDate(d.getDate() - i);
    if (back.getDay() === 0) return ymdLocal2(back);
  }
  return null;
};
// exactly 3 Sundays back (≈21 days) – used to prevent week-4 == week-1 groups
const getPrevSameMassSunday3w2 = (iso) => {
  const d = new Date(iso);
  d.setDate(d.getDate() - 21);
  // ensure it's a Sunday; if not, walk back until Sunday
  for (let i = 0; i < 7; i++) {
    if (d.getDay() === 0) return ymdLocal2(d);
    d.setDate(d.getDate() - 1);
  }
  return null;
};

// tiny painter that reuses your existing overlay if present
const LCPaint = (() => {
  let ui = {
    sundaysProcessed: 0,
    totalSundays: 0,
    massesProcessed: 0,
    totalMasses: 0,
    membersAssigned: 0,
    errors: 0,
  };
  const paint = () => AssignProgress?.maybePaint?.(ui);
  return {
    mount: (m) => AssignProgress?.mount?.(m),
    totals: (s, m) => {
      ui.totalSundays = s;
      ui.totalMasses = m;
      paint();
    },
    mTick: () => {
      ui.massesProcessed++;
      paint();
    },
    sTick: () => {
      ui.sundaysProcessed++;
      paint();
    },
    add: (n = 1) => {
      ui.membersAssigned += n;
      paint();
    },
    err: () => {
      ui.errors++;
      paint();
    },
    done: () => AssignProgress?.unmount?.(),
  };
})();

const lcCountsForSunday2 = () =>
  roleCountsForLectorCommentator({ flags: null, isSunday: true });
const lcVisibleForSunday2 = () =>
  roleVisibilityForLectorCommentator({ flags: null, isSunday: true });

async function lcEligibilitySets2() {
  const { data } = await supabase
    .from("lector-commentator-roles")
    .select("idNumber, reading, preface");
  const out = { reading: new Set(), preface: new Set() };
  (data || []).forEach((r) => {
    const id = String(r.idNumber).trim();
    if (Number(r.reading) === 1) out.reading.add(id);
    if (Number(r.preface) === 1) out.preface.add(id);
  });
  return out;
}
async function lcNameMap2() {
  const { data } = await supabase
    .from("members-information")
    .select("idNumber, firstName, middleName, lastName");
  const map = new Map();
  (data || []).forEach((m) => {
    const name = [
      m.firstName,
      m.middleName ? `${m.middleName[0]}.` : "",
      m.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    map.set(String(m.idNumber).trim(), name || String(m.idNumber));
  });
  return map;
}

async function lcSundayAssignments2(dateISO) {
  const { data } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber, role, mass")
    .eq("date", dateISO);

  const byMember = new Map();
  const byRoleMass = {
    reading: { 0: [], 1: [], 2: [] },
    preface: { 0: [], 1: [], 2: [] },
  };

  (data || []).forEach((r) => {
    const id = String(r.idNumber).trim();
    const idx = MASS_INDEX2(r.mass || "");
    if (idx < 0) return;
    if (!byMember.has(id)) byMember.set(id, { roles: [], masses: new Set() });
    byMember.get(id).roles.push({ role: r.role, massIdx: idx });
    byMember.get(id).masses.add(idx);
    if (byRoleMass[r.role]) byRoleMass[r.role][idx].push(id);
  });

  return { byMember, byRoleMass };
}

// set of members who served on the same mass *three weeks ago*
async function lcPrevSameMassCohort2(prev3wISO, massIdx) {
  if (!prev3wISO) return new Set();
  const massLabel = LC_SUNDAY_MASSES[massIdx];
  const { data } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber")
    .eq("date", prev3wISO)
    .eq("mass", massLabel);
  return new Set((data || []).map((r) => String(r.idNumber).trim()));
}

/** priority pass: move last-Sunday people to next mass (hard rotation),
 *  but avoid re-forming the *same trio* from 3 weeks ago:
 *    - allow at most ONE member from that 3w-ago cohort per mass this week (when possible)
 */
async function lcPriorityRotationPass2({
  dateISO,
  prevSundayISO,
  eligible,
  counts,
  visible,
  alreadyToday,
  existingByRoleMass,
  prev3wCohortPerMass, // [Set, Set, Set]
}) {
  const insertRows = [];
  const assigned = new Set();
  if (!prevSundayISO) return { assigned, insertRows };

  const { byMember: prevByMember } = await lcSundayAssignments2(prevSundayISO);

  // remaining capacity per role/mass
  const caps = { reading: { 0: 0, 1: 0, 2: 0 }, preface: { 0: 0, 1: 0, 2: 0 } };
  for (const roleKey of Object.keys(caps)) {
    if (!visible[roleKey]) continue;
    const req = Number(counts[roleKey] || 0);
    for (let idx = 0; idx < 3; idx++) {
      const have = (existingByRoleMass[roleKey]?.[idx] || []).length;
      caps[roleKey][idx] = Math.max(0, req - have);
    }
  }

  // track how many from the 3w-ago cohort we already picked per mass
  const pickedFromCohort = [0, 0, 0];

  for (const [id, info] of prevByMember.entries()) {
    if (alreadyToday.has(id)) continue;
    const last = info.roles[0];
    if (!last) continue;

    const targetIdx = nextMassIdx2(last.massIdx);
    const cohort = prev3wCohortPerMass[targetIdx];
    const cohortLimitHit = cohort.has(id) && pickedFromCohort[targetIdx] >= 1;

    // same-role first, then the other if needed
    const tryRoles = [
      last.role,
      ...(last.role === "reading" ? ["preface"] : ["reading"]),
    ].filter(
      (r) => visible[r] && eligible[r].has(id) && caps[r][targetIdx] > 0
    );

    if (!tryRoles.length) continue;
    if (cohortLimitHit && tryRoles.length === 0) continue; // (defensive)

    // if cohort limit would be exceeded AND we still have other people to place,
    // skip this person for this mass; they can be used elsewhere by fair pass
    if (cohortLimitHit) continue;

    const rolePick = tryRoles[0];
    const massLabel = LC_SUNDAY_MASSES[targetIdx];

    insertRows.push({
      date: dateISO,
      mass: massLabel,
      role: rolePick,
      slot: (existingByRoleMass[rolePick][targetIdx]?.length || 0) + 1,
      idNumber: id,
    });

    caps[rolePick][targetIdx] -= 1;
    existingByRoleMass[rolePick][targetIdx] = (
      existingByRoleMass[rolePick][targetIdx] || []
    ).concat(id);
    alreadyToday.add(id);
    assigned.add(id);

    if (cohort.has(id)) pickedFromCohort[targetIdx] += 1;
  }

  return { assigned, insertRows };
}

async function lcFairFillPass2({
  dateISO,
  eligible,
  counts,
  visible,
  alreadyToday,
  existingByRoleMass,
  nameMap,
  monthAssignCount,
  prev3wCohortPerMass, // [Set,Set,Set]
}) {
  const inserts = [];
  const selectedFromCohort = [0, 0, 0];

  for (const roleKey of ["reading", "preface"]) {
    if (!visible[roleKey]) continue;
    const req = Number(counts[roleKey] || 0);
    for (let idx = 0; idx < 3; idx++) {
      const massLabel = LC_SUNDAY_MASSES[idx];
      const already = existingByRoleMass[roleKey][idx] || [];
      const need = Math.max(0, req - already.length);
      if (need <= 0) continue;

      const pool = Array.from(eligible[roleKey] || []).filter(
        (id) => !alreadyToday.has(id) && !already.includes(id)
      );

      const cohort = prev3wCohortPerMass[idx];

      const ranked = pool
        .map((id) => {
          const monthCnt = monthAssignCount.get(id) || 0;
          // big penalty if we’d exceed 1 person from the 3w-ago cohort for this mass
          const cohortPenalty =
            cohort.has(id) && selectedFromCohort[idx] >= 1
              ? 10000
              : cohort.has(id)
              ? 2000
              : 0; // mild penalty for first one, allowed
          return {
            id,
            score: monthCnt * 100 + cohortPenalty,
            nameTie: (nameMap.get(id) || "").toUpperCase(),
          };
        })
        .sort((a, b) => a.score - b.score || a.nameTie.localeCompare(b.nameTie))
        .slice(0, need);

      if (!ranked.length) continue;

      const rows = ranked.map((r, i) => ({
        date: dateISO,
        mass: massLabel,
        role: roleKey,
        slot: already.length + i + 1,
        idNumber: r.id,
      }));
      inserts.push(...rows);

      ranked.forEach((r) => {
        alreadyToday.add(r.id);
        existingByRoleMass[roleKey][idx] = (
          existingByRoleMass[roleKey][idx] || []
        ).concat(r.id);
        monthAssignCount.set(r.id, (monthAssignCount.get(r.id) || 0) + 1);
        if (cohort.has(r.id)) selectedFromCohort[idx] += 1;
      });
    }
  }

  return inserts;
}

async function lcAssignOneSunday2({
  dateISO,
  monthAssignCount,
  nameMap,
  eligible,
}) {
  const counts = lcCountsForSunday2();
  const visible = lcVisibleForSunday2();

  const existing = await lcSundayAssignments2(dateISO);
  const existingByRoleMass = existing.byRoleMass;

  const { data: todayRows } = await supabase
    .from("lector-commentator-placeholder")
    .select("idNumber")
    .eq("date", dateISO);
  const alreadyToday = new Set(
    (todayRows || []).map((r) => String(r.idNumber).trim())
  );

  // get cohorts from exactly 3 Sundays earlier (same mass index)
  const prev3wISO = getPrevSameMassSunday3w2(dateISO);
  const prev3wCohortPerMass = [
    await lcPrevSameMassCohort2(prev3wISO, 0),
    await lcPrevSameMassCohort2(prev3wISO, 1),
    await lcPrevSameMassCohort2(prev3wISO, 2),
  ];

  // hard rotation (from last Sunday) but cohort-aware
  const prev = getPrevSunday2(dateISO);
  const { insertRows } = await lcPriorityRotationPass2({
    dateISO,
    prevSundayISO: prev,
    eligible,
    counts,
    visible,
    alreadyToday,
    existingByRoleMass,
    prev3wCohortPerMass,
  });
  if (insertRows.length)
    await supabase.from("lector-commentator-placeholder").insert(insertRows);

  // fair fill with cohort diversity
  const fillRows = await lcFairFillPass2({
    dateISO,
    eligible,
    counts,
    visible,
    alreadyToday,
    existingByRoleMass,
    nameMap,
    monthAssignCount,
    prev3wCohortPerMass,
  });
  if (fillRows.length)
    await supabase.from("lector-commentator-placeholder").insert(fillRows);

  return insertRows.length + fillRows.length;
}

/** PUBLIC: month auto-assign (rotation + anti-trio).  */
export async function autoAssignLectorCommentatorSchedules(year, month) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthText = `${monthNames[month]} - ${year}`;

  // 🔒 Keep your exact confirmation copy
  const ok = await Swal.fire({
    icon: "question",
    title: "Automate Scheduling?",
    text: `Do you want to automate the process of scheduling on all Sunday schedules for ${monthText}?`,
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
    reverseButtons: true,
  });
  if (!ok.isConfirmed) return { success: false };

  LCPaint.mount(monthText);

  try {
    const sundays = getSundaysInMonth2(year, month);
    const totalMasses = sundays.length * LC_SUNDAY_MASSES.length;
    if (!sundays.length) {
      LCPaint.done();
      await Swal.fire("No Sundays", "No Sundays in this month.", "info");
      return { success: true };
    }
    LCPaint.totals(sundays.length, totalMasses);

    // month counters for fairness (pre-existing rows included)
    const monthAssignCount = new Map();
    const startISO = ymdLocal2(new Date(year, month, 1));
    const endISO = ymdLocal2(new Date(year, month + 1, 0));
    const { data: monthRows } = await supabase
      .from("lector-commentator-placeholder")
      .select("idNumber, date")
      .gte("date", startISO)
      .lte("date", endISO);
    (monthRows || []).forEach((r) => {
      const id = String(r.idNumber).trim();
      monthAssignCount.set(id, (monthAssignCount.get(id) || 0) + 1);
    });

    const eligible = await lcEligibilitySets2();
    const nameMap = await lcNameMap2();

    let assignedTotal = 0;
    for (const s of sundays) {
      const dateISO = ymdLocal2(s);
      const n = await lcAssignOneSunday2({
        dateISO,
        monthAssignCount,
        nameMap,
        eligible,
      });
      assignedTotal += n;
      // 3 masses → 3 ticks
      LCPaint.mTick();
      LCPaint.mTick();
      LCPaint.mTick();
      LCPaint.sTick();
      LCPaint.add(n);
    }

    LCPaint.done();

    await Swal.fire({
      icon: "success",
      title: "Auto-Assignment Complete",
      text: `Masses processed: ${totalMasses}\nAssignments inserted: ${assignedTotal}`,
    });

    // 🔁 Reload the SelectSchedule view after success (your request)
    try {
      window.location.reload();
    } catch {}

    return { success: true, stats: { assignedTotal, totalMasses } };
  } catch (e) {
    console.error("LC auto-assign fatal:", e);
    LCPaint.err();
    LCPaint.done();
    await Swal.fire("Error", e?.message || "Auto-assignment failed.", "error");
    return { success: false, error: e?.message || "Unknown error" };
  }
}

/*----------------------------------

CHOIR FUNCTIONS

------------------------------------*/

export const getTemplateFlagsChoir = async (selectedISO) =>
  getTemplateFlagsForChoir(selectedISO);

export const fetchAssignmentsGroupedChoir = async ({ dateISO, massLabel }) =>
  getAssignmentsForCardsLectorCommentator(dateISO, massLabel);

export const replaceChoirGroupAssignments = async ({
  dateISO,
  massLabel,
  groupKey, // e.g., Sopranos, Altos, etc.
  groups, // [{ groupId, groupName }]
}) => {
  // Delete existing group assignments for the mass
  const { error: delErr } = await supabase
    .from("choir-placeholder")
    .delete()
    .eq("date", dateISO)
    .eq("mass", massLabel)
    .eq("group", groupKey);

  if (delErr) throw delErr;

  // If no groups are provided, return early
  if (!groups || groups.length === 0) return { inserted: 0 };

  // Insert new group assignments
  const rows = groups.map((g) => ({
    date: dateISO,
    mass: massLabel,
    group: groupKey, // Only one group per mass, no need for slots
    groupId: g.groupId, // Store the groupId if needed for referencing
  }));

  const { data, error } = await supabase
    .from("choir-placeholder")
    .insert(rows)
    .select();
  if (error) throw error;
  return { inserted: data?.length ?? 0 };
};

export const getChoirGroupAssignments = async (dateISO, massLabel) => {
  try {
    const { data, error } = await supabase
      .from("choir-placeholder")
      .select("group") // Remove groupId reference
      .eq("date", dateISO)
      .eq("mass", massLabel);

    if (error) {
      console.error("Error fetching choir group assignments:", error);
      return {};
    }

    if (!data || data.length === 0) return {};

    // Group assignments by the group name
    const grouped = {};
    data.forEach((row) => {
      if (row.group && row.group.trim()) {
        const groupName = row.group.trim();
        if (!grouped[groupName]) grouped[groupName] = [];
        grouped[groupName].push({ groupName }); // Keep consistent with expected structure
      }
    });

    return grouped;
  } catch (err) {
    console.error("Error fetching Choir group assignments:", err);
    return {};
  }
};

export const saveChoirGroupAssignments = async ({
  dateISO,
  massLabel,
  templateID,
  assignedGroups,
}) => {
  try {
    // Delete existing assignments first
    const { error: delErr } = await supabase
      .from("choir-placeholder")
      .delete()
      .eq("date", dateISO)
      .eq("mass", massLabel);

    if (delErr) throw delErr;

    // If no groups are provided, return early (after deletion)
    const chosenGroups = (assignedGroups || []).filter(Boolean);
    if (chosenGroups.length === 0) return { inserted: 0 };

    // Insert new group assignments - matching your actual table schema
    const rows = chosenGroups.map((group) => ({
      date: dateISO,
      mass: massLabel,
      templateID: templateID || null,
      group: group.name || group, // Handle both object and string formats
    }));

    const { data, error } = await supabase
      .from("choir-placeholder")
      .insert(rows)
      .select();

    if (error) throw error;
    return { inserted: data?.length ?? 0 };
  } catch (error) {
    console.error("Error saving choir group assignments:", error);
    throw error;
  }
};

export const preloadAssignedForChoirGroup = async ({
  dateISO,
  massLabel,
  groupsCount = 1,
}) => {
  try {
    // Get assignments for this specific mass
    const { data: assignments, error } = await supabase
      .from("choir-placeholder")
      .select("group") // Remove groupId reference
      .eq("date", dateISO)
      .eq("mass", massLabel);

    if (error) {
      console.error("Error fetching choir group assignments:", error);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    // Return the group names
    const groups = assignments
      .map((assignment) => assignment.group)
      .filter(Boolean)
      .filter((group) => group.trim());

    return groups;
  } catch (error) {
    console.error("Error in preloadAssignedForChoirGroup:", error);
    return [];
  }
};

export const clearChoirGroupAssignments = async (dateISO, massLabel) => {
  try {
    const { error } = await supabase
      .from("choir-placeholder")
      .delete()
      .eq("date", dateISO)
      .eq("mass", massLabel);

    if (error) throw error;

    return true;
  } catch (e) {
    console.error("clearChoirGroupAssignments error:", e);
    await Swal.fire({
      icon: "error",
      title: "Couldn't reset",
      text: "Please try again.",
    });
    return false;
  }
};

const SUNDAY_MASSES_CHOIR = [
  "1st Mass - 6:00 AM",
  "2nd Mass - 8:00 AM",
  "3rd Mass - 5:00 PM",
];

export async function isMonthFullyScheduledChoir(year, month) {
  const sundays = getSundaysInMonth(year, month);
  const totalSundayMasses = sundays.length * SUNDAY_MASSES_CHOIR.length;

  if (totalSundayMasses === 0) {
    return { isComplete: false, totalMasses: 0, completeMasses: 0 };
  }

  const startISO = ymdLocal(new Date(year, month, 1));
  const endISO = ymdLocal(new Date(year, month + 1, 0));

  const { data, error } = await supabase
    .from("choir-placeholder")
    .select("date, mass, group")
    .gte("date", startISO)
    .lte("date", endISO);

  if (error) {
    console.error("isMonthFullyScheduledChoir error:", error);
    return {
      isComplete: false,
      totalMasses: totalSundayMasses,
      completeMasses: 0,
    };
  }

  const sundaySet = new Set(sundays.map(ymdLocal));
  const assignedMasses = new Set();

  (data || []).forEach((row) => {
    const dateISO = String(row.date);
    const mass = String(row.mass);

    // Only count Sunday masses, ignore template masses
    if (!sundaySet.has(dateISO)) return;
    if (!SUNDAY_MASSES_CHOIR.includes(mass)) return;
    if (!row.group || !row.group.trim()) return;

    assignedMasses.add(`${dateISO}|${mass}`);
  });

  return {
    isComplete: assignedMasses.size === totalSundayMasses,
    totalMasses: totalSundayMasses,
    completeMasses: assignedMasses.size,
  };
}

const AssignProgressChoir = (() => {
  let el, nodes;
  let lastPaint = 0;

  const html = (monthText) => `
    <div id="assign-overlay" style="
      position:fixed; inset:0; z-index:99999;
      background: rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
      <div style="
        width:min(520px, 92vw); border-radius:10px; padding:18px 20px 22px;
        background:#fff; color:#222; box-shadow:0 10px 30px rgba(0,0,0,.25)">
        <div style="font-size:22px; font-weight:700; margin-bottom:8px">Auto-assigning Schedules…</div>
        <div style="margin-bottom:10px"><strong>Month:</strong> ${
          monthText ?? ""
        }</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px 16px; font-size:14px; line-height:1.35">
          <div><strong>Sundays:</strong> <span id="ap-sun">0</span>/<span id="ap-sunTotal">0</span></div>
          <div><strong>Masses:</strong> <span id="ap-mass">0</span>/<span id="ap-massTotal">0</span></div>
          <div><strong>Assignments:</strong> <span id="ap-assign">0</span></div>
          <div><strong>Errors:</strong> <span id="ap-err">0</span></div>
        </div>
        <div style="margin-top:10px;height:10px;background:#e9ecef;border-radius:6px;overflow:hidden;">
          <div id="ap-bar" style="height:100%;width:0%;background:#4e79ff;transition:width .15s ease"></div>
        </div>
        <div id="ap-pct" style="font-size:12px;margin-top:6px;opacity:.8">0% complete</div>
      </div>
    </div>
  `;

  const mount = (monthText) => {
    unmount();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html(monthText);
    el = wrapper.firstElementChild;
    document.body.appendChild(el);

    nodes = {
      sun: el.querySelector("#ap-sun"),
      sunTotal: el.querySelector("#ap-sunTotal"),
      mass: el.querySelector("#ap-mass"),
      massTotal: el.querySelector("#ap-massTotal"),
      assign: el.querySelector("#ap-assign"),
      err: el.querySelector("#ap-err"),
      bar: el.querySelector("#ap-bar"),
      pct: el.querySelector("#ap-pct"),
    };
  };

  const paint = (ui = {}) => {
    if (!nodes) return;

    const sundaysProcessed = Number(ui.sundaysProcessed ?? 0);
    const totalSundays = Number(ui.totalSundays ?? 0);
    const massesProcessed = Number(ui.massesProcessed ?? 0);
    const totalMasses = Number(ui.totalMasses ?? 0);
    const errors = Number(ui.errors ?? 0);

    // Accept any of the common keys + keep 0 valid
    const assignments =
      ui.assignments ?? ui.groupsAssigned ?? ui.membersAssigned ?? 0;

    nodes.sun.textContent = String(sundaysProcessed);
    nodes.sunTotal.textContent = String(totalSundays);
    nodes.mass.textContent = String(massesProcessed);
    nodes.massTotal.textContent = String(totalMasses);
    nodes.assign.textContent = String(assignments);
    nodes.err.textContent = String(errors);

    const pct =
      totalMasses > 0
        ? Math.round((massesProcessed / totalMasses) * 100)
        : totalSundays > 0
        ? Math.round((sundaysProcessed / totalSundays) * 100)
        : 0;

    nodes.bar.style.width = pct + "%";
    nodes.pct.textContent = `${pct}% complete`;
  };

  const maybePaint = (ui) => {
    const now = performance.now?.() ?? Date.now();
    if (now - lastPaint > 120) {
      paint(ui);
      lastPaint = now;
    }
  };

  const unmount = () => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = null;
    nodes = null;
    lastPaint = 0;
  };

  return { mount, maybePaint, paint, unmount };
})();

export const autoAssignChoirSchedules = async (year, month) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthText = `${monthNames[month]} - ${year}`;

  const result = await Swal.fire({
    icon: "question",
    title: "Automate Scheduling?",
    text: `Do you want to automate the process of scheduling for Choir groups in ${monthText}?`,
    showCancelButton: true,
    confirmButtonText: "Yes, automate",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  const ui = {
    sundaysProcessed: 0,
    totalSundays: 0,
    massesProcessed: 0,
    totalMasses: 0,
    groupsAssigned: 0,
    assignments: 0,
    errors: 0,
  };

  const counters = { totalAssignments: 0 };
  const handleAssign = () => {
    counters.totalAssignments += 1;
    ui.assignments = counters.totalAssignments;
    ui.groupsAssigned = counters.totalAssignments;
    AssignProgressChoir.maybePaint(ui);
  };

  try {
    AssignProgressChoir.mount(monthText);

    const sundays = getSundaysInMonth(year, month);
    ui.totalSundays = sundays.length;
    ui.totalMasses = sundays.length * SUNDAY_MASSES_CHOIR.length;
    AssignProgressChoir.paint(ui);

    if (sundays.length === 0) {
      AssignProgressChoir.unmount();
      await Swal.fire(
        "No Sundays Found",
        "No Sundays found in the selected month.",
        "info"
      );
      return { success: false, message: "No Sundays", stats: {} };
    }

    const availableGroups = await fetchChoirGroups();
    if (!availableGroups || availableGroups.length === 0) {
      AssignProgressChoir.unmount();
      await Swal.fire(
        "No Groups Found",
        "No choir groups available for assignment.",
        "info"
      );
      return { success: false, message: "No Groups", stats: {} };
    }

    // IMPORTANT: fetch once, but keep this array MUTABLE and updated as we assign
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoISO = sixMonthsAgo.toISOString().split("T")[0];

    let { data: historicalAssignments, error: histError } = await supabase
      .from("choir-placeholder")
      .select("group, mass, date")
      .gte("date", sixMonthsAgoISO)
      .order("date", { ascending: false });

    if (histError) {
      console.error("Error fetching historical assignments:", histError);
      historicalAssignments = []; // fall back to empty, but still mutable
      ui.errors += 1;
      AssignProgressChoir.maybePaint(ui);
    } else {
      historicalAssignments = historicalAssignments || [];
    }

    const stats = {
      sundaysProcessed: 0,
      massesProcessed: 0,
      groupsAssigned: 0,
      errors: [],
    };

    // Build a stable cycle order once
    const groupCycle = makeGroupCycle(availableGroups);
    const groupNamesCycle = groupCycle.map((g) => g.name.trim());

    // Process each Sunday with week index
    for (let w = 0; w < sundays.length; w++) {
      const sunday = sundays[w];
      const dateISO = ymdLocal(sunday);

      try {
        const dailyAssignedGroups = new Set(); // 1 per day

        // iterate masses by index (0..2)
        for (let m = 0; m < SUNDAY_MASSES_CHOIR.length; m++) {
          const massLabel = SUNDAY_MASSES_CHOIR[m];

          try {
            // 1) Preferred round-robin pick
            const prefIdx = preferredGroupIndex(w, m, groupNamesCycle.length);
            // create a candidate order starting at preferred, then wrap around
            const orderedCandidates = [
              ...groupNamesCycle.slice(prefIdx),
              ...groupNamesCycle.slice(0, prefIdx),
            ];

            // 2) First pass: strict Rule #2 + 1/day
            let assigned = false;
            for (const name of orderedCandidates) {
              assigned = await tryAssignSpecificGroup({
                dateISO,
                massLabel,
                groupName: name,
                dailyAssignedGroups,
                historicalAssignments,
                onAssign: handleAssign,
              });
              if (assigned) break;
            }

            // 3) Second pass: relax Rule #2 (keeps 1/day)
            if (!assigned) {
              console.warn(
                `[Rotation Relaxed] ${dateISO} ${massLabel}: strict rotation blocked all candidates.`
              );
              assigned = await tryAssignWithRelaxedRotation({
                dateISO,
                massLabel,
                candidateNamesInOrder: orderedCandidates,
                dailyAssignedGroups,
                historicalAssignments,
                onAssign: handleAssign,
              });
            }

            stats.massesProcessed += 1;
            ui.massesProcessed = stats.massesProcessed;
            AssignProgressChoir.maybePaint(ui);
          } catch (massError) {
            console.error(
              `Error assigning ${massLabel} on ${dateISO}:`,
              massError
            );
            stats.errors.push(`${dateISO} ${massLabel}: ${massError.message}`);
            ui.errors = stats.errors.length;
            stats.massesProcessed += 1;
            ui.massesProcessed = stats.massesProcessed;
            AssignProgressChoir.maybePaint(ui);
          }
        }

        stats.sundaysProcessed += 1;
        ui.sundaysProcessed = stats.sundaysProcessed;
        AssignProgressChoir.maybePaint(ui);
      } catch (sundayError) {
        console.error(`Error processing Sunday ${dateISO}:`, sundayError);
        stats.errors.push(`${dateISO}: ${sundayError.message}`);
        ui.errors = stats.errors.length;
        AssignProgressChoir.maybePaint(ui);
      }
    }

    stats.groupsAssigned = counters.totalAssignments;
    AssignProgressChoir.unmount();

    const successMessage =
      `Successfully auto-assigned schedules!\n\n` +
      `Sundays processed: ${stats.sundaysProcessed}\n` +
      `Masses processed: ${stats.massesProcessed}\n` +
      `Total groups assigned: ${stats.groupsAssigned}\n` +
      (stats.errors.length ? `Errors: ${stats.errors.length}` : ``);

    if (stats.errors.length) {
      await Swal.fire({
        icon: "warning",
        title: "Partial Success",
        text: successMessage,
        footer: `Errors: ${stats.errors.length}`,
      });
    } else {
      await Swal.fire({
        icon: "success",
        title: "Auto-Assignment Complete!",
        text: successMessage,
      });
      window.location.reload();
    }

    return { success: true, message: successMessage, stats };
  } catch (error) {
    console.error("Auto-assignment failed:", error);
    AssignProgressChoir.unmount();
    await Swal.fire({
      icon: "error",
      title: "Auto-Assignment Failed",
      text: `An error occurred: ${error.message}`,
    });
    return {
      success: false,
      message: `Auto-assignment failed: ${error.message}`,
      stats: {},
    };
  }
};

const hasCompletedFullRotationSinceLastTargetMass = (
  groupName,
  targetMass,
  historicalAssignments
) => {
  // Gather this group's entire assignment history (descending by date)
  const hist = (historicalAssignments || [])
    .filter((a) => (a.group || "").trim() === groupName.trim())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // If group never did the target mass before, allow it (starting rotation).
  const lastTarget = hist.find((a) => a.mass === targetMass);
  if (!lastTarget) return true;

  // Since the last time they did the *same* mass, check if they've done BOTH other masses.
  const lastTargetDate = new Date(lastTarget.date);
  const otherMassesDone = new Set();

  for (const a of hist) {
    const d = new Date(a.date);
    if (d <= lastTargetDate) break; // only look *after* last target mass
    if (a.mass !== targetMass) {
      otherMassesDone.add(a.mass);
    }
  }

  // Define the full Sunday mass set used by Choir
  const ALL_SUNDAY_MASSES = [
    "1st Mass - 6:00 AM",
    "2nd Mass - 8:00 AM",
    "3rd Mass - 5:00 PM",
  ];

  const otherTwo = ALL_SUNDAY_MASSES.filter((m) => m !== targetMass);
  // Rule #2 satisfied only if both other masses are present
  return otherTwo.every((m) => otherMassesDone.has(m));
};

/*const autoAssignChoirSingleMass = async ({
  dateISO,
  massLabel,
  availableGroups,
  historicalAssignments, // <-- MUTABLE reference
  dailyAssignedGroups,
  onAssign,
}) => {
  // Already assigned?
  const { data: existingAssignments, error: existingError } = await supabase
    .from("choir-placeholder")
    .select("group")
    .eq("date", dateISO)
    .eq("mass", massLabel);

  if (existingError) {
    console.error("Error fetching existing assignments:", existingError);
    throw existingError;
  }
  if (existingAssignments && existingAssignments.length > 0) {
    return 0;
  }

  // 1 group per day filter
  const baseCandidates = availableGroups.filter((group) => {
    const groupName = group.name.trim();
    return !dailyAssignedGroups.has(groupName);
  });

  if (baseCandidates.length === 0) {
    console.warn(`No available groups for ${massLabel} on ${dateISO}`);
    return 0;
  }

  // Hard Rule #2 gate
  const hardEligible = baseCandidates.filter((g) =>
    hasCompletedFullRotationSinceLastTargetMass(
      g.name,
      massLabel,
      historicalAssignments
    )
  );

  const candidates = hardEligible.length > 0 ? hardEligible : baseCandidates;
  if (hardEligible.length === 0) {
    console.warn(
      `[Rotation Relaxed] ${dateISO} ${massLabel}: No group satisfied full rotation; relaxing Rule #2 for this slot.`
    );
  }

  // Score, with penalty if we relaxed Rule #2
  const groupsWithScores = candidates.map((group) => {
    const rotationScore = calculateChoirGroupRotationScore(
      group.name,
      massLabel,
      historicalAssignments,
      dateISO
    );

    const brokeRule2 = !hasCompletedFullRotationSinceLastTargetMass(
      group.name,
      massLabel,
      historicalAssignments
    );
    const penaltyIfRelaxed = brokeRule2 ? 6000 : 0;

    return { ...group, rotationScore: rotationScore + penaltyIfRelaxed };
  });

  groupsWithScores.sort((a, b) => a.rotationScore - b.rotationScore);
  const selectedGroup = groupsWithScores[0];

  // Insert and **UPDATE HISTORY IN-MEMORY**
  try {
    const { data: inserted, error } = await supabase
      .from("choir-placeholder")
      .insert([
        {
          date: dateISO,
          mass: massLabel,
          group: selectedGroup.name,
          templateID: null,
        },
      ])
      .select("group, mass, date");

    if (error)
      throw new Error(
        `Failed to assign ${selectedGroup.name}: ${error.message}`
      );

    if (inserted && inserted.length > 0) {
      // Enforce 1/day
      dailyAssignedGroups.add(selectedGroup.name);

      // ðŸ”´ CRITICAL LINE: teach the scheduler what we just did
      historicalAssignments.unshift({
        group: selectedGroup.name,
        mass: massLabel,
        date: dateISO,
      });

      if (typeof onAssign === "function") onAssign();
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`Error assigning group to ${massLabel}:`, error);
    throw error;
  }
};*/

/*const calculateChoirGroupRotationScore = (
  groupName,
  targetMass,
  historicalAssignments,
  targetDate
) => {
  if (!historicalAssignments || historicalAssignments.length === 0) {
    return -5000; // New/unknown group gets high priority
  }

  const groupAssignments = historicalAssignments
    .filter((a) => (a.group || "").trim() === groupName.trim())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (groupAssignments.length === 0) return -5000;

  let score = 0;

  // How many times this group did the target mass (historically)?
  const massCount = groupAssignments.filter(
    (a) => a.mass === targetMass
  ).length;

  // Most recent date they did the target mass
  const lastTarget = groupAssignments.find((a) => a.mass === targetMass);
  const lastTargetDate = lastTarget ? new Date(lastTarget.date) : null;

  const daysSinceLastMass = lastTargetDate
    ? Math.floor(
        (new Date(targetDate) - lastTargetDate) / (1000 * 60 * 60 * 24)
      )
    : Infinity;

  // Penalize recent repeats of same mass; reward long gaps
  if (daysSinceLastMass < 7) score += 8000;
  else if (daysSinceLastMass < 21) score += 4000;
  else if (daysSinceLastMass < 60) score += 1000;
  if (daysSinceLastMass > 90) score -= 2000;

  // Penalize heavy skew toward this mass
  score += massCount * 2000;

  // Distribution balance (historical)
  const dist = {
    "1st Mass - 6:00 AM": 0,
    "2nd Mass - 8:00 AM": 0,
    "3rd Mass - 5:00 PM": 0,
  };
  groupAssignments.forEach((a) => {
    if (dist.hasOwnProperty(a.mass)) dist[a.mass]++;
  });
  const avg =
    (dist["1st Mass - 6:00 AM"] +
      dist["2nd Mass - 8:00 AM"] +
      dist["3rd Mass - 5:00 PM"]) /
    3;
  const currentMassCount = dist[targetMass] || 0;
  if (currentMassCount > avg + 1) score += 3000;

  // Big bonus if they have never done this mass before
  if (massCount === 0) score -= 10000;

  return score;
};*/

const makeGroupCycle = (availableGroups) =>
  [...availableGroups].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

const preferredGroupIndex = (weekIndex, massIndex, groupCount) =>
  (weekIndex + massIndex) % groupCount;

const tryAssignSpecificGroup = async ({
  dateISO,
  massLabel,
  groupName,
  dailyAssignedGroups,
  historicalAssignments,
  onAssign,
}) => {
  // already assigned?
  const { data: existing, error: existingError } = await supabase
    .from("choir-placeholder")
    .select("group")
    .eq("date", dateISO)
    .eq("mass", massLabel);

  if (existingError) throw existingError;
  if (existing && existing.length > 0) return false; // slot already filled

  // 1/day rule
  if (dailyAssignedGroups.has(groupName.trim())) return false;

  // Rule #2 hard check
  const okRotation = hasCompletedFullRotationSinceLastTargetMass(
    groupName,
    massLabel,
    historicalAssignments
  );
  if (!okRotation) return false;

  // insert
  const { data: inserted, error } = await supabase
    .from("choir-placeholder")
    .insert([
      { date: dateISO, mass: massLabel, group: groupName, templateID: null },
    ])
    .select("group, mass, date");

  if (error) throw new Error(`Failed to assign ${groupName}: ${error.message}`);
  if (!inserted || inserted.length === 0) return false;

  dailyAssignedGroups.add(groupName.trim());
  historicalAssignments.unshift({
    group: groupName,
    mass: massLabel,
    date: dateISO,
  });
  if (typeof onAssign === "function") onAssign();
  return true;
};

const tryAssignWithRelaxedRotation = async ({
  dateISO,
  massLabel,
  candidateNamesInOrder,
  dailyAssignedGroups,
  historicalAssignments,
  onAssign,
}) => {
  // already assigned?
  const { data: existing, error: existingError } = await supabase
    .from("choir-placeholder")
    .select("group")
    .eq("date", dateISO)
    .eq("mass", massLabel);

  if (existingError) throw existingError;
  if (existing && existing.length > 0) return false;

  for (const name of candidateNamesInOrder) {
    if (dailyAssignedGroups.has(name.trim())) continue;
    const { data: inserted, error } = await supabase
      .from("choir-placeholder")
      .insert([
        { date: dateISO, mass: massLabel, group: name, templateID: null },
      ])
      .select("group, mass, date");

    if (!error && inserted && inserted.length > 0) {
      dailyAssignedGroups.add(name.trim());
      historicalAssignments.unshift({
        group: name,
        mass: massLabel,
        date: dateISO,
      });
      if (typeof onAssign === "function") onAssign();
      return true;
    }
  }
  return false;
};

/*----------------------------------

EUCHARISTIC MINISTER FUNCTIONS

------------------------------------*/

export const resetEucharisticMinisterGroupAndMembers = async (
  dateISO,
  massLabel
) => {
  try {
    const delGroupPromise = supabase
      .from("eucharistic-minister-group-placeholder")
      .delete()
      .eq("date", dateISO)
      .eq("mass", massLabel);

    const delMembersPromise = supabase
      .from("eucharistic-minister-placeholder")
      .delete()
      .eq("date", dateISO)
      .eq("mass", massLabel);

    const [{ error: groupErr }, { error: memberErr }] = await Promise.all([
      delGroupPromise,
      delMembersPromise,
    ]);

    if (groupErr) throw groupErr;
    if (memberErr) throw memberErr;

    return true; // success (even if 0 rows affected)
  } catch (err) {
    console.error(
      "Error resetting Eucharistic Minister group & members:",
      err?.message || err
    );
    return false;
  }
};

export const saveEucharisticMinisterGroup = async ({
  dateISO,
  massLabel,
  templateID = null,
  group,
}) => {
  try {
    const { error } = await supabase
      .from("eucharistic-minister-group-placeholder")
      .upsert([
        {
          date: dateISO,
          mass: massLabel,
          templateID,
          group,
        },
      ]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error saving EM group:", err);
    return false;
  }
};

export const fetchExistingEucharisticMinisterGroup = async (
  selectedISO,
  selectedMassDisplay
) => {
  if (!selectedISO || !selectedMassDisplay) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("eucharistic-minister-group-placeholder")
      .select("group")
      .eq("date", selectedISO)
      .eq("mass", selectedMassDisplay)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error fetching existing group:", error);
      return null;
    }

    return data?.group || null;
  } catch (err) {
    console.error("Failed to fetch existing group assignment:", err);
    return null;
  }
};

export const saveEucharisticMinisterAssignments = async (
  dateISO,
  massLabel,
  templateID,
  assigned
) => {
  try {
    // Clear old assignments first
    await supabase
      .from("eucharistic-minister-placeholder")
      .delete()
      .eq("date", dateISO)
      .eq("mass", massLabel);

    // Prepare new rows - only include non-empty assignments
    const rows = Object.entries(assigned)
      .filter(([_, member]) => member && member.id) // Filter out empty slots
      .map(([key, member], idx) => ({
        date: dateISO,
        mass: massLabel,
        templateID: templateID || null,
        slot: idx + 1,
        idNumber: member.id, // Store the member ID, not the name
      }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from("eucharistic-minister-placeholder")
        .insert(rows);

      if (error) throw error;
    }

    return true;
  } catch (err) {
    console.error("Error saving EM assignments:", err.message);
    return false;
  }
};

export const resetEucharisticMinisterAssignments = async (
  dateISO,
  massLabel
) => {
  try {
    // Delete all assignments for this specific date and mass
    const { error } = await supabase
      .from("eucharistic-minister-placeholder")
      .delete()
      .eq("date", dateISO)
      .eq("mass", massLabel);

    if (error) {
      console.error("Error resetting EM assignments:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to reset EM assignments:", err);
    return false;
  }
};

/*export const fetchEucharisticMinisterGroupMembers = async (groupName) => {
  if (!groupName) {
    return [];
  }

  try {
    // First, get all member IDs from the specified group
    const { data: groupMembers, error: groupError } = await supabase
      .from("eucharistic-minister-group")
      .select("idNumber")
      .eq("group-name", groupName);

    if (groupError) {
      console.error("Error fetching group members:", groupError);
      return [];
    }

    if (!groupMembers || groupMembers.length === 0) {
      return [];
    }

    // Extract the ID numbers
    const memberIds = groupMembers.map((member) => member.idNumber);

    // Now fetch the member information for these IDs
    const { data: memberInfo, error: memberError } = await supabase
      .from("members-information")
      .select("idNumber, firstName, middleName, lastName")
      .in("idNumber", memberIds);

    if (memberError) {
      console.error("Error fetching member information:", memberError);
      return [];
    }

    // Format the member data
    const formattedMembers = (memberInfo || []).map((member) => ({
      id: member.idNumber,
      name: [member.firstName, member.middleName, member.lastName]
        .filter((name) => name && name.trim()) // Remove empty/null names
        .join(" ")
        .trim(),
    }));

    return formattedMembers;
  } catch (err) {
    console.error("Failed to fetch group members:", err);
    return [];
  }
};

export const fetchEucharisticMinisterAssignments = async (
  dateISO,
  massLabel
) => {
  try {
    // 1) Get saved slots (idNumber per slot)
    const { data: assignments, error: assignError } = await supabase
      .from("eucharistic-minister-placeholder")
      .select("slot, idNumber")
      .eq("date", dateISO)
      .eq("mass", massLabel)
      .order("slot", { ascending: true });

    if (assignError) throw assignError;
    if (!assignments || assignments.length === 0) return [];

    // 2) Unique IDs (normalize types to avoid .in() mismatches)
    const memberIds = [...new Set(assignments.map((a) => a.idNumber))].filter(
      (v) => v !== null && v !== undefined
    );

    // 3) Fetch names for those IDs
    const { data: memberInfo, error: memberError } = await supabase
      .from("members-information")
      .select("idNumber, firstName, middleName, lastName")
      .in(
        "idNumber",
        memberIds.map((v) => (typeof v === "string" ? v : String(v))) // cast to string for safety
      );

    if (memberError) throw memberError;

    // 4) Build a fast lookup (try both string and number keys)
    const nameMap = new Map();
    (memberInfo || []).forEach((m) => {
      const fullName = [m.firstName, m.middleName, m.lastName]
        .filter((n) => n && String(n).trim())
        .join(" ")
        .trim();
      nameMap.set(String(m.idNumber), fullName);
      nameMap.set(Number(m.idNumber), fullName);
    });

    // 5) Return slot â†’ {id, name} (name filled if found)
    return assignments.map((a) => ({
      slot: a.slot,
      id: a.idNumber,
      name: nameMap.get(a.idNumber) || nameMap.get(String(a.idNumber)) || "",
    }));
  } catch (err) {
    console.error("Error fetching EM assignments:", err?.message || err);
    return [];
  }
};*/

// A) Group members â†’ return id as STRING
export const fetchEucharisticMinisterGroupMembers = async (groupName) => {
  if (!groupName) return [];
  try {
    const { data: groupMembers, error: groupError } = await supabase
      .from("eucharistic-minister-group")
      .select("idNumber")
      .eq("group-name", groupName);
    if (groupError) return [];

    const memberIds = (groupMembers || [])
      .map((m) => String(m.idNumber))
      .filter(Boolean);

    if (memberIds.length === 0) return [];

    const { data: memberInfo, error: memberError } = await supabase
      .from("members-information")
      .select("idNumber, firstName, middleName, lastName")
      .in("idNumber", memberIds);
    if (memberError) return [];

    return (memberInfo || []).map((m) => ({
      id: String(m.idNumber),
      name: [m.firstName, m.middleName, m.lastName]
        .filter((x) => x && String(x).trim())
        .join(" ")
        .trim(),
    }));
  } catch (e) {
    return [];
  }
};

// B) Saved assignments â†’ return id as STRING
export const fetchEucharisticMinisterAssignments = async (
  dateISO,
  massLabel
) => {
  try {
    const { data: assignments, error: assignError } = await supabase
      .from("eucharistic-minister-placeholder")
      .select("slot, idNumber")
      .eq("date", dateISO)
      .eq("mass", massLabel)
      .order("slot", { ascending: true });
    if (assignError || !assignments?.length) return [];

    const memberIds = [...new Set(assignments.map((a) => String(a.idNumber)))];

    const { data: memberInfo, error: memberError } = await supabase
      .from("members-information")
      .select("idNumber, firstName, middleName, lastName")
      .in("idNumber", memberIds);
    if (memberError) return [];

    const nameMap = new Map(
      (memberInfo || []).map((m) => [
        String(m.idNumber),
        [m.firstName, m.middleName, m.lastName]
          .filter((x) => x && String(x).trim())
          .join(" ")
          .trim(),
      ])
    );

    return assignments.map((a) => ({
      slot: a.slot,
      id: String(a.idNumber),
      name: nameMap.get(String(a.idNumber)) || "",
    }));
  } catch {
    return [];
  }
};

/** ---------------------------
 * EUCHARISTIC MINISTER: Group eligibility
 * --------------------------- */

/** Extract 1|2|3 from mass labels like "1st Mass - 6:00 AM". Returns null if not 1/2/3. */
function getSundayOrdinalFromLabel(massLabel = "") {
  const m = String(massLabel).match(/^(\d+)(?:st|nd|rd|th)\s+Mass\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return [1, 2, 3].includes(n) ? n : null;
}

/** Normalize */
const _norm = (s) => String(s || "").trim();

/** Pull DISTINCT group names from your master table "eucharistic-minister-group" (col: "group-name"). */
export async function fetchEMGroupNamesDistinct() {
  try {
    const { data, error } = await supabase
      .from("eucharistic-minister-group")
      .select('"group-name"');

    if (error) {
      console.error("fetchEMGroupNamesDistinct error:", error);
      return [];
    }

    const set = new Set();
    (data || []).forEach((row) => {
      const g = _norm(row?.["group-name"]);
      if (g) set.add(g);
    });
    return Array.from(set);
  } catch (e) {
    console.error("fetchEMGroupNamesDistinct failed:", e);
    return [];
  }
}

/**
 * Get the eligible EM groups for a given date + mass, enforcing both rules.
 *
 * Tables used:
 *  - eucharistic-minister-group           (source of distinct group names via "group-name")
 *  - eucharistic-minister-group-placeholder (stores: date, mass, group)
 *
 * @param {Object} p
 * @param {string} p.dateISO    "YYYY-MM-DD"
 * @param {string} p.massLabel  e.g. "1st Mass - 6:00 AM"
 * @param {string[]} [p.allGroups] Optional pre-fetched group names to avoid extra query
 * @returns {Promise<string[]>}   Eligible group names for the dropdown
 */
export async function fetchEligibleEucharisticMinisterGroups({
  dateISO,
  massLabel,
  allGroups,
}) {
  const targetDate = _norm(dateISO);
  const targetMass = _norm(massLabel);
  const targetOrd = getSundayOrdinalFromLabel(targetMass); // 1|2|3 or null

  // Load available group names (distinct)
  const groups = (
    allGroups && allGroups.length
      ? allGroups
      : await fetchEMGroupNamesDistinct()
  )
    .map(_norm)
    .filter(Boolean);

  if (groups.length === 0) return [];

  // Get all EM group assignments up to and including the target date
  // (from the GROUP placeholder, not the member placeholder)
  const { data: rowsAll, error } = await supabase
    .from("eucharistic-minister-group-placeholder")
    .select("date, mass, group")
    .lte("date", targetDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("fetchEligibleEucharisticMinisterGroups error:", error);
    // Fail-safe: show all groups so UI isn't blocked
    return groups;
  }

  const rows = rowsAll || [];
  const rowsSameDay = rows.filter((r) => String(r.date) === targetDate);
  const rowsBefore = rows.filter((r) => String(r.date) < targetDate);

  // Rule 1: Same date → hide groups already used in ANY mass on that date
  const usedSameDay = new Set(
    rowsSameDay.map((r) => _norm(r.group)).filter(Boolean)
  );

  // Build per-group history (only BEFORE target date) with ordinals
  const historyByGroup = new Map();
  for (const r of rowsBefore) {
    const g = _norm(r.group);
    if (!g) continue;
    if (!historyByGroup.has(g)) historyByGroup.set(g, []);
    historyByGroup.get(g).push({
      date: String(r.date),
      mass: _norm(r.mass),
      ord: getSundayOrdinalFromLabel(r.mass), // 1|2|3 or null
    });
  }

  // Rule 2: can’t appear again in the SAME ordinal until it has served the other two ordinals
  function passesRotation(groupName) {
    if (targetOrd == null) return true; // rotation applies only to 1st/2nd/3rd Sunday masses

    const hist = historyByGroup.get(groupName) || [];
    // Find last time the group served this SAME ordinal
    let lastSameOrdIdx = -1;
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i].ord === targetOrd) {
        lastSameOrdIdx = i;
        break;
      }
    }
    // Never did this ordinal before → allowed
    if (lastSameOrdIdx === -1) return true;

    // After that appearance, must have served BOTH other ordinals at least once
    const needed = new Set([1, 2, 3].filter((o) => o !== targetOrd));
    for (let i = lastSameOrdIdx + 1; i < hist.length; i++) {
      const o = hist[i].ord;
      if (needed.has(o)) needed.delete(o);
      if (needed.size === 0) break;
    }
    return needed.size === 0;
  }

  // Final: not used on same date, and passes rotation
  return groups.filter((g) => !usedSameDay.has(g) && passesRotation(g));
}

// ======== EUCHARISTIC MINISTER: AUTO-ASSIGN (Groups + Members) ========

// ---- tiny helpers (safe to re-declare if not present elsewhere)

function sundayOrdinalInMonth(date) {
  // date: Date in local time
  const y = date.getFullYear();
  const m = date.getMonth();
  let count = 0;
  for (let d = new Date(y, m, 1); d <= date; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) count++;
  }
  return count; // 1-based
}

// ---- rotation matrix (3-week cycle)
const ROTATION = [
  // ordinal 1 (mod 3 === 1): [Mass1, Mass2, Mass3]
  ["Group 1", "Group 2", "Group 3"],

  // ordinal 2 (mod 3 === 2)
  ["Group 2", "Group 3", "Group 1"],

  // ordinal 3 (mod 3 === 0)
  ["Group 3", "Group 1", "Group 2"],
];

function groupFor(ordinal1, massIndex0) {
  // cycle every 3 Sundays
  const idx = (ordinal1 - 1) % 3;
  return ROTATION[idx][massIndex0];
}

// ---- CORE: auto-assign one Sunday mass (group + 6 members)
async function autoAssignEMForMass({
  dateISO,
  massLabel,
  groupName, // "Group 1/2/3"
  onAssign, // optional progress callback
}) {
  // 1) Set/overwrite the group for this date+mass
  await supabase
    .from("eucharistic-minister-group-placeholder")
    .delete()
    .eq("date", dateISO)
    .eq("mass", massLabel);

  await supabase
    .from("eucharistic-minister-group-placeholder")
    .insert([
      { date: dateISO, mass: massLabel, templateID: null, group: groupName },
    ]);

  // 2) Fetch group members
  const members = await fetchEucharisticMinisterGroupMembers(groupName);
  if (!members.length) return;

  // 3) Avoid double-booking on same date
  const { data: sameDayAssignments } = await supabase
    .from("eucharistic-minister-placeholder")
    .select("idNumber")
    .eq("date", dateISO);
  const takenToday = new Set(
    (sameDayAssignments || []).map((r) => String(r.idNumber))
  );

  // 4) Build fairness metrics from recent history (last 6 months)
  const since = new Date(dateISO);
  since.setMonth(since.getMonth() - 6);
  const sinceISO = ymdLocal(since);

  const { data: history } = await supabase
    .from("eucharistic-minister-placeholder")
    .select("idNumber, date")
    .gte("date", sinceISO)
    .order("date", { ascending: true });

  const countPer = new Map();
  const lastDatePer = new Map();
  (history || []).forEach((h) => {
    const id = String(h.idNumber);
    countPer.set(id, (countPer.get(id) || 0) + 1);
    lastDatePer.set(id, h.date);
  });

  // 5) Rank candidates: least assigned first; if tie → oldest last assignment first; then name
  const ranked = members
    .filter((m) => !takenToday.has(String(m.id)))
    .map((m) => {
      const id = String(m.id);
      const cnt = countPer.get(id) || 0;
      const last = lastDatePer.get(id) || null;
      return {
        ...m,
        _count: cnt,
        _last: last ? new Date(last) : new Date(0),
      };
    })
    .sort((a, b) => {
      if (a._count !== b._count) return a._count - b._count;
      if (a._last.getTime() !== b._last.getTime()) return a._last - b._last; // older first
      return (a.name || "").localeCompare(b.name || "");
    });

  const pick = ranked.slice(0, 6); // default 6 ministers

  // 6) Write assignments (slots 1..6)
  await supabase
    .from("eucharistic-minister-placeholder")
    .delete()
    .eq("date", dateISO)
    .eq("mass", massLabel);

  if (pick.length) {
    const rows = pick.map((m, i) => ({
      date: dateISO,
      mass: massLabel,
      templateID: null,
      slot: i + 1,
      idNumber: String(m.id),
    }));
    await supabase.from("eucharistic-minister-placeholder").insert(rows);
  }

  if (onAssign) onAssign(pick.length);
}

// ---- splash overlay UI (lightweight)
const EMProgress = (() => {
  let el, nodes;
  const html = (monthText) => `
    <div id="em-overlay" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
      <div style="width:min(520px,92vw);border-radius:10px;padding:18px 20px 22px;background:#fff;color:#222;box-shadow:0 10px 30px rgba(0,0,0,.25)">
        <div style="font-size:22px;font-weight:700;margin-bottom:8px">Auto-assigning Schedules…</div>
        <div style="margin-bottom:10px"><strong>Month:</strong> ${monthText}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:14px;line-height:1.35">
          <div><strong>Sundays:</strong> <span id="em-sun">0</span>/<span id="em-sunT">0</span></div>
          <div><strong>Masses:</strong> <span id="em-mass">0</span>/<span id="em-massT">0</span></div>
          <div><strong>Members Assigned:</strong> <span id="em-assign">0</span></div>
          <div><strong>Errors:</strong> <span id="em-err">0</span></div>
        </div>
        <div style="margin-top:10px;height:10px;background:#e9ecef;border-radius:6px;overflow:hidden;">
          <div id="em-bar" style="height:100%;width:0%;background:#4e79ff;transition:width .15s ease"></div>
        </div>
        <div id="em-pct" style="font-size:12px;margin-top:6px;opacity:.8">0% complete</div>
      </div>
    </div>
  `;
  const mount = (m) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = html(m);
    el = wrap.firstElementChild;
    document.body.appendChild(el);
    nodes = {
      sun: el.querySelector("#em-sun"),
      sunT: el.querySelector("#em-sunT"),
      mass: el.querySelector("#em-mass"),
      massT: el.querySelector("#em-massT"),
      assign: el.querySelector("#em-assign"),
      err: el.querySelector("#em-err"),
      bar: el.querySelector("#em-bar"),
      pct: el.querySelector("#em-pct"),
    };
  };
  const paint = ({ sDone, sTotal, mDone, mTotal, assigned, errors }) => {
    nodes.sun.textContent = String(sDone);
    nodes.sunT.textContent = String(sTotal);
    nodes.mass.textContent = String(mDone);
    nodes.massT.textContent = String(mTotal);
    nodes.assign.textContent = String(assigned);
    nodes.err.textContent = String(errors);
    const pct = mTotal ? Math.round((mDone / mTotal) * 100) : 0;
    nodes.bar.style.width = pct + "%";
    nodes.pct.textContent = `${pct}% complete`;
  };
  const unmount = () => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = null;
    nodes = null;
  };
  return { mount, paint, unmount };
})();

// ---- PUBLIC: run auto-assign for the month (Sundays only)
export async function autoAssignEucharisticMinisterSchedules(year, month) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthText = `${monthNames[month]} - ${year}`;

  const ok = await Swal.fire({
    icon: "question",
    title: "Automate Sunday Schedules?",
    text: `This fills all Sunday masses for ${monthText} with rotated groups and fair member rotation.`,
    showCancelButton: true,
    confirmButtonText: "Yes, automate",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  if (!ok.isConfirmed) return { success: false };

  const sundays = getSundaysInMonth(year, month);
  const sTotal = sundays.length;
  const mTotal = sTotal * SUNDAY_MASSES.length;

  EMProgress.mount(monthText);
  let sDone = 0,
    mDone = 0,
    assigned = 0,
    errors = 0;

  const onAssign = (n) => {
    assigned += Number(n || 0);
    EMProgress.paint({ sDone, sTotal, mDone, mTotal, assigned, errors });
  };

  try {
    for (const s of sundays) {
      const dateISO = ymdLocal(s);
      const ord = sundayOrdinalInMonth(s);
      for (let i = 0; i < SUNDAY_MASSES.length; i++) {
        const massLabel = SUNDAY_MASSES[i];
        const g = groupFor(ord, i);
        try {
          await autoAssignEMForMass({
            dateISO,
            massLabel,
            groupName: g,
            onAssign,
          });
        } catch (e) {
          console.error(`EM auto-assign failed ${dateISO} ${massLabel}`, e);
          errors += 1;
        } finally {
          mDone += 1;
          EMProgress.paint({ sDone, sTotal, mDone, mTotal, assigned, errors });
        }
      }
      sDone += 1;
      EMProgress.paint({ sDone, sTotal, mDone, mTotal, assigned, errors });
    }
    EMProgress.unmount();

    const msg =
      `Finished auto-assigning EM schedules.\n\n` +
      `Sundays: ${sDone}/${sTotal}\n` +
      `Masses: ${mDone}/${mTotal}\n` +
      `Members assigned: ${assigned}\n` +
      (errors ? `Errors: ${errors}` : `Errors: 0`);

    await Swal.fire({
      icon: errors ? "warning" : "success",
      title: errors ? "Partial Success" : "Auto-Assignment Complete",
      text: msg,
    });

    // optional: refresh
    try {
      window.location.reload();
    } catch {}
    return {
      success: true,
      stats: { sDone, sTotal, mDone, mTotal, assigned, errors },
    };
  } catch (e) {
    console.error("autoAssignEucharisticMinisterSchedules fatal:", e);
    EMProgress.unmount();
    await Swal.fire("Error", e.message || "Auto-assignment failed.", "error");
    return { success: false, error: e?.message || "Unknown error" };
  }
}

// ---- MONTH COMPLETENESS CHECK for Eucharistic Minister
export async function isMonthFullyScheduledEucharisticMinister(year, month) {
  // helper to format YYYY-MM-DD
  const ymdLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // get all Sundays of this month
  const sundays = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === 0) sundays.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  if (!sundays.length) return true;

  // Check each Sunday’s 3 masses
  const SUNDAY_MASSES = [
    "1st Mass - 6:00 AM",
    "2nd Mass - 8:00 AM",
    "3rd Mass - 5:00 PM",
  ];

  for (const s of sundays) {
    const dateISO = ymdLocal(s);
    for (const massLabel of SUNDAY_MASSES) {
      const { data, error } = await supabase
        .from("eucharistic-minister-placeholder")
        .select("idNumber")
        .eq("date", dateISO)
        .eq("mass", massLabel);

      if (error) return false;
      if ((data || []).length !== 6) {
        // needs exactly 6 ministers
        return false;
      }
    }
  }
  return true;
}
