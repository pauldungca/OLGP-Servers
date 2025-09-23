import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import image from "../../helper/images";

export const sampleMembers = [
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890522", name: "John Paul Dungca" },
  { idNumber: "200890523", name: "Jane Doe" },
  { idNumber: "200890524", name: "Mark Smith" },
  { idNumber: "200890524", name: "Mark Talavera" },

  // ...add more as needed
];

const renderMemberPage = async (
  pdf,
  pageMembers,
  pageNumber,
  totalPages,
  department = "Members"
) => {
  // Layout values moved inside here
  const pdfWidth = 816; // 8.5in
  const pdfHeight = 1056; // 11in
  const margin = 40;
  const cellHeight = 40;

  const logoWidth = 60;
  const logoHeight = 60;

  // Logo
  await pdf.addImage(
    image.OLGPlogo,
    "PNG",
    margin,
    margin,
    logoWidth,
    logoHeight
  );

  // Titles
  const textX = margin + logoWidth + 20;
  const textYTitle = margin + 25;
  const textYSubtitle = margin + 55;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(30);
  pdf.text("Our Lady of Guadalupe Parish", textX, textYTitle);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(20);
  pdf.text(String(department), textX, textYSubtitle); // <-- dynamic subtitle

  // Main heading
  const mainHeadingY = margin + logoHeight + 40;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text("Members of the Organization", pdfWidth / 2, mainHeadingY, {
    align: "center",
  });

  // Table header
  const startY = mainHeadingY + 40;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setDrawColor(51, 51, 51);
  pdf.setLineWidth(0.5);

  // Header row (2 columns: ID Number / Name)
  pdf.rect(margin, startY, 200, cellHeight);
  pdf.rect(margin + 200, startY, 536, cellHeight);
  pdf.text("ID Number", margin + 10, startY + cellHeight / 2 + 5);
  pdf.text("Name", margin + 210, startY + cellHeight / 2 + 5);

  // Table rows
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  let rowY = startY + cellHeight;

  pageMembers.forEach((m) => {
    pdf.rect(margin, rowY, 200, cellHeight);
    pdf.rect(margin + 200, rowY, 536, cellHeight);

    pdf.text(m.idNumber.toString(), margin + 10, rowY + cellHeight / 2 + 5);
    pdf.text(m.name, margin + 210, rowY + cellHeight / 2 + 5);

    rowY += cellHeight;
  });

  // Footer
  pdf.setFontSize(10);
  pdf.text(
    `Page ${pageNumber} of ${totalPages}`,
    pdfWidth - margin - 60,
    pdfHeight - margin
  );
  pdf.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    margin,
    pdfHeight - margin
  );
};

export const exportTableAsPNG = async (members, department = "Members") => {
  if (!members || members.length === 0) {
    await Swal.fire("Error", "No members to export.", "error");
    return;
  }

  const pdfWidth = 816;
  const pdfHeight = 1056;
  const rowsPerPage = 19;

  try {
    const chunks = [];
    for (let i = 0; i < members.length; i += rowsPerPage) {
      chunks.push(members.slice(i, i + rowsPerPage));
    }

    const totalPages = chunks.length;
    const zip = new JSZip();

    for (let index = 0; index < chunks.length; index++) {
      const canvas = document.createElement("canvas");
      canvas.width = pdfWidth;
      canvas.height = pdfHeight;
      const ctx = canvas.getContext("2d");

      // White background
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentFontSize = 12;
      let currentFontWeight = "normal";
      ctx.font = `${currentFontWeight} ${currentFontSize}px Arial`;

      const fakePDF = {
        addImage: (imgSrc, type, x, y, w, h) =>
          new Promise((resolve, reject) => {
            const imgEl = new Image();
            imgEl.crossOrigin = "anonymous";
            imgEl.src = imgSrc;

            imgEl.onload = () => {
              ctx.drawImage(imgEl, x, y, w, h);
              resolve();
            };
            imgEl.onerror = (err) => {
              console.error("Failed to load logo:", err, imgSrc);
              reject(err);
            };
          }),
        setFont: (font, weight) => {
          currentFontWeight = weight === "bold" ? "bold" : "normal";
          ctx.font = `${currentFontWeight} ${currentFontSize}px Arial`;
        },
        setFontSize: (size) => {
          currentFontSize = size;
          ctx.font = `${currentFontWeight} ${currentFontSize}px Arial`;
        },
        setDrawColor: (r, g, b) => {
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
        },
        setLineWidth: (w) => {
          ctx.lineWidth = w;
        },
        rect: (x, y, w, h) => {
          ctx.strokeRect(x, y, w, h);
        },
        text: (txt, x, y, options = {}) => {
          ctx.textAlign = options.align === "center" ? "center" : "start";
          ctx.fillStyle = "#000";
          ctx.fillText(txt, x, y);
        },
      };

      await renderMemberPage(
        fakePDF,
        chunks[index],
        index + 1,
        totalPages,
        department
      );

      const imgData = canvas.toDataURL("image/png");
      zip.file(`members-list-page-${index + 1}.png`, imgData.split(",")[1], {
        base64: true,
      });
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "members-list.zip");
  } catch (err) {
    console.error("PNG export failed:", err);
    alert("Failed to export PNG. Please try again.");
  }
};

