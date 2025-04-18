/**
 * Media Library Manager
 *
 * Módulo unificado para manejar la biblioteca de medios con tres modos:
 * 1. Inserción de imágenes en el editor (modo por defecto)
 * 2. Selección de imagen principal
 * 3. Selección múltiple para galerías
 */
// La biblioteca de medios ya no depende directamente del editor
// import { EditorManager } from './editor.js'

export const MediaManager = {
  // Configuración
  config: {
    basePath: window.PATHS ? window.PATHS.MEDIA + '/' : '../../../public/img/', // Ruta base para las imágenes (asegurar / final)
    publicPath: window.PATHS ? window.PATHS.MEDIA + '/' : '../../../public/img/' // Ruta pública para las imágenes (asegurar / final)
  },

  // Elementos del DOM
  modal: null,
  modalContent: null,
  mediaGrid: null,
  mediaLoading: null,
  mediaHome: null,
  currentPath: null,
  uploadInput: null,
  createDirBtn: null,
  closeModalBtn: null,
  openMediaBtn: null,

  /**
   * Construir la ruta completa de una imagen
   * @param {string} path - Ruta relativa de la imagen
   * @param {boolean} useBasePath - Si es true, usa basePath, si es false usa publicPath
   * @returns {string} - Ruta completa de la imagen
   */
  buildImagePath: function (path, useBasePath = true) {
    // Remover cualquier / inicial
    const cleanPath = path.startsWith('/') ? path.substring(1) : path

    // Si el path ya incluye public/img o la ruta base, devolverlo tal cual
    if (cleanPath.includes(this.config.publicPath)) {
      return useBasePath ? cleanPath.replace(this.config.publicPath, this.config.basePath) : cleanPath
    }

    // Construir la ruta completa
    const basePath = useBasePath ? this.config.basePath : this.config.publicPath
    const result = basePath + cleanPath

    // Debug - verificar la construcción de paths
    // console.log('MediaManager.buildImagePath:', {
    //   input: path,
    //   cleanPath,
    //   basePath,
    //   result,
    //   configPaths: this.config
    // })

    return result
  },
  modeIndicator: null,
  modalFooter: null,
  selectedCount: null,
  confirmSelectionBtn: null,

  // Estado
  currentMediaPath: '',
  currentMode: 'editor', // 'editor', 'main-image', 'gallery', 'image'
  selectedImages: [],
  currentGalleryId: null,
  currentImageId: null,
  isLoading: false,

  /**
   * Inicializar el módulo
   */
  init: function () {
    // Inicializar elementos del DOM
    this.modal = document.getElementById('media-modal')
    this.mediaGrid = document.querySelector('.media-grid')
    this.mediaLoading = document.querySelector('.media-loading')
    this.mediaHome = document.querySelector('.media-home')
    this.currentPath = document.querySelector('.current-path')
    this.uploadInput = document.getElementById('upload-image')
    this.createDirBtn = document.getElementById('create-dir-btn')
    this.closeModalBtn = document.getElementById('close-media-modal')
    this.openMediaBtn = document.getElementById('open-media-library')
    this.modeIndicator = document.getElementById('media-mode-indicator')
    this.modalFooter = document.getElementById('media-modal-footer')
    this.selectedCount = document.getElementById('selected-count')
    this.confirmSelectionBtn = document.getElementById('confirm-selection')

    // Verificar si los elementos existen
    if (!this.modal) {
      return
    }

    // Si no se encuentra el botón para abrir el modal, intentar buscarlo de nuevo
    if (!this.openMediaBtn) {
      // Intentar con un selector más general para encontrar el botón en cualquier parte del DOM
      const possibleButtons = document.querySelectorAll('#open-media-library')
      if (possibleButtons.length > 0) {
        this.openMediaBtn = possibleButtons[0]
      } else {
        // Configurar un MutationObserver para detectar cuando se añada el botón al DOM
        const buttonObserver = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              const button = document.getElementById('open-media-library')
              if (button && !this.openMediaBtn) {
                this.openMediaBtn = button
                this.setupOpenMediaButtonEvent()
                buttonObserver.disconnect()
                break
              }
            }
          }
        })

        buttonObserver.observe(document.body, {
          childList: true,
          subtree: true
        })
      }
    }

    // Crear modal para creación de directorios
    this.createDirectoryModal()

    // Configurar eventos
    this.setupEventListeners()

    // Configurar MutationObserver para detectar nuevos botones
    this.setupMutationObserver()
  },

  /**
   * Configurar los event listeners
   */
  setupEventListeners: function () {
    // Evento para abrir el modal
    this.setupOpenMediaButtonEvent()

    // Evento para cerrar el modal
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => {
        this.closeModal()
      })
    }

    // Evento para navegar a la carpeta raíz
    if (this.mediaHome) {
      this.mediaHome.addEventListener('click', () => {
        this.loadMedia('')
      })
    }

    // Evento para subir imágenes
    if (this.uploadInput) {
      this.uploadInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.uploadImage(e.target.files)
        }
      })
    }

    // Evento para crear directorio
    if (this.createDirBtn) {
      this.createDirBtn.addEventListener('click', () => {
        this.showCreateDirectoryModal()
      })
    }

    // Evento para confirmar selección en modo galería
    if (this.confirmSelectionBtn) {
      this.confirmSelectionBtn.addEventListener('click', () => {
        this.confirmGallerySelection()
      })
    }

    // Escuchar eventos de selección para imagen principal
    document.addEventListener('selectForMainImage', (e) => {
      if (e.detail && e.detail.active) {
        this.openModal('main-image')
      }
    })

    // Escuchar eventos de selección para galería
    document.addEventListener('selectForGallery', (e) => {
      if (e.detail && e.detail.active && e.detail.galleryId) {
        this.openModal('gallery', e.detail.galleryId)
      }
    })
    
    // Escuchar eventos de selección para imagen
    document.addEventListener('selectForImage', (e) => {
      console.log('Evento selectForImage recibido:', e.detail)
      if (e.detail && e.detail.active) {
        const imageId = e.detail.imageId || null
        console.log('Abriendo modal en modo imagen con ID:', imageId)
        this.openModal('image', imageId)
      } else {
        console.log('El evento no tiene los detalles necesarios')
      }
    })
  },

  /**
   * Configurar el evento para el botón de abrir el modal
   */
  setupOpenMediaButtonEvent: function () {
    if (this.openMediaBtn) {
      // Eliminar eventos anteriores para evitar duplicados
      if (this._openModalHandler) {
        this.openMediaBtn.removeEventListener('click', this._openModalHandler)
      }

      // Crear manejador de eventos robusto
      this._openModalHandler = (e) => {
        e.preventDefault()
        console.log('Clic en botón principal de la biblioteca de medios')

        // Determinar el modo basado en el atributo data-media-mode
        const mode = this.openMediaBtn.getAttribute('data-media-mode') || 'editor'
        const galleryId = this.openMediaBtn.getAttribute('data-gallery-id') || null

        // Verificar si el modal existe
        const mediaModal = document.getElementById('media-modal')
        if (!mediaModal) {
          console.error('Error: El modal de la biblioteca de medios no existe en el DOM')
          alert('Error: No se pudo abrir la biblioteca de medios. Por favor, recarga la página.')
          return
        }
        
        try {
          // Asegurarse de que el modal esté visible
          mediaModal.classList.remove('hidden')
          mediaModal.style.display = ''
          document.body.classList.add('overflow-hidden')
          
          // Llamar al método openModal
          this.openModal(mode, galleryId)
        } catch (error) {
          console.error(`Error al abrir el modal en modo ${mode}:`, error)
          // Mostrar el modal manualmente como último recurso
          mediaModal.classList.remove('hidden')
          mediaModal.style.display = ''
          document.body.classList.add('overflow-hidden')
          
          // Actualizar el estado interno del MediaManager
          this.currentMode = mode
          if (mode === 'gallery') {
            this.currentGalleryId = galleryId
            this.currentImageId = null
          }
          
          // Cargar el contenido de la carpeta actual o la raíz
          this.loadMedia(this.currentMediaPath || '')
        }
      }

      // Añadir evento
      this.openMediaBtn.addEventListener('click', this._openModalHandler)
      // console.log('Evento configurado para el botón principal de la biblioteca de medios')
    } else {
      console.warn('Botón principal de la biblioteca de medios no encontrado')
    }
  },

  /**
   * Configurar un MutationObserver para detectar nuevos botones
   */
  setupMutationObserver: function () {
    // Asegurarse de que MutationObserver esté disponible
    if (typeof window.MutationObserver === 'undefined') {
      console.warn('MutationObserver no está disponible')
      return
    }
    
    // Configurar inmediatamente los botones existentes
    this.setupMediaButtons()

    const observer = new window.MutationObserver((mutations) => {
      let shouldCheckButtons = false

      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 &&
                (node.hasAttribute('data-media-mode') ||
                 node.querySelector('[data-media-mode]') ||
                 node.classList.contains('media-button') ||
                 node.querySelector('.media-button'))) {
              shouldCheckButtons = true
            }
          })
        }
      })

      if (shouldCheckButtons) {
        this.setupMediaButtons()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  },
  
  /**
   * Configurar todos los botones relacionados con la biblioteca de medios
   */
  setupMediaButtons: function() {
    // console.log('Configurando botones de medios...')
    
    // Función auxiliar para crear un manejador de eventos robusto
    const createRobustClickHandler = (mode, id = null) => {
      return (e) => {
        e.preventDefault()
        console.log(`Clic en botón de modo: ${mode}${id ? ` con ID: ${id}` : ''}`)
        
        // Verificar si el modal existe
        const mediaModal = document.getElementById('media-modal')
        if (!mediaModal) {
          console.error('Error: El modal de la biblioteca de medios no existe en el DOM')
          alert('Error: No se pudo abrir la biblioteca de medios. Por favor, recarga la página.')
          return
        }
        
        try {
          // Asegurarse de que el modal esté visible
          mediaModal.classList.remove('hidden')
          mediaModal.style.display = ''
          document.body.classList.add('overflow-hidden')
          
          // Llamar al método openModal
          this.openModal(mode, id)
        } catch (error) {
          console.error(`Error al abrir el modal en modo ${mode}:`, error)
          // Mostrar el modal manualmente como último recurso
          mediaModal.classList.remove('hidden')
          mediaModal.style.display = ''
          document.body.classList.add('overflow-hidden')
          
          // Actualizar el estado interno del MediaManager
          this.currentMode = mode
          if (mode === 'gallery') {
            this.currentGalleryId = id
            this.currentImageId = null
          } else if (mode === 'image') {
            this.currentImageId = id
            this.currentGalleryId = null
          }
          
          // Cargar el contenido de la carpeta actual o la raíz
          this.loadMedia(this.currentMediaPath || '')
        }
      }
    }
    
    // Configurar botón principal de la biblioteca de medios
    const openMediaBtn = document.getElementById('open-media-library')
    if (openMediaBtn) {
      // Eliminar eventos anteriores para evitar duplicados
      if (openMediaBtn._clickHandler) {
        openMediaBtn.removeEventListener('click', openMediaBtn._clickHandler)
      }
      
      // Crear y asignar nuevo manejador
      const clickHandler = createRobustClickHandler('editor')
      openMediaBtn._clickHandler = clickHandler
      openMediaBtn.addEventListener('click', clickHandler)
    }
    
    // Actualizar event listeners para botones de imagen principal
    document.querySelectorAll('[data-media-mode="main-image"]').forEach(btn => {
      // Eliminar eventos anteriores
      if (btn._clickHandler) {
        btn.removeEventListener('click', btn._clickHandler)
      }
      
      // Crear y asignar nuevo manejador
      const clickHandler = createRobustClickHandler('main-image')
      btn._clickHandler = clickHandler
      btn.addEventListener('click', clickHandler)
    })

    // Configurar botones para galerías
    document.querySelectorAll('[data-media-mode="gallery"]').forEach(btn => {
      // Eliminar eventos anteriores
      if (btn._clickHandler) {
        btn.removeEventListener('click', btn._clickHandler)
      }
      
      const galleryId = btn.getAttribute('data-gallery-id')
      
      // Crear y asignar nuevo manejador
      const clickHandler = createRobustClickHandler('gallery', galleryId)
      btn._clickHandler = clickHandler
      btn.addEventListener('click', clickHandler)
    })
    
    // Configurar botones para campos de imagen
    document.querySelectorAll('[data-media-mode="image"]').forEach(btn => {
      // Eliminar eventos anteriores
      if (btn._clickHandler) {
        btn.removeEventListener('click', btn._clickHandler)
      }
      
      const imageId = btn.getAttribute('data-image-id')
      // console.log('Configurando botón de imagen con ID:', imageId)
      
      // Crear y asignar nuevo manejador
      const clickHandler = createRobustClickHandler('image', imageId)
      btn._clickHandler = clickHandler
      btn.addEventListener('click', clickHandler)
    })
    
    // Configurar botones con la clase media-button
    document.querySelectorAll('.media-button').forEach(btn => {
      // Eliminar eventos anteriores
      if (btn._clickHandler) {
        btn.removeEventListener('click', btn._clickHandler)
      }
      
      const mode = btn.getAttribute('data-media-mode') || 'editor'
      const id = mode === 'gallery' ? btn.getAttribute('data-gallery-id') : 
                (mode === 'image' ? btn.getAttribute('data-image-id') : null)
      
      // console.log('Configurando media-button:', { mode, id })
      
      // Crear y asignar nuevo manejador
      const clickHandler = createRobustClickHandler(mode, id)
      btn._clickHandler = clickHandler
      btn.addEventListener('click', clickHandler)
    })
  },
  
  setupMutationObserver: function () {
    // Asegurarse de que MutationObserver esté disponible
    if (typeof window.MutationObserver === 'undefined') {
      console.warn('MutationObserver no está disponible')
      return
    }
    
    // Configurar inmediatamente los botones existentes
    this.setupMediaButtons()

    const observer = new window.MutationObserver((mutations) => {
      let shouldCheckButtons = false

      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 &&
                (node.hasAttribute('data-media-mode') ||
                 node.querySelector('[data-media-mode]') ||
                 node.classList.contains('media-button') ||
                 node.querySelector('.media-button'))) {
              shouldCheckButtons = true
            }
          })
        }
      })

      if (shouldCheckButtons) {
        this.setupMediaButtons()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  },

  /**
   * Abrir el modal de la biblioteca de medios
   * @param {string} mode - Modo de selección ('editor', 'main-image', 'gallery', 'image')
   * @param {string} id - ID del campo (galleryId o imageId dependiendo del modo)
   */
  openModal: function (mode = 'editor', id = null) {
    console.log('openModal llamado con modo:', mode, 'y ID:', id)
    
    // Verificar y reinicializar el modal si es necesario
    if (!this.modal) {
      console.warn('Modal no inicializado, intentando reinicializar...')
      this.modal = document.getElementById('media-modal')
      
      // Si aún no existe, verificar si el HTML del modal está presente
      if (!this.modal) {
        console.error('Error: El modal no existe en el DOM')
        
        // Verificar si hay un elemento con la clase media-modal
        const possibleModal = document.querySelector('.media-modal')
        if (possibleModal) {
          this.modal = possibleModal
          console.log('Modal encontrado usando selector alternativo')
        } else {
          console.error('No se pudo encontrar el modal en el DOM')
          alert('Error: No se pudo abrir la biblioteca de medios. Por favor, recarga la página.')
          return
        }
      }
      
      // Reinicializar otros elementos importantes
      this.mediaGrid = this.mediaGrid || document.querySelector('.media-grid')
      this.mediaLoading = this.mediaLoading || document.querySelector('.media-loading')
      this.closeModalBtn = this.closeModalBtn || document.getElementById('close-media-modal')
      
      // Configurar evento para cerrar el modal si no estaba configurado
      if (this.closeModalBtn) {
        this.closeModalBtn.addEventListener('click', () => {
          this.closeModal()
        })
      }
    }

    // Establecer el modo actual
    this.currentMode = mode || 'editor'
    console.log('Modo establecido a:', this.currentMode)
    
    // Guardar el ID según el modo
    if (mode === 'gallery') {
      this.currentGalleryId = id
      this.currentImageId = null
      console.log('ID de galería establecido a:', this.currentGalleryId)
    } else if (mode === 'image') {
      this.currentImageId = id
      this.currentGalleryId = null
      console.log('ID de imagen establecido a:', this.currentImageId)
    } else {
      this.currentGalleryId = null
      this.currentImageId = null
      console.log('IDs de galería e imagen restablecidos')
    }
    
    this.selectedImages = []

    // Actualizar la UI según el modo
    this.updateModeUI()

    // Mostrar el modal
    this.modal.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')

    // Cargar el contenido de la carpeta actual o la raíz
    this.loadMedia(this.currentMediaPath || '')

    // Disparar evento para notificar que el modal ha sido abierto
    document.dispatchEvent(new CustomEvent('mediaModalOpened', {
      detail: {
        mode: this.currentMode
      }
    }))
  },

  /**
   * Cerrar el modal de la biblioteca de medios
   */
  closeModal: function () {
    if (this.modal) {
      // Quitar clase de animación si existe
      this.modal.classList.remove('modal-active')

      // Ocultar el modal
      this.modal.classList.add('hidden')
      this.modal.style.display = 'none'
    }

    // Resetear selección
    this.selectedImages = []
    this.updateSelectedCount()
  },

  /**
   * Actualizar la UI según el modo actual
   */
  updateModeUI: function () {
    // Actualizar indicador de modo
    if (this.modeIndicator) {
      if (this.currentMode === 'editor') {
        this.modeIndicator.textContent = 'Modo: Insertar en Editor'
        this.modeIndicator.classList.remove('hidden')
      } else if (this.currentMode === 'main-image') {
        this.modeIndicator.textContent = 'Modo: Imagen Principal'
        this.modeIndicator.classList.remove('hidden')
      } else if (this.currentMode === 'gallery') {
        this.modeIndicator.textContent = 'Modo: Galería'
        this.modeIndicator.classList.remove('hidden')
      } else if (this.currentMode === 'image') {
        this.modeIndicator.textContent = 'Modo: Seleccionar Imagen'
        this.modeIndicator.classList.remove('hidden')
      } else {
        this.modeIndicator.classList.add('hidden')
      }
    }

    // Mostrar/ocultar footer según el modo
    if (this.modalFooter) {
      if (this.currentMode === 'gallery') {
        this.modalFooter.classList.remove('hidden')
      } else {
        this.modalFooter.classList.add('hidden')
      }
    }
  },

  /**
   * Actualizar contador de imágenes seleccionadas
   */
  updateSelectedCount: function () {
    if (this.selectedCount) {
      const count = this.selectedImages.length
      this.selectedCount.textContent = `${count} ${count === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'}`
    }

    // Habilitar/deshabilitar botón de confirmación
    if (this.confirmSelectionBtn) {
      this.confirmSelectionBtn.disabled = this.selectedImages.length === 0
    }
  },

  /**
   * Cargar medios desde un directorio
   * @param {string} path - Ruta del directorio a cargar
   */
  loadMedia: function (path = '') {
    // Si ya estamos cargando, cancelar
    if (this.isLoading) {
      return
    }

    // Establecer estado de carga
    this.isLoading = true

    // Guardar la ruta actual
    this.currentMediaPath = path

    // Limpiar el grid antes de cargar nuevos elementos
    if (this.mediaGrid) {
      this.mediaGrid.innerHTML = ''
    }

    // Mostrar indicador de carga
    if (this.mediaLoading) {
      this.mediaLoading.classList.remove('hidden')
    }

    // Actualizar breadcrumbs
    if (this.currentPath) {
      if (path) {
        // Crear breadcrumbs navegables
        this.currentPath.innerHTML = ''
        
        // Dividir la ruta en partes
        const pathParts = path.split('/')
        
        // Agregar separador inicial
        this.currentPath.appendChild(document.createTextNode(' / '))
        
        // Variable para construir rutas acumulativas
        let accumulatedPath = ''
        
        // Crear enlaces para cada parte de la ruta
        pathParts.forEach((part, index) => {
          // Actualizar la ruta acumulada
          if (accumulatedPath) {
            accumulatedPath += '/' + part
          } else {
            accumulatedPath = part
          }
          
          // Crear enlace para esta parte de la ruta
          const link = document.createElement('button')
          link.className = 'text-neutral-600 dark:text-neutral-300 hover:underline'
          link.textContent = part
          
          // Crear una copia de la ruta acumulada para la clausura
          const pathToNavigate = accumulatedPath
          
          link.addEventListener('click', () => {
            this.loadMedia(pathToNavigate)
          })
          
          this.currentPath.appendChild(link)
          
          // Añadir otro separador si no es el último elemento
          if (index < pathParts.length - 1) {
            this.currentPath.appendChild(document.createTextNode(' / '))
          }
        })
      } else {
        this.currentPath.textContent = ''
      }
    }

    fetch(window.getApiUrl(`?action=media&path=${encodeURIComponent(path)}`), {
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(response => {
        return response.json()
      })
      .then(data => {
        // Ocultar indicador de carga
        if (this.mediaLoading) {
          this.mediaLoading.classList.add('hidden')
        }

        // Finalizar estado de carga
        this.isLoading = false

        // Verificar si la respuesta fue exitosa
        if (!data.success) {
          if (this.mediaGrid) {
            this.mediaGrid.innerHTML = `<div class="col-span-full text-center py-4 text-red-500">${data.message || 'Error al cargar medios'}</div>`
          }
          return
        }

        // Extraer directorios e imágenes de la nueva estructura
        const directories = data.items ? data.items.filter(item => item.type === 'directory').map(item => item.name) : []
        const images = data.items ? data.items.filter(item => item.type === 'image').map(item => item.name) : []

        if (directories.length === 0 && images.length === 0) {
          if (this.mediaGrid) {
            this.mediaGrid.innerHTML = '<div class="col-span-full text-center py-4 text-neutral-500 dark:text-neutral-400">No se encontraron medios</div>'
          }
          return
        }

        // Crear un fragmento para minimizar reflows
        const fragment = document.createDocumentFragment()

        // Añadir directorios primero
        directories.forEach(dir => {
          const dirElement = document.createElement('div')
          dirElement.className = 'directory p-2 border border-neutral-300 dark:border-neutral-700 rounded cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-700 relative group'
          dirElement.innerHTML = `
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span class="ml-2 truncate text-neutral-500 dark:text-neutral-300">${dir}</span>
              </div>
              <button class="delete-dir text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-dir="${dir}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          `

          dirElement.querySelector('.delete-dir').addEventListener('click', (e) => {
            e.stopPropagation()
            this.deleteDirectory(dir)
          })

          dirElement.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-dir')) {
              const newPath = path ? `${path}/${dir}` : dir
              this.loadMedia(newPath)
            }
          })

          fragment.appendChild(dirElement)
        })

        // Implementar lazy loading para imágenes
        const observer = new window.IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target
              const dataSrc = img.getAttribute('data-src')
              if (dataSrc) {
                img.src = dataSrc
                img.removeAttribute('data-src')
                img.classList.remove('opacity-0')
                img.classList.add('opacity-100')
                observer.unobserve(img)
              }
            }
          })
        }, {
          root: null,
          rootMargin: '100px',
          threshold: 0.1
        })

        // Añadir imágenes
        images.forEach(imageName => {
          const imageElement = document.createElement('div')

          // Determinar la clase según el modo actual
          let imageClass = 'image-item relative group'

          if (this.currentMode === 'gallery') {
            imageClass += ' cursor-pointer'
          } else {
            imageClass += ' cursor-pointer'
          }

          imageElement.className = imageClass

          // Construir rutas correctas para imágenes
          // URL completa para mostrar la imagen en el navegador
          const imagePath = path ? `${path}/${imageName}` : imageName
          const imageUrl = this.buildImagePath(imagePath, false)

          // Ruta para insertar en markdown (relativa a la raíz del contenido)
          const markdownPath = this.buildImagePath(imagePath, true)

          // Verificar si esta imagen ya está seleccionada (para modo galería)
          const isSelected = this.selectedImages.some(img => img.path === markdownPath)
          if (isSelected) {
            imageElement.classList.add('selected-image')
            imageElement.classList.add('ring-2')
            imageElement.classList.add('ring-red-500')
          }

          // Crear contenedor para la imagen con lazy loading
          const imgContainer = document.createElement('div')
          imgContainer.className = 'relative pb-[100%] overflow-hidden bg-neutral-200 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700'

          // Crear imagen con placeholder
          const img = document.createElement('img')
          img.className = 'absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0'
          img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-size="5" text-anchor="middle" alignment-baseline="middle" font-family="sans-serif" fill="%23999"%3ELoading...%3C/text%3E%3C/svg%3E'
          img.setAttribute('data-src', imageUrl)
          img.alt = imageName

          // Añadir la imagen al contenedor
          imgContainer.appendChild(img)

          // Nombre de la imagen
          const nameElement = document.createElement('div')
          nameElement.className = 'mt-1 text-xs truncate text-neutral-600 dark:text-neutral-400'
          nameElement.textContent = imageName

          // Botones de acción
          const actionButtons = document.createElement('div')
          actionButtons.className = 'delete-image-wrap'

          // Botón de eliminar
          const deleteButton = document.createElement('button')
          deleteButton.className = 'delete-image'
          deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>'

          actionButtons.appendChild(deleteButton)

          // Añadir elementos al contenedor principal
          imageElement.appendChild(imgContainer)
          imageElement.appendChild(nameElement)
          imageElement.appendChild(actionButtons)

          // Configurar eventos según el modo
          if (this.currentMode === 'gallery') {
            // En modo galería, el clic selecciona/deselecciona la imagen
            imageElement.addEventListener('click', () => {
              this.toggleImageSelection(imageName, markdownPath, imageUrl, imageElement)
            })
          } else {
            // En otros modos, el clic inserta la imagen
            imageElement.addEventListener('click', (e) => {
              if (!e.target.closest('.delete-image')) {
                this.handleImageSelection(imageName, markdownPath, imageUrl)
              }
            })
          }

          // Configurar evento para eliminar imagen
          deleteButton.addEventListener('click', (e) => {
            e.stopPropagation()
            this.deleteImage(imageName)
          })

          fragment.appendChild(imageElement)

          // Observar la imagen para cargarla cuando sea visible
          observer.observe(img)
        })

        // Limpiar el grid y añadir todos los elementos de una vez
        if (this.mediaGrid) {
          this.mediaGrid.appendChild(fragment)
        }
      })
      .catch(error => {
        // Ocultar indicador de carga
        if (this.mediaLoading) {
          this.mediaLoading.classList.add('hidden')
        }

        // Finalizar estado de carga
        this.isLoading = false

        if (this.mediaGrid) {
          this.mediaGrid.innerHTML = '<div class="col-span-full text-center py-4 text-red-500">Error al cargar medios: ' + error.message + '</div>'
        }
      })
  },

  /**
   * Manejar la selección de imagen según el modo actual
   * @param {string} imageName - Nombre de la imagen
   * @param {string} imagePath - Ruta de la imagen para markdown
   * @param {string} fullPath - Ruta completa de la imagen
   */
  handleImageSelection: function (imageName, imagePath, fullPath) {
    // Construir las rutas correctas usando buildImagePath
    const relativePath = this.buildImagePath(imagePath, true)
    const displayPath = this.buildImagePath(imagePath, false)

    if (this.currentMode === 'editor') {
      // Modo editor: insertar en el editor
      this.insertImageToEditor(imageName, relativePath)
      this.closeModal()
    } else if (this.currentMode === 'main-image') {
      // Modo imagen principal: establecer como imagen principal
      this.setMainImage(imageName, relativePath, fullPath)
      this.closeModal()
    } else if (this.currentMode === 'image') {
      // Modo imagen: establecer imagen para el campo de tipo imagen
      this.setImage(imageName, relativePath, fullPath)
    } else if (this.currentMode === 'gallery') {
      // Modo galería: alternar selección
      const images = this.mediaGrid.querySelectorAll('.image-item')
      let imageElement = null

      // Encontrar el elemento que corresponde a esta imagen
      for (const item of images) {
        const img = item.querySelector('img[data-src]')
        if (img && img.getAttribute('data-src') === displayPath) {
          imageElement = item
          break
        }
      }

      // Si no se encontró por data-src (puede que ya esté cargada), buscar por src
      if (!imageElement) {
        for (const item of images) {
          const img = item.querySelector('img')
          if (img && (img.src.endsWith(displayPath) || img.src.endsWith(imageName))) {
            imageElement = item
            break
          }
        }
      }

      if (imageElement) {
        this.toggleImageSelection(imageName, imagePath, fullPath, imageElement)
      }
    }
  },

  /**
   * Alternar la selección de una imagen en modo galería
   * @param {string} imageName - Nombre de la imagen
   * @param {string} markdownPath - Ruta de la imagen para markdown
   * @param {string} fullPath - Ruta completa de la imagen
   * @param {HTMLElement} imageElement - Elemento DOM de la imagen
   */
  toggleImageSelection: function (imageName, markdownPath, fullPath, imageElement) {
    // Verificar si la imagen ya está seleccionada
    const index = this.selectedImages.findIndex(img => img.path === markdownPath)

    if (index !== -1) {
      // Si ya está seleccionada, quitarla de la selección
      this.selectedImages.splice(index, 1)
      imageElement.classList.remove('selected-image', 'ring-2', 'ring-red-500')

      // Actualizar el icono de selección
      const checkIcon = imageElement.querySelector('.absolute > div')
      if (checkIcon) {
        checkIcon.innerHTML = ''
        checkIcon.parentElement.classList.add('opacity-0')
        checkIcon.parentElement.classList.remove('opacity-100')
      }
    } else {
      // Para la vista previa: Mantener la ruta completa con ../../public/
      const displayPath = this.buildImagePath(markdownPath, false)

      // Para el front-matter: Generar una ruta en formato /img/... similar a insertImageToEditor
      let frontMatterPath = markdownPath

      // Si la ruta ya comienza con /img/, usarla tal cual
      if (frontMatterPath.startsWith('/img/')) {
        console.log('Ruta ya tiene formato correcto para front-matter (galería):', frontMatterPath)
      }
      // Si comienza con ../../../public/img/, convertirla al formato /img/
      else if (frontMatterPath.includes('../../../public/img/')) {
        frontMatterPath = frontMatterPath.replace('../../../public/img/', '/img/')
      }
      // Para compatibilidad con rutas antiguas
      else if (frontMatterPath.includes('../../public/img/')) {
        frontMatterPath = frontMatterPath.replace('../../public/img/', '/img/')
        console.log('Ruta convertida a formato correcto para front-matter (galería):', frontMatterPath)
      }
      // Cualquier otro formato, normalizarlo a /img/
      else {
        // Eliminar cualquier prefijo de ruta relativa
        const cleanPath = frontMatterPath.replace(/^(\.\.\/)*/g, '')
        // Eliminar public/img/ si ya existe
        const finalPath = cleanPath.replace(/^public\/img\//i, '')
        // Asegurarse de que no comience con /
        const pathWithoutLeadingSlash = finalPath.replace(/^\/+/, '')
        // Construir la ruta completa con el formato correcto
        frontMatterPath = '/img/' + pathWithoutLeadingSlash
        console.log('Ruta normalizada para front-matter (galería):', frontMatterPath)
      }

      // Disparar evento para notificar que se ha seleccionado una imagen
      document.dispatchEvent(new CustomEvent('mainImageSelected', {
        detail: {
          name: imageName,
          path: frontMatterPath, // Usar la ruta formateada para el front-matter
          fullPath: displayPath,
          forMainImage: true
        }
      }))

      // Si no está seleccionada, añadirla a la selección
      this.selectedImages.push({
        name: imageName,
        path: frontMatterPath, // Usar la ruta formateada para front-matter
        fullPath: displayPath // Mantener ruta completa para visualización
      })

      imageElement.classList.add('selected-image', 'ring-2', 'ring-red-500')

      // Actualizar el icono de selección
      const checkIcon = imageElement.querySelector('.absolute > div')
      if (checkIcon) {
        checkIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>'
        checkIcon.parentElement.classList.remove('opacity-0')
        checkIcon.parentElement.classList.add('opacity-100')
      }
    }

    // Actualizar contador de selección
    this.updateSelectedCount()
  },

  /**
   * Eliminar una imagen
   * @param {string} imageName - Nombre de la imagen a eliminar
   */
  deleteImage: function (imageName) {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
      // Mostrar indicador de carga
      this.mediaLoading.classList.remove('hidden')
      this.mediaGrid.classList.add('hidden')

      // Obtener la ruta actual
      const path = this.currentMediaPath || ''

      // Enviar solicitud para eliminar la imagen
      fetch(window.getApiUrl('?action=deleteimage'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: `image=${encodeURIComponent(imageName)}&path=${encodeURIComponent(path)}`
      })
        .then(response => response.json())
        .then(data => {
          // Ocultar indicador de carga
          if (this.mediaLoading) {
            this.mediaLoading.classList.add('hidden')
          }

          // Finalizar estado de carga
          this.isLoading = false

          if (data.success) {
            // Volver a mostrar el grid de medios
            this.mediaGrid.classList.remove('hidden')

            // Eliminar la imagen del DOM sin recargar toda la biblioteca
            const imageElements = this.mediaGrid.querySelectorAll('.image-item')
            imageElements.forEach(element => {
              const nameElement = element.querySelector('.truncate')
              if (nameElement && nameElement.textContent.trim() === imageName) {
                // Añadir una animación de desvanecimiento antes de eliminar
                element.style.transition = 'opacity 0.3s ease'
                element.style.opacity = '0'

                // Eliminar el elemento después de la animación
                setTimeout(() => {
                  element.remove()

                  // Si no quedan imágenes, mostrar mensaje
                  if (this.mediaGrid.querySelectorAll('.image-item').length === 0 &&
                      this.mediaGrid.querySelectorAll('.directory').length === 0) {
                    this.mediaGrid.innerHTML = '<div class="col-span-full text-center py-4 text-neutral-500 dark:text-neutral-400">No se encontraron medios</div>'
                  }
                }, 300)
              }
            })

            this.showFlashMessage('Imagen movida a la papelera de reciclaje', 'success')
          } else {
            window.alert('Error al mover la imagen a la papelera: ' + (data.message || data.error))
          }
        })
        .catch(error => {
          console.error('Error al mover la imagen a la papelera:', error)
          window.alert('Error al mover la imagen a la papelera')
          this.mediaLoading.classList.add('hidden')
          this.mediaGrid.classList.remove('hidden')
        })
    }
  },

  /**
   * Confirmar la selección de imágenes para la galería
   */
  confirmGallerySelection: function () {
    if (this.selectedImages.length === 0) return

    const galleryField = document.querySelector(`.gallery-field[data-gallery-id="${this.currentGalleryId}"]`)
    if (!galleryField) {
      return
    }

    const imagesContainer = galleryField.querySelector('.gallery-images-container')
    const hiddenInput = galleryField.querySelector('.gallery-data')

    if (!imagesContainer || !hiddenInput) {
      return
    }

    // Limpiar el contenedor de imágenes
    imagesContainer.innerHTML = ''

    // Guardar las rutas de las imágenes en formato /img/... para el front-matter
    // Asegurarse de que todas las rutas tengan el formato correcto
    const imagePaths = this.selectedImages.map(image => {
      const path = image.path

      // Verificar si la ruta ya tiene el formato correcto
      if (path.startsWith('/img/')) {
        return path
      }

      // Si comienza con ../../../public/img/, convertirla al formato /img/
      if (path.includes('../../../public/img/')) {
        return path.replace('../../../public/img/', '/img/')
      }
      // Para compatibilidad con rutas antiguas
      if (path.includes('../../public/img/')) {
        return path.replace('../../public/img/', '/img/')
      }

      // Normalizar cualquier otro formato a /img/
      const cleanPath = path.replace(/^(\.\.\/)*/, '')
      const finalPath = cleanPath.replace(/^public\/img\//i, '')
      const pathWithoutLeadingSlash = finalPath.replace(/^\/+/, '')
      return '/img/' + pathWithoutLeadingSlash
    })

    hiddenInput.value = JSON.stringify(imagePaths)

    // Añadir las imágenes al contenedor
    this.selectedImages.forEach(image => {
      const imageItem = document.createElement('div')
      imageItem.className = 'gallery-image-item relative border border-neutral-300 dark:border-neutral-700 rounded overflow-hidden'

      // Construir la ruta correcta para la vista previa
      let displayPath = ''
      if (image.fullPath.startsWith('/')) {
        // Si comienza con /, añadir el prefijo ../../../public
        displayPath = `../../../public${image.fullPath}`
      } else if (image.fullPath.includes('public/img')) {
        // Si ya contiene public/img, asegurarse de que tenga la estructura correcta
        displayPath = image.fullPath.replace(/^\.\.\/\.\.\/public\//, '../../../public/')
      } else {
        // Para otros casos, añadir el prefijo completo
        displayPath = `../../../public/${image.fullPath}`
      }

      imageItem.innerHTML = `
        <img src="${displayPath}" class="w-full h-20 object-cover">
        <button type="button" class="gallery-remove-image absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center" data-path="${image.path}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      `

      // Configurar el botón para eliminar la imagen
      const removeBtn = imageItem.querySelector('.gallery-remove-image')
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          imageItem.remove()
          // Actualizar el valor del input oculto
          const paths = JSON.parse(hiddenInput.value || '[]').filter(path => path !== image.path)
          hiddenInput.value = JSON.stringify(paths)
        })
      }

      imagesContainer.appendChild(imageItem)
    })

    this.closeModal()
  },

  /**
   * Insertar imagen en el editor
   * @param {string} imageName - Nombre de la imagen
   * @param {string} imagePath - Ruta de la imagen para markdown
   */
  insertImageToEditor: function (imageName, imagePath) {
    if (!window.editor) {
      return
    }

    // Asegurar que la ruta siempre tenga el formato correcto /img/
    let relativePath = imagePath

    // Si la ruta ya comienza con /img/, usarla tal cual
    if (relativePath.startsWith('/img/')) {
      console.log('Ruta ya tiene formato correcto:', relativePath)
    }
    // Si comienza con ../../../public/img/, convertirla al formato /img/
    else if (relativePath.includes('../../../public/img/')) {
      relativePath = relativePath.replace('../../../public/img/', '/img/')
    }
    // Para compatibilidad con rutas antiguas
    else if (relativePath.includes('../../public/img/')) {
      relativePath = relativePath.replace('../../public/img/', '/img/')
      console.log('Ruta convertida a formato correcto:', relativePath)
    }
    // Cualquier otro formato, normalizarlo a /img/
    else {
      // Eliminar cualquier prefijo de ruta relativa
      const cleanPath = relativePath.replace(/^(\.\.\/)+/g, '')
      // Eliminar public/img/ si ya existe
      const finalPath = cleanPath.replace(/^public\/img\//i, '')
      // Asegurarse de que no comience con /
      const pathWithoutLeadingSlash = finalPath.replace(/^\/+/, '')
      // Construir la ruta completa con el formato correcto
      relativePath = '/img/' + pathWithoutLeadingSlash
      console.log('Ruta normalizada:', relativePath)
    }

    const markdownImage = `![${imageName}](${relativePath})`
    console.log('Insertando imagen con ruta:', relativePath)
    window.editor.codemirror.replaceSelection(markdownImage)

    this.showFlashMessage('Imagen insertada en el editor')
  },

  /**
   * Establecer imagen principal
   * @param {string} imageName - Nombre de la imagen
   * @param {string} imagePath - Ruta de la imagen para markdown
   * @param {string} fullPath - Ruta completa de la imagen
   */
  setMainImage: function (imageName, imagePath, fullPath) {
    // Actualizar los elementos de la imagen principal
    const mainImagePath = document.getElementById('main-image-path')
    const mainImagePreview = document.getElementById('main-image-preview')
    const mainImagePlaceholder = document.getElementById('main-image-placeholder')
    const mainImageStatus = document.querySelector('.main-image-status')

    // Para la vista previa: Mantener la ruta completa con ../../public/
    const displayPath = this.buildImagePath(imagePath, false)

    // Para el front-matter: Generar una ruta en formato /img/... similar a insertImageToEditor
    let frontMatterPath = imagePath

    // Si la ruta ya comienza con /img/, usarla tal cual
    if (frontMatterPath.startsWith('/img/')) {
      console.log('Ruta ya tiene formato correcto para front-matter:', frontMatterPath)
    }
    // Si comienza con ../../../public/img/, convertirla al formato /img/
    else if (frontMatterPath.includes('../../../public/img/')) {
      frontMatterPath = frontMatterPath.replace('../../../public/img/', '/img/')
    }
    // Para compatibilidad con rutas antiguas
    else if (frontMatterPath.includes('../../public/img/')) {
      frontMatterPath = frontMatterPath.replace('../../public/img/', '/img/')
      console.log('Ruta convertida a formato correcto para front-matter:', frontMatterPath)
    }
    // Cualquier otro formato, normalizarlo a /img/
    else {
      // Eliminar cualquier prefijo de ruta relativa
      const cleanPath = frontMatterPath.replace(/^(\.\.\/)*/, '')
      // Eliminar public/img/ si ya existe
      const finalPath = cleanPath.replace(/^public\/img\//i, '')
      // Asegurarse de que no comience con /
      const pathWithoutLeadingSlash = finalPath.replace(/^\/+/, '')
      // Construir la ruta completa con el formato correcto
      frontMatterPath = '/img/' + pathWithoutLeadingSlash
      console.log('Ruta normalizada para front-matter:', frontMatterPath)
    }

    if (mainImagePath) mainImagePath.value = frontMatterPath
    if (mainImageStatus) mainImageStatus.textContent = 'Imagen seleccionada'

    // Actualizar vista previa
    if (mainImagePreview && mainImagePlaceholder) {
      mainImagePreview.src = displayPath
      mainImagePreview.classList.remove('hidden')
      mainImagePlaceholder.classList.add('hidden')
    }

    // Disparar evento para notificar que se ha seleccionado una imagen
    document.dispatchEvent(new CustomEvent('mainImageSelected', {
      detail: {
        name: imageName,
        path: frontMatterPath, // Usar la ruta formateada para el front-matter
        fullPath: displayPath, // Mantener la ruta completa para la vista previa
        forMainImage: true
      }
    }))

    // Ya no mostramos mensaje flash al establecer la imagen principal
  },
  
  /**
   * Establecer imagen para campo de tipo image
   * @param {string} imageName - Nombre de la imagen
   * @param {string} imagePath - Ruta de la imagen para markdown
   * @param {string} fullPath - Ruta completa de la imagen
   */
  setImage: function (imageName, imagePath, fullPath) {
    // Para la vista previa: Mantener la ruta completa con ../../public/
    const displayPath = this.buildImagePath(imagePath, false)

    // Para el front-matter: Generar una ruta en formato /img/... similar a insertImageToEditor
    let frontMatterPath = imagePath

    // Si la ruta ya comienza con /img/, usarla tal cual
    if (frontMatterPath.startsWith('/img/')) {
      // console.log('Ruta ya tiene formato correcto para front-matter (imagen):', frontMatterPath)
    }
    // Si comienza con ../../../public/img/, convertirla al formato /img/
    else if (frontMatterPath.includes('../../../public/img/')) {
      frontMatterPath = frontMatterPath.replace('../../../public/img/', '/img/')
    }
    // Para compatibilidad con rutas antiguas
    else if (frontMatterPath.includes('../../public/img/')) {
      frontMatterPath = frontMatterPath.replace('../../public/img/', '/img/')
    }
    // Cualquier otro formato, normalizarlo a /img/
    else {
      // Eliminar cualquier prefijo de ruta relativa
      const cleanPath = frontMatterPath.replace(/^(\.\.\/)*/, '')
      // Eliminar public/img/ si ya existe
      const finalPath = cleanPath.replace(/^public\/img\//i, '')
      // Asegurarse de que no comience con /
      const pathWithoutLeadingSlash = finalPath.replace(/^\/+/, '')
      // Construir la ruta completa con el formato correcto
      frontMatterPath = '/img/' + pathWithoutLeadingSlash
    }

    // Buscar el campo de imagen correspondiente
    const imageField = document.querySelector(`.image-field[data-image-id="${this.currentImageId}"]`)
    if (!imageField) {
      console.error('No se encontró el campo de imagen con ID:', this.currentImageId)
      return
    }

    // Obtener el contenedor de la imagen y el input oculto
    const imageContainer = imageField.querySelector('.image-container')
    const hiddenInput = imageField.querySelector('.image-data')

    if (!imageContainer || !hiddenInput) {
      console.error('No se encontraron los elementos necesarios para el campo de imagen')
      return
    }

    // Limpiar el contenedor de imagen
    imageContainer.innerHTML = ''

    // Establecer el valor en el input oculto
    hiddenInput.value = frontMatterPath

    // Crear el elemento de vista previa
    const previewWrapper = document.createElement('div')
    previewWrapper.className = 'image-preview-wrapper'

    previewWrapper.innerHTML = `
      <img src="${displayPath}">
      <button type="button" class="image-remove" data-path="${frontMatterPath}">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    `

    // Añadir al contenedor
    imageContainer.appendChild(previewWrapper)

    // Actualizar el texto del botón
    const selectButton = imageField.querySelector('.image-select')
    if (selectButton) {
      selectButton.textContent = 'Change Image'
    }

    // Ya no mostramos mensaje flash al seleccionar imágenes

    // Cerrar el modal
    this.closeModal()
  },

  /**
   * Mostrar mensaje flash
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de mensaje ('success' o 'error')
   */
  showFlashMessage: function (message, type = 'success') {
    const flashElement = document.createElement('div')
    flashElement.className = 'flash-message'
    
    // Añadir clases de color según el tipo
    if (type === 'success') {
      flashElement.classList.add('bg-green-500', 'text-white')
    } else if (type === 'error') {
      flashElement.classList.add('bg-red-500', 'text-white')
    } else if (type === 'warning') {
      flashElement.classList.add('bg-yellow-500', 'text-white')
    } else {
      flashElement.classList.add('bg-green-500', 'text-white')
    }
    
    flashElement.textContent = message
    document.body.appendChild(flashElement)

    // Add the active class after a small delay to trigger the animation
    setTimeout(() => {
      flashElement.classList.add('active')
    }, 10)

    setTimeout(() => {
      flashElement.classList.remove('active')
      setTimeout(() => {
        document.body.removeChild(flashElement)
      }, 500)
    }, 1500)
  },

  /**
   * Crear modal para creación de directorios
   */
  createDirectoryModal: function () {
    // Verificar si ya existe el modal
    if (document.getElementById('create-dir-modal')) {
      return
    }

    // Crear elementos del modal
    const modal = document.createElement('div')
    modal.id = 'create-dir-modal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center hidden'
    modal.style.display = 'none'

    // Contenido del modal
    modal.innerHTML = `
      <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-96 p-6">
        <h3 class="text-lg font-semibold mb-4">Crear Nueva Carpeta</h3>
        <div class="mb-4">
          <label for="dir-name" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nombre de la carpeta</label>
          <input type="text" id="dir-name" class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-neutral-800">
        </div>
        <div class="flex justify-end gap-2">
          <button id="cancel-create-dir" class="px-4 py-2 bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-400 dark:hover:bg-neutral-600">
            Cancelar
          </button>
          <button id="confirm-create-dir" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Crear
          </button>
        </div>
      </div>
    `

    // Añadir el modal al body
    document.body.appendChild(modal)

    // Configurar eventos
    const cancelBtn = document.getElementById('cancel-create-dir')
    const confirmBtn = document.getElementById('confirm-create-dir')
    const dirNameInput = document.getElementById('dir-name')

    // Evento para cancelar
    cancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden')
      modal.style.display = 'none'
      dirNameInput.value = ''
    })

    // Evento para confirmar
    confirmBtn.addEventListener('click', () => {
      const dirName = dirNameInput.value.trim()
      if (dirName) {
        this.createDirectory(dirName)
        modal.classList.add('hidden')
        modal.style.display = 'none'
        dirNameInput.value = ''
      }
    })

    // Guardar referencia al modal
    this.createDirModal = modal
  },

  /**
   * Mostrar modal para crear directorio
   */
  showCreateDirectoryModal: function () {
    if (this.createDirModal) {
      this.createDirModal.classList.remove('hidden')
      this.createDirModal.style.display = 'flex'
      document.getElementById('dir-name').focus()
    }
  },

  /**
   * Crear un nuevo directorio
   * @param {string} dirName - Nombre del directorio a crear
   */
  createDirectory: function (dirName) {
    // Mostrar indicador de carga
    this.mediaLoading.classList.remove('hidden')
    this.mediaGrid.classList.add('hidden')

    // Obtener la ruta actual
    const path = this.currentMediaPath || ''

    // Enviar solicitud para crear el directorio
    const apiUrl = window.API_BASE_PATH || 'process.php'
    const collection = window.CURRENT_COLLECTION || ''
    const url = `${apiUrl}?action=createdir&collection=${encodeURIComponent(collection)}`

    console.log('Creating directory using URL:', url)

    fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `dirname=${encodeURIComponent(dirName)}&path=${encodeURIComponent(path)}`
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Recargar medios para mostrar el nuevo directorio
          this.loadMedia(this.currentMediaPath)

          // Asegurarnos de que la cuadrícula de medios sea visible después de cargar
          setTimeout(() => {
            this.mediaLoading.classList.add('hidden')
            this.mediaGrid.classList.remove('hidden')
          }, 500) // Pequeño retraso para dar tiempo a que loadMedia complete su ejecución

          // Mostrar mensaje de éxito
          this.showFlashMessage('Directorio creado correctamente', 'success')
        } else {
          this.showFlashMessage('Error al crear directorio: ' + data.error, 'error')
          this.mediaLoading.classList.add('hidden')
          this.mediaGrid.classList.remove('hidden')
          throw new Error('Error al crear directorio: ' + data.error)
        }
      })
      .catch(error => {
        window.alert('Error al crear directorio')
        this.mediaLoading.classList.add('hidden')
        this.mediaGrid.classList.remove('hidden')
      })
  },

  /**
   * Eliminar un directorio
   * @param {string} dirName - Nombre del directorio a eliminar
   */
  deleteDirectory: function (dirName) {
    // Confirmar antes de eliminar
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el directorio "${dirName}" y todo su contenido?`)) {
      return
    }

    // Mostrar indicador de carga
    this.mediaLoading.classList.remove('hidden')
    this.mediaGrid.classList.add('hidden')

    // Obtener la ruta actual
    const path = this.currentMediaPath || ''
    
    // Construir la ruta completa del directorio a eliminar
    // Si estamos en un subdirectorio, necesitamos incluir la ruta completa
    const fullDirPath = path ? `${path}/${dirName}` : dirName

    // Enviar solicitud para eliminar el directorio
    fetch(window.getApiUrl('?action=deletedir'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `fullpath=${encodeURIComponent(fullDirPath)}`
    })
      .then(response => response.json())
      .then(data => {
        // Ocultar indicador de carga
        if (this.mediaLoading) {
          this.mediaLoading.classList.add('hidden')
        }

        // Finalizar estado de carga
        this.isLoading = false

        if (data.success) {
          // Recargar medios para reflejar la eliminación
          this.loadMedia(this.currentMediaPath)

          // Asegurarnos de que la cuadrícula de medios sea visible después de cargar
          setTimeout(() => {
            this.mediaLoading.classList.add('hidden')
            this.mediaGrid.classList.remove('hidden')
          }, 500) // Pequeño retraso para dar tiempo a que loadMedia complete su ejecución

          // Mostrar mensaje de éxito
          this.showFlashMessage('Directorio eliminado correctamente', 'success')
        } else {
          window.alert('Error al eliminar directorio: ' + data.message)
          this.mediaLoading.classList.add('hidden')
          this.mediaGrid.classList.remove('hidden')
        }
      })
      .catch(error => {
        console.error('Error al eliminar directorio:', error)
        window.alert('Error al eliminar directorio')
        this.mediaLoading.classList.add('hidden')
        this.mediaGrid.classList.remove('hidden')
      })
  },

  /**
   * Subir una imagen al servidor
   * @param {FileList} files - Lista de archivos a subir
   */
  uploadImage: function (files) {
    if (!files || files.length === 0) {
      return
    }

    // Mostrar indicador de carga
    this.mediaLoading.classList.remove('hidden')
    this.mediaGrid.classList.add('hidden')

    // Crear FormData para enviar el archivo
    const formData = new FormData()
    formData.append('image', files[0])

    // Añadir la ruta actual si existe
    if (this.currentMediaPath) {
      formData.append('path', this.currentMediaPath)
    }

    // Ya no necesitamos añadir la acción al FormData pues va en la URL

    // Enviar solicitud para subir la imagen
    const apiUrl = window.API_BASE_PATH || 'process.php'
    const collection = window.CURRENT_COLLECTION || ''
    const url = `${apiUrl}?action=upload&collection=${encodeURIComponent(collection)}`

    console.log('Uploading image to URL:', url)

    // Usar withCredentials: true para asegurar que las cookies se envíen en solicitudes cross-origin
    const fetchOptions = {
      method: 'POST',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: formData
    }

    console.log('Fetch options:', JSON.stringify(fetchOptions, (key, value) => {
      // No mostrar el contenido del formData en la consola por razones de seguridad
      if (key === 'body' && value instanceof FormData) return '[FormData]'
      return value
    }, 2))

    fetch(url, fetchOptions)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Recargar medios para mostrar la nueva imagen
          this.loadMedia(this.currentMediaPath)

          // Asegurarnos de que la cuadrícula de medios sea visible después de cargar
          setTimeout(() => {
            this.mediaLoading.classList.add('hidden')
            this.mediaGrid.classList.remove('hidden')
          }, 500) // Pequeño retraso para dar tiempo a que loadMedia complete su ejecución

          this.showFlashMessage('Imagen subida correctamente', 'success')
        } else {
          this.showFlashMessage('Error al subir imagen: ' + data.message, 'error')
          this.mediaLoading.classList.add('hidden')
          this.mediaGrid.classList.remove('hidden')
          throw new Error('Error al subir imagen: ' + data.message)
        }
      })
      .catch(error => {
        window.alert('Error al subir imagen')
        this.mediaLoading.classList.add('hidden')
        this.mediaGrid.classList.remove('hidden')
      })

    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    this.uploadInput.value = ''
  }
}
