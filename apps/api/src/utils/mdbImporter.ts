import MDBReader from 'mdb-reader';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Helper to extract raw image (JPG, PNG, BMP) from Microsoft Access OLE Object wrappers
const extractImageFromOle = (oleBuffer: Buffer): { buffer: Buffer, ext: string } | null => {
  if (!oleBuffer || oleBuffer.length === 0) return null;
  
  const candidates: { buffer: Buffer, ext: string }[] = [];

  // 1. Find all PNGs
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  let searchIdx = 0;
  while (true) {
    const idx = oleBuffer.indexOf(pngMagic, searchIdx);
    if (idx === -1) break;
    const iendIdx = oleBuffer.indexOf(Buffer.from('IEND'), idx);
    if (iendIdx !== -1) {
      candidates.push({ buffer: oleBuffer.subarray(idx, iendIdx + 8), ext: 'png' });
    } else {
      candidates.push({ buffer: oleBuffer.subarray(idx), ext: 'png' });
    }
    searchIdx = idx + 8;
  }

  // 2. Find all JPEGs
  const jpgMagic1 = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  const jpgMagic2 = Buffer.from([0xff, 0xd8, 0xff, 0xe1]);
  searchIdx = 0;
  while (true) {
    let idx1 = oleBuffer.indexOf(jpgMagic1, searchIdx);
    let idx2 = oleBuffer.indexOf(jpgMagic2, searchIdx);
    let idx = -1;
    if (idx1 !== -1 && idx2 !== -1) idx = Math.min(idx1, idx2);
    else if (idx1 !== -1) idx = idx1;
    else if (idx2 !== -1) idx = idx2;
    
    if (idx === -1) break;
    
    const endIdx = oleBuffer.indexOf(Buffer.from([0xff, 0xd9]), idx);
    if (endIdx !== -1) {
      candidates.push({ buffer: oleBuffer.subarray(idx, endIdx + 2), ext: 'jpg' });
    } else {
      candidates.push({ buffer: oleBuffer.subarray(idx), ext: 'jpg' });
    }
    searchIdx = idx + 2;
  }

  // 3. Find all OLE DIBs
  searchIdx = 0;
  while (true) {
    const dibIndex = oleBuffer.indexOf(Buffer.from([0x28, 0x00, 0x00, 0x00]), searchIdx);
    if (dibIndex === -1) break;
    
    if (dibIndex + 40 <= oleBuffer.length) {
      const width = oleBuffer.readInt32LE(dibIndex + 4);
      const height = oleBuffer.readInt32LE(dibIndex + 8);
      const planes = oleBuffer.readUInt16LE(dibIndex + 12);
      const bitCount = oleBuffer.readUInt16LE(dibIndex + 14);
      
      if (planes === 1 && [1, 4, 8, 16, 24, 32].includes(bitCount) && width > 0 && width < 10000 && height !== 0) {
        const biSize = oleBuffer.readUInt32LE(dibIndex);
        let colorsUsed = oleBuffer.readUInt32LE(dibIndex + 32);
        if (colorsUsed === 0 && bitCount < 16) {
          colorsUsed = Math.pow(2, bitCount);
        }
        let colorTableSize = colorsUsed * 4;
        
        const compression = oleBuffer.readUInt32LE(dibIndex + 16);
        if (compression === 3) {
          colorTableSize += 12; // BI_BITFIELDS masks
        }

        const dataOffset = 14 + biSize + colorTableSize;
        
        let imageSize = oleBuffer.readUInt32LE(dibIndex + 20);
        if (imageSize === 0) {
          // Calculate row size in bytes (padded to multiple of 4 bytes)
          const rowSize = Math.floor((width * bitCount + 31) / 32) * 4;
          imageSize = rowSize * Math.abs(height);
        }
        
        const exactDibSize = biSize + colorTableSize + imageSize;
        const actualDibSize = Math.min(exactDibSize, oleBuffer.length - dibIndex);

        const bmpBuffer = Buffer.alloc(14 + actualDibSize);
        bmpBuffer.write('BM', 0);
        bmpBuffer.writeUInt32LE(14 + actualDibSize, 2);
        bmpBuffer.writeUInt32LE(0, 6);
        bmpBuffer.writeUInt32LE(dataOffset, 10); // Correct offset accounting for palette
        oleBuffer.copy(bmpBuffer, 14, dibIndex, dibIndex + actualDibSize);
        candidates.push({ buffer: bmpBuffer, ext: 'bmp' });
      }
    }
    searchIdx = dibIndex + 4;
  }

  // 4. Find all raw BMPs
  searchIdx = 0;
  while (true) {
    const bmpIndex = oleBuffer.indexOf(Buffer.from('BM'), searchIdx);
    if (bmpIndex === -1) break;
    if (bmpIndex + 14 <= oleBuffer.length) {
      const fileSize = oleBuffer.readUInt32LE(bmpIndex + 2);
      if (fileSize > 0 && fileSize <= oleBuffer.length - bmpIndex) {
         candidates.push({ buffer: oleBuffer.subarray(bmpIndex, bmpIndex + fileSize), ext: 'bmp' });
      }
    }
    searchIdx = bmpIndex + 2;
  }

  if (candidates.length === 0) return null;

  // Return the largest candidate to avoid extracting tiny thumbnails
  candidates.sort((a, b) => b.buffer.length - a.buffer.length);
  return candidates[0];
};

