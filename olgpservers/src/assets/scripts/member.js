import { supabase } from "../../utils/supabase";

export const createButtonCard = (images, navigate) => {
  return function ButtonCard({ department, parish, toPage }) {
    return (
      <button className="member-card" onClick={() => navigate(toPage)}>
        <img src={images.OLGPlogo} alt={department} />
        <div>
          <div className="member-card-title">{department}</div>
          <div className="member-card-subtitle">{parish}</div>
        </div>
      </button>
    );
  };
};

export const isAltarServerScheduler = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`altar-server-scheduler`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching altar server status:", error);
      return false;
    }

    return data["altar-server-scheduler"] === 1;
  } catch (err) {
    console.error("Error in fetchAltarServerStatus:", err);
    return false;
  }
};

export const isLectorCommentatorScheduler = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`lector-commentator`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching lector commentator status:", error);
      return false;
    }

    return data["lector-commentator"] === 1;
  } catch (err) {
    console.error("Error in fetchLectorCommentatorStatus:", err);
    return false;
  }
};

export const navigationAddMember = (navigate) => {
  return () => {
    navigate("/addMember");
  };
};

export const navigationSelectDepartment = (navigate) => {
  return () => {
    navigate("/selectDepartment");
  };
};
