import { parseMdbVisitorData } from '@digital-library/utils';
import { VisitorRecord } from '@digital-library/types';
import { visitorRecordsStore } from '../services/store';

export const importMdbBufferToStore = (filename: string, buffer: Buffer): { count: number; records: VisitorRecord[] } => {
  const fileString = buffer.toString('utf-8');
  const parsedRecords = parseMdbVisitorData(filename, fileString);

  const imported: VisitorRecord[] = [];
  parsedRecords.forEach((rec) => {
    const newRecord: VisitorRecord = {
      id: `vis-mdb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      visitorName: rec.visitorName || 'Historical Visitor',
      visitDate: rec.visitDate || '1995-01-01',
      purpose: rec.purpose || 'Academic Consultation',
      department: rec.department || 'University Archives',
      contact: rec.contact || '',
      year: rec.year || 1995,
      notes: rec.notes || `Converted from MDB database file (${filename})`,
      originalMdbId: rec.originalMdbId || `MDB_${Date.now()}`,
    };
    visitorRecordsStore.unshift(newRecord);
    imported.push(newRecord);
  });

  return {
    count: imported.length,
    records: imported,
  };
};
