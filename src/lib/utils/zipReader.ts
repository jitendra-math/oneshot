// src/lib/utils/zipReader.ts
import JSZip from 'jszip';
import type { ZipFileEntry } from '../stores';

// Allowed text file extensions (case-insensitive) – common text-based files
const ALLOWED_EXTENSIONS = new Set([
  '.txt', '.js', '.ts', '.jsx', '.tsx', '.html', '.htm', '.css', '.scss', '.sass',
  '.json', '.xml', '.yaml', '.yml', '.md', '.py', '.rb', '.php', '.java', '.c',
  '.cpp', '.h', '.cs', '.go', '.rs', '.swift', '.kt', '.sql', '.sh', '.bash',
  '.zsh', '.ps1', '.bat', '.cmd', '.r', '.pl', '.lua', '.dart', '.fs', '.fsx',
  '.svelte', '.vue', '.astro', '.graphql', '.gql', '.toml', '.ini', '.cfg',
  '.conf', '.properties', '.env', '.gitignore', '.dockerignore', '.eslintrc',
  '.prettierrc', '.babelrc', '.stylelintrc', '.svg',
  // Additional extensions for Next.js / common configs
  '.mjs', '.cjs',                // ES modules
  '.jsconfig', '.tsconfig',      // config files (though usually .json)
  '.postcssrc', '.tailwindrc',   // possible config files
  '.yarnrc', '.npmrc',           // package manager configs
  '.eslintignore', '.prettierignore',
  '.editorconfig', '.browserslistrc'
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
 * 
 * Debugging alerts ke saath.
 */
export async function readZipFile(file: File): Promise<ZipFileEntry[]> {
  try {
    // Step 1: File ko ArrayBuffer me read karo
    alert(`1. File selected: ${file.name}, size: ${file.size} bytes`);
    const arrayBuffer = await file.arrayBuffer();
    alert(`2. ArrayBuffer created, size: ${arrayBuffer.byteLength} bytes`);
    
    // Step 2: JSZip se load karo
    const zip = await JSZip.loadAsync(arrayBuffer);
    alert(`3. ZIP loaded successfully. Total entries: ${Object.keys(zip.files).length}`);
    
    const entries: ZipFileEntry[] = [];
    const filePromises: Promise<void>[] = [];
    
    // Counters for debugging
    let totalFiles = 0;
    let skippedBinary = 0;
    let processed = 0;
    
    zip.forEach((relativePath, zipEntry) => {
      // Sirf files lo (folders ko ignore)
      if (!zipEntry.dir) {
        totalFiles++;
        if (!isTextFile(relativePath)) {
          console.log(`Skipping binary file: ${relativePath}`);
          skippedBinary++;
          return; // Skip this file
        }
        
        processed++;
        const promise = zipEntry.async('string') // content as string (UTF-8)
          .then(content => {
            entries.push({
              path: relativePath,
              content: content
            });
          })
          .catch(err => {
            console.warn(`File read karne mein error: ${relativePath}`, err);
            // Fallback empty content
            entries.push({
              path: relativePath,
              content: '' 
            });
          });
        filePromises.push(promise);
      }
    });
    
    alert(`4. ZIP scan complete.\nTotal files (non-folder): ${totalFiles}\nText files identified: ${processed}\nBinary skipped: ${skippedBinary}`);
    
    // Sab files ke read complete hone ka wait karo
    await Promise.all(filePromises);
    alert(`5. All text files read. Final entries count: ${entries.length}`);
    
    // Optional: show first few paths in alert (if any)
    if (entries.length > 0) {
      const samplePaths = entries.slice(0, 3).map(e => e.path).join('\n');
      alert(`Sample paths:\n${samplePaths}\n...`);
    } else {
      alert(`⚠️ Koi text file nahi mili. Check extensions ya ZIP content.`);
    }
    
    return entries;
  } catch (error) {
    console.error('ZIP parse karne mein error:', error);
    alert(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw new Error('ZIP file corrupt ya invalid hai');
  }
}
