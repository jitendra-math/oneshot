// src/lib/utils/zipReader.ts
import JSZip from 'jszip';
import type { ZipFileEntry } from '../stores';

// Allowed text file extensions (case-insensitive)
const ALLOWED_EXTENSIONS = new Set([
  '.txt', '.js', '.ts', '.jsx', '.tsx', '.html', '.htm', '.css', '.scss', '.sass',
  '.json', '.xml', '.yaml', '.yml', '.md', '.py', '.rb', '.php', '.java', '.c',
  '.cpp', '.h', '.cs', '.go', '.rs', '.swift', '.kt', '.sql', '.sh', '.bash',
  '.zsh', '.ps1', '.bat', '.cmd', '.r', '.pl', '.lua', '.dart', '.fs', '.fsx',
  '.svelte', '.vue', '.astro', '.graphql', '.gql', '.toml', '.ini', '.cfg',
  '.conf', '.properties', '.env', '.gitignore', '.dockerignore', '.eslintrc',
  '.prettierrc', '.babelrc', '.stylelintrc'
]);

function isTextFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  // Check if file has an allowed extension
  for (const ext of ALLOWED_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

/**
 * Uploaded File object ko read karta hai, ZIP parse karta hai,
 * aur sirf text files ka path aur content return karta hai.
 * Binary files (images, videos, PDF, etc.) automatically skip ho jayengi.
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
        // Binary files ko skip karo
        if (!isTextFile(relativePath)) {
          console.log(`Skipping binary file: ${relativePath}`);
          return; // Skip this file
        }
        
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
