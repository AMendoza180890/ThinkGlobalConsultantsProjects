import jsPDF from "jspdf";

interface CertificateData {
  staffName: string;
  sessionTitle: string;
  date: string;
  durationHours: number;
  standardCode: string;
  standardName: string;
  schoolName: string;
}

export function generateCPDCertificate(data: CertificateData): Blob {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const cx = width / 2;

  // Border
  doc.setDrawColor(34, 112, 147);
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, width - 28, height - 28);

  // Header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("CQ Impact Platform", cx, 30, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(34, 112, 147);
  doc.setFont("helvetica", "bold");
  doc.text("Certificate of Professional Development", cx, 48, { align: "center" });

  // Decorative line
  doc.setDrawColor(34, 112, 147);
  doc.setLineWidth(1);
  doc.line(cx - 60, 54, cx + 60, 54);

  // Staff name
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text(data.staffName, cx, 72, { align: "center" });

  // Has successfully completed
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("has successfully completed:", cx, 82, { align: "center" });

  // Session title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(data.sessionTitle, cx, 96, { align: "center" });

  // Date & Duration
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`${data.date}  •  ${data.durationHours} CPD hour${data.durationHours !== 1 ? "s" : ""}`, cx, 108, { align: "center" });

  // WASC Standard
  doc.setFontSize(11);
  doc.setTextColor(34, 112, 147);
  doc.text(`ACS WASC Standard: ${data.standardCode} — ${data.standardName}`, cx, 118, { align: "center" });

  // School name
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(data.schoolName, cx, 135, { align: "center" });

  // Issued by
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Issued by: CQ Impact Platform", cx, 145, { align: "center" });

  return doc.output("blob");
}

export function downloadCertificate(data: CertificateData) {
  const blob = generateCPDCertificate(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CPD-Certificate-${data.staffName.replace(/\s+/g, "-")}-${data.sessionTitle.replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAllCertificates(certificates: CertificateData[]) {
  certificates.forEach((cert, i) => {
    setTimeout(() => downloadCertificate(cert), i * 300);
  });
}
