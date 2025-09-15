export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  title?: string;
}

export class PDFExtractionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PDFExtractionError';
  }
}