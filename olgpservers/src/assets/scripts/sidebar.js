import { supabase } from "../../utils/supabase";
import { Tooltip } from "antd";
import Swal from "sweetalert2";

export const fetchUserRoles = async (userId, setUserRoles, setUserRoleType) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(
        `parish-secretary, 
        altar-server-scheduler, 
        eucharistic-minister-scheduler, 
        choir-scheduler, 
        lector-commentator-scheduler,
        altar-server-member, 
        eucharistic-minister-member, 
        choir-member, 
        lector-commentator-member`
      )
      .eq("idNumber", userId)
      .single();

    if (error) {
      alert("Supabase error:", error);
      setUserRoleType("Error Hello");
      return;
    }

    if (!data) {
      console.error("No role data found");
      setUserRoleType("None");
      return;
    }

    const roles = {
      isParishSecretary: data["parish-secretary"] === 1,
      isAltarServerScheduler: data["altar-server-scheduler"] === 1,
      isEucharisticMinisterScheduler:
        data["eucharistic-minister-scheduler"] === 1,
      isChoirScheduler: data["choir-scheduler"] === 1,
      isLectorCommentatorScheduler: data["lector-commentator-scheduler"] === 1,
      isAltarServerMember: data["altar-server-member"] === 1,
      isEucharisticMinisterMember: data["eucharistic-minister-member"] === 1,
      isChoirMember: data["choir-member"] === 1,
      isLectorCommentatorMember: data["lector-commentator-member"] === 1,
    };

    setUserRoles(roles);
    setUserRoleType(determineUserRole(roles));
  } catch (err) {
    console("Error in fetchUserRoles:", err);
    setUserRoleType("Error");
  }
};

export const determineUserRole = (roles) => {
  const activeRoles = [];

  // ✅ Universal checks
  const allSchedulers =
    roles.isAltarServerScheduler &&
    roles.isEucharisticMinisterScheduler &&
    roles.isLectorCommentatorScheduler &&
    roles.isChoirScheduler;

  const allMembers =
    roles.isAltarServerMember &&
    roles.isEucharisticMinisterMember &&
    roles.isLectorCommentatorMember &&
    roles.isChoirMember;

  if (allSchedulers && allMembers) {
    // Both universal → show only these two
    activeRoles.push("Universal Scheduler", "Universal Member");
  } else {
    if (allSchedulers) {
      activeRoles.push("Universal Scheduler");
    } else if (allMembers) {
      activeRoles.push("Universal Member");
    }

    // Parish Secretary
    if (roles.isParishSecretary) {
      activeRoles.push("Parish Secretary");
    }

    // 🔹 Department-specific only if not "both universals"
    if (!allSchedulers && !allMembers) {
      if (roles.isAltarServerScheduler && roles.isAltarServerMember) {
        activeRoles.push("Altar Server Coordinator");
      } else {
        if (roles.isAltarServerScheduler)
          activeRoles.push("Altar Server Scheduler");
        if (roles.isAltarServerMember) activeRoles.push("Altar Server Member");
      }

      if (
        roles.isEucharisticMinisterScheduler &&
        roles.isEucharisticMinisterMember
      ) {
        activeRoles.push("Eucharistic Minister Coordinator");
      } else {
        if (roles.isEucharisticMinisterScheduler)
          activeRoles.push("Eucharistic Minister Scheduler");
        if (roles.isEucharisticMinisterMember)
          activeRoles.push("Eucharistic Minister Member");
      }

      if (
        roles.isLectorCommentatorScheduler &&
        roles.isLectorCommentatorMember
      ) {
        activeRoles.push("Lector Commentator Coordinator");
      } else {
        if (roles.isLectorCommentatorScheduler)
          activeRoles.push("Lector Commentator Scheduler");
        if (roles.isLectorCommentatorMember)
          activeRoles.push("Lector Commentator Member");
      }

      if (roles.isChoirScheduler && roles.isChoirMember) {
        activeRoles.push("Choir Coordinator");
      } else {
        if (roles.isChoirScheduler) activeRoles.push("Choir Scheduler");
        if (roles.isChoirMember) activeRoles.push("Choir Member");
      }
    }
  }

  // Return string
  if (activeRoles.length === 0) return "None";
  if (activeRoles.length === 1) return activeRoles[0];
  return activeRoles.join(" | ");
};

