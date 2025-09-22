import { supabase } from "../../utils/supabase";

export const createButtonCard = (navigate) => {
  return function ButtonCard({ department, parish, toPage, icon }) {
    return (
      <button
        className="member-card"
        onClick={() => navigate(toPage, { state: { department, parish } })}
      >
        <img
          src={icon}
          alt={department}
          style={{
            borderRadius: "100%",
          }}
        />
        <div>
          <div className="member-card-title">{department}</div>
          <div className="member-card-subtitle">{parish}</div>
        </div>
      </button>
    );
  };
};

export const createSelectedDepartmentCard = (navigate) => {
  return function SelectedDepartmentCard({
    department,
    parish,
    toPage,
    selectedDepartment,
    originalDepartment,
    group,
    icon,
  }) {
    return (
      <button
        className="member-card"
        onClick={() =>
          navigate(toPage, {
            state: {
              department: originalDepartment,
              selectedDepartment,
              parish,
              group,
            },
          })
        }
      >
        <img
          src={icon}
          alt={department}
          style={{
            borderRadius: "100%",
          }}
        />
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
      .select(`lector-commentator-scheduler`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching lector commentator status:", error);
      return false;
    }

    return data["lector-commentator-scheduler"] === 1;
  } catch (err) {
    console.error("Error in fetchLectorCommentatorStatus:", err);
    return false;
  }
};

export const navigationAddMember = (navigate, state) => () => {
  navigate("/addMember", { state });
};

export const navigationSelectDepartment = (navigate, state) => () => {
  navigate("/selectDepartment", { state });
};

export const handleViewInformation = (navigate, member, department) => () => {
  navigate("/viewMemberInformation", {
    state: {
      idNumber: member.idNumber,
      department: department,
    },
  });
};

export const handleSearchChange = (
  e,
  members,
  setSearchQuery,
  setFilteredMembers
) => {
  const query = e.target.value;
  setSearchQuery(query);

  if (query === "") {
    setFilteredMembers(members);
  } else {
    const filtered = members.filter((member) => {
      const firstName = member.firstName?.toLowerCase() || "";
      const lastName = member.lastName?.toLowerCase() || "";
      const role = member.role?.toLowerCase() || "";
      const idNumber = member.idNumber?.toString() || "";

      return (
        firstName.includes(query.toLowerCase()) ||
        lastName.includes(query.toLowerCase()) ||
        role.includes(query.toLowerCase()) ||
        idNumber.includes(query)
      );
    });

    setFilteredMembers(filtered);
  }
};
