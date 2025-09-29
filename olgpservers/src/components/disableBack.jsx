import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function DisableBack() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== "/dashboard" && pathname !== "/secretaryDashboard") return;

    const onPop = () => {
      // cancel the back attempt
      window.history.go(1);
    };

    // seed history so popstate triggers
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [pathname]);

  return null;
}
