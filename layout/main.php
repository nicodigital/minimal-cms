<main class="relative lg:sticky top-[5rem] w-full md:w-[50%] px-4 pt-6 h-[calc(100vh-5rem)] overflow-y-auto">
  
  <!-- SimpleMDE Editor -->
  <div id="editor-container" class="<?php echo isEditorEnabled() ? '' : 'hidden'; ?>">
    <textarea id="editor"></textarea>
  </div>
  
  <!-- Custom Fields for Main Area -->
  <div class="custom-fields-section main-fields mt-4">
    <div class="custom-fields-container">
      <?php
      // Include the fields helper if it exists
      if (file_exists( PARENT_URI . '/inc/fields-helper.php')) {
          include_once PARENT_URI . '/inc/fields-helper.php';
          
          // Get fields for main area
          $mainFields = getMainFields();
          
          // Render each field
          foreach ($mainFields as $field) {
              echo renderField($field);
          }
      }
      ?>
    </div>
  </div>
</main>