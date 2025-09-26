// assets/scripts/assignMember.js
import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";
import { fetchAltarServerMembersWithRole } from "./fetchMember";
import { getTemplateFlagsForDate } from "./fetchSchedule";

/**
 * =========================
 * CORE DB OPS (existing)
 * =========================
 */
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

/**
 * =========================
 * ROLE ROTATION HELPERS
 * =========================
 */

/**
 * Calculate rotation priority score for a member for a specific role
 * Lower score = higher priority for assignment
 */
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

/**
 * Get rotation statistics for a member
 */
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

/**
 * Check if a member needs priority for role rotation
 */
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

/**
 * =========================
 * UTILITIES (from AssignMember)
 * =========================
 */

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
  return replacePlaceholderRoleAssignments({
    dateISO,
    massLabel,
    templateID,
    roleKey,
    members: chosen,
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

// Whether we must fetch template flags (non-Sunday and has date)
export const needTemplateFlagsFor = ({ isSunday, selectedISO }) =>
  !isSunday && !!selectedISO;

// Thin passthrough (keeps imports centralized here)
export const getTemplateFlags = async (selectedISO) =>
  getTemplateFlagsForDate(selectedISO);

// Compute slot counts per role given flags OR default Sunday values
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

// Visibility per role (true if Sunday or count>0)
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

// Load grouped assignments (preview tiles)
export const fetchAssignmentsGrouped = async ({ dateISO, massLabel }) =>
  getAssignmentsForCards(dateISO, massLabel);

// Reset all assignments for the (date,mass)
export const resetAllAssignments = async ({ dateISO, massLabel }) =>
  clearAssignmentsFor(dateISO, massLabel);

// Build navigation state payload for /assignMemberAltarServer
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

/*

AUTOMATED SCHEDULING FUNCTIONS

*/

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
};

const autoAssignSingleMass = async ({
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
};
