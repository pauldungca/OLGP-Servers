import { supabase } from "../../utils/supabase";

export const fetchAltarServerMembers = async () => {
  try {
    // Fetch ALL columns from Supabase
    const { data, error } = await supabase
      .from("altar-server-members")
      .select("*") // Get all columns
      .order("dateJoined", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Supabase error:", error.message);
    return [];
  }
};
