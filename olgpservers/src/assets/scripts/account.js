import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";

export const fetchMemberInformation = async (idNumber) => {
  if (!idNumber) return null;

  try {
    const { data, error } = await supabase
      .from("members-information")
      .select("*")
      .eq("idNumber", idNumber)
      .single();

    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error("fetchMemberInformation error:", err.message);
    return null;
  }
};

export const editMemberInfo = async (
  idNumber,
  firstName,
  middleName,
  lastName,
  address,
  sex,
  email,
  contactNumber
) => {
  if (!idNumber) {
    await Swal.fire({
      icon: "error",
      title: "Missing ID",
      text: "No ID number provided.",
    });
    return false;
  }

  // Confirm
  const confirm = await Swal.fire({
    icon: "question",
    title: "Save changes?",
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  if (!confirm.isConfirmed) return false;

  // Optional: normalize contact (digits only, max 11)
  const normalizedContact =
    String(contactNumber || "")
      .replace(/\D/g, "")
      .slice(0, 11) || null;

  try {
    const { data, error } = await supabase
      .from("members-information")
      .update({
        firstName,
        middleName: middleName || null,
        lastName,
        address,
        sex,
        email,
        contactNumber: normalizedContact,
      })
      .eq("idNumber", idNumber)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No rows updated");

    await Swal.fire({
      icon: "success",
      title: "Saved",
      text: "Your information was updated.",
    });

    return true;
  } catch (err) {
    console.error("editMemberInfo error:", err);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to save your information.",
    });
    return false;
  }
};
