import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";

export const isEucharisticMinisterScheduler = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`eucharistic-minister-scheduler`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching eucharistic minister status:", error);
      return false;
    }

    return data["eucharistic-minister-scheduler"] === 1;
  } catch (err) {
    console.error("Error in fetchEucharisticMinisterStatus:", err);
    return false;
  }
};

export const isChoirScheduler = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`choir-scheduler`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching choir status:", error);
      return false;
    }

    return data["choir-scheduler"] === 1;
  } catch (err) {
    console.error("Error in fetchChoirStatus:", err);
    return false;
  }
};

export const fetchEucharisticMinisterGroups = async () => {
  try {
    const { data, error } = await supabase
      .from("eucharistic-minister-groups")
      .select("id, group-name");

    if (error) throw error;

    // Map to cleaner format
    return data.map((group) => ({
      id: group.id,
      name: group["group-name"],
    }));
  } catch (err) {
    console.error("Error fetching groups:", err.message);
    return [];
  }
};

export const addEucharisticMinisterGroup = async () => {
  try {
    const { value: groupName } = await Swal.fire({
      title: "Add New Group",
      input: "text",
      inputLabel: "Group Name",
      inputPlaceholder: "Enter group name",
      showCancelButton: true,
      confirmButtonText: "Add",
      reverseButtons: true,
    });

    if (!groupName) return null;

    const { data, error } = await supabase
      .from("eucharistic-minister-groups")
      .insert([{ "group-name": groupName }])
      .select();

    if (error) throw error;

    Swal.fire("Success", `Group "${groupName}" added!`, "success");

    // Return the new group in same format as fetch
    return {
      id: data[0].id,
      name: data[0]["group-name"],
    };
  } catch (err) {
    console.error("Error adding group:", err.message);
    Swal.fire("Error", "Failed to add group.", "error");
    return null;
  }
};

export const deleteEucharisticMinisterGroup = async (groupId, groupName) => {
  try {
    const result = await Swal.fire({
      title: `Delete "${groupName}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return false;

    const { error } = await supabase
      .from("eucharistic-minister-groups")
      .delete()
      .eq("id", groupId);

    if (error) throw error;

    Swal.fire("Deleted!", `"${groupName}" has been deleted.`, "success");
    return true;
  } catch (err) {
    console.error("Error deleting group:", err.message);
    Swal.fire("Error", "Failed to delete group.", "error");
    return false;
  }
};

export const navigationAddMember = (navigate, state) => () => {
  navigate("/groupAddMember", { state });
};

export const navigationSelectDepartment = (navigate, state) => () => {
  navigate("/groupSelectDepartment", { state });
};

export const handleViewInformation = (navigate, member, department) => () => {
  navigate("/groupViewMemberInformation", {
    state: {
      idNumber: member.idNumber,
      department: department,
    },
  });
};