export const createNavigationLinks = (navigate) => {
  return function navigationLinks(
    title,
    toPage,
    pageName,
    icon,
    activePage,
    collapsed,
    onClick // optional: if provided, overrides default navigation
  ) {
    const handleClick = (e) => {
      if (onClick) return onClick(e);
      return navigate(toPage);
    };

    return (
      <li className="nav-item">
        {collapsed ? (
          <Tooltip
            title={title}
            placement="right"
            overlayClassName="sidebar-tooltip"
            align={{ offset: [10, -5] }}
          >
            <button
              onClick={handleClick}
              className={`button-link ${
                activePage === pageName ? "active" : ""
              }`}
            >
              <img src={icon} className="icon" alt={title} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={handleClick}
            className={`button-link ${activePage === pageName ? "active" : ""}`}
          >
            <img src={icon} className="icon" alt={title} />
            <span>{title}</span>
          </button>
        )}
      </li>
    );
  };
};

export const createNavigationLinkWithSubmenu = (icons, navigate) => {
  return function navigationLinkWithSubmenu(
    title,
    toPage,
    pageName,
    icon,
    submenuItems,
    activePage,
    activeSubmenu,
    collapsed,
    toggleSubmenu
  ) {
    return (
      <li className="nav-item has-submenu">
        <button
          //onClick={() => navigate("#")}
          className={`button-link ${activePage === pageName ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            toggleSubmenu(`${pageName}-submenu`);
          }}
        >
          <img src={icon} className="icon" alt={title} />
          {!collapsed && <span>{title}</span>}
          {collapsed ? (
            <Tooltip
              title={title}
              placement="right"
              overlayClassName="sidebar-tooltip"
              align={{ offset: [10, -18] }}
            >
              <span></span>
            </Tooltip>
          ) : null}
          <img
            src={icons.arrowLogo}
            className={`arrow-icon ms-auto ${
              activeSubmenu === `${pageName}-submenu` ? "rotate" : ""
            }`}
            alt="arrow"
          />
        </button>
        <ul
          className={`submenu ${
            activeSubmenu === `${pageName}-submenu` ? "open" : ""
          }`}
          id={`${pageName}-submenu`}
        >
          {submenuItems.map((item, index) => (
            <li className="nav-item" key={index}>
              {collapsed ? (
                <Tooltip
                  title={item.title}
                  placement="right"
                  overlayClassName="sidebar-tooltip"
                  align={{ offset: [10, -5] }}
                >
                  <button
                    onClick={() => navigate(item.to)}
                    className={`button-link sub-link ${
                      activePage === item.pageName ? "active" : ""
                    }`}
                  >
                    <img src={item.icon} className="icon" alt={item.title} />
                  </button>
                </Tooltip>
              ) : (
                <button
                  onClick={() => navigate(item.to)}
                  className={`button-link sub-link ${
                    activePage === item.pageName ? "active" : ""
                  }`}
                >
                  <img src={item.icon} className="icon" alt={item.title} />
                  <span>{item.title}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </li>
    );
  };
};

export const buildDisplayName = async (idNumber) => {
  if (!idNumber) return "";

  try {
    // 1) Basic member info
    const { data: info, error: infoError } = await supabase
      .from("members-information")
      .select("*")
      .eq("idNumber", idNumber)
      .single();
    if (infoError) throw infoError;

    // 🔹 Build name string from whatever fields exist
    return (
      info.name ||
      [info.firstName, info.middleName, info.lastName, info.suffix]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      [info.firstname, info.middlename, info.lastname, info.suffix]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      info.displayName ||
      info.fullname ||
      info.fullName ||
      String(info.idNumber || "")
    );
  } catch (err) {
    console.error("Error building display name:", err.message);
    return String(idNumber); // fallback
  }
};

export const handleLogoutClick = (navigate) => async (e) => {
  e.preventDefault();

  const result = await Swal.fire({
    title: "Logout",
    text: "Are you sure you want to log out?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, log out",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    allowOutsideClick: false,
    allowEscapeKey: true,
  });

  if (result.isConfirmed) {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}

    await Swal.fire({
      icon: "success",
      title: "Logged out",
      showConfirmButton: false,
      timer: 900,
    });

    navigate("/", { replace: true });
  }
};
