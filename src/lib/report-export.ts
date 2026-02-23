import { Buffer } from "node:buffer";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export type ReportRow = Record<string, string | number | null | undefined>;

export async function createExcelBuffer(
  title: string,
  rows: ReportRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 31) || "Report");

  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    sheet.addRow(headers);
    for (const row of rows) {
      sheet.addRow(headers.map((h) => row[h] ?? ""));
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function createPdfBuffer(
  title: string,
  rows: ReportRow[],
): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk as Buffer);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", (error) => {
      reject(error);
    });

    doc.fontSize(16).text(title, { align: "center" });
    doc.moveDown();

    if (rows.length === 0) {
      doc.fontSize(10).text("Tidak ada data");
    } else {
      const headers = Object.keys(rows[0]);
      doc.fontSize(10).text(headers.join(" | "));
      doc.moveDown(0.5);

      for (const row of rows) {
        const line = headers
          .map((h) => {
            const value = row[h];
            if (value == null) return "";
            return String(value);
          })
          .join(" | ");
        doc.text(line);
      }
    }

    doc.end();
  });
}
