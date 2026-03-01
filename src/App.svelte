<!-- src/App.svelte -->
<script lang="ts">
  import { uploadedFiles, selectedPaths, treeData, selectAll, type ZipFileEntry } from './lib/stores';
  import { readZipFile } from './lib/utils/zipReader';
  import { buildFileTree } from './lib/utils/treeBuilder';
  import { createZipFromSelected, downloadZip } from './lib/utils/zipWriter';
  import FileTree from './lib/components/FileTree.svelte';

  let zipFile: File | null = null;
  let isLoading = false;
  let errorMessage = '';
  let allFilePaths: string[] = [];
  let localTreeData: any[] = []; // Local variable for reactivity

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      zipFile = null;
      localTreeData = [];
      $uploadedFiles = [];
      $treeData = [];
      return;
    }

    const file = input.files[0];
    zipFile = file;
    isLoading = true;
    errorMessage = '';

    try {
      const entries = await readZipFile(file);
      $uploadedFiles = entries;
      
      const tree = buildFileTree(entries);
      localTreeData = tree; // Set local variable first
      $treeData = tree; // Then set store
      
      allFilePaths = entries.map(e => e.path);
      selectAll(true, allFilePaths);
      
      // Force UI update
      isLoading = false;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'ZIP file upload failed';
      isLoading = false;
      localTreeData = [];
      $uploadedFiles = [];
      $treeData = [];
    }
  }

  async function handleDownload() {
    if ($selectedPaths.size === 0) {
      alert('Koi file select nahi ki gayi');
      return;
    }

    try {
      const selected: ZipFileEntry[] = $uploadedFiles.filter(file => 
        $selectedPaths.has(file.path)
      );
      const zipBlob = await createZipFromSelected(selected);
      downloadZip(zipBlob, 'selected_files.zip');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'ZIP creation failed';
    }
  }

  function handleSelectAll() {
    const allSelected = $selectedPaths.size === allFilePaths.length;
    selectAll(!allSelected, allFilePaths);
  }

  function handleClear() {
    zipFile = null;
    localTreeData = [];
    $uploadedFiles = [];
    $selectedPaths = new Set();
    $treeData = [];
    allFilePaths = [];
    errorMessage = '';
    const fileInput = document.getElementById('zip-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
</script>

<main>
  <h1>ZIP File Tree Selector</h1>

  <div class="upload-section">
    <label for="zip-upload">Select ZIP file:</label>
    <input
      type="file"
      id="zip-upload"
      accept=".zip,application/zip"
      on:change={handleFileUpload}
      disabled={isLoading}
    />
    
    {#if zipFile}
      <button on:click={handleClear} disabled={isLoading}>Clear</button>
    {/if}
  </div>

  {#if isLoading}
    <div class="loading">Loading... ⏳</div>
  {/if}

  {#if errorMessage}
    <div class="error">❌ {errorMessage}</div>
  {/if}

  <!-- Simple debug info -->
  <div style="margin: 10px 0; padding: 5px; background: #f0f0f0;">
    Files: {$uploadedFiles.length} | Tree nodes: {localTreeData.length} | Selected: {$selectedPaths.size}
  </div>

  <!-- Direct condition using local variable -->
  {#if localTreeData.length > 0}
    <div class="tree-container">
      <div class="tree-header">
        <h2>Folder Structure</h2>
        <div class="tree-actions">
          <button on:click={handleSelectAll} disabled={isLoading}>
            {$selectedPaths.size === allFilePaths.length ? 'Deselect All' : 'Select All'}
          </button>
          <span class="selected-count">
            {$selectedPaths.size} / {allFilePaths.length} files selected
          </span>
        </div>
      </div>
      
      <div class="tree-wrapper">
        <!-- Direct rendering without key or store -->
        <FileTree nodes={localTreeData} />
      </div>

      <div class="download-section">
        <button
          on:click={handleDownload}
          disabled={$selectedPaths.size === 0 || isLoading}
          class="download-btn"
        >
          Download Selected Files (10 parts)
        </button>
      </div>
    </div>
  {/if}

  <div class="info">
    <p>ℹ️ Selected files 10 text files mein divide hokar ZIP mein download honge.</p>
  </div>
</main>

<style>
  /* Same styles as before */
  main { max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { color: #333; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; }
  .upload-section { margin: 20px 0; display: flex; gap: 10px; align-items: center; }
  button { padding: 8px 16px; background-color: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer; }
  button:hover:not(:disabled) { background-color: #357abd; }
  button:disabled { background-color: #ccc; cursor: not-allowed; }
  .loading { background-color: #e3f2fd; color: #1976d2; padding: 10px; }
  .error { background-color: #ffebee; color: #c62828; padding: 10px; }
  .tree-container { margin-top: 20px; border: 1px solid #ddd; border-radius: 4px; padding: 15px; }
  .tree-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
  .selected-count { background-color: #e8f5e8; padding: 4px 8px; border-radius: 4px; color: #2e7d32; }
  .tree-wrapper { max-height: 400px; overflow-y: auto; border: 1px solid #eee; padding: 10px; background: #fafafa; }
  .download-section { margin-top: 20px; text-align: center; }
  .download-btn { background-color: #2e7d32; font-size: 16px; padding: 12px 24px; }
  .info { margin-top: 20px; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px; }
</style>
