/**
 * Main Image Manager
 *
 * Módulo para manejar la selección y visualización de la imagen principal
 */

export class MainImageManager {
  constructor () {
    // Path configuration
    this.paths = {
      root: window.PATHS ? window.PATHS.ROOT : '/',
      cms: window.PATHS ? window.PATHS.CMS : '/content/',
      media: window.PATHS ? window.PATHS.MEDIA : '../../../public/img'
    }
    
    // Elementos del DOM
    this.mainImageSection = document.querySelector('.main-image-section')
    this.mainImageStatus = document.querySelector('.main-image-status')
    this.mainImagePreview = document.getElementById('main-image-preview')
    this.mainImagePlaceholder = document.getElementById('main-image-placeholder')
    this.mainImagePath = document.getElementById('main-image-path')
    this.selectMainImageBtn = document.getElementById('select-main-image')
    this.clearMainImageBtn = document.getElementById('clear-main-image')

    // Estado
    this.selectingForMainImage = false

    // Inicializar
    this.init()
  }

  // Inicializar el módulo
  init () {
    if (!this.mainImageSection) {
      return
    }

    // Si no se encontró el botón, intentar buscarlo de nuevo
    if (!this.selectMainImageBtn) {
      this.selectMainImageBtn = document.getElementById('select-main-image')

      if (!this.selectMainImageBtn) {
        // Intentar con un selector más general
        const possibleButtons = document.querySelectorAll('button')

        possibleButtons.forEach((btn, index) => {
        })
      } else {
      }
    }

    this.setupEventListeners()
  }

  // Configurar los event listeners
  setupEventListeners () {
    // Botón para seleccionar imagen principal
    if (this.selectMainImageBtn) {
      // Eliminar eventos anteriores para evitar duplicados
      this.selectMainImageBtn.removeEventListener('click', this.showMediaSelectionModal.bind(this))

      // Añadir evento con un manejador directo para depuración
      this.selectMainImageBtn.addEventListener('click', (e) => {
        this.showMediaSelectionModal()
      })

      // Añadir también un evento directo para pruebas
      this.selectMainImageBtn.onclick = (e) => {
        // No llamar a showMediaSelectionModal aquí para evitar duplicados
      }
    } else {
      // Intentar configurar los eventos después de un breve retraso
      setTimeout(() => {
        // Buscar los elementos de nuevo
        this.selectMainImageBtn = document.getElementById('select-main-image')
        this.clearMainImageBtn = document.getElementById('clear-main-image')

        if (this.selectMainImageBtn) {
          this.selectMainImageBtn.addEventListener('click', (e) => {
            this.showMediaSelectionModal()
          })

          // Detener el observer una vez que se ha encontrado el botón
          // observer.disconnect()
        }
      }, 1000)
    }

    // Botón para limpiar imagen principal
    if (this.clearMainImageBtn) {
      // Eliminar eventos anteriores para evitar duplicados
      this.clearMainImageBtn.removeEventListener('click', this.clearMainImage.bind(this))

      // Añadir evento con un manejador directo para depuración
      this.clearMainImageBtn.addEventListener('click', (e) => {
        this.clearMainImage()
      })
    } else {
    }

    // Escuchar eventos de selección de imagen desde la biblioteca de medios
    document.removeEventListener('mediaSelected', this.handleMediaSelection.bind(this))
    document.addEventListener('mediaSelected', (e) => {
      this.handleMediaSelection(e)
    })

    // Configurar un MutationObserver para detectar cuando se añade el botón al DOM
    this.setupMutationObserver()
  }