export const parseMdbBufferToRecords = (filename: string, buffer: Buffer) => {
  const reader = new MDBReader(buffer);
  const tables = reader.getTableNames();
  
  // Filter out internal MS Access system tables
  const userTables = tables.filter(t => !t.startsWith('MSys') && !t.startsWith('~') && !t.includes('AutoCorrect'));
  if (userTables.length === 0) {
    throw new Error("No valid user tables found in the provided .mdb database file.");
  }
  
  // Define upload directory for extracted Autograph OLE images
  const uploadDir = path.join(__dirname, '../../../../apps/website/public/uploads/autographs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const imported: any[] = [];
  
  for (const tableName of userTables) {
    const table = reader.getTable(tableName);
    const rows = table.getData();

    for (const row of rows) {
      if (Object.keys(row).length === 0) continue;
      
      console.log(`[MDB Debug] Table: ${tableName}, Keys:`, Object.keys(row));

      // 1. Identify the name column to ensure this is a valid visitor record
      const nameKey = Object.keys(row).find(k => {
        const kl = k.toLowerCase().trim();
        return kl === 'name' || kl.includes('visitor') || kl.includes('name') || kl.includes('person');
      });
      
      // Skip empty or invalid rows that don't have a valid name field or value
      if (!nameKey || row[nameKey] == null) continue;

      let autographPath: string | null = null;
      let visitorImagePath: string | null = null;
      
      // 2. Extract Autograph Image
      const autographKey = Object.keys(row).find(k => {
        const lower = k.toLowerCase();
        return lower.includes('autograph') || lower.includes('signature') || lower === 'mr_picture';
      });
      if (autographKey && Buffer.isBuffer(row[autographKey])) {
        const extracted = extractImageFromOle(row[autographKey]);
        if (extracted) {
          const imageFilename = `autograph_${uuidv4()}.${extracted.ext}`;
          const imagePath = path.join(uploadDir, imageFilename);
          fs.writeFileSync(imagePath, extracted.buffer);
          autographPath = `/uploads/autographs/${imageFilename}`;
        }
      }

      // 2b. Extract Visitor Photo/Picture
      const photoKey = Object.keys(row).find(k => {
        const lower = k.toLowerCase();
        if (lower === 'mr_picture') return false; // Prevent double-matching the autograph
        return lower.includes('photo') || lower.includes('image') || lower === 'mr_photo';
      });
      if (photoKey && Buffer.isBuffer(row[photoKey])) {
        const extracted = extractImageFromOle(row[photoKey]);
        if (extracted) {
          const imageFilename = `photo_${uuidv4()}.${extracted.ext}`;
          const imagePath = path.join(uploadDir, imageFilename);
          fs.writeFileSync(imagePath, extracted.buffer);
          visitorImagePath = `/uploads/autographs/${imageFilename}`;
        }
      }
      
      // 3. Map standard fields natively
      const dateKey = Object.keys(row).find(k => k.toLowerCase() === 'visiting date' || k.toLowerCase().includes('date'));
      const countryKey = Object.keys(row).find(k => k.toLowerCase().includes('country'));
      const designationKey = Object.keys(row).find(k => k.toLowerCase().includes('designation'));
      const pageNoKey = Object.keys(row).find(k => k.toLowerCase() === 'page no.' || k.toLowerCase().includes('page'));
      
      const visitDateVal = dateKey ? row[dateKey] : null;
      let visitDateStr = 'Unknown Date';
      if (visitDateVal instanceof Date) {
        visitDateStr = visitDateVal.toISOString().split('T')[0];
      } else if (visitDateVal) {
        visitDateStr = String(visitDateVal);
      }

      imported.push({
        visitorName: String(row[nameKey]),
        visitDate: visitDateStr,
        country: countryKey && row[countryKey] ? String(row[countryKey]) : null,
        designation: designationKey && row[designationKey] ? String(row[designationKey]) : null,
        pageNumber: pageNoKey && row[pageNoKey] ? parseInt(String(row[pageNoKey])) : null,
        autographPath,
        visitorImagePath,
        notes: `Imported from ${filename} (Table: ${tableName})`,
        originalMdbId: row['ID'] ? String(row['ID']) : null
      });
    }
  }

  return {
    count: imported.length,
    records: imported,
  };
};
