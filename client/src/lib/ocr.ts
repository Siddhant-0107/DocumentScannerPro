import Tesseract from 'tesseract.js';

export async function processOCR(file: File): Promise<string> {
  try {
    // For PDF files, we would need additional processing
    if (file.type === 'application/pdf') {
      // For now, return a placeholder message
      // In a real implementation, you would use PDF.js to convert pages to images first
      return "PDF text extraction requires additional processing. Please implement PDF.js integration.";
    }

    // Process image files with Tesseract
    const result = await Tesseract.recognize(file, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return result.data.text;
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to extract text from document');
  }
}
