import { supabase } from "../../utils/supabase";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
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

export const exportTableAsPNG = async (exportRef) => {
  if (!exportRef.current) return;

  const element = exportRef.current;
  const dpiScale = 2; // higher quality
  const pageHeight = 1056 * dpiScale; // 11 in @96dpi * scale
  const pageWidth = 816 * dpiScale; // 8.5 in @96dpi * scale

  try {
    const canvas = await html2canvas(element, { scale: dpiScale });
    const totalHeight = canvas.height;

    // ✅ Single-page export
    if (totalHeight <= pageHeight) {
      const ctx = canvas.getContext("2d");

      // Draw page number
      ctx.font = "20px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "right";
      ctx.fillText("Page 1 of 1", pageWidth - 40, pageHeight - 20);

      const link = document.createElement("a");
      link.download = "members-list.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      return;
    }

    // ✅ Multi-page export → ZIP
    const zip = new JSZip();
    const totalPages = Math.ceil(totalHeight / pageHeight);
    let pageNum = 1;

    for (let y = 0; y < totalHeight; y += pageHeight) {
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = pageWidth;
      pageCanvas.height = Math.min(pageHeight, totalHeight - y);

      const ctx = pageCanvas.getContext("2d");
      ctx.drawImage(
        canvas,
        0,
        y,
        pageWidth,
        pageCanvas.height,
        0,
        0,
        pageWidth,
        pageCanvas.height
      );

      // Draw page number (bottom-right)
      ctx.font = "20px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "right";
      ctx.fillText(
        `Page ${pageNum} of ${totalPages}`,
        pageCanvas.width - 40,
        pageCanvas.height - 20
      );

      const imgData = pageCanvas.toDataURL("image/png");
      zip.file(`members-list-page-${pageNum}.png`, imgData.split(",")[1], {
        base64: true,
      });

      pageNum++;
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "members-list.zip");
  } catch (error) {
    console.error("Error exporting PNG:", error);
  }
};

export const exportTableAsPDF = async (members) => {
  if (!members || members.length === 0) {
    alert("No members to export.");
    return;
  }

  const pdfWidth = 816; // 8.5in
  const pdfHeight = 1056; // 11in
  const margin = 40;
  const rowsPerPage = 19;

  try {
    const pdf = new jsPDF("p", "pt", [pdfWidth, pdfHeight]);

    const renderPage = (pageMembers, pageNumber, totalPages) => {
      const logoWidth = 60;
      const logoHeight = 60;
      pdf.addImage(
        image.OLGPlogo,
        "PNG",
        margin,
        margin,
        logoWidth,
        logoHeight
      );

      const textX = margin + logoWidth + 20;
      const textYTitle = margin + 25;
      const textYSubtitle = margin + 55;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(30);
      pdf.text("Our Lady of Guadalupe Parish", textX, textYTitle);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(20);
      pdf.text("Altar Servers", textX, textYSubtitle);

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

      const cellHeight = 40;

      // Header row
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

    const chunks = [];
    for (let i = 0; i < members.length; i += rowsPerPage) {
      chunks.push(members.slice(i, i + rowsPerPage));
    }

    const totalPages = chunks.length;

    chunks.forEach((pageMembers, index) => {
      if (index > 0) pdf.addPage();
      renderPage(pageMembers, index + 1, totalPages);
    });

    pdf.save(`members-list-${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (err) {
    console.error("PDF export failed:", err);
    alert("Failed to export PDF. Please try again.");
  }
};

export const fetchAltarServerMembersWithRole = async () => {
  try {
    // 1️⃣ Get all user-type entries where altar-server-member = 1
    const { data: userTypes, error: userTypeError } = await supabase
      .from("user-type")
      .select("idNumber")
      .eq('"altar-server-member"', 1);

    if (userTypeError) throw userTypeError;

    const idNumbers = userTypes.map((ut) => ut.idNumber);

    // 2️⃣ Alert if no altar server members
    if (idNumbers.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Altar Server Members",
        text: "There are currently no members marked as altar servers.",
      });
      return [];
    }

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
