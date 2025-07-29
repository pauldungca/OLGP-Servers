import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [idNumber, setIdNumber] = useState("");

  useEffect(() => {
    document.title = "OLGP Servers | Dashboard";
    const storedIdNumber = localStorage.getItem("idNumber");
    if (storedIdNumber) {
      setIdNumber(storedIdNumber);
    } else {
      setIdNumber("No ID found");
    }
  }, []);

  return (
    <div>
      <h2>Welcome to the Dashboard</h2>
      <p>
        This is your main dashboard page where you can manage your content.
        <h4>{idNumber}</h4>
      </p>
    </div>
  );
}
