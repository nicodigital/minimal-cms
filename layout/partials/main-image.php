<!-- Main Image Section -->
<div class="main-image-section mb-6">
  <div class="flex justify-between items-center mb-2">
    <h3 class="text-lg font-semibold mb-3">Main Image</h3>
    <div class="text-sm text-neutral-800 dark:text-neutral-700 main-image-status">Select a file</div>
  </div>

  <div class="main-image-container flex gap-2">
    <div class="main-image-preview border border-neutral-300 dark:border-neutral-700 rounded overflow-hidden">
      <img id="main-image-preview" class="size-[8rem] hidden object-cover object-center " src="" alt="Main image preview">
      <div id="main-image-placeholder" class="size-[8rem] flex items-center justify-center text-center text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800">
        <span>No image selected</span>
      </div>
    </div>

    <div class="flex flex-col gap-2 items-start">
        <button id="select-main-image" class="btn neutral" data-media-mode="main-image">
          Select from Media
        </button>
        <button id="clear-main-image" class="btn neutral">
          Clear
        </button>
      <input type="hidden" id="main-image-path" name="main_img" value="">
    </div>
  </div>
</div>