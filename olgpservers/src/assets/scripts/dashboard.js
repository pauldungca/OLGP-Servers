import { supabase } from "../../utils/supabase";

import { isAltarServerScheduler, isLectorCommentatorScheduler } from "./member";
import { isEucharisticMinisterScheduler, isChoirScheduler } from "./group";

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

    // Choir (via groups)
    const { data: memberGroups, error: mgErr } = await supabase
      .from("choir-member-group")
      .select("choir-group-name")
      .eq("idNumber", idNumber);

    if (!mgErr && memberGroups?.length) {
      const groupNames = memberGroups.map((r) => r["choir-group-name"]);
      const { data: choir, error: choirErr } = await supabase
        .from("choir-placeholder")
        .select("group")
        .in("group", groupNames);

      if (!choirErr) total += choir?.length || 0;
    }
  } catch (err) {
    console.error("Error counting schedules assigned:", err);
  }

  return total;
}
