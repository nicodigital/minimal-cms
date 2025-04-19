<aside id="files-list" class="h-fit overflow-y-auto">
      
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-xl font-semibold">Files</h2>
        <button class="create-new btn neutral">New File</button>
      </div>
      
      <form class="search-form mb-6">
        <input type="search" class="search-input border rounded p-2 flex-grow w-full bg-transparent border-neutral-300 dark:border-neutral-700" placeholder="Search files...">
      </form>
      
      <div class="form-create hidden mb-4">
        <div class="flex">
          <input type="text" class="create border rounded p-2 flex-grow bg-transparent border-neutral-300 dark:border-neutral-700" placeholder="filename.md">
          <button class="save-new bg-red-500 text-white px-3 py-1 rounded ml-2 hover:bg-red-600 transition">Create</button>
          <button class="cancel-new bg-neutral-800 text-white px-3 py-1 rounded ml-2 hover:bg-gray-600 transition">Cancel</button>
        </div>
      </div>
      
      <ul class="md-list divide-y divide-neutral-800 dark:divide-neutral-700 mb-6 lg:h-[calc(100vh-19.7rem)] overflow-y-auto rounded-lg">
        <!-- Files will be listed here dynamically -->
        <li class="py-2 text-neutral-800 dark:text-neutral-400 italic">Loading files...</li>
      </ul>
      
      <!-- Custom Fields Section (Left) -->
      <div class="custom-fields-section left-fields mt-6 pt-4 hidden">
     
        <div class="custom-fields-container">
          <?php
          // Include the fields helper if it exists
          if (file_exists( PARENT_URI . '/inc/fields-helper.php')) {
              include_once PARENT_URI . '/inc/fields-helper.php';
              
              // Get fields for left sidebar
              $leftFields = getFieldsByLocation('left');
              
              // Render each field
              foreach ($leftFields as $field) {
                  echo renderField($field);
              }
          }
          ?>
        </div>
      </div>
    </aside>