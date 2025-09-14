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

export const createTemplate = async ({
  templateName,
  massType,
  selectedDepartments = [],
  mode = {},
  enabledRoles = {},
}) => {
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

    // --- Confirm ---
    const confirm = await Swal.fire({
      icon: "question",
      title: "are you sure to create this template?",
      showCancelButton: true,
      confirmButtonText: "Yes, create it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return null;

    // helpers
    const isSelected = (dept) => selectedDepartments.includes(dept);
    const useDefaultIf = (dept, label) =>
      mode?.[dept] === "standard" ? true : !!enabledRoles?.[dept]?.[label];

    // defaults (match your UI)
    const ALTAR_DEFAULTS = {
      "candle-bearer": 2, // Candle Bearers
      beller: 2, // Bellers
      "cross-bearer": 1,
      "incense-bearer": 1,
      thurifer: 1,
      "main-server": 2,
      plate: 10,
    };
    const EUCH_DEFAULT = 4; // minister-count
    const CHOIR_DEFAULT = 1; // group-count
    const LECTOR_DEFAULTS = { reading: 2, intercession: 1 };

    // --- Insert header (template-information) ---
    const templateID = await getUniqueTemplateId();

    const { data: head, error: headErr } = await supabase
      .from("template-information")
      .insert([{ templateID, "template-name": name, "mass-type": type }])
      .select("id, templateID")
      .single();

    if (headErr) throw headErr;

    // --- Build detail payloads based on selection/mode/roles ---
    const altarPayload = (() => {
      if (!isSelected("altar")) {
        return {
          templateID,
          isNeeded: 0,
          "candle-bearer": 0,
          beller: 0,
          "cross-bearer": 0,
          "incense-bearer": 0,
          thurifer: 0,
          "main-server": 0,
          plate: 0,
        };
      }
      // selected
      return {
        templateID,
        isNeeded: 1,
        "candle-bearer": useDefaultIf("altar", "Candle Bearers")
          ? ALTAR_DEFAULTS["candle-bearer"]
          : 0,
        beller: useDefaultIf("altar", "Bellers") ? ALTAR_DEFAULTS.beller : 0,
        "cross-bearer": useDefaultIf("altar", "Cross Bearer")
          ? ALTAR_DEFAULTS["cross-bearer"]
          : 0,
        "incense-bearer": useDefaultIf("altar", "Incense Bearer")
          ? ALTAR_DEFAULTS["incense-bearer"]
          : 0,
        thurifer: useDefaultIf("altar", "Thurifer")
          ? ALTAR_DEFAULTS.thurifer
          : 0,
        "main-server": useDefaultIf("altar", "Main Servers")
          ? ALTAR_DEFAULTS["main-server"]
          : 0,
        plate: useDefaultIf("altar", "Plates") ? ALTAR_DEFAULTS.plate : 0,
      };
    })();

    const euchPayload = (() => {
      if (!isSelected("eucharistic")) {
        return { templateID, isNeeded: 0, "minister-count": 0 };
      }
      return {
        templateID,
        isNeeded: 1,
        "minister-count": useDefaultIf("eucharistic", "Minister")
          ? EUCH_DEFAULT
          : 0,
      };
    })();

    const choirPayload = (() => {
      if (!isSelected("choir")) {
        return { templateID, isNeeded: 0, "group-count": 0 };
      }
      return {
        templateID,
        isNeeded: 1,
        "group-count": useDefaultIf("choir", "Choir") ? CHOIR_DEFAULT : 0,
      };
    })();

    const lectorPayload = (() => {
      if (!isSelected("lector")) {
        return { templateID, isNeeded: 0, reading: 0, intercession: 0 };
      }
      return {
        templateID,
        isNeeded: 1,
        reading: useDefaultIf("lector", "Readings")
          ? LECTOR_DEFAULTS.reading
          : 0,
        intercession: useDefaultIf("lector", "Intercession")
          ? LECTOR_DEFAULTS.intercession
          : 0,
      };
    })();

    // --- Insert details (parallel) ---
    const inserts = await Promise.all([
      supabase.from("template-altar-server").insert([altarPayload]),
      supabase.from("template-eucharistic-minister").insert([euchPayload]),
      supabase.from("template-choir").insert([choirPayload]),
      supabase.from("template-lector-commentator").insert([lectorPayload]),
    ]);

    // check for any error
    const detailErr = inserts.find((r) => r.error);
    if (detailErr?.error) {
      // best-effort rollback to keep data consistent
      await Promise.allSettled([
        supabase
          .from("template-altar-server")
          .delete()
          .eq("templateID", templateID),
        supabase
          .from("template-eucharistic-minister")
          .delete()
          .eq("templateID", templateID),
        supabase.from("template-choir").delete().eq("templateID", templateID),
        supabase
          .from("template-lector-commentator")
          .delete()
          .eq("templateID", templateID),
        supabase
          .from("template-information")
          .delete()
          .eq("templateID", templateID),
      ]);
      throw detailErr.error;
    }

    // --- Success swal (no visible timer text) ---
    await Swal.fire({
      icon: "success",
      title: "Template Created!",
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false,
    });

    return head; // { id, templateID }
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

export const listTemplates = async () => {
  const { data, error } = await supabase
    .from("template-information")
    .select("id, templateID, template-name, mass-type")
    .order("id", { ascending: true }); // ascending order

  if (error) throw new Error(error.message);
  return data || [];
};

export const deleteTemplate = async (templateID, templateName) => {
  const res = await Swal.fire({
    icon: "warning",
    title: "Delete this template?",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  if (!res.isConfirmed) return false;

  // delete detail rows first (avoid FK issues), then the header
  const [altarRes, euchRes, choirRes, lectorRes] = await Promise.all([
    supabase
      .from("template-altar-server")
      .delete()
      .eq("templateID", templateID),
    supabase
      .from("template-eucharistic-minister")
      .delete()
      .eq("templateID", templateID),
    supabase.from("template-choir").delete().eq("templateID", templateID),
    supabase
      .from("template-lector-commentator")
      .delete()
      .eq("templateID", templateID),
  ]);

  const firstErr =
    altarRes.error || euchRes.error || choirRes.error || lectorRes.error;
  if (firstErr) {
    await Swal.fire({
      icon: "error",
      title: "Delete Failed",
      text: firstErr.message,
      confirmButtonText: "OK",
    });
    return false;
  }

  const { error: headErr } = await supabase
    .from("template-information")
    .delete()
    .eq("templateID", templateID);

  if (headErr) {
    await Swal.fire({
      icon: "error",
      title: "Delete Failed",
      text: headErr.message,
      confirmButtonText: "OK",
    });
    return false;
  }

  await Swal.fire({
    icon: "success",
    title: "Deleted",
    timer: 1200,
    timerProgressBar: true,
    showConfirmButton: false,
  });
  return true;
};
