import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";

export const generateTemplateId = () => {
  const four = Math.floor(1000 + Math.random() * 9000);
  return `2025${four}`;
};

export const getUniqueTemplateId = async () => {
  for (let i = 0; i < 5; i++) {
    const candidate = generateTemplateId();
    const { count, error } = await supabase
      .from("template-inforamtion")
      .select("id", { count: "exact", head: true })
      .eq("templateID", candidate);

    if (error) throw new Error(error.message);
    if (!count || count === 0) return candidate;
  }
  throw new Error("Could not generate a unique templateID. Please try again.");
};

export const createTemplate = async ({ templateName, massType }) => {
  try {
    const name = (templateName || "").trim();
    const type = (massType || "").trim();

    // --- Validation ---
    if (!name) {
      await Swal.fire({
        icon: "warning",
        title: "Template name is required",
        confirmButtonText: "OK",
      });
      return null;
    }

    if (!type) {
      await Swal.fire({
        icon: "warning",
        title: "Mass type is required",
        confirmButtonText: "OK",
      });
      return null;
    }

    // --- Ask confirmation ---
    const confirm = await Swal.fire({
      icon: "question",
      title: "Are you sure to create this template?",
      showCancelButton: true,
      confirmButtonText: "Yes, create it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return null;
    }

    // --- Insert into Supabase ---
    const templateID = await getUniqueTemplateId();

    const { data, error } = await supabase
      .from("template-information")
      .insert([
        {
          templateID,
          "template-name": name,
          "mass-type": type,
        },
      ])
      .select("id, templateID")
      .single();

    if (error) throw error;

    // --- Success Swal with countdown ---
    await Swal.fire({
      icon: "success",
      title: "Template Created!",
      timer: 1200,
      timerProgressBar: true,
      showConfirmButton: false,
    });

    return data;
  } catch (err) {
    await Swal.fire({
      icon: "error",
      title: "Create Failed",
      text: err?.message || "Something went wrong.",
      confirmButtonText: "OK",
    });
    return null;
  }
};

export const confirmCancel = async () => {
  const res = await Swal.fire({
    icon: "question",
    title: "Discard changes?",
    text: "Any unsaved selections will be lost.",
    showCancelButton: true,
    confirmButtonText: "Yes, cancel",
    cancelButtonText: "Stay",
    reverseButtons: true,
  });
  return !!res.isConfirmed;
};
