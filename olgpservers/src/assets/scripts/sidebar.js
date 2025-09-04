import { supabase } from "../../utils/supabase";
import { Tooltip } from "antd";

// Role-related functions
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

  if (roles.isParishSecretary) activeRoles.push("Parish Secretary");
  if (roles.isAltarServerScheduler) activeRoles.push("Altar Server Scheduler");
  if (roles.isEucharisticMinisterScheduler)
    activeRoles.push("Eucharistic Minister Scheduler");
  if (roles.isLectorCommentatorScheduler)
    activeRoles.push("Lector Commentator Scheduler");
  if (roles.isChoirScheduler) activeRoles.push("Choir Scheduler");

  if (roles.isAltarServerMember) activeRoles.push("Altar Server member");
  if (roles.isEucharisticMinisterMember)
    activeRoles.push("Eucharistic Minister member");
  if (roles.isLectorCommentatorMember)
    activeRoles.push("Lector Commentator member");
  if (roles.isChoirMember) activeRoles.push("Choir member");

  if (activeRoles.length === 0) {
    return "None";
  } else if (activeRoles.length === 1) {
    return activeRoles[0];
  } else {
    return activeRoles.join(" | ");
  }
};

export const createNavigationLinks = (navigate) => {
  return function navigationLinks(
    title,
    toPage,
    pageName,
    icon,
    activePage,
    collapsed
  ) {
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
              onClick={() => navigate(toPage)}
              className={`button-link ${
                activePage === pageName ? "active" : ""
              }`}
            >
              <img src={icon} className="icon" alt={title} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => navigate(toPage)}
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
