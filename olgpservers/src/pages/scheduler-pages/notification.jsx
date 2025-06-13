import React, { useEffect, useState } from "react";

export default function Notification() {
  const [idNumber, setIdNumber] = useState("");

  useEffect(() => {
    document.title = "OLGP Servers | Notification";
    const storedIdNumber = localStorage.getItem("idNumber");
    if (storedIdNumber) {
      setIdNumber(storedIdNumber);
    } else {
      setIdNumber("No ID found");
    }
  }, []);

  return (
    <div>
      <h2>Welcome to the Notification</h2>
      <p>
        This is your notification page where you can manage your content.
        <h4>{idNumber}</h4>
      </p>
    </div>
  );
}
