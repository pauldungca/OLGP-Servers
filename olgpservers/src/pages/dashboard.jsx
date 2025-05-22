import React, { useEffect } from "react";
import supabase from "../helper/supabaseClient";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  useEffect(() => {
    document.title = "OLGP Servers | Dashboard";
  }, []);

  const navigate = useNavigate();
  const signout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate("/login");
    }
  };
  return (
    <div>
      <h2>Dashboard</h2>
      <br />
      <p>Welcome to the Dashboard!</p>
      <button onClick={signout}>Sign Out</button>
    </div>
  );
}

export default Dashboard;
