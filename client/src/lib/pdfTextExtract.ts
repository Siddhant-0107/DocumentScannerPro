// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
// @ts-ignore
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

// Set the workerSrc to the URL string
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }

    return text.trim();
  } catch (err) {
    console.error("PDF.js text extraction failed:", err);
    throw new Error("PDF text extraction failed: " + (err instanceof Error ? err.message : String(err)));
  }
}