  // Configurar un MutationObserver para detectar cambios en el DOM
  setupMutationObserver () {
    // Crear un observer que observe cambios en el árbol del DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Verificar si se han añadido nodos
        if (mutation.addedNodes.length) {
          // Verificar si alguno de los nodos añadidos contiene nuestros elementos
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // ELEMENT_NODE
              // Verificar si el nodo es o contiene nuestro botón
              if (node.id === 'select-main-image' || node.querySelector('#select-main-image')) {
                // Actualizar la referencia al botón
                this.selectMainImageBtn = document.getElementById('select-main-image')

                // Configurar el evento
                if (this.selectMainImageBtn) {
                  this.selectMainImageBtn.addEventListener('click', (e) => {
                    this.showMediaSelectionModal()
                  })

                  // Detener el observer una vez que se ha encontrado el botón
                  observer.disconnect()
                }
              }
            }
          })
        }
      })
    })

    // Iniciar la observación del documento con la configuración indicada
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // Mostrar modal para seleccionar imagen desde la biblioteca de medios
  showMediaSelectionModal () {
    this.selectingForMainImage = true
    window.selectingMainImage = true

    // Verificar si el objeto Media existe y sobrescribir su función insertImageToEditor
    if (window.Media && typeof window.Media.insertImageToEditor === 'function') {
      this.overrideMediaFunctions()
    }

    // Disparar evento para abrir el modal de la biblioteca de medios en modo "main-image"
    document.dispatchEvent(new CustomEvent('selectForMainImage', {
      detail: {
        active: true
      }
    }))
  }

  // Configurar un listener global para capturar clics en imágenes
  setupGlobalImageClickListener () {
    // Eliminar listener anterior si existe
    document.removeEventListener('click', this._globalImageClickHandler)

    // Crear un nuevo handler y guardarlo para poder eliminarlo después
    this._globalImageClickHandler = (e) => {
      if (!this.selectingForMainImage) {
        return // No estamos en modo de selección
      }

      // Verificar si el clic fue en una imagen o en el botón de insertar
      const imageItem = e.target.closest('.image-item')
      const insertButton = e.target.closest('.insert-image')

      if (imageItem || insertButton) {
        // Prevenir el comportamiento predeterminado
        e.preventDefault()
        e.stopPropagation()

        // Obtener el elemento de imagen (ya sea desde el item o desde el botón)
        const item = imageItem || insertButton.closest('.image-item')
        const imgElement = item.querySelector('img')

        if (!imgElement) {
          return
        }

        const imgSrc = imgElement.getAttribute('src')
        const imgAlt = imgElement.getAttribute('alt')

        // Convertir la ruta relativa a la ruta markdown considerando la nueva estructura
        const markdownPath = imgSrc.replace('../../../public', '')

        // Establecer como imagen principal
        this.setMainImage(imgAlt, markdownPath, imgSrc)

        // Desactivar modo de selección
        this.selectingForMainImage = false
        if (window.Media) {
          window.Media.selectingForMainImage = false
        }

        return false
      }
    }

    // Añadir el listener con captura para que se ejecute antes que otros
    document.addEventListener('click', this._globalImageClickHandler, true)
  }

  // Añadir indicadores visuales a las imágenes
  addVisualIndicatorsToImages () {
    const imageItems = document.querySelectorAll('.image-item')
    imageItems.forEach(item => {
      if (!item.hasAttribute('data-selecting-indicator')) {
        item.setAttribute('data-selecting-indicator', 'true')
        item.style.border = '2px solid red'
        item.style.position = 'relative'

        // Añadir un indicador de texto
        const indicator = document.createElement('div')
        indicator.className = 'absolute top-0 right-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded-bl'
        indicator.textContent = 'Click para seleccionar'
        item.appendChild(indicator)
      }
    })
  }

  // Eliminar indicadores visuales
  removeVisualIndicatorsFromImages () {
    const imageItems = document.querySelectorAll('.image-item[data-selecting-indicator]')
    imageItems.forEach(item => {
      item.removeAttribute('data-selecting-indicator')
      item.style.border = ''

      const indicator = item.querySelector('.absolute')
      if (indicator) {
        indicator.remove()
      }
    })
  }

  // Eliminar indicador visual de selección
  removeSelectionIndicator () {
    const mediaLibraryTitle = document.querySelector('.selecting-for-main-image')
    if (mediaLibraryTitle) {
      mediaLibraryTitle.classList.remove('selecting-for-main-image')
    }

    const indicator = document.querySelector('.selecting-indicator')
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator)
    }
  }

  // Sobrescribir funciones de Media
  overrideMediaFunctions () {
    // Verificar si el objeto Media está disponible directamente
    if (window.Media) {
      this._overrideMediaDirectly(window.Media)
    } else {
      // Intentar encontrar el objeto Media en otros contextos
      this._findAndOverrideMedia()

      // Configurar un intervalo para seguir intentando
      const checkInterval = setInterval(() => {
        if (window.Media) {
          this._overrideMediaDirectly(window.Media)
          clearInterval(checkInterval)
        }
      }, 500)

      // Limpiar el intervalo después de 10 segundos
      setTimeout(() => {
        clearInterval(checkInterval)
      }, 10000)
    }
  }

  // Sobrescribir el objeto Media directamente
  _overrideMediaDirectly (mediaObj) {
    // Guardar referencia a la función original
    const originalInsertImageToEditor = mediaObj.insertImageToEditor

    // Crear una referencia a this que podamos usar dentro de la función
    const self = this

    // Sobrescribir la función
    mediaObj.insertImageToEditor = function (imageName, imagePath) {
      // Verificar si estamos en modo de selección (usando cualquiera de los flags)
      if (self.selectingForMainImage || this.selectingForMainImage || window.selectingMainImage) {
        // Establecer como imagen principal
        self.setMainImage(imageName, imagePath, imagePath)

        // Resetear todos los flags
        self.selectingForMainImage = false
        this.selectingForMainImage = false
        window.selectingMainImage = false

        // No continuar con la inserción en el editor
        return
      }

      // Si no estamos seleccionando para imagen principal, llamar a la función original
      return originalInsertImageToEditor.call(this, imageName, imagePath)
    }
  }

  // Buscar el objeto Media en diferentes contextos y sobrescribirlo
  _findAndOverrideMedia () {
    // Buscar en todos los scripts cargados
    const scripts = document.querySelectorAll('script[src*="media"]')

    // Buscar el objeto Media en el contexto global
    for (const prop in window) {
      try {
        const obj = window[prop]
        if (obj && typeof obj === 'object' && obj.insertImageToEditor) {
          this._overrideMediaDirectly(obj)
          return
        }
      } catch (e) {
        // Ignorar errores al acceder a propiedades
      }
    }

    // Si no se encuentra, configurar un listener para el evento DOMContentLoaded
    if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
      document.addEventListener('DOMContentLoaded', () => {
        if (window.Media) {
          this._overrideMediaDirectly(window.Media)
        }
      })
    }
  }

  // Manejar la selección de imagen desde la biblioteca de medios
  handleMediaSelection (e) {
    if (e.detail && e.detail.forMainImage) {
      // Establecer la imagen principal
      const path = e.detail.path
      const fullPath = e.detail.fullPath

      this.setMainImage(e.detail.name, path, fullPath)
    }
  }

  // Establecer la imagen principal
  setMainImage (name, path, fullPath) {
    // Formatear el path para asegurar que tenga el formato correcto (comenzando con '/')
    let formattedPath = path
    if (formattedPath && !formattedPath.startsWith('/')) {
      formattedPath = '/' + formattedPath
    }
    
    // Guarda el path formateado
    if (this.mainImagePath) this.mainImagePath.value = formattedPath
    if (this.mainImageStatus) this.mainImageStatus.textContent = 'Image selected'

    // Actualizar vista previa
    if (this.mainImagePreview && this.mainImagePlaceholder) {
      this.mainImagePreview.src = fullPath
      this.mainImagePreview.classList.remove('hidden')
      this.mainImagePlaceholder.classList.add('hidden')
    }

    // Eliminar indicador visual
    this.removeSelectionIndicator()
    this.removeVisualIndicatorsFromImages()

    // Resetear flag de selección
    this.selectingForMainImage = false

    // Cerrar el modal de la biblioteca de medios
    this.closeMediaModal()

    // Hacer scroll de vuelta a la sección de imagen principal
    if (this.mainImageSection) {
      setTimeout(() => {
        this.mainImageSection.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }

    // Disparar un evento para notificar que se ha seleccionado una imagen principal
    const event = new CustomEvent('mainImageSelected', {
      detail: {
        name,
        path: this.mainImagePath ? this.mainImagePath.value : path, // Usar el path formateado
        fullPath
      }
    })
    document.dispatchEvent(event)
  }

  // Cerrar el modal de la biblioteca de medios
  closeMediaModal () {
    // Intentar cerrar el modal usando diferentes métodos
    if (window.MediaManager && typeof window.MediaManager.closeModal === 'function') {
      window.MediaManager.closeModal()
    } else if (window.Media && typeof window.Media.closeModal === 'function') {
      window.Media.closeModal()
    } else {
      // Buscar el modal y cerrarlo manualmente
      const modal = document.getElementById('media-modal')
      if (modal) {
        modal.classList.add('hidden')
        modal.style.display = 'none'
      } else {
      }

      // Intentar hacer clic en el botón de cerrar
      const closeBtn = document.getElementById('close-media-modal')
      if (closeBtn) {
        closeBtn.click()
      }
    }
  }

  // Limpiar la imagen principal
  clearMainImage () {
    if (this.mainImagePath) this.mainImagePath.value = ''
    if (this.mainImageStatus) this.mainImageStatus.textContent = 'No image selected'
    if (this.mainImagePreview) this.mainImagePreview.classList.add('hidden')
    if (this.mainImagePlaceholder) this.mainImagePlaceholder.classList.remove('hidden')
  }
}

// Exportar una instancia del módulo para uso global
export const mainImageManager = new MainImageManager()
