// ExportMemberList.jsx
import React, { forwardRef } from "react";
import image from "../helper/images"; // adjust path to your logo

// forwardRef allows html2canvas to access this div by ref instead of ID
const ExportMemberList = forwardRef(({ members }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: "816px", // 8.5 in
        height: "1056px", // 11 in
        background: "#fff",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}
      >
        <img
          src={image.OLGPlogo}
          alt="Logo"
          style={{ width: "64px", height: "64px", marginRight: "16px" }}
        />
        <div>
          <h2 style={{ margin: 0 }}>Our Lady of Guadalupe Parish</h2>
          <div>Altar Servers</div>
        </div>
      </div>

      <h3 style={{ textAlign: "center", margin: "16px 0" }}>
        Members of the Organization
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "16px",
        }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid #333", padding: "8px" }}>
              ID Number
            </th>
            <th style={{ border: "1px solid #333", padding: "8px" }}>Name</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid #333", padding: "8px" }}>
                {member.idNumber}
              </td>
              <td style={{ border: "1px solid #333", padding: "8px" }}>
                {member.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default ExportMemberList;
