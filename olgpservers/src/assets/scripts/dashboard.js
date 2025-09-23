import { supabase } from "../../utils/supabase";

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
