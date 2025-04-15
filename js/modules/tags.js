/**
 * Tags Manager
 *
 * Maneja la funcionalidad de etiquetas en el CMS
 */
export const TagsManager = {
  // Path configuration
  paths: {
    root: window.PATHS ? window.PATHS.ROOT : '/',
    cms: window.PATHS ? window.PATHS.CMS : '/content/',
    media: window.PATHS ? window.PATHS.MEDIA : '../../../public/img'
  },
  currentTags: [],
  tagsField: null,
  tagsFieldContainer: null,
  tagsList: null,
  tagInput: null,
  addTagBtn: null,

  init: function () {
    // Buscar el campo de tags en lugar de una sección independiente
    this.tagsField = document.querySelector('.custom-field[data-field-name="tags"]')

    // Si no existe el campo de tags, salir sin error
    if (!this.tagsField) {
      console.warn('Tags field not found')
      return
    }

    // Buscar elementos dentro del campo de tags
    this.tagsFieldContainer = this.tagsField.querySelector('.tags-field')
    this.tagsList = this.tagsField.querySelector('.tags-list')
    this.tagInput = this.tagsField.querySelector('.tag-input')
    this.addTagBtn = this.tagsField.querySelector('.add-tag')

    if (!this.tagsFieldContainer || !this.tagsList) {
      console.warn('Tags elements not found within tags field')
      return
    }

    // Configurar eventos
    this.setupEventListeners()

    // console.log('Tags manager initialized')
  },

  // Configurar event listeners
  setupEventListeners: function () {
    const self = this

    if (this.addTagBtn && this.tagInput) {
      // Añadir etiqueta al hacer clic en el botón
      this.addTagBtn.addEventListener('click', function () {
        self.addTag(self.tagInput.value)
      })

      // Añadir etiqueta al presionar Enter
      this.tagInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault()
          self.addTag(self.tagInput.value)
        }
      })
    }

    // Añadir event listeners para los botones de eliminar tag
    this.setupTagRemoveButtons()
  },

  // Configurar botones para eliminar tags
  setupTagRemoveButtons: function () {
    if (!this.tagsList) return

    // Buscar todos los botones de eliminar tag
    const removeButtons = this.tagsList.querySelectorAll('.tag-remove')

    // Añadir event listener a cada botón
    removeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tag = button.getAttribute('data-tag')
        if (tag) {
          this.removeTag(tag)
        }
      })
    })
  },

  // Extraer etiquetas del contenido
  extractTags: function (content) {
    // Si no hay campo de tags, salir sin error
    if (!this.tagsField) {
      return
    }

    this.currentTags = []

    // Verificar si el contenido tiene front matter (entre --- y ---)
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
    const match = content.match(frontMatterRegex)

    if (match && match[1]) {
      // Analizar front matter
      const frontMatter = match[1]
      const tagMatch = frontMatter.match(/tags:\s*\[(.*?)\]/)

      if (tagMatch && tagMatch[1]) {
        // Extraer etiquetas
        this.currentTags = tagMatch[1]
          .split(',')
          .map(tag => tag.trim().replace(/['"]/g, ''))
          .filter(tag => tag.length > 0)
      } else {
        // Buscar categorías como respaldo para compatibilidad
        const categoryMatch = frontMatter.match(/categories:\s*\[(.*?)\]/)
        if (categoryMatch && categoryMatch[1]) {
          // Extraer categorías como etiquetas
          this.currentTags = categoryMatch[1]
            .split(',')
            .map(cat => cat.trim().replace(/['"]/g, ''))
            .filter(cat => cat.length > 0)
        }
      }
    }

    // Actualizar lista de etiquetas en la UI
    this.updateTagsList()

    // Actualizar el campo oculto de tags
    this.updateTagsDataField()
  },

  // Actualizar lista de etiquetas en la UI
  updateTagsList: function () {
    if (!this.tagsList) return

    this.tagsList.innerHTML = ''

    if (this.currentTags.length === 0) {
      return
    }

    const self = this
    this.currentTags.forEach(tag => {
      const tagElement = document.createElement('div')
      tagElement.className = 'tag-item bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-sm flex items-center'
      tagElement.innerHTML = `
        <span>${tag}</span>
        <button class="tag-remove ml-1 text-red-500 hover:text-red-700 dark:hover:text-red-400" data-tag="${tag}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      `

      // Añadir event listener al botón de eliminar
      const removeBtn = tagElement.querySelector('.tag-remove')
      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          self.removeTag(tag)
        })
      }

      self.tagsList.appendChild(tagElement)
    })
  },

  // Añadir etiqueta
  addTag: function (tag) {
    tag = tag.trim()

    if (!tag) return

    // Verificar si la etiqueta ya existe
    if (this.currentTags.includes(tag)) {
      alert('Tag already exists')
      return
    }

    this.currentTags.push(tag)
    this.updateTagsList()
    this.updateTagsDataField()
    this.tagInput.value = ''
  },

  // Eliminar etiqueta
  removeTag: function (tag) {
    this.currentTags = this.currentTags.filter(t => t !== tag)
    this.updateTagsList()
    this.updateTagsDataField()
  },

  // Actualizar el campo oculto de tags
  updateTagsDataField: function () {
    if (!this.tagsField) return

    // Buscar el campo oculto de datos de tags
    const tagsDataField = this.tagsField.querySelector('input.tags-data')
    if (tagsDataField) {
      // Actualizar el valor del campo con el array de tags en formato JSON
      tagsDataField.value = JSON.stringify(this.currentTags)

      // Disparar evento de cambio para que otros componentes se actualicen
      tagsDataField.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }
}