export const exportTableAsPDF = async (members, department = "Members") => {
  if (!members || members.length === 0) {
    await Swal.fire("Error", "No members to export.", "error");
    return;
  }

  const rowsPerPage = 19;

  try {
    const pdf = new jsPDF("p", "pt", [816, 1056]);

    const chunks = [];
    for (let i = 0; i < members.length; i += rowsPerPage) {
      chunks.push(members.slice(i, i + rowsPerPage));
    }

    const totalPages = chunks.length;

    for (let index = 0; index < chunks.length; index++) {
      if (index > 0) pdf.addPage();
      await renderMemberPage(
        pdf,
        chunks[index],
        index + 1,
        totalPages,
        department
      );
    }

    pdf.save(`members-list-${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (err) {
    console.error("PDF export failed:", err);
    alert("Failed to export PDF. Please try again.");
  }
};

export const printMemberList = async (members, department = "Members") => {
  try {
    if (!members || members.length === 0) {
      await Swal.fire("Error", "No members to print.", "error");
      return;
    }

    const membersPerPage = 17;
    const totalPages = Math.ceil(members.length / membersPerPage);

    let htmlContent = '<div class="print-container">';

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      const startIndex = (pageNumber - 1) * membersPerPage;
      const endIndex = Math.min(startIndex + membersPerPage, members.length);
      const pageMembers = members.slice(startIndex, endIndex);

      htmlContent += await renderMemberPageHTML(
        pageMembers,
        pageNumber,
        totalPages,
        department // <-- pass it
      );
    }

    htmlContent += "</div>";

    const printWindow = window.open("", "_blank", "width=816,height=1056");
    if (!printWindow) {
      Swal.fire("Popup Blocked", "Please allow popups to print.", "error");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Members List</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  } catch (err) {
    console.error("Print failed:", err);
    Swal.fire("Error", "Unexpected error occurred while printing.", "error");
  }
};

const renderMemberPageHTML = async (
  pageMembers,
  pageNumber,
  totalPages,
  department
) => {
  // Logo section
  const logoHtml = `<img src="${image.OLGPlogo}" class="logo" alt="OLGP Logo">`;

  return `
    <div class="page">
      <!-- Header section -->
      <div class="header">
        <div class="logo-title-section">
          <div class="logo-container">
            ${logoHtml}
          </div>
          <div class="title-container">
            <h1 class="main-title">Our Lady of Guadalupe Parish</h1>
            <h2 class="subtitle">${department}</h2>
          </div>
        </div>
      </div>
      
      <!-- Main heading -->
      <div class="main-heading">
        <h3>Members of the Organization</h3>
      </div>
      
      <!-- Table -->
      <div class="table-container">
        <table class="members-table">
          <thead>
            <tr>
              <th class="id-header">ID Number</th>
              <th class="name-header">Name</th>
            </tr>
          </thead>
          <tbody>
            ${pageMembers
              .map(
                (member) => `
              <tr>
                <td class="id-cell">${member.idNumber}</td>
                <td class="name-cell">${member.name}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <span class="footer-date">Generated: ${new Date().toLocaleDateString()}</span>
        <span class="footer-page">Page ${pageNumber} of ${totalPages}</span>
      </div>
    </div>
  `;
};

const getPrintStyles = () => `
  @page {
    size: 8.5in 11in;
    margin: 0;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: Arial, Helvetica, sans-serif;
    margin: 0;
    padding: 0;
  }
  
  .print-container {
    width: 100%;
  }
  
  .page {
    width: 816px;
    height: 1056px;
    padding: 40px;
    position: relative;
    background: white;
    margin: 0 auto;
    display: block;
  }
  
  .header {
    margin-bottom: 40px;
  }
  
  .logo-title-section {
    display: flex;
    align-items: flex-start;
  }
  
  .logo-container {
    width: 60px;
    height: 60px;
    margin-right: 20px;
  }
  
  .logo {
    width: 60px;
    height: 60px;
    display: block;
  }
  
  .title-container {
    flex: 1;
    margin-top: 25px;
  }
  
  .main-title {
    font-family: helvetica, Arial, sans-serif;
    font-weight: bold;
    font-size: 30px;
    margin: 0;
    line-height: 1;
  }
  
  .subtitle {
    font-family: helvetica, Arial, sans-serif;
    font-weight: normal;
    font-size: 20px;
    margin: 30px 0 0 0;
  }
  
  .main-heading {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .main-heading h3 {
    font-family: helvetica, Arial, sans-serif;
    font-weight: bold;
    font-size: 22px;
    margin: 0;
  }
  
  .table-container {
    margin-bottom: 60px;
  }
  
  .members-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .id-header, .name-header, .id-cell, .name-cell {
    border: 0.5px solid #333;
    padding: 10px;
    font-family: helvetica, Arial, sans-serif;
    font-size: 12px;
    text-align: left;
    vertical-align: middle;
    height: 40px;
  }
  
  .id-header, .name-header {
    font-weight: bold;
  }
  
  .id-header, .id-cell {
    width: 200px;
  }
  
  .name-header, .name-cell {
    width: 536px;
  }
  
  .footer {
    position: absolute;
    bottom: 40px;
    left: 40px;
    right: 40px;
    font-size: 10px;
  }
  
  .footer-date {
    float: left;
  }
  
  .footer-page {
    float: right;
  }
  
  @media print {
    body {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    .page {
      margin: 0 !important;
      page-break-inside: avoid;
    }
    
    .page:not(:first-child) {
      page-break-before: always;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
`;

export const fetchAltarServerMembersWithRole = async () => {
  try {
    // 1️⃣ Get all user-type entries where altar-server-member = 1
    const { data: userTypes, error: userTypeError } = await supabase
      .from("user-type")
      .select("idNumber")
      .eq('"altar-server-member"', 1);

    if (userTypeError) throw userTypeError;

    const idNumbers = userTypes.map((ut) => ut.idNumber);

    // 3️⃣ Fetch members-information for those idNumbers
    const { data: members, error: membersError } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", idNumbers)
      .order("dateJoined", { ascending: false });

    if (membersError) throw membersError;

    // 4️⃣ Fetch altar-server-roles for these members
    const { data: rolesData, error: rolesError } = await supabase
      .from("altar-server-roles")
      .select("*")
      .in("idNumber", idNumbers);

    if (rolesError) throw rolesError;

    // 5️⃣ Merge roles and compute Flexible / Non-Flexible
    const membersWithRole = members.map((member) => {
      const roles = rolesData.find((r) => r.idNumber === member.idNumber);

      if (!roles) return { ...member, role: "Non-Flexible" };

      // all role columns except id and idNumber
      const roleFields = Object.keys(roles).filter(
        (key) => key !== "id" && key !== "idNumber"
      );

      const isFlexible = roleFields.every((key) => roles[key] === 1);

      return { ...member, role: isFlexible ? "Flexible" : "Non-Flexible" };
    });

    return membersWithRole;
  } catch (err) {
    console.error("Supabase error:", err);
    return [];
  }
};

export const fetchLectorCommentatorMembersWithRole = async () => {
  try {
    // 1️⃣ Get all user-type entries where lector-commentator-member = 1
    const { data: userTypes, error: userTypeError } = await supabase
      .from("user-type")
      .select("idNumber")
      .eq('"lector-commentator-member"', 1);

    if (userTypeError) throw userTypeError;

    const idNumbers = userTypes.map((ut) => ut.idNumber);

    // 3️⃣ Fetch members-information for those idNumbers
    const { data: members, error: membersError } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", idNumbers)
      .order("dateJoined", { ascending: false });

    if (membersError) throw membersError;

    // 4️⃣ Fetch lector-commentator-roles for these members
    const { data: rolesData, error: rolesError } = await supabase
      .from("lector-commentator-roles")
      .select("*")
      .in("idNumber", idNumbers);

    if (rolesError) throw rolesError;

    // 5️⃣ Merge roles and compute Flexible / Non-Flexible manually
    const membersWithRole = members.map((member) => {
      // find the role row
      const roles = rolesData.find(
        (r) => String(r.idNumber).trim() === String(member.idNumber).trim()
      );

      if (!roles) return { ...member, role: "Non-Flexible" };

      // Only two columns: preface and reading
      const isFlexible = roles.preface === 1 && roles.reading === 1;

      return { ...member, role: isFlexible ? "Flexible" : "Non-Flexible" };
    });

    return membersWithRole;
  } catch (err) {
    console.error("Supabase error:", err);
    return [];
  }
};

export const fetchEucharisticMinisterWithGroup = async (groupName) => {
  try {
    // 1) Get idNumbers that belong to this group (from eucharistic-minister-group)
    const { data: groupRows, error: groupErr } = await supabase
      .from("eucharistic-minister-group")
      .select('idNumber, "group-name"')
      .eq('"group-name"', groupName);

    if (groupErr) throw groupErr;

    const idNumbers = (groupRows || []).map((r) => r.idNumber);

    // 2) Fetch members-information for those idNumbers
    const { data: members, error: memErr } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", idNumbers)
      .order("dateJoined", { ascending: false });

    if (memErr) throw memErr;

    // 3) Attach the group name (3rd column used by GroupTable)
    const membersWithGroup = members.map((m) => ({
      ...m,
      group: groupName,
    }));

    return membersWithGroup;
  } catch (err) {
    console.error("fetchEucharisticMinisterWithGroup error:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to fetch group members: " + err.message,
    });
    return [];
  }
};

export const fetchChoirWithGroup = async (groupName) => {
  try {
    // 1) Get idNumbers that belong to this choir group
    const { data: groupRows, error: groupErr } = await supabase
      .from("choir-member-group")
      .select('idNumber, "choir-group-name"')
      .eq("choir-group-name", groupName);

    if (groupErr) throw groupErr;

    const idNumbers = (groupRows || []).map((r) => r.idNumber);

    // 2) Fetch members-information for those idNumbers
    const { data: members, error: memErr } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", idNumbers)
      .order("dateJoined", { ascending: false });

    if (memErr) throw memErr;

    // 3) Attach the group name for GroupTable display
    const membersWithGroup = members.map((m) => ({
      ...m,
      group: groupName,
    }));

    return membersWithGroup;
  } catch (err) {
    console.error("fetchChoirWithGroup error:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to fetch choir group members: " + err.message,
    });
    return [];
  }
};

export const fetchEucharisticMinisterMembers = async () => {
  try {
    const { data: userTypes, error: utErr } = await supabase
      .from("user-type")
      .select("idNumber")
      .eq('"eucharistic-minister-member"', 1);
    if (utErr) throw utErr;

    const ids = (userTypes || []).map((u) => u.idNumber);

    const { data: members, error: memErr } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", ids)
      .order("dateJoined", { ascending: false });
    if (memErr) throw memErr;

    // Align to ImportMemberTable shape (role is optional)
    return members.map((m) => ({ ...m, role: "-" }));
  } catch (err) {
    console.error("fetchEucharisticMinisterMembers error:", err);
    return [];
  }
};

export const fetchChoirMembers = async () => {
  try {
    const { data: userTypes, error: utErr } = await supabase
      .from("user-type")
      .select("idNumber")
      .eq('"choir-member"', 1);
    if (utErr) throw utErr;

    const ids = (userTypes || []).map((u) => u.idNumber);
    if (ids.length === 0) {
      await Swal.fire("Info", "No Choir members found.", "info");
      return [];
    }

    const { data: members, error: memErr } = await supabase
      .from("members-information")
      .select("*")
      .in("idNumber", ids)
      .order("dateJoined", { ascending: false });
    if (memErr) throw memErr;

    return members.map((m) => ({ ...m, role: "-" }));
  } catch (err) {
    console.error("fetchChoirMembers error:", err);
    await Swal.fire("Error", "Failed to fetch Choir members.", "error");
    return [];
  }
};

export const isAltarServerMember = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`altar-server-member`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching altar server status:", error);
      return false;
    }

    return data["altar-server-member"] === 1;
  } catch (err) {
    console.error("Error in fetchAltarServerStatus:", err);
    return false;
  }
};

export const isLectorCommentatorMember = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`lector-commentator-member`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching lector commentator status:", error);
      return false;
    }

    return data["lector-commentator-member"] === 1;
  } catch (err) {
    console.error("Error in fetchLectorCommentatorStatus:", err);
    return false;
  }
};

export const isEucharisticMinisterMember = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`eucharistic-minister-member`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching eucharistic minister status:", error);
      return false;
    }

    return data["eucharistic-minister-member"] === 1;
  } catch (err) {
    console.error("Error in fetchEucharisticMinisterStatus:", err);
    return false;
  }
};

export const isChoirMember = async (idNumber) => {
  try {
    const { data, error } = await supabase
      .from("user-type")
      .select(`choir-member`)
      .eq("idNumber", idNumber)
      .single();

    if (error) {
      console.error("Error fetching choir status:", error);
      return false;
    }

    return data["choir-member"] === 1;
  } catch (err) {
    console.error("Error in fetchChoirStatus:", err);
    return false;
  }
};
