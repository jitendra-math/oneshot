<!-- src/lib/components/FileTree.svelte -->
<script lang="ts">
  import { selectedPaths, type FileNode } from '../stores';
  import { createEventDispatcher } from 'svelte';

  export let nodes: FileNode[] = []; // Recursive prop
  export let level: number = 0;       // Indentation level

  const dispatch = createEventDispatcher();

  // Helper: check if a node is a file
  const isFile = (node: FileNode) => node.type === 'file';

  // Check if node is selected (for files)
  function isSelected(path: string): boolean {
    let selected = false;
    selectedPaths.subscribe(set => {
      selected = set.has(path);
    })(); // Immediate execution, but better to use derived store?
    // Actually we should use a derived store or reactive statement.
    // We'll use $selectedPaths directly if we make it reactive.
    // But in Svelte, we can use $: reactive statement with store subscription.
    // Let's use $selectedPaths from the store directly.
    // However, selectedPaths is a writable store, but we need its value.
    // In Svelte, prefix with $ to get the value.
  }

  // We'll use $selectedPaths directly in markup.
  // For logic, we can use $selectedPaths inside reactive statements.

  // For folder indeterminate state: check if some but not all children are selected
  function getFolderState(node: FileNode): { checked: boolean; indeterminate: boolean } {
    if (!node.children || node.children.length === 0) {
      return { checked: false, indeterminate: false };
    }

    // Get all descendant file paths
    const descendantPaths = collectFilePaths(node);
    if (descendantPaths.length === 0) return { checked: false, indeterminate: false };

    let selectedCount = 0;
    // Use current $selectedPaths
    const selectedSet = $selectedPaths; // This will be reactive if used inside reactive statement

    descendantPaths.forEach(path => {
      if (selectedSet.has(path)) selectedCount++;
    });

    const allSelected = selectedCount === descendantPaths.length;
    const someSelected = selectedCount > 0 && selectedCount < descendantPaths.length;

    return {
      checked: allSelected,
      indeterminate: someSelected
    };
  }

  // Helper to collect all file paths under a folder
  function collectFilePaths(node: FileNode): string[] {
    const paths: string[] = [];
    if (node.type === 'file') {
      paths.push(node.path);
    } else if (node.children) {
      node.children.forEach(child => {
        paths.push(...collectFilePaths(child));
      });
    }
    return paths;
  }

  // Handle folder checkbox change
  function handleFolderToggle(node: FileNode, event: Event) {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    const descendantPaths = collectFilePaths(node);

    // Update selectedPaths store
    $selectedPaths.update(set => {
      const newSet = new Set(set);
      descendantPaths.forEach(path => {
        if (checked) {
          newSet.add(path);
        } else {
          newSet.delete(path);
        }
      });
      return newSet;
    });

    // Dispatch event if needed (e.g., to notify parent)
    dispatch('toggle', { path: node.path, checked });
  }

  // Handle file checkbox change
  function handleFileToggle(node: FileNode, event: Event) {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;

    $selectedPaths.update(set => {
      const newSet = new Set(set);
      if (checked) {
        newSet.add(node.path);
      } else {
        newSet.delete(node.path);
      }
      return newSet;
    });

    dispatch('toggle', { path: node.path, checked });
  }

  // Simple expand/collapse state (optional)
  let expandedFolders = new Set<string>();
  function toggleExpand(path: string) {
    if (expandedFolders.has(path)) {
      expandedFolders.delete(path);
    } else {
      expandedFolders.add(path);
    }
    expandedFolders = expandedFolders; // trigger update
  }
</script>

<!-- Main tree container -->
<div class="tree" class:level-{level}>
  {#each nodes as node (node.path)}
    <div class="tree-node" class:file={node.type === 'file'} class:folder={node.type === 'folder'}>
      <div class="node-row" style="padding-left: {level * 20}px">
        {#if node.type === 'folder'}
          <!-- Expand/collapse icon -->
          <span class="expand-icon" on:click={() => toggleExpand(node.path)}>
            {#if expandedFolders.has(node.path)}
              ▼
            {:else}
              ▶
            {/if}
          </span>
          <!-- Checkbox for folder -->
          {@const { checked, indeterminate } = getFolderState(node)}
          <input
            type="checkbox"
            bind:checked={checked}
            indeterminate={indeterminate}
            on:change={(e) => handleFolderToggle(node, e)}
          />
          <span class="folder-name">{node.name}</span>
        {:else}
          <!-- File: indent without expand icon -->
          <span class="file-indent" style="display: inline-block; width: 20px;"></span>
          <input
            type="checkbox"
            checked={$selectedPaths.has(node.path)}
            on:change={(e) => handleFileToggle(node, e)}
          />
          <span class="file-name">{node.name}</span>
        {/if}
      </div>

      <!-- Render children if folder and expanded -->
      {#if node.type === 'folder' && node.children && expandedFolders.has(node.path)}
        <svelte:self nodes={node.children} level={level + 1} on:toggle />
      {/if}
    </div>
  {/each}
</div>

<style>
  .tree-node {
    user-select: none;
  }
  .node-row {
    display: flex;
    align-items: center;
    padding: 2px 0;
  }
  .expand-icon {
    cursor: pointer;
    display: inline-block;
    width: 16px;
    text-align: center;
    font-size: 10px;
    margin-right: 4px;
  }
  .file-indent {
    display: inline-block;
  }
  .folder-name, .file-name {
    margin-left: 4px;
  }
  input[type="checkbox"] {
    margin: 0;
  }
</style>