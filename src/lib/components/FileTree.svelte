<!-- src/lib/components/FileTree.svelte -->
<script lang="ts">
  import { selectedPaths, type FileNode } from '../stores';
  import { createEventDispatcher } from 'svelte';

  export let nodes: FileNode[] = [];
  export let level: number = 0;

  const dispatch = createEventDispatcher();

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

  // Folder state: checked aur indeterminate calculate karo
  function getFolderState(node: FileNode) {
    if (!node.children || node.children.length === 0) {
      return { checked: false, indeterminate: false };
    }

    const descendantPaths = collectFilePaths(node);
    if (descendantPaths.length === 0) return { checked: false, indeterminate: false };

    let selectedCount = 0;
    descendantPaths.forEach(path => {
      if ($selectedPaths.has(path)) selectedCount++;
    });

    const allSelected = selectedCount === descendantPaths.length;
    const someSelected = selectedCount > 0 && selectedCount < descendantPaths.length;

    return {
      checked: allSelected,
      indeterminate: someSelected
    };
  }

  // Handle folder checkbox change
  function handleFolderToggle(node: FileNode, event: Event) {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    const descendantPaths = collectFilePaths(node);

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

  // Expand/collapse state
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

<div class="tree" class:level-{level}>
  {#each nodes as node (node.path)}
    <div class="tree-node" class:file={node.type === 'file'} class:folder={node.type === 'folder'}>
      <div class="node-row" style="padding-left: {level * 20}px">
        {#if node.type === 'folder'}
          <span class="expand-icon" on:click={() => toggleExpand(node.path)}>
            {#if expandedFolders.has(node.path)}▼{:else}▶{/if}
          </span>
          <input
            type="checkbox"
            checked={getFolderState(node).checked}
            indeterminate={getFolderState(node).indeterminate}
            on:change={(e) => handleFolderToggle(node, e)}
          />
          <span class="folder-name">{node.name}</span>
        {:else}
          <span class="file-indent" style="display: inline-block; width: 20px;"></span>
          <input
            type="checkbox"
            checked={$selectedPaths.has(node.path)}
            on:change={(e) => handleFileToggle(node, e)}
          />
          <span class="file-name">{node.name}</span>
        {/if}
      </div>

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
