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

        // Verificar si el nombre de archivo normalizado contiene la consulta normalizada
        const isVisible = searchableFilename.includes(normalizedQuery)

        if (isVisible) {
          file.style.display = 'flex'
          visibleCount++
        } else {
          file.style.display = 'none'
        }
      })

      // Mostrar mensaje de "no results" si no se encontraron coincidencias
      if (visibleCount === 0 && files.length > 0) {
        const noResults = document.createElement('li')
        noResults.className = 'py-2 text-neutral-800 dark:text-gray-400 italic no-results'
        noResults.textContent = 'No matching files found'
        mdList.appendChild(noResults)
      }
    }

    // Usar la API de View Transitions si es compatible
    if (supportsViewTransitions) {
      document.startViewTransition(() => updateDOM())
    } else {
      updateDOM()
    }
  }
}
