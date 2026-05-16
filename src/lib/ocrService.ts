import Tesseract from 'tesseract.js';

// Free OCR for images (JPG, PNG)
export const extractTextFromImage = async (file: File): Promise<string> => {
  try {
    const result = await Tesseract.recognize(file, 'eng', {
      logger: (m) => {
        // Optional: log progress for debugging
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    return result.data.text;
  } catch (error) {
    console.error('OCR failed:', error);
    throw new Error('Failed to extract text from image. Please try a clearer image.');
  }
};

// For PDF files - returns mock text for now
export const extractTextFromPDF = async (file: File): Promise<string> => {
  // For now, return a message
  console.warn('PDF OCR not fully implemented yet');
  
  // Read as text for now (won't work well but at least doesn't crash)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      resolve(text.substring(0, 5000)); // First 5000 chars
    };
    reader.onerror = () => reject(new Error('Failed to read PDF'));
    reader.readAsText(file);
  });
};