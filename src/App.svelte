<!-- src/App.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { uploadedFiles, selectedPaths, treeData, selectAll, type ZipFileEntry } from './lib/stores';
  import { readZipFile } from './lib/utils/zipReader';
  import { buildFileTree } from './lib/utils/treeBuilder';
  import { createZipFromSelected, downloadZip } from './lib/utils/zipWriter';
  import FileTree from './lib/components/FileTree.svelte';

  let zipFile: File | null = null;
  let isLoading = false;
  let errorMessage = '';
  let allFilePaths: string[] = [];

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
      alert('📦 Step A: readZipFile start');
      const entries = await readZipFile(file);
      alert(`📦 Step B: readZipFile complete, entries length = ${entries.length}`);
      
      $uploadedFiles = entries;
      alert('✅ uploadedFiles store updated');

      alert('🌲 Step C: building file tree...');
      const tree = buildFileTree(entries);
      alert(`🌲 Step D: tree built, tree length = ${tree.length} (top-level nodes)`);
      
      $treeData = tree;
      alert('✅ treeData store updated');

      allFilePaths = entries.map(e => e.path);
      alert(`📋 allFilePaths collected: ${allFilePaths.length} paths`);

      selectAll(true, allFilePaths);
      alert('✅ selectAll executed, selectedPaths size = ' + $selectedPaths.size);

      isLoading = false;
      alert('🎉 Loading finished, UI should update now');
    } catch (error) {
      console.error('Upload error:', error);
      errorMessage = error instanceof Error ? error.message : 'ZIP file upload failed';
      isLoading = false;
      $uploadedFiles = [];
      $treeData = [];
      alert('❌ ERROR: ' + errorMessage);
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

  <!-- Debug: show treeData length even if zero -->
  <div style="margin: 10px 0; padding: 5px; background: #f0f0f0; border-radius: 4px;">
    Debug: treeData length = {$treeData.length}
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
        <FileTree nodes={$treeData} />
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
  /* (previous styles same rahenge, bas warning class add karo) */
  .warning {
    background-color: #fff3cd;
    color: #856404;
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0;
  }
</style>
