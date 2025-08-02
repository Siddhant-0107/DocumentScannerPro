export interface StructuredText {
  rawText: string;
  processedText: string;
  entities: {
    emails: string[];
    phones: string[];
    dates: string[];
    amounts: string[];
    names: string[];
    addresses: string[];
    numbers: string[];
  };
  sections: {
    title?: string;
    header: string[];
    body: string[];
    footer: string[];
  };
  documentType: 'invoice' | 'receipt' | 'contract' | 'resume' | 'id' | 'report' | 'other';
  confidence: number;
  metadata: {
    lineCount: number;
    wordCount: number;
    hasTable: boolean;
    hasSignature: boolean;
    language: string;
  };
}

export class TextProcessor {
  // Email regex
  private emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  // Phone regex (various formats)
  private phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})|(\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4})/g;
  
  // Date regex (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)
  private dateRegex = /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;
  
  // Amount regex (currency symbols + numbers)
  private amountRegex = /(?:[$€£¥₹]\s*\d+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?\s*(?:USD|EUR|GBP|INR|dollars?|euros?|pounds?))/gi;
  
  // Numbers regex (ID numbers, reference numbers, etc.)
  private numberRegex = /\b(?:ID|REF|NO|#)[\s:]*([A-Z0-9\-]+)\b/gi;
  
  // Name patterns (common title + name patterns)
  private nameRegex = /\b(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)\s+[A-Z][a-z]+\s+[A-Z][a-z]+|[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;

  public processText(rawText: string): StructuredText {
    let cleanedText = this.cleanText(rawText);
    cleanedText = this.formatHeadings(cleanedText);
    cleanedText = this.formatBullets(cleanedText);
    cleanedText = this.formatTables(cleanedText);
    const lines = cleanedText.split('\n').filter(line => line.trim().length > 0);
    return {
      rawText,
      processedText: cleanedText,
      entities: this.extractEntities(cleanedText),
      sections: this.identifySections(lines),
      documentType: this.classifyDocument(cleanedText),
      confidence: this.calculateConfidence(cleanedText),
      metadata: this.extractMetadata(cleanedText, lines)
    };
  }

  // Enhanced cleanText: preserve line breaks, paragraphs, and bullet points
  private cleanText(text: string): string {
    return text
      .replace(/\r\n|\r/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n') // collapse >2 blank lines to 1
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  // Format bullet points as Markdown
  private formatBullets(text: string): string {
    return text.replace(/^(\s*[-*•]\s+)/gm, '$1'); // keep as-is for Markdown/HTML rendering
  }

  // Format table-like lines as Markdown tables (header-aware, more robust)
  private formatTables(text: string): string {
    const lines = text.split('\n');
    let result: string[] = [];
    let tableBuffer: string[][] = [];
    let expectedCols = 0;
    const minCols = 3;
    const headerKeywords = ['s.no', 'content', 'page no', 'teacher'];
    let inTable = false;
    let colSplit = / {2,}|\t|\|/;

    function isHeader(line: string) {
      const lower = line.toLowerCase();
      return headerKeywords.every(k => lower.includes(k));
    }

    function flushTable() {
      if (tableBuffer.length >= 2 && expectedCols >= minCols) {
        result.push('| ' + tableBuffer[0].join(' | ') + ' |');
        result.push('|' + tableBuffer[0].map(() => '---').join('|') + '|');
        for (let i = 1; i < tableBuffer.length; i++) {
          result.push('| ' + tableBuffer[i].join(' | ') + ' |');
        }
      } else {
        for (const row of tableBuffer) {
          result.push(row.join(' '));
        }
      }
      tableBuffer = [];
      expectedCols = 0;
      inTable = false;
    }

    for (let i = 0; i < lines.length; i++) {
      if (isHeader(lines[i])) {
        if (tableBuffer.length > 0) flushTable();
        inTable = true;
        colSplit = / {2,}|\t|\|/; // try with 2+ spaces first
        const cols = lines[i].trim().split(colSplit).filter(Boolean);
        expectedCols = cols.length;
        tableBuffer.push(cols);
        continue;
      }
      if (inTable) {
        // Try to split with 2+ spaces, then fallback to 1+ space if not enough columns
        let cols = lines[i].trim().split(colSplit).filter(Boolean);
        if (cols.length < expectedCols && expectedCols > 0) {
          cols = lines[i].trim().split(/ +/).filter(Boolean);
        }
        if (cols.length >= minCols && Math.abs(cols.length - expectedCols) <= 1) {
          tableBuffer.push(cols);
          continue;
        } else {
          flushTable();
        }
      }
      result.push(lines[i]);
    }
    if (tableBuffer.length > 0) {
      flushTable();
    }
    return result.join('\n');
  }

  // Format headings (all caps, short lines) as Markdown ###
  private formatHeadings(text: string): string {
    return text.replace(/^(?=.{3,50}$)([A-Z][A-Z\s]+)$/gm, '### $1');
  }

  private extractEntities(text: string) {
    return {
      emails: Array.from(text.matchAll(this.emailRegex)).map(match => match[0]),
      phones: Array.from(text.matchAll(this.phoneRegex)).map(match => match[0]),
      dates: Array.from(text.matchAll(this.dateRegex)).map(match => match[0]),
      amounts: Array.from(text.matchAll(this.amountRegex)).map(match => match[0]),
      names: Array.from(text.matchAll(this.nameRegex)).map(match => match[0]),
      addresses: this.extractAddresses(text),
      numbers: Array.from(text.matchAll(this.numberRegex)).map(match => match[1])
    };
  }

  private extractAddresses(text: string): string[] {
    // Simple address extraction (can be enhanced)
    const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)(?:\s*,?\s*[A-Za-z\s]+)*,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?/gi;
    return Array.from(text.matchAll(addressRegex)).map(match => match[0]);
  }

  private identifySections(lines: string[]) {
    const sections = {
      title: undefined as string | undefined,
      header: [] as string[],
      body: [] as string[],
      footer: [] as string[]
    };

    if (lines.length === 0) return sections;

    // First line is likely title if it's short and capitalized
    if (lines[0] && lines[0].length < 50 && /^[A-Z\s]+$/.test(lines[0])) {
      sections.title = lines[0];
      lines = lines.slice(1);
    }

    // Header: first 20% of lines
    const headerEnd = Math.min(3, Math.floor(lines.length * 0.2));
    sections.header = lines.slice(0, headerEnd);

    // Footer: last 20% of lines or lines with signature/contact info
    const footerStart = Math.max(headerEnd, Math.floor(lines.length * 0.8));
    sections.footer = lines.slice(footerStart);

    // Body: everything in between
    sections.body = lines.slice(headerEnd, footerStart);

    return sections;
  }

  private classifyDocument(text: string): StructuredText['documentType'] {
    const lowerText = text.toLowerCase();
    
    // Invoice indicators
    if (lowerText.includes('invoice') || lowerText.includes('bill') || 
        lowerText.includes('amount due') || lowerText.includes('total:')) {
      return 'invoice';
    }
    
    // Receipt indicators
    if (lowerText.includes('receipt') || lowerText.includes('thank you') || 
        lowerText.includes('purchase') || lowerText.includes('paid')) {
      return 'receipt';
    }
    
    // Contract indicators
    if (lowerText.includes('contract') || lowerText.includes('agreement') || 
        lowerText.includes('terms and conditions') || lowerText.includes('signature')) {
      return 'contract';
    }
    
    // Resume indicators
    if (lowerText.includes('resume') || lowerText.includes('cv') || 
        lowerText.includes('experience') || lowerText.includes('education') ||
        lowerText.includes('skills')) {
      return 'resume';
    }
    
    // ID document indicators
    if (lowerText.includes('license') || lowerText.includes('passport') || 
        lowerText.includes('id card') || lowerText.includes('identification')) {
      return 'id';
    }
    
    // Report indicators
    if (lowerText.includes('report') || lowerText.includes('analysis') || 
        lowerText.includes('summary') || lowerText.includes('findings')) {
      return 'report';
    }
    
    return 'other';
  }

  private calculateConfidence(text: string): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for longer text
    if (text.length > 100) confidence += 0.1;
    if (text.length > 500) confidence += 0.1;
    
    // Higher confidence if structured elements found
    if (this.emailRegex.test(text)) confidence += 0.1;
    if (this.phoneRegex.test(text)) confidence += 0.1;
    if (this.dateRegex.test(text)) confidence += 0.1;
    if (this.amountRegex.test(text)) confidence += 0.1;
    
    // Lower confidence for very short text
    if (text.length < 50) confidence -= 0.2;
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  private extractMetadata(text: string, lines: string[]) {
    return {
      lineCount: lines.length,
      wordCount: text.split(/\s+/).length,
      hasTable: this.detectTable(text),
      hasSignature: this.detectSignature(text),
      language: this.detectLanguage(text)
    };
  }

  private detectTable(text: string): boolean {
    // Look for table-like patterns
    const lines = text.split('\n');
    let tableLines = 0;
    
    for (const line of lines) {
      // Check for multiple columns (separated by spaces, tabs, or pipes)
      if (line.split(/\s{2,}|\t|\|/).length >= 3) {
        tableLines++;
      }
    }
    
    return tableLines >= 2; // At least 2 lines that look like table rows
  }

  private detectSignature(text: string): boolean {
    const signatureWords = ['signature', 'signed', 'sign here', 'authorized', 'signatory'];
    const lowerText = text.toLowerCase();
    return signatureWords.some(word => lowerText.includes(word));
  }

  private detectLanguage(text: string): string {
    // Simple language detection (can be enhanced with proper library)
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    const words = text.toLowerCase().split(/\s+/);
    const englishMatches = words.filter(word => englishWords.includes(word)).length;
    
    if (englishMatches / words.length > 0.1) {
      return 'en';
    }
    
    return 'unknown';
  }
}
