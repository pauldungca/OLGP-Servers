// assets/scripts/assignMember.js
import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";
import { fetchAltarServerMembersWithRole } from "./fetchMember";
import { getTemplateFlagsForDate } from "./fetchSchedule";

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

/*export const fetchMembersNormalized = async (dateISO, massLabel, role) => {
  // Step 1: Get all members already assigned to ANY mass on this date
  const { data: allAssignedMembers, error: allAssignedError } = await supabase
    .from("altar-server-placeholder")
    .select("idNumber, role, mass")
    .eq("date", dateISO);

  if (allAssignedError) {
    console.error("Error fetching all assigned members:", allAssignedError);
    return [];
  }

  // Step 2: Get members assigned to the current mass specifically
  const { data: currentMassMembers, error: currentMassError } = await supabase
    .from("altar-server-placeholder")
    .select("idNumber, role")
    .eq("date", dateISO)
    .eq("mass", massLabel);

  if (currentMassError) {
    console.error("Error fetching current mass members:", currentMassError);
    return [];
  }

  // Step 3: Get historical role assignments for rotation analysis (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString().split("T")[0];

  const { data: historicalAssignments, error: histError } = await supabase
    .from("altar-server-placeholder")
    .select("idNumber, role, date")
    .gte("date", sixMonthsAgoISO)
    .order("date", { ascending: false });

  if (histError) {
    console.error("Error fetching historical assignments:", histError);
  }

  // Create sets for different assignment scenarios
  const allAssignedIds = new Set(
    allAssignedMembers.map((member) => String(member.idNumber).trim())
  );

  // Create a map of assigned members by role for current mass
  const assignedByRole = new Map();
  currentMassMembers.forEach((member) => {
    const id = String(member.idNumber).trim();
    if (!assignedByRole.has(member.role)) {
      assignedByRole.set(member.role, new Set());
    }
    assignedByRole.get(member.role).add(id);
  });

  // Step 4: Fetch all altar server members with roles
  const rows = await fetchAltarServerMembersWithRole();

  // Step 5: Normalize members and apply rotation logic
  const normalized = (rows || [])
    .map((m) => ({
      idNumber: String(m.idNumber ?? "").trim(),
      fullName: buildFullName(m),
      role: m.role || "Non-Flexible",
      sex: m.sex || "Unknown",
    }))
    .filter((m) => {
      if (!m.idNumber || !m.fullName) return false;

      // If this member is assigned to the current role in the current mass, always include them
      const assignedToCurrentRole = assignedByRole.get(role)?.has(m.idNumber);
      if (assignedToCurrentRole) return true;

      // If this member is assigned to ANY mass on this date (including current mass), exclude them
      const assignedToAnyMass = allAssignedIds.has(m.idNumber);
      if (assignedToAnyMass) return false;

      // If not assigned anywhere on this date, include them
      return true;
    })
    .map((m) => {
      // Add rotation priority score and statistics
      const rotationScore = calculateRotationScore(
        m.idNumber,
        role,
        historicalAssignments || [],
        dateISO
      );

      const stats = getMemberRotationStats(
        m.idNumber,
        historicalAssignments || []
      );
      const shouldPrioritize = shouldPrioritizeForRotation(
        m.idNumber,
        role,
        historicalAssignments || [],
        dateISO
      );

      const roleCount = stats.roleDistribution[role] || 0;

      // Calculate days since last role assignment
      const roleAssignments = (historicalAssignments || [])
        .filter(
          (assignment) =>
            String(assignment.idNumber).trim() === m.idNumber &&
            assignment.role === role
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const daysSinceLastRole =
        roleAssignments.length > 0
          ? Math.floor(
              (new Date(dateISO) - new Date(roleAssignments[0].date)) /
                (1000 * 60 * 60 * 24)
            )
          : Infinity;

      return {
        ...m,
        rotationScore,
        roleCount,
        daysSinceLastRole,
        shouldPrioritize,
        totalAssignments: stats.totalAssignments,
        isNewMember: stats.isNewMember,
      };
    })
    // Sort by rotation priority (lower score = higher priority)
    .sort((a, b) => {
      // First sort by rotation score
      if (a.rotationScore !== b.rotationScore) {
        return a.rotationScore - b.rotationScore;
      }
      // Then by name for consistency
      return a.fullName.localeCompare(b.fullName);
    });

  // Step 6: For assigned members, get additional info from members-information table
  const assignedToCurrentRole = assignedByRole.get(role);
  if (assignedToCurrentRole && assignedToCurrentRole.size > 0) {
    const assignedIds = Array.from(assignedToCurrentRole);

    // Get detailed information for assigned members
    const { data: assignedMemberDetails, error: detailsError } = await supabase
      .from("members-information")
      .select("idNumber, firstName, middleName, lastName, sex")
      .in("idNumber", assignedIds)
      .order("id", { ascending: true });

    if (!detailsError && assignedMemberDetails) {
      // Update the normalized array with detailed information for assigned members
      assignedMemberDetails.forEach((detail) => {
        const index = normalized.findIndex(
          (m) => m.idNumber === String(detail.idNumber).trim()
        );
        if (index !== -1) {
          normalized[index] = {
            ...normalized[index],
            fullName: buildFullName(detail),
            sex: detail.sex || "Unknown",
          };
        } else {
          // Add member if not found in the original list (edge case)
          normalized.push({
            idNumber: String(detail.idNumber).trim(),
            fullName: buildFullName(detail),
            role: "Non-Flexible",
            sex: detail.sex || "Unknown",
            rotationScore: 0,
            roleCount: 0,
            daysSinceLastRole: Infinity,
            shouldPrioritize: true,
            totalAssignments: 0,
            isNewMember: true,
          });
        }
      });
    }
  }

  return normalized;
};*/

