import Swal from "sweetalert2";
import { supabase } from "../../utils/supabase";
import dayjs from "dayjs";

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

export const updateTemplate = async ({
  templateID,
  templateName,
  massType,
  selectedDepartments = [],
  mode = {},
  enabledRoles = {},
  counts = {},
}) => {
  const confirm = await Swal.fire({
    icon: "question",
    title: "Save changes to this template?",
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  if (!confirm.isConfirmed) return false;

  // Helpers
  const isSelected = (dept) => selectedDepartments.includes(dept);
  const useDefaultIf = (dept, label) =>
    mode?.[dept] === "standard" ? true : !!enabledRoles?.[dept]?.[label];

  // Defaults
  const ALTAR_DEFAULTS = {
    "candle-bearer": 2,
    beller: 2,
    "cross-bearer": 1,
    "incense-bearer": 1,
    thurifer: 1,
    "main-server": 2,
    plate: 10, 
  };
  const EUCHARISTIC_DEFAULTS = { minister: 6 };
  const CHOIR_DEFAULTS = { choir: 1 };
  const LECTOR_DEFAULTS = { reading: 2, intercession: 1 };

  // Build payloads
  const altarPayload = isSelected("altar")
    ? (() => {
        if (mode.altar === "custom") {
          return {
            templateID,
            isNeeded: 1,
            "candle-bearer": Number(counts.altar?.["Candle Bearers"] || 0),
            beller: Number(counts.altar?.["Bellers"] || 0),
            "cross-bearer": Number(counts.altar?.["Cross Bearer"] || 0),
            "incense-bearer": Number(counts.altar?.["Incense Bearer"] || 0),
            thurifer: Number(counts.altar?.["Thurifer"] || 0),
            "main-server": Number(counts.altar?.["Main Servers"] || 0),
            plate: Number(counts.altar?.["Plates"] || 0), 
          };
        }
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
          plate: useDefaultIf("altar", "Plates") ? ALTAR_DEFAULTS.plate : 0, // ✅ singular
        };
      })()
    : { templateID, isNeeded: 0 };

  const eucharisticPayload = isSelected("eucharistic")
    ? (() => {
        if (mode.eucharistic === "custom") {
          return {
            templateID,
            isNeeded: 1,
            "minister-count": Number(
              counts.eucharistic?.Minister ?? counts.eucharistic?.minister ?? 0
            ),
          };
        }
        return {
          templateID,
          isNeeded: 1,
          "minister-count": EUCHARISTIC_DEFAULTS.minister,
        };
      })()
    : { templateID, isNeeded: 0 };

  const choirPayload = isSelected("choir")
    ? (() => {
        if (mode.choir === "custom") {
          return {
            templateID,
            isNeeded: 1,
            "group-count": Number(counts.choir?.Choir || 0),
          };
        }
        return {
          templateID,
          isNeeded: 1,
          "group-count": CHOIR_DEFAULTS.choir,
        };
      })()
    : { templateID, isNeeded: 0 };

  const lectorPayload = isSelected("lector")
    ? (() => {
        if (mode.lector === "custom") {
          return {
            templateID,
            isNeeded: 1,
            reading: Number(counts.lector?.Readings || 0),
            intercession: Number(counts.lector?.Intercession || 0),
          };
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
      })()
    : { templateID, isNeeded: 0 };

  // 1) Update header
  {
    const { error: upErr } = await supabase
      .from("template-information")
      .update({
        "template-name": templateName,
        "mass-type": massType,
      })
      .eq("templateID", templateID);

    if (upErr) {
      await Swal.fire({
        icon: "error",
        title: "Failed to update template",
        text: upErr.message || "Unknown error",
        confirmButtonText: "OK",
      });
      return false;
    }
  }

  // 2) Upserts (or switch to updateOrInsert if you don’t add UNIQUE)
  const upserts = [
    supabase.from("template-altar-server").upsert(altarPayload, {
      onConflict: "templateID",
    }),
    supabase.from("template-eucharistic-minister").upsert(eucharisticPayload, {
      onConflict: "templateID",
    }),
    supabase.from("template-choir").upsert(choirPayload, {
      onConflict: "templateID",
    }),
    supabase
      .from("template-lector-commentator")
      .upsert(lectorPayload, { onConflict: "templateID" }),
  ];

  const results = await Promise.all(upserts);
  const firstErr = results.find((r) => r.error)?.error;

  if (firstErr) {
    await Swal.fire({
      icon: "error",
      title: "Failed to save details",
      text: firstErr.message || "Unknown error",
      confirmButtonText: "OK",
    });
    return false;
  }

  await Swal.fire({
    icon: "success",
    title: "Template updated",
    timer: 1200,
    timerProgressBar: true,
    showConfirmButton: false,
  });
  return true;
};

export const getTemplateDetails = async (templateID) => {
  if (!templateID) throw new Error("Missing templateID");

  const headerQ = supabase
    .from("template-information")
    .select("templateID, template-name, mass-type")
    .eq("templateID", templateID)
    .single();

  const altarQ = supabase
    .from("template-altar-server")
    .select(
      "templateID, isNeeded, candle-bearer, beller, cross-bearer, incense-bearer, thurifer, main-server, plate"
    )
    .eq("templateID", templateID)
    .maybeSingle();

  const eucharisticQ = supabase
    .from("template-eucharistic-minister")
    .select("templateID, isNeeded, minister-count")
    .eq("templateID", templateID)
    .maybeSingle();

  const choirQ = supabase
    .from("template-choir")
    .select("templateID, isNeeded, group-count")
    .eq("templateID", templateID)
    .maybeSingle();

  const lectorQ = supabase
    .from("template-lector-commentator")
    .select("templateID, isNeeded, reading, intercession")
    .eq("templateID", templateID)
    .maybeSingle();

  const [
    { data: header, error: hErr },
    { data: altar, error: aErr },
    { data: eucharistic, error: eErr },
    { data: choir, error: cErr },
    { data: lector, error: lErr },
  ] = await Promise.all([headerQ, altarQ, eucharisticQ, choirQ, lectorQ]);

  const firstErr = hErr || aErr || eErr || cErr || lErr;
  if (firstErr) throw firstErr;

  return { header, altar, eucharistic, choir, lector };
};

export const addUseTemplate = async ({
  scheduleID,
  templateID,
  date,
  time,
  clientName,
  note,
}) => {
  if (!templateID) {
    await Swal.fire({
      icon: "error",
      title: "Missing template",
      text: "Template ID is required.",
    });
    return false;
  }
  if (!date || !time) {
    await Swal.fire({
      icon: "warning",
      title: "Incomplete fields",
      text: "Please select a date and time.",
    });
    return false;
  }
  if (!clientName || !clientName.trim()) {
    await Swal.fire({
      icon: "warning",
      title: "Missing client name",
      text: "Please enter the client’s name.",
    });
    return false;
  }

  const ok = await Swal.fire({
    icon: "question",
    title: "Add this schedule?",
    text: `Template will be scheduled for ${clientName}`,
    showCancelButton: true,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  if (!ok.isConfirmed) return false;

  const payload = {
    scheduleID,
    templateID,
    clientName: clientName.trim(), // ✅ now stored in DB
    date,
    time,
    note: note?.trim() ? note.trim() : null,
  };

  const { error } = await supabase.from("use-template-table").insert(payload);
  if (error) {
    await Swal.fire({
      icon: "error",
      title: "Failed to add schedule",
      text: error.message || "Unknown error",
    });
    return false;
  }

  await Swal.fire({
    icon: "success",
    title: "Schedule added",
    timer: 1200,
    timerProgressBar: true,
    showConfirmButton: false,
  });
  return true;
};

export const confirmCancelUseTemplate = async () => {
  const res = await Swal.fire({
    icon: "warning",
    title: "Cancel this process?",
    text: "Your selections will not be saved.",
    showCancelButton: true,
    confirmButtonText: "Yes, cancel",
    cancelButtonText: "Stay",
    reverseButtons: true,
  });
  return res.isConfirmed;
};

export const disablePastDates = (current) => {
  return current && current < dayjs().startOf("day");
};

export const disablePastTimes = (dateVal) => {
  // Only restrict when the selected date is today
  if (!dateVal || !dateVal.isSame(dayjs(), "day")) return {};

  const now = dayjs();
  const curH = now.hour(); // 0..23
  const curM = now.minute(); // 0..59
  const curS = now.second(); // 0..59

  return {
    disabledHours: () => Array.from({ length: curH }, (_, i) => i), // 0..curH-1
    disabledMinutes: (hour) =>
      hour === curH ? Array.from({ length: curM }, (_, i) => i) : [],
    disabledSeconds: (hour, minute) =>
      hour === curH && minute === curM
        ? Array.from({ length: curS }, (_, i) => i)
        : [],
  };
};

export const handleNoteChange = (e, setNote) => {
  if (e.target.value.length <= 150) {
    setNote(e.target.value);
  }
};

export const handleAddSchedule = async ({
  dateVal,
  timeVal,
  templateID,
  clientName,
  note,
  navigate,
}) => {
  if (!dateVal || !timeVal) {
    await Swal.fire({
      icon: "warning",
      title: "Incomplete fields",
      text: "Please select a date and time.",
    });
    return;
  }

  const scheduleID = Date.now();
  const dateStr = dayjs(dateVal).format("YYYY-MM-DD");
  const timeStr = dayjs(timeVal).format("HH:mm:ss");

  const ok = await addUseTemplate({
    scheduleID,
    templateID: Number(templateID),
    clientName,
    date: dateStr,
    time: timeStr,
    note,
  });

  if (ok) navigate("/selectTemplate");
};

export const handleCancel = async (navigate) => {
  const ok = await confirmCancelUseTemplate();
  if (ok) navigate("/selectTemplate");
};

export const getEucharisticMax = async () => {
  const { count, error } = await supabase
    .from("user-type")
    .select("*", { count: "exact", head: true }) // HEAD request; returns only count
    .eq("eucharistic-minister-member", 1);

  if (error) {
    console.error("getEucharisticMax error:", error);
    return 0;
  }
  return count ?? 0;
};

export const getChoirMax = async () => {
  const { count, error } = await supabase
    .from("choir-groups")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("getChoirMax error:", error);
    return 0;
  }
  return count ?? 0;
};
