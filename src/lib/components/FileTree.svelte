<!-- src/lib/components/FileTree.svelte - Simplified version -->
<script lang="ts">
  import { selectedPaths } from '../stores';
  
  export let nodes: any[] = [];
  export let level: number = 0;

  let expandedFolders = new Set<string>();

  function toggleExpand(path: string) {
    if (expandedFolders.has(path)) {
      expandedFolders.delete(path);
    } else {
      expandedFolders.add(path);
    }
    expandedFolders = expandedFolders;
  }

  function isFileSelected(path: string): boolean {
    let selected = false;
    selectedPaths.subscribe(set => {
      selected = set.has(path);
    })();
    return selected;
  }

  function handleFileToggle(path: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    selectedPaths.update(set => {
      const newSet = new Set(set);
      if (checked) newSet.add(path);
      else newSet.delete(path);
      return newSet;
    });
  }
</script>

<div>
  {#each nodes as node}
    <div style="padding-left: {level * 20}px; margin: 2px 0;">
      {#if node.type === 'folder'}
        <div>
          <span on:click={() => toggleExpand(node.path)} style="cursor: pointer; margin-right: 4px;">
            {expandedFolders.has(node.path) ? '▼' : '▶'}
          </span>
          <span style="font-weight: bold;">📁 {node.name}</span>
        </div>
        {#if expandedFolders.has(node.path) && node.children}
          <svelte:self nodes={node.children} level={level + 1} />
        {/if}
      {:else}
        <div>
          <span style="margin-left: 20px; display: inline-block; width: 16px;"></span>
          <input 
            type="checkbox" 
            checked={isFileSelected(node.path)}
            on:change={(e) => handleFileToggle(node.path, e)}
          />
          <span style="margin-left: 4px;">📄 {node.name}</span>
        </div>
      {/if}
    </div>
  {/each}
</div>
