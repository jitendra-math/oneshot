// src/lib/utils/zipWriter.ts
import JSZip from 'jszip';
import type { ZipFileEntry } from '../stores';

/**
 * Selected files ko 10 parts mein divide karta hai aur har part ka content JSON format mein rakhta hai
 * @param selectedFiles - Array of selected ZipFileEntry objects
 * @returns Promise<Blob> - Generated ZIP file ka blob
 */
export async function createZipFromSelected(selectedFiles: ZipFileEntry[]): Promise<Blob> {
  const zip = new JSZip();
  
  // Agar koi file selected nahi to empty ZIP return karo (ya error throw karo)
  if (selectedFiles.length === 0) {
    zip.file('part_01.txt', '');
    return zip.generateAsync({ type: 'blob' });
  }

  // Step 1: Har file ka content JSON format mein convert karo
  // Format: { "full/path/to/file.ext": "file content here" }
  const formattedBlocks = selectedFiles.map(file => {
    // Object create karo jisme key = path, value = content
    const obj = {
      [file.path]: file.content
    };
    // JSON string mein convert karo (pretty nahi, ek line mein)
    return JSON.stringify(obj);
  });

  // Step 2: 10 files mein round-robin distribution
  const TOTAL_FILES = 10;
  const parts: string[][] = Array.from({ length: TOTAL_FILES }, () => []);
  
  formattedBlocks.forEach((block, index) => {
    const partIndex = index % TOTAL_FILES; // Round-robin
    parts[partIndex].push(block);
  });

  // Step 3: Har part ko ek text file mein convert karo
  // Files ko array of objects ki jagah ek object per line rakhenge (JSON Lines style)
  // Ya phir ek array mein wrap kar sakte hain - decide karo
  // Better: JSON Lines (har line ek independent JSON object) - yeh parsing mein easy hai
  
  for (let i = 0; i < TOTAL_FILES; i++) {
    const partBlocks = parts[i];
    let content = '';
    
    if (partBlocks.length === 0) {
      // Agar koi block nahi to empty file ya placeholder
      content = ''; // Empty file
    } else {
      // JSON Lines format: har block alag line mein
      content = partBlocks.join('\n');
      
      // Alternative: Array format - [block1, block2, ...]
      // content = '[' + partBlocks.join(',') + ']';
    }
    
    // File name: part_01.txt, part_02.txt, etc.
    const fileName = `part_${(i + 1).toString().padStart(2, '0')}.txt`;
    zip.file(fileName, content);
  }

  // Step 4: ZIP generate karo as blob
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 } // Default compression level
  });

  return zipBlob;
}

/**
 * Helper function to download blob as file
 * @param blob - ZIP blob
 * @param filename - Download filename
 */
export function downloadZip(blob: Blob, filename: string = 'selected_files.zip') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}