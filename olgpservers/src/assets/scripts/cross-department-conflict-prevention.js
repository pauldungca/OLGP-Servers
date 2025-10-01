import { supabase } from "../../utils/supabase";

export async function fetchCrossDepartmentConflicts(
  dateISO,
  massLabel,
  excludeDepartment = ""
) {
  const conflicts = new Set();

  try {
    const departments = [
      { name: "altar-server", table: "altar-server-placeholder" },
      { name: "lector-commentator", table: "lector-commentator-placeholder" },
      {
        name: "eucharistic-minister",
        table: "eucharistic-minister-placeholder",
      },
    ];

    const promises = departments
      .filter((dept) => dept.name !== excludeDepartment)
      .map((dept) =>
        supabase
          .from(dept.table)
          .select("idNumber")
          .eq("date", dateISO)
          .eq("mass", massLabel)
      );

    const results = await Promise.all(promises);

    results.forEach(({ data, error }) => {
      if (error) {
        console.error("Error fetching cross-dept conflicts:", error);
        return;
      }
      (data || []).forEach((row) => {
        if (row.idNumber) {
          conflicts.add(String(row.idNumber).trim());
        }
      });
    });

    return conflicts;
  } catch (err) {
    console.error("fetchCrossDepartmentConflicts error:", err);
    return new Set();
  }
}