/*export const fetchMembersNormalized = async (dateISO, massLabel, role) => {
  // 🔐 Eligibility maps
  const { perRoleAllowed } = await buildEligibilityMaps();
  const allowedSet = perRoleAllowed.get(role) || new Set();

  // Step 1: Get all members already assigned to ANY mass on this date
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

  // Step 2: Group by role
  const assignedByRole = new Map();
  (allAssignedMembers || []).forEach((m) => {
    const k = m.role;
    if (!assignedByRole.has(k)) assignedByRole.set(k, new Set());
    assignedByRole.get(k).add(String(m.idNumber).trim());
  });

  // Step 3: Fetch historical assignments (rotation scoring)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString().split("T")[0];

  const { data: historicalAssignments } = await supabase
    .from("altar-server-placeholder")
    .select("idNumber, role, date, mass")
    .gte("date", sixMonthsAgoISO)
    .order("date", { ascending: false });

  // Step 4: Fetch all altar server members
  const rows = await fetchAltarServerMembersWithRole();

  // Step 5: Normalize members and apply filters
  const normalized = (rows || [])
    .map((m) => ({
      idNumber: String(m.idNumber ?? "").trim(),
      fullName: buildFullName(m),
      role: m.role || "Non-Flexible",
      sex: m.sex || "Unknown",
    }))
    .filter((m) => {
      if (!m.idNumber || !m.fullName) return false;

      // If this member is already assigned to this role in this mass, keep them (so you can unassign)
      const assignedToCurrentRole = assignedByRole.get(role)?.has(m.idNumber);
      if (assignedToCurrentRole) return true;

      // 🔐 Eligibility: only allow if altar-server-roles says so
      if (!allowedSet.has(m.idNumber)) return false;

      // If member already assigned to any mass on this date, skip them
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
      return {
        ...m,
        rotationScore,
      };
    })
    .sort((a, b) => {
      if (a.rotationScore !== b.rotationScore) {
        return a.rotationScore - b.rotationScore;
      }
      return a.fullName.localeCompare(b.fullName);
    });

  return normalized;
};*/

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

/*export const saveRoleAssignments = async ({
  dateISO,
  massLabel,
  templateID,
  roleKey,
  assigned,
}) => {
  const chosen = (assigned || []).filter(Boolean);
  return replacePlaceholderRoleAssignments({
    dateISO,
    massLabel,
    templateID,
    roleKey,
    members: chosen,
  });
};*/

