 <!-- Custom Fields Section (Right) -->
  <div class="custom-fields-section right-fields mb-6 pb-4">
  
    <div class="custom-fields-container">
      <?php
      // Include the fields helper if it exists
      if (file_exists(__DIR__ . '/../../inc/fields-helper.php')) {
          include_once __DIR__ . '/../../inc/fields-helper.php';
          
          // Get fields for right sidebar
          $rightFields = getFieldsByLocation('right');
          
          // Render each field
          foreach ($rightFields as $field) {
              echo renderField($field);
          }
      }
      ?>
    </div>
  </div>