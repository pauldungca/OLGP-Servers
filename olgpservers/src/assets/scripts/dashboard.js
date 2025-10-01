import { supabase } from "../../utils/supabase";

import { isAltarServerScheduler, isLectorCommentatorScheduler } from "./member";
import { isEucharisticMinisterScheduler, isChoirScheduler } from "./group";

import {
  isAltarServerMember,
  isEucharisticMinisterMember,
  isChoirMember,
  isLectorCommentatorMember,
} from "./viewScheduleNormal";

export const fetchAuthRowByIdNumber = async (id) => {
  const { data, error } = await supabase
    .from("authentication")
    .select("hasAgree")
    .eq("idNumber", id)
    .single();
  return { data, error };
};

export const setHasAgreeTrue = async (id) => {
  const { data, error } = await supabase
    .from("authentication")
    .update({ hasAgree: 1 })
    .eq("idNumber", id)
    .select()
    .single();
  return { data, error };
};

export const redirectOnExit = () => {
  window.location.href = "/logout";
};

export async function isAnyMember(idNumber) {
  try {
    const [altar, lector, euch, choir] = await Promise.all([
      isAltarServerMember(idNumber),
      isLectorCommentatorMember(idNumber),
      isEucharisticMinisterMember(idNumber),
      isChoirMember(idNumber),
    ]);
    return !!(altar || lector || euch || choir);
  } catch {
    return false;
  }
}

export async function isAnyScheduler(idNumber) {
  // you already count this, so reuse the logic
  const n = await countDepartmentHandles(idNumber); // returns # of scheduler depts
  return n > 0;
}

export async function countDepartmentHandles(idNumber) {
  let count = 0;

  try {
    const altar = await isAltarServerScheduler(idNumber);
    if (altar) count++;

    const lector = await isLectorCommentatorScheduler(idNumber);
    if (lector) count++;

    const eucharist = await isEucharisticMinisterScheduler(idNumber);
    if (eucharist) count++;

    const choir = await isChoirScheduler(idNumber);
    if (choir) count++;
  } catch (err) {
    console.error("Error counting department handles:", err);
  }

  return count;
}

export async function getDepartmentCardInfo(idNumber) {
  if (!idNumber) return { count: 0, label: "Department Assigned" };

  // --- check schedulers in parallel
  const [altarSched, lectorSched, euchSched, choirSched] = await Promise.all([
    isAltarServerScheduler(idNumber),
    isLectorCommentatorScheduler(idNumber),
    isEucharisticMinisterScheduler(idNumber),
    isChoirScheduler(idNumber),
  ]);

  const schedulerCount = [
    altarSched,
    lectorSched,
    euchSched,
    choirSched,
  ].filter(Boolean).length;

  if (schedulerCount > 0) {
    return { count: schedulerCount, label: "Department Handled" };
  }

  // --- if not scheduler, check members
  const [altarMem, lectorMem, euchMem, choirMem] = await Promise.all([
    isAltarServerMember(idNumber),
    isLectorCommentatorMember(idNumber),
    isEucharisticMinisterMember(idNumber),
    isChoirMember(idNumber),
  ]);

  const memberCount = [altarMem, lectorMem, euchMem, choirMem].filter(
    Boolean
  ).length;

  return { count: memberCount, label: "Department Assigned" };
}

export async function countSchedulesAssigned(idNumber) {
  let total = 0;

  try {
    // Altar Server
    const { data: altar, error: altarErr } = await supabase
      .from("altar-server-placeholder")
      .select("idNumber")
      .eq("idNumber", idNumber);
    if (!altarErr) total += altar?.length || 0;

    // Lector Commentator
    const { data: lector, error: lectorErr } = await supabase
      .from("lector-commentator-placeholder")
      .select("idNumber")
      .eq("idNumber", idNumber);
    if (!lectorErr) total += lector?.length || 0;

    // Eucharistic Minister
    const { data: euch, error: euchErr } = await supabase
      .from("eucharistic-minister-placeholder")
      .select("idNumber")
      .eq("idNumber", idNumber);
    if (!euchErr) total += euch?.length || 0;

    // Choir (via groups; member table uses abbreviations, placeholder uses full names)
    const { data: memberGroups, error: mgErr } = await supabase
      .from("choir-member-group")
      .select("choir-group-name")
      .eq("idNumber", idNumber);

    if (!mgErr && memberGroups?.length) {
      // 1) unique abbreviations from member-group
      const abbrevs = [
        ...new Set(
          memberGroups.map((r) => r["choir-group-name"]).filter(Boolean)
        ),
      ];

      if (abbrevs.length) {
        // 2) map abbreviations -> full group names via choir-groups
        const { data: groups, error: cgErr } = await supabase
          .from("choir-groups")
          .select("group-name, abbreviation")
          .in("abbreviation", abbrevs);

        if (!cgErr && groups?.length) {
          const fullNames = [
            ...new Set(groups.map((g) => g["group-name"]).filter(Boolean)),
          ];

          if (fullNames.length) {
            // 3) count choir placeholders for those full group names
            const { data: choir, error: choirErr } = await supabase
              .from("choir-placeholder")
              .select("group")
              .in("group", fullNames);

            if (!choirErr) total += choir?.length || 0;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error counting schedules assigned:", err);
  }

  return total;
}
