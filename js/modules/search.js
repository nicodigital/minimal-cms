/**
 * Search Manager
 *
 * Maneja la funcionalidad de búsqueda de archivos en el CMS
 */
export const SearchManager = {
  // Path configuration
  paths: {
    root: window.PATHS ? window.PATHS.ROOT : '/',
    cms: window.PATHS ? window.PATHS.CMS : '/content/',
    media: window.PATHS ? window.PATHS.MEDIA : '../../../public/img'
  },
  searchForm: null,
  searchInput: null,

  init: function () {
    this.searchForm = document.querySelector('.search-form')
    this.searchInput = document.querySelector('.search-input')

    if (!this.searchForm || !this.searchInput) {
      console.warn('Search elements not found')
      return
    }
    
    // Deshabilitar explícitamente el autocompletado para evitar errores con SimpleMDE
    if (this.searchInput) {
      this.searchInput.setAttribute('autocomplete', 'off')
      this.searchInput.setAttribute('data-no-autocomplete', 'true')
      // Asegurarse que SimpleMDE no intente usar este campo para autocompletado
      this.searchInput.classList.add('no-simplemde-autocomplete')
    }

    // Configurar eventos
    this.searchForm.addEventListener('submit', (e) => {
      e.preventDefault()
      const query = this.searchInput.value.trim()
      this.searchFiles(query)
    })

    this.searchInput.addEventListener('keyup', () => {
      const query = this.searchInput.value.trim()
      this.searchFiles(query)
    })

    // console.log('Search manager initialized')
  },

  // Normalizar string para búsqueda
  normalizeSearchString: function (str) {
    return str
      .toLowerCase()
      .replace(/[-_.]/g, ' ') // Replace hyphens, underscores, and periods with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .trim()
  },

  // Buscar archivos con View Transitions API
  searchFiles: function (query) {
    const mdList = document.querySelector('.md-list')
    if (!mdList) return

    // Normalizar la consulta de búsqueda
    const normalizedQuery = this.normalizeSearchString(query)

    // Verificar si la API de View Transitions es compatible
    const supportsViewTransitions = !!document.startViewTransition

    // Preparar los elementos para transiciones primero
    this.prepareElementsForTransition(mdList);
    
    const updateDOM = () => {
      const files = Array.from(mdList.querySelectorAll('.file-item'))
      const noResultsEl = mdList.querySelector('.no-results')

      // Eliminar mensaje de "no results" si existe
      if (noResultsEl) {
        noResultsEl.remove()
      }

      let visibleCount = 0

      files.forEach(file => {
        const searchableFilename = file.dataset.searchableFilename
        // Asegurar que cada archivo tenga un identificador único para las transiciones
        const fileId = file.dataset.filename || searchableFilename || `file-${Math.random().toString(36).substr(2, 9)}`;
        
        // Asignar el atributo view-transition-name con un ID único
        file.style.viewTransitionName = `file-transition-${fileId.replace(/[^a-z0-9]/gi, '-')}`;

        // Verificar si el nombre de archivo normalizado contiene la consulta normalizada
        const isVisible = searchableFilename.includes(normalizedQuery)

        if (isVisible) {
          file.style.display = 'flex'
          file.setAttribute('data-visible', 'true')
          visibleCount++
        } else {
          file.style.display = 'none'
          file.setAttribute('data-visible', 'false')
        }
      })

      // Mostrar mensaje de "no results" si no se encontraron coincidencias
      if (visibleCount === 0 && files.length > 0) {
        const noResults = document.createElement('li')
        noResults.className = 'py-2 text-neutral-800 dark:text-gray-400 italic no-results'
        noResults.textContent = 'No matching files found'
        noResults.style.viewTransitionName = 'no-results'
        mdList.appendChild(noResults)
      }
    }

    // Usar la API de View Transitions si es compatible
    if (supportsViewTransitions) {
      document.startViewTransition(() => updateDOM())
    } else {
      updateDOM()
    }
  },
  
  // Preparar elementos para transición - este método asegura que todos los elementos tengan IDs únicos
  prepareElementsForTransition: function(mdList) {
    if (!mdList) return;
    
    // Asegurarse de que la lista misma tenga un nombre de transición
    mdList.style.viewTransitionName = 'md-list-container';
    
    // Preparar todos los elementos de archivo
    const files = Array.from(mdList.querySelectorAll('.file-item'));
    
    files.forEach((file, index) => {
      // Obtener un identificador único para el archivo
      const filename = file.dataset.filename || file.querySelector('.file-item-text')?.textContent || `file-${index}`;
      const cleanId = filename.replace(/[^a-z0-9]/gi, '-');
      
      // Guardar el ID limpio en el elemento para referencia
      file.dataset.transitionId = cleanId;
      
      // Asignar el atributo viewTransitionName
      file.style.viewTransitionName = `file-transition-${cleanId}`;
    });
  }
}
