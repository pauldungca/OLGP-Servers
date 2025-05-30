import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import navigation from "../data/navigation.json";

function Home() {
  useEffect(() => {
    document.title = "OLGP Servers | Home";
  }, []);

  return (
    <div>
      {navigation.navigation.map((item) => (
        <div key={item.path}>
          <Link to={item.path}>{item.name}</Link>
          <br />
        </div>
      ))}
    </div>
  );
}

export default Home;
