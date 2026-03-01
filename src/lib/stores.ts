// src/lib/stores.ts
import { writable, type Writable } from 'svelte/store';

// Ek file ka interface jo ZIP se nikalega
export interface ZipFileEntry {
  path: string;        // Full path inside zip (e.g. "folder/file.txt")
  content: string;      // File ka raw text content (binary files ke liye base64? Abhi text maante hain)
}

// Tree node ka interface (hierarchical display ke liye)
export interface FileNode {
  name: string;         // File/folder name (basename)
  path: string;         // Full path
  type: 'file' | 'folder';
  children?: FileNode[]; // Agar folder hai to children
  checked?: boolean;     // Default true (checkbox state)
  indeterminate?: boolean; // For partial selection inside folder (optional)
}

// Sab files (raw) store
export const uploadedFiles: Writable<ZipFileEntry[]> = writable([]);

// Selected files ke paths ka Set (as string[] bhi use kar sakte the, but Set efficient hai toggle ke liye)
export const selectedPaths: Writable<Set<string>> = writable(new Set());

// Tree data jo UI me render hoga
export const treeData: Writable<FileNode[]> = writable([]);

// Helper function: selectedPaths ko update karne ke liye (toggle ek file)
export function toggleFileSelection(path: string, checked: boolean) {
  selectedPaths.update(set => {
    if (checked) {
      set.add(path);
    } else {
      set.delete(path);
    }
    return set; // Note: Set reference change nahi hota, isliye manually trigger karne ke liye new Set bana sakte hain
    // Better: return new Set(set) to trigger reactivity
  });
}

// Better implementation jo reactivity trigger kare:
export function updateSelection(path: string, checked: boolean) {
  selectedPaths.update(set => {
    const newSet = new Set(set);
    if (checked) {
      newSet.add(path);
    } else {
      newSet.delete(path);
    }
    return newSet;
  });
}

// Select/Deselect all
export function selectAll(select: boolean, allPaths: string[]) {
  selectedPaths.update(set => {
    const newSet = select ? new Set(allPaths) : new Set();
    return newSet;
  });
}