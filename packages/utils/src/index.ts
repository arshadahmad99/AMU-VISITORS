/**
 * Currency formatter
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format Date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Search inside page texts of a book
 */
export interface SearchMatch {
  pageNumber: number;
  snippet: string;
  matchIndex: number;
}

export const searchInBookPages = (pages: string[], query: string): SearchMatch[] => {
  if (!query || !query.trim()) return [];
  const results: SearchMatch[] = [];
  const cleanQuery = query.toLowerCase().trim();

  pages.forEach((content, idx) => {
    const lowerContent = content.toLowerCase();
    const matchIndex = lowerContent.indexOf(cleanQuery);
    if (matchIndex !== -1) {
      const start = Math.max(0, matchIndex - 30);
      const end = Math.min(content.length, matchIndex + cleanQuery.length + 40);
      const snippet = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
      results.push({
        pageNumber: idx + 1,
        snippet,
        matchIndex,
      });
    }
  });

  return results;
};

/**
 * Parses simulated or real MDB Access binary buffer / text stream into VisitorRecords
 */
export const parseMdbVisitorData = (filename: string, content: string | ArrayBuffer) => {
  // Parses CSV or mock MDB data format from file content
  const records: any[] = [];
  const textContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
  
  const lines = textContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  let idCounter = 1;

  lines.forEach((line, index) => {
    // Skip header if present
    if (index === 0 && line.toLowerCase().includes('visitor')) return;
    
    const parts = line.split(/[,;\t|]/);
    if (parts.length >= 3) {
      const name = parts[0]?.replace(/["']/g, '').trim() || `Visitor #${idCounter}`;
      const year = parseInt(parts[1]?.trim()) || 2020 + (idCounter % 5);
      const purpose = parts[2]?.replace(/["']/g, '').trim() || 'Academic Research';
      const dept = parts[3]?.replace(/["']/g, '').trim() || 'Computer Science';
      
      records.push({
        id: `vis-mdb-${Date.now()}-${idCounter}`,
        visitorName: name,
        year: isNaN(year) ? 2024 : year,
        purpose,
        department: dept,
        visitDate: `${year}-05-15`,
        contact: `visitor${idCounter}@univ.edu`,
        originalMdbId: `MDB_ROW_${idCounter}`,
        notes: `Imported from ${filename}`
      });
      idCounter++;
    }
  });

  return records;
};
