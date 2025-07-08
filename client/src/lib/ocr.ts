import Tesseract from 'tesseract.js';
import { extractTextFromPDF } from './pdfTextExtract';


export async function processOCR(file: File): Promise<string> {
  try {
    console.log("Running OCR on file:", file);

    if (file.type === 'application/pdf') {
      // Use PDF.js to extract text from PDF
      return extractTextFromPDF(file);
    }

    // Convert File to Blob URL
    const imageURL = URL.createObjectURL(file);

    const result = await Tesseract.recognize(imageURL, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Clean up blob URL
    URL.revokeObjectURL(imageURL);

    return result.data.text;
  } 
    catch (error) {
  console.error("OCR processing failed:", error);
  alert("OCR Error: " + error); // TEMP: Remove in prod
  throw new Error("Failed to extract text from document");
}

  }


