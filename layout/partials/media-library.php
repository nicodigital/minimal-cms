<!-- Modal de la Biblioteca de Medios -->
<div id="media-modal" class="modal hidden" style="display: none;">
  <div>
    <!-- Cabecera del modal -->
    <div class="border-b border-neutral-300 dark:border-neutral-700 p-4 flex justify-between items-center">
      <div class="flex items-center">
        <h2 class="text-xl font-semibold">Biblioteca de Medios</h2>
        <span id="media-mode-indicator" class="ml-3 text-sm px-2 py-1 rounded bg-red-500 text-white hidden"></span>
      </div>
      <button id="close-media-modal" class="text-neutral-500 hover:text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <!-- Contenido del modal -->
    <div class="p-4 flex-1 overflow-y-auto">
      <div class="flex flex-col justify-center mb-4">
        <div class="flex gap-2">
          <button id="create-dir-btn"
            class="bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition cursor-pointer">
            Nueva Carpeta
          </button>
          <label for="upload-image"
            class="bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition cursor-pointer">
            Subir Imagen
          </label>
          <input type="file" id="upload-image" class="hidden" accept="image/*">
        </div>
      </div>

      <div class="media-breadcrumbs mb-3 text-sm">
        <button class="media-home text-neutral-600 dark:text-neutral-300 hover:underline">Inicio</button>
        <span class="current-path"></span>
      </div>

      <div class="media-container overflow-y-auto pb-5 mb-3">
        <div class="media-loading text-center py-4">
          <svg class="animate-spin h-8 w-8 mx-auto text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <p class="mt-2 text-neutral-500 dark:text-neutral-400">Cargando medios...</p>
        </div>
        <div class="media-grid grid grid-cols-3 md:grid-cols-4 gap-2 p-1"></div>
      </div>
    </div>
    
    <!-- Footer del modal (solo visible en modo galería) -->
    <div id="media-modal-footer" class="border-t border-neutral-300 dark:border-neutral-700 p-4 flex justify-between items-center hidden">
      <div id="selected-count" class="text-sm text-neutral-600 dark:text-neutral-400">0 imágenes seleccionadas</div>
      <button id="confirm-selection" class="btn red disabled:opacity-50 disabled:cursor-not-allowed">
        Confirmar Selección
      </button>
    </div>
  </div>
</div>