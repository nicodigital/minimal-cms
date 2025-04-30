<main class="relative lg:sticky top-[5rem] w-full md:w-[50%] px-4 mt-6 pb-6">
  
  <!-- Custom Fields for Main Area -->
  <div class="custom-fields-section main-fields">
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
  <?php
    // Exponer los campos configurados globalmente para el JS
    if (function_exists('getConfiguredFields')) {
      $configuredFields = getConfiguredFields();
      $configuredFieldNames = array_map(function($f) { return $f['name']; }, $configuredFields);
      echo '<script>window.configuredFields = ' . json_encode($configuredFieldNames) . ';</script>';
    }
  ?>
</main>