<!-- Recycle Bin Modal -->
<div id="recycle-bin-modal" class="modal hidden" style="display: none;">
  <div>
    <!-- Modal Header -->
    <div class="flex justify-between items-center p-4 border-b border-neutral-300 dark:border-neutral-700">
      <h2 class="text-xl font-semibold flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Recycle Bin
      </h2>
      <div class="flex items-center">
        <button id="close-recycle-bin" class="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-neutral-300 dark:border-neutral-700">
      <button id="tab-files" class="py-2 px-4 border-b-2 border-red-500 text-red-500 font-medium">Files</button>
      <button id="tab-images" class="py-2 px-4 border-b-2 border-transparent hover:text-red-500 transition">Images</button>
    </div>

    <!-- Modal Content -->
    <div class="flex-grow overflow-auto p-4">
      <!-- Loading indicator -->
      <div id="recycle-loading" class="flex justify-center items-center py-8">
        <svg class="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Empty state -->
      <div id="recycle-empty" class="hidden text-center py-8 text-neutral-500 dark:text-neutral-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <p>Recycle bin is empty</p>
      </div>

      <!-- Files grid -->
      <div id="recycle-files-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Files will be populated dynamically -->
      </div>

      <!-- Images grid -->
      <div id="recycle-images-grid" class="hidden grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Images will be populated dynamically -->
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="border-t border-neutral-300 dark:border-neutral-700 p-4 flex justify-between items-center">
      <div class="text-sm text-neutral-600 dark:text-neutral-400" id="recycle-count">0 items</div>
      <button id="empty-recycle-bin" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
        Empty Recycle Bin
      </button>
    </div>
  </div>
</div>