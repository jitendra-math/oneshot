// src/lib/utils/zipReader.ts
import JSZip from 'jszip';
import type { ZipFileEntry } from '../stores';

/**
 * Uploaded File object ko read karta hai, ZIP parse karta hai,
 * aur har file ka path aur text content return karta hai.
 */
export async function readZipFile(file: File): Promise<ZipFileEntry[]> {
  try {
    // File ko ArrayBuffer me read karo
    const arrayBuffer = await file.arrayBuffer();
    
    // JSZip se load karo
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const entries: ZipFileEntry[] = [];
    
    // Saare files ke liye loop
    const filePromises: Promise<void>[] = [];
    
    zip.forEach((relativePath, zipEntry) => {
      // Sirf files lo (folders ko ignore)
      if (!zipEntry.dir) {
        const promise = zipEntry.async('string') // content as string (UTF-8)
          .then(content => {
            entries.push({
              path: relativePath,
              content: content
            });
          })
          .catch(err => {
            console.warn(`File read karne mein error: ${relativePath}`, err);
            // Agar koi file read na ho to empty content daalo taaki process aage badhe
            entries.push({
              path: relativePath,
              content: '' // fallback
            });
          });
        filePromises.push(promise);
      }
    });
    
    // Sab files ke read complete hone ka wait karo
    await Promise.all(filePromises);
    
    return entries;
  } catch (error) {
    console.error('ZIP parse karne mein error:', error);
    throw new Error('ZIP file corrupt ya invalid hai');
  }
}