<header class="sticky top-0 z-50 p-4 flex gap-4 justify-between items-start bg-[var(--bg-main)] h-[5rem] lg:h-[7rem]">

  <div class="md:w-[25%] flex justify-between items-center">
    <div class="save-wrapper flex justify-between pr-5 w-full">
      <h2 class="text-xl font-semibold current-file lg:w-[75%]">Select a file</h2>
      <button class="edit-file-name" title="Edit file name">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-4" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75z"/></svg>
      </button>
    </div>
  </div>

  <div class="tabs md:w-[50%] flex flex-1 justify-between">
    <?php include __DIR__ . '/partials/collection-buttons.php'; ?>
    <div class="flex gap-2">
      <?php
      include __DIR__ . '/partials/media-library-button.php';
      include __DIR__ . '/partials/recycle-bin-button.php';
      include __DIR__ . '/partials/save-file-button.php';
      ?>
    </div>
  </div>

  <div class="flex md:w-[25%] justify-end items-center gap-3">
    <?php
    include __DIR__ . '/partials/preview-button.php';
    include __DIR__ . '/partials/exit-button.php';
    ?>
  </div>
</header>