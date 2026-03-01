<!-- src/App.svelte -->
<script lang="ts">
  import { tick } from 'svelte';
  import { uploadedFiles, selectedPaths, treeData, selectAll, type ZipFileEntry } from './lib/stores';
  import { readZipFile } from './lib/utils/zipReader';
  import { buildFileTree } from './lib/utils/treeBuilder';
  import { createZipFromSelected, downloadZip } from './lib/utils/zipWriter';
  import FileTree from './lib/components/FileTree.svelte';

  let zipFile: File | null = null;
  let isLoading = false;
  let errorMessage = '';
  let allFilePaths: string[] = [];
  let treeKey = 0;

  $: {
    console.log('uploadedFiles length:', $uploadedFiles.length);
    console.log('treeData length:', $treeData.length);
    console.log('selectedPaths size:', $selectedPaths.size);
  }

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      zipFile = null;
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
      alert('Step 1: entries length = ' + entries.length);
      
      $uploadedFiles = entries;
      await tick();

      const tree = buildFileTree(entries);
      alert('Step 2: tree length = ' + tree.length);
      
      $treeData = tree;
      treeKey += 1;
      await tick();

      allFilePaths = entries.map(e => e.path);
      alert('Step 3: allFilePaths length = ' + allFilePaths.length + ', first path: ' + (allFilePaths[0] || 'none'));
      
      selectAll(true, allFilePaths);
      await tick();
      
      alert('Step 4: selectedPaths size = ' + $selectedPaths.size);
      
      isLoading = false;
      await tick(); // Force UI update after setting isLoading to false
      alert('Step 5: isLoading set to false');
    } catch (error) {
      console.error('Upload error:', error);
      errorMessage = error instanceof Error ? error.message : 'ZIP file upload failed';
      isLoading = false;
      $uploadedFiles = [];
      $treeData = [];
      alert('ERROR: ' + errorMessage);
    }
  }

  async function handleDownload() {
    if ($selectedPaths.size === 0) {
      alert('Koi file select nahi ki gayi');
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      const selected: ZipFileEntry[] = $uploadedFiles.filter(file => 
        $selectedPaths.has(file.path)
      );
      const zipBlob = await createZipFromSelected(selected);
      downloadZip(zipBlob, 'selected_files.zip');
      isLoading = false;
    } catch (error) {
      console.error('Download error:', error);
      errorMessage = error instanceof Error ? error.message : 'ZIP creation failed';
      isLoading = false;
    }
  }

  function handleSelectAll() {
    const allSelected = $selectedPaths.size === allFilePaths.length;
    selectAll(!allSelected, allFilePaths);
  }

  function handleClear() {
    zipFile = null;
    $uploadedFiles = [];
    $selectedPaths = new Set();
    $treeData = [];
    allFilePaths = [];
    errorMessage = '';
    treeKey += 1;
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

  <div style="margin: 10px 0; padding: 5px; background: #f0f0f0; border-radius: 4px;">
    Debug: isLoading = {isLoading} | treeData length = {$treeData.length} | uploadedFiles length = {$uploadedFiles.length} | selectedPaths size = {$selectedPaths.size}
  </div>

  {#if $treeData.length > 0}
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
        {#key treeKey}
          <FileTree nodes={$treeData} />
        {/key}
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
  {:else if !isLoading && $uploadedFiles.length > 0}
    <div class="warning">
      ⚠️ Tree empty! {$uploadedFiles.length} files available, but treeData is 0.
    </div>
  {/if}

  <div class="info">
    <p>ℹ️ Selected files 10 text files mein divide hokar ZIP mein download honge.</p>
  </div>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  h1 {
    color: #333;
    border-bottom: 2px solid #4a90e2;
    padding-bottom: 10px;
  }

  .upload-section {
    margin: 20px 0;
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .upload-section label {
    font-weight: bold;
  }

  .upload-section input[type="file"] {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    flex: 1;
  }

  button {
    padding: 8px 16px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  button:hover:not(:disabled) {
    background-color: #357abd;
  }

  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .loading, .error {
    padding: 10px;
    margin: 10px 0;
    border-radius: 4px;
  }

  .loading {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .error {
    background-color: #ffebee;
    color: #c62828;
  }

  .tree-container {
    margin-top: 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
  }

  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .tree-header h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .tree-actions {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .selected-count {
    background-color: #e8f5e8;
    padding: 4px 8px;
    border-radius: 4px;
    color: #2e7d32;
    font-size: 0.9rem;
  }

  .tree-wrapper {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #eee;
    padding: 10px;
    background-color: #fafafa;
  }

  .download-section {
    margin-top: 20px;
    text-align: center;
  }

  .download-btn {
    background-color: #2e7d32;
    font-size: 16px;
    padding: 12px 24px;
  }

  .download-btn:hover:not(:disabled) {
    background-color: #1b5e20;
  }

  .info {
    margin-top: 20px;
    color: #666;
    font-size: 0.9rem;
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
  }

  .warning {
    background-color: #fff3cd;
    color: #856404;
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0;
  }
</style>
