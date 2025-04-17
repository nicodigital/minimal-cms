<header class="sticky top-0 z-50 p-4 flex gap-4 justify-between items-center bg-[var(--bg-main)] h-[5rem]">

  <div class="md:w-[25%] flex justify-between items-center">
    <div class="save-wrapper flex justify-between">
      <h2 class="text-xl font-semibold current-file">Select a file</h2>
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