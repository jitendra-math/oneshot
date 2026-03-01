// src/lib/utils/treeBuilder.ts
import type { ZipFileEntry, FileNode } from '../stores';

/**
 * Flat file list se nested tree structure banata hai
 * @param files - Array of ZipFileEntry objects (path & content)
 * @returns Array of root FileNode objects (top-level folders/files)
 */
export function buildFileTree(files: ZipFileEntry[]): FileNode[] {
  const root: FileNode[] = [];
  
  // Path ke according nodes store karne ke liye map
  // Key: full path, Value: corresponding FileNode
  const nodeMap = new Map<string, FileNode>();

  // Pehle saare files ke liye nodes banao
  files.forEach(file => {
    const parts = file.path.split('/').filter(p => p.length > 0); // empty parts hatao
    let currentPath = '';
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      // Agar node already exist karta hai to use karo, warna naya banao
      if (!nodeMap.has(currentPath)) {
        const node: FileNode = {
          name: part,
          path: currentPath,
          type: isLast ? 'file' : 'folder',
          children: isLast ? undefined : []
        };
        nodeMap.set(currentPath, node);
        
        // Parent ke children mein add karo
        if (parentPath === '') {
          // Root level
          root.push(node);
        } else {
          const parentNode = nodeMap.get(parentPath);
          if (parentNode && parentNode.children) {
            parentNode.children.push(node);
          } else {
            // Yeh case nahi hona chahiye, phir bhi handle kar lete hain
            console.warn(`Parent missing for ${currentPath}, adding to root`);
            root.push(node);
          }
        }
      } else {
        // Agar node already hai (e.g., folder pehle file ban gaya ho) to kuch nahi
        // But folder/file conflict? Usually ZIP mein dono nahi hote ek saath. Ignore.
      }
    });
  });

  // Children ko sort karo (folders pehle, phir files alphabetically)
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1; // folders pehle
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
    return nodes;
  };

  return sortNodes(root);
}