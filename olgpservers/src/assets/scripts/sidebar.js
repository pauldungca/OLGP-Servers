import { supabase } from "../../utils/supabase";
import { Link } from "react-router-dom";
import { Tooltip } from "antd";

// Role-related functions
export const fetchUserRoles = async (userId, setUserRoles, setUserRoleType) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(
        `parish-secretary, altar-server-scheduler, eucharistic-minister-scheduler`
      )
      .eq("idNumber", userId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      setUserRoleType("Error");
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
    };

    setUserRoles(roles);
    setUserRoleType(determineUserRole(roles));
  } catch (err) {
    console.error("Error in fetchUserRoles:", err);
    setUserRoleType("Error");
  }
};

export const determineUserRole = (roles) => {
  const activeRoles = [];

  if (roles.isParishSecretary) activeRoles.push("Parish Secretary");
  if (roles.isAltarServerScheduler) activeRoles.push("Altar Server Scheduler");
  if (roles.isEucharisticMinisterScheduler)
    activeRoles.push("Eucharistic Minister Scheduler");

  if (activeRoles.length === 0) {
    return "None";
  } else if (activeRoles.length === 1) {
    return activeRoles[0];
  } else {
    return activeRoles.join(" | ");
  }
};

// Navigation components factory
export const createNavigationLinks = () => {
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
            align={{ offset: [10, -18] }}
          >
            <Link
              to={toPage}
              className={`nav-link ${activePage === pageName ? "active" : ""}`}
            >
              <img src={icon} className="icon" alt={title} />
            </Link>
          </Tooltip>
        ) : (
          <Link
            to={toPage}
            className={`nav-link ${activePage === pageName ? "active" : ""}`}
          >
            <img src={icon} className="icon" alt={title} />
            <span>{title}</span>
          </Link>
        )}
      </li>
    );
  };
};

export const createNavigationLinkWithSubmenu = (icons) => {
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
        <a
          href="#"
          className={`nav-link ${activePage === pageName ? "active" : ""}`}
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
        </a>
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
                  align={{ offset: [10, -13] }}
                >
                  <Link
                    to={item.to}
                    className={`nav-link sub-link ${
                      activePage === item.pageName ? "active" : ""
                    }`}
                  >
                    <img src={item.icon} className="icon" alt={item.title} />
                  </Link>
                </Tooltip>
              ) : (
                <Link
                  to={item.to}
                  className={`nav-link sub-link ${
                    activePage === item.pageName ? "active" : ""
                  }`}
                >
                  <img src={item.icon} className="icon" alt={item.title} />
                  <span>{item.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </li>
    );
  };
};
