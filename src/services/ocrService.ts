import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedData {
  pan: string;
  name: string;
  income: number;
  tds: number;
  deductions: {
    section80C: number;
    section80D: number;
    hra: number;
  };
  confidenceScore: number;
  rawText: string;
}

export class OCRService {
  
  static async extractText(file: File): Promise<string> {
    const fileType = file.type;
    
    if (fileType === 'application/pdf') {
      return await this.extractFromPDF(file);
    } else if (fileType.startsWith('image/')) {
      return await this.extractFromImage(file);
    } else {
      throw new Error('Please upload PDF or image files (JPG, PNG)');
    }
  }

  private static async extractFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  }

  private static async extractFromImage(file: File): Promise<string> {
    const result = await Tesseract.recognize(file, 'eng', {
      logger: (m) => console.log(m)
    });
    return result.data.text;
  }

  static calculateConfidence(parsedData: Partial<ExtractedData>): number {
    let score = 0;
    let totalFields = 0;
    
    if (parsedData.pan && parsedData.pan.length === 10) { score += 20; totalFields += 20; }
    if (parsedData.name && parsedData.name.length > 0) { score += 20; totalFields += 20; }
    if (parsedData.income && parsedData.income > 0) { score += 20; totalFields += 20; }
    if (parsedData.tds && parsedData.tds > 0) { score += 20; totalFields += 20; }
    if (parsedData.deductions) { score += 20; totalFields += 20; }
    
    return totalFields > 0 ? Math.round((score / totalFields) * 100) : 0;
  }
}