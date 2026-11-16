const formatDate = (value) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString() : "-";

const pdfText = (value) => String(value ?? "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^\x20-\x7E]/g, "?")
  .replace(/[\\()]/g, "\\$&");

export const buildMonthlyReportPdf = (month, loans) => {
  const bodyLines = [
    `Report month: ${month}`,
    `Loan records: ${loans.length} | Returned: ${loans.filter((loan) => loan.returnedAt).length} | Outstanding: ${loans.filter((loan) => !loan.returnedAt).length}`,
    "",
    "BORROWING AND RETURN RECORDS",
    "",
  ];
  loans.forEach((loan, index) => {
    bodyLines.push(
      `${index + 1}. ${loan.studentName} | ${loan.regNo}`,
      `   Equipment: ${loan.itemName}`,
      `   Issued: ${formatDate(loan.borrowedAt)} | Due: ${formatDate(loan.dueAt)} | Returned: ${formatDate(loan.returnedAt)}`,
      "",
    );
  });
  if (!loans.length) bodyLines.push("No equipment loans were recorded during this month.");

  const pageLines = [];
  for (let index = 0; index < bodyLines.length; index += 52) {
    pageLines.push(["UNIXSPORT - EQUIPMENT MANAGEMENT REPORT", "", ...bodyLines.slice(index, index + 52)]);
  }
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";
  const pageIds = pageLines.map((_, index) => 4 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  pageLines.forEach((lines, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const textOps = ["BT", "/F1 9 Tf", "40 800 Td", "13 TL"];
    lines.forEach((line) => textOps.push(`(${pdfText(line)}) Tj`, "T*"));
    textOps.push("ET");
    const stream = `${textOps.join("\n")}\n`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
  });

  let documentText = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = documentText.length;
    documentText += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = documentText.length;
  documentText += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    documentText += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  documentText += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return documentText;
};