export const saveRoleAssignments = async ({
  dateISO,
  massLabel,
  templateID,
  roleKey,
  assigned,
}) => {
  const chosen = (assigned || []).filter(Boolean);

  // 🔐 Eligibility check
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

/*---------------------------------

AUTOMATED SCHEDULING FUNCTIONS

---------------------------------*/

// ===== Progress Overlay (no Swal) =====
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
        <div style="font-size:22px; font-weight:700; margin-bottom:8px">Auto-assigning schedules…</div>
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

/*export const autoAssignSundaySchedules = async (year, month) => {
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

  // Simple confirm without Swal (you can replace with your own UI)
  const ok = window.confirm(
    `Automate scheduling on all Sunday schedules for ${monthText}?`
  );
  if (!ok) return;

  // UI state for the overlay
  const ui = {
    sundaysProcessed: 0,
    totalSundays: 0,
    massesProcessed: 0,
    totalMasses: 0,
    membersAssigned: 0,
    errors: 0,
  };

  try {
    AssignProgress.mount(monthText);

    // Get Sundays
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
      alert("No Sundays found in the selected month.");
      return { success: false, message: "No Sundays", stats: {} };
    }

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

    let totalAssignments = 0;
    const stats = {
      sundaysProcessed: 0,
      massesProcessed: 0,
      membersAssigned: 0,
      errors: [],
    };

    // Loop Sundays
    for (const sunday of sundays) {
      const dateISO = ymdLocal(sunday);
      try {
        const sundayAssignments = new Set();

        // Loop masses
        for (const massLabel of sundayMasses) {
          try {
            // Important: pass onAssign to count each member as it's assigned
            const massAssignments = await autoAssignSingleMass({
              dateISO,
              massLabel,
              availableMembers: normalizedMembers,
              historicalAssignments: historicalAssignments || [],
              sundayAssignments,
              templateID: null,
              onAssign: () => {
                totalAssignments += 1;
                ui.membersAssigned = totalAssignments;
                AssignProgress.maybePaint(ui);
              },
            });

            // Fallback: if onAssign wasn’t called (e.g., no inserts), add the count
            if (massAssignments > 0) {
              totalAssignments += 0; // already added via onAssign above
            }

            stats.massesProcessed += 1;
            ui.massesProcessed = stats.massesProcessed;

            // keep same-day tracking in sync
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

            // Count the mass as processed so the bar advances
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

    stats.membersAssigned = totalAssignments;
    AssignProgress.unmount();

    const successMessage =
      `Successfully auto-assigned schedules!\n\n` +
      `Sundays processed: ${stats.sundaysProcessed}\n` +
      `Masses processed: ${stats.massesProcessed}\n` +
      `Total assignments: ${stats.membersAssigned}\n` +
      (stats.errors.length ? `Errors: ${stats.errors.length}` : ``);

    if (stats.errors.length) {
      alert(`Partial Success\n\n${successMessage}`);
    } else {
      alert(successMessage);
    }

    return { success: true, message: successMessage, stats };
  } catch (error) {
    console.error("Auto-assignment failed:", error);
    AssignProgress.unmount();
    alert(`Auto-Assignment Failed:\n${error.message}`);
    return {
      success: false,
      message: `Auto-assignment failed: ${error.message}`,
      stats: {},
    };
  }
};*/

/*export const autoAssignSundaySchedules = async (year, month) => {
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

  if (!result.isConfirmed) {
    return;
  }

  try {
    // Show loading indicator
    Swal.fire({
      title: "Auto-assigning schedules...",
      text: "This may take a moment",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Get all Sundays in the month
    const sundays = getSundaysInMonth(year, month);

    if (sundays.length === 0) {
      await Swal.fire(
        "No Sundays Found",
        "No Sundays found in the selected month.",
        "info"
      );
      return {
        success: false,
        message: "No Sundays found in the selected month",
        stats: {},
      };
    }

    // Get historical assignments for rotation analysis (last 6 months)
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
    }

    // Get all available altar server members
    const availableMembers = await fetchAltarServerMembersWithRole();
    const normalizedMembers = normalizeMembers(availableMembers);

    let totalAssignments = 0;
    let stats = {
      sundaysProcessed: 0,
      massesProcessed: 0,
      membersAssigned: 0,
      errors: [],
    };

    // Process each Sunday
    for (const sunday of sundays) {
      const dateISO = ymdLocal(sunday);
      const sundayMasses = [
        "1st Mass - 6:00 AM",
        "2nd Mass - 8:00 AM",
        "3rd Mass - 5:00 PM",
      ];

      try {
        // Track members assigned on this Sunday to prevent over-assignment
        const sundayAssignments = new Set();

        // Process each mass for this Sunday
        for (const massLabel of sundayMasses) {
          try {
            const massAssignments = await autoAssignSingleMass({
              dateISO,
              massLabel,
              availableMembers: normalizedMembers,
              historicalAssignments: historicalAssignments || [],
              sundayAssignments,
              templateID: null, // Sunday masses don't use templates
            });

            totalAssignments += massAssignments;
            stats.massesProcessed++;

            // Add assigned members to Sunday tracking
            const { data: newAssignments } = await supabase
              .from("altar-server-placeholder")
              .select("idNumber")
              .eq("date", dateISO)
              .eq("mass", massLabel);

            newAssignments?.forEach((assignment) => {
              sundayAssignments.add(String(assignment.idNumber));
            });
          } catch (massError) {
            console.error(
              `Error assigning ${massLabel} on ${dateISO}:`,
              massError
            );
            stats.errors.push(`${dateISO} ${massLabel}: ${massError.message}`);
          }
        }

        stats.sundaysProcessed++;
      } catch (sundayError) {
        console.error(`Error processing Sunday ${dateISO}:`, sundayError);
        stats.errors.push(`${dateISO}: ${sundayError.message}`);
      }
    }

    // Update stats
    stats.membersAssigned = totalAssignments;

    // Close loading and show results
    await Swal.close();

    const successMessage = `Successfully auto-assigned schedules!\n\nSundays processed: ${stats.sundaysProcessed}\nMasses processed: ${stats.massesProcessed}\nTotal assignments: ${stats.membersAssigned}`;

    if (stats.errors.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Partial Success",
        text: `${successMessage}\n\nSome errors occurred during assignment.`,
        footer: `Errors: ${stats.errors.length}`,
      });
    } else {
      await Swal.fire({
        icon: "success",
        title: "Auto-Assignment Complete!",
        text: successMessage,
      });
    }

    //window.location.reload();

    return {
      success: true,
      message: successMessage,
      stats,
    };
  } catch (error) {
    console.error("Auto-assignment failed:", error);
    await Swal.close();
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
};*/

/*const autoAssignSingleMass = async ({
  dateISO,
  massLabel,
  availableMembers,
  historicalAssignments,
  sundayAssignments,
  templateID,
}) => {
  // Check existing assignments for this mass
  const { data: existingAssignments } = await supabase
    .from("altar-server-placeholder")
    .select("role, slot, idNumber")
    .eq("date", dateISO)
    .eq("mass", massLabel);

  // Track what's already assigned
  const existingByRole = {};
  (existingAssignments || []).forEach((assignment) => {
    if (!existingByRole[assignment.role]) {
      existingByRole[assignment.role] = [];
    }
    existingByRole[assignment.role].push({
      slot: assignment.slot,
      idNumber: assignment.idNumber,
    });
  });

  // Sunday role requirements
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

  // Process each role
  for (const [roleKey, requiredCount] of Object.entries(roleRequirements)) {
    const existing = existingByRole[roleKey] || [];
    const needToAssign = requiredCount - existing.length;

    if (needToAssign <= 0) {
      continue; // Role is already fully assigned
    }

    try {
      // Get available members for this role with rotation scoring
      const candidatesForRole = availableMembers
        .filter((member) => {
          // Don't assign if already assigned on this Sunday
          if (sundayAssignments.has(member.idNumber)) {
            return false;
          }

          // Don't assign if already assigned to this mass
          const alreadyInMass = (existingAssignments || []).some(
            (assignment) => String(assignment.idNumber) === member.idNumber
          );
          if (alreadyInMass) {
            return false;
          }

          return true;
        })
        .map((member) => {
          const rotationScore = calculateRotationScore(
            member.idNumber,
            roleKey,
            historicalAssignments,
            dateISO
          );

          return {
            ...member,
            rotationScore,
          };
        })
        .sort((a, b) => a.rotationScore - b.rotationScore); // Lower score = higher priority

      // Apply gender constraints for specific roles
      let filteredCandidates = candidatesForRole;

      if (roleKey === "candleBearer" || roleKey === "beller") {
        // For roles requiring 2 people, ensure gender consistency
        if (existing.length > 0) {
          // Find gender of existing member
          const existingMember = availableMembers.find(
            (m) => m.idNumber === String(existing[0].idNumber)
          );
          if (existingMember?.sex) {
            filteredCandidates = candidatesForRole.filter(
              (c) => c.sex === existingMember.sex
            );
          }
        }
      }

      // Select the best candidates
      const selectedMembers = filteredCandidates.slice(0, needToAssign);

      if (selectedMembers.length < needToAssign) {
        console.warn(
          `Could only find ${selectedMembers.length} members for ${roleKey} (needed ${needToAssign})`
        );
      }

      // Assign the selected members
      if (selectedMembers.length > 0) {
        const assignments = selectedMembers.map((member, index) => ({
          date: dateISO,
          mass: massLabel,
          templateID: templateID,
          role: roleKey,
          slot: existing.length + index + 1,
          idNumber: member.idNumber,
        }));

        const { error } = await supabase
          .from("altar-server-placeholder")
          .insert(assignments);

        if (error) {
          throw new Error(`Failed to assign ${roleKey}: ${error.message}`);
        }

        // Track assignments
        selectedMembers.forEach((member) => {
          sundayAssignments.add(member.idNumber);
        });

        totalNewAssignments += selectedMembers.length;
      }
    } catch (roleError) {
      console.error(`Error assigning role ${roleKey}:`, roleError);
      throw roleError;
    }
  }

  return totalNewAssignments;
};*/

/*export const autoAssignSundaySchedules = async (year, month) => {
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

  // SweetAlert confirm (replaces window.confirm)
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

  // UI state for the overlay
  const ui = {
    sundaysProcessed: 0,
    totalSundays: 0,
    massesProcessed: 0,
    totalMasses: 0,
    membersAssigned: 0,
    errors: 0,
  };

  // ---- counters & stable callbacks (avoid no-loop-func) ----
  const counters = { totalAssignments: 0 };
  const handleAssign = () => {
    counters.totalAssignments += 1;
    ui.membersAssigned = counters.totalAssignments;
    AssignProgress.maybePaint(ui);
  };

  try {
    AssignProgress.mount(monthText);

    // Get Sundays
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

    // Loop Sundays
    for (const sunday of sundays) {
      const dateISO = ymdLocal(sunday);
      try {
        const sundayAssignments = new Set();

        // Loop masses
        for (const massLabel of sundayMasses) {
          try {
            // Pass stable callback (defined outside the loop)
            const massAssignments = await autoAssignSingleMass({
              dateISO,
              massLabel,
              availableMembers: normalizedMembers,
              historicalAssignments: historicalAssignments || [],
              sundayAssignments,
              templateID: null,
              onAssign: handleAssign, // ✅ stable reference, no-loop-func safe
            });

            if (!massAssignments > 0) {
              // already counted via onAssign callback
            }

            stats.massesProcessed += 1;
            ui.massesProcessed = stats.massesProcessed;

            // keep same-day tracking in sync
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

            // Count the mass as processed so the bar advances
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

    // SweetAlert result (replaces alert)
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
      window.location.reload(); // <-- reload after alert
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
  onAssign, // NEW (optional)
}) => {
  const { data: existingAssignments } = await supabase
    .from("altar-server-placeholder")
    .select("role, slot, idNumber")
    .eq("date", dateISO)
    .eq("mass", massLabel);

  const existingByRole = {};
  (existingAssignments || []).forEach((assignment) => {
    if (!existingByRole[assignment.role]) existingByRole[assignment.role] = [];
    existingByRole[assignment.role].push({
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
      const candidatesForRole = availableMembers
        .filter((member) => {
          if (sundayAssignments.has(member.idNumber)) return false;
          const alreadyInMass = (existingAssignments || []).some(
            (a) => String(a.idNumber) === member.idNumber
          );
          if (alreadyInMass) return false;
          return true;
        })
        .map((member) => ({
          ...member,
          rotationScore: calculateRotationScore(
            member.idNumber,
            roleKey,
            historicalAssignments,
            dateISO
          ),
        }))
        .sort((a, b) => a.rotationScore - b.rotationScore);

      let filteredCandidates = candidatesForRole;

      if (roleKey === "candleBearer" || roleKey === "beller") {
        if (existing.length > 0) {
          const existingMember = availableMembers.find(
            (m) => m.idNumber === String(existing[0].idNumber)
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
        idNumber: member.idNumber,
      }));

      const { error } = await supabase
        .from("altar-server-placeholder")
        .insert(assignments);

      if (error)
        throw new Error(`Failed to assign ${roleKey}: ${error.message}`);

      // Update Sunday tracking + per-member callback
      selectedMembers.forEach((member) => {
        sundayAssignments.add(member.idNumber);
        if (typeof onAssign === "function") onAssign(member.idNumber); // 🔔 increment counter in UI
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
      // Sunday
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
};*/

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
