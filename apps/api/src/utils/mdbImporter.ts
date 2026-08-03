import { parseMdbVisitorData } from '@digital-library/utils';

export const parseMdbBufferToRecords = (filename: string, buffer: Buffer) => {
  const fileString = buffer.toString('utf-8');
  const parsedRecords = parseMdbVisitorData(filename, fileString);

  const imported: any[] = [];
  parsedRecords.forEach((rec) => {
    imported.push({
      visitorName: rec.visitorName || 'Historical Visitor',
      visitDate: rec.visitDate || '1995-01-01',
      purpose: rec.purpose || 'Academic Consultation',
      department: rec.department || 'University Archives',
      contact: rec.contact || '',
      year: rec.year || 1995,
      notes: rec.notes || `Converted from MDB database file (${filename})`,
      originalMdbId: rec.originalMdbId || `MDB_${Date.now()}`,
    });
  });

  return {
    count: imported.length,
    records: imported,
  };
};
