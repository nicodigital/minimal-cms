/**
 * Módulo para gestionar la papelera de reciclaje
 */
export const RecycleBinManager = {
  // Configuración de paths
  paths: {
    root: window.PATHS ? window.PATHS.ROOT : '/',
    cms: window.PATHS ? window.PATHS.CMS : '/content/',
    media: window.PATHS ? window.PATHS.MEDIA : '../../../public/img'
  },
  
  // Elementos del DOM
  modal: null,
  closeBtn: null,
  openBtn: null,
  tabFiles: null,
  tabImages: null,
  filesGrid: null,
  imagesGrid: null,
  loadingIndicator: null,
  emptyState: null,
  itemCount: null,
  emptyRecycleBinBtn: null,

  // Estado actual
  currentTab: 'files',
  isConfirmingEmpty: false, // Variable para evitar confirmaciones múltiples

  /**
   * Inicializar el módulo
   * @param {number} retryCount - Contador de reintentos (para uso interno)
   */
  init: function (retryCount = 0) {
    // console.log('Inicializando Recycle Bin Manager...')

    // Inicializar elementos del DOM
    this.modal = document.getElementById('recycle-bin-modal')
    this.closeBtn = document.getElementById('close-recycle-bin')
    this.openBtn = document.getElementById('open-recycle-bin')
    this.tabFiles = document.getElementById('tab-files')
    this.tabImages = document.getElementById('tab-images')
    this.filesGrid = document.getElementById('recycle-files-grid')
    this.imagesGrid = document.getElementById('recycle-images-grid')
    this.loadingIndicator = document.getElementById('recycle-loading')
    this.emptyState = document.getElementById('recycle-empty')
    this.itemCount = document.getElementById('recycle-count')
    this.emptyRecycleBinBtn = document.getElementById('empty-recycle-bin')

    // Si no encontramos los elementos necesarios, intentar buscarlos después de un tiempo
    // pero limitar a máximo 3 intentos para evitar bucles infinitos
    if (!this.modal || !this.openBtn) {
      if (retryCount < 3) {
        // console.warn(`Recycle bin elements not found, retrying... (${retryCount + 1}/3)`)
        setTimeout(() => this.init(retryCount + 1), 1000)
      } else {
        // console.error('Recycle bin elements not found after 3 attempts. Make sure the recycle-bin.php is included in the layout.')
      }
      return
    }

    // Configurar eventos
    this.setupEventListeners()

    // console.log('Recycle bin manager initialized')
  },

  /**
   * Configurar listeners de eventos
   */
  setupEventListeners: function () {
    // Abrir modal
    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.openModal())
    }

    // Cerrar modal
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal())
    }

    // Cambiar entre pestañas
    if (this.tabFiles) {
      this.tabFiles.addEventListener('click', () => this.switchTab('files'))
    }

    if (this.tabImages) {
      this.tabImages.addEventListener('click', () => this.switchTab('images'))
    }

    // Vaciar papelera
    if (this.emptyRecycleBinBtn) {
      this.emptyRecycleBinBtn.addEventListener('click', () => this.confirmEmptyRecycleBin())
    }
  },

  /**
   * Abrir el modal de la papelera
   */
  openModal: function () {
    if (this.modal) {
      this.modal.style.display = 'flex'
      setTimeout(() => {
        this.modal.classList.remove('hidden')
      }, 10)

      // Cargar contenido
      this.loadRecycleBinItems()
    }
  },

  /**
   * Cerrar el modal de la papelera
   */
  closeModal: function () {
    if (this.modal) {
      this.modal.classList.add('hidden')
      setTimeout(() => {
        this.modal.style.display = 'none'

        // Refrescar la lista de archivos al cerrar el modal
        if (window.FileManager && typeof window.FileManager.loadFileList === 'function') {
          window.FileManager.loadFileList()
        } else if (window.App && window.App.FileManager && typeof window.App.FileManager.loadFileList === 'function') {
          window.App.FileManager.loadFileList()
        } else {
          // Intentar encontrar FileManager en el ámbito global
          const event = new CustomEvent('refreshFileList')
          document.dispatchEvent(event)
          // console.log('Dispatched refreshFileList event')
        }
      }, 300)
    }
  },

  /**
   * Cambiar entre pestañas (archivos/imágenes)
   */
  switchTab: function (tab) {
    if (tab === this.currentTab) {
      return
    }

    this.currentTab = tab

    // Actualizar clases de pestañas
    if (this.tabFiles && this.tabImages) {
      if (tab === 'files') {
        this.tabFiles.classList.add('border-red-500', 'text-red-500')
        this.tabFiles.classList.remove('border-transparent', 'hover:text-red-500')
        this.tabImages.classList.remove('border-red-500', 'text-red-500')
        this.tabImages.classList.add('border-transparent', 'hover:text-red-500')
      } else {
        this.tabImages.classList.add('border-red-500', 'text-red-500')
        this.tabImages.classList.remove('border-transparent', 'hover:text-red-500')
        this.tabFiles.classList.remove('border-red-500', 'text-red-500')
        this.tabFiles.classList.add('border-transparent', 'hover:text-red-500')
      }
    }

    // Mostrar/ocultar grids
    if (this.filesGrid && this.imagesGrid) {
      if (tab === 'files') {
        this.filesGrid.classList.remove('hidden')
        this.imagesGrid.classList.add('hidden')
      } else {
        this.filesGrid.classList.add('hidden')
        this.imagesGrid.classList.remove('hidden')
      }
    }

    // Cargar elementos
    this.loadRecycleBinItems()
  },

  /**
   * Cargar elementos de la papelera
   */
  loadRecycleBinItems: function () {
    // Mostrar indicador de carga
    this.loadingIndicator.classList.remove('hidden')
    this.filesGrid.classList.add('hidden')
    this.imagesGrid.classList.add('hidden')
    this.emptyState.classList.add('hidden')

    // Obtener tipo actual
    const type = this.currentTab

    // Obtener la colección actual
    const collection = window.currentCollection || ''

    // Realizar solicitud
    fetch(window.getApiUrl(`?action=recyclebin&type=${type}&collection=${encodeURIComponent(collection)}`))
      .then(response => response.json())
      .then(data => {
        // Ocultar indicador de carga
        this.loadingIndicator.classList.add('hidden')

        if (data.success) {
          const files = data.files || []

          // Actualizar contador
          this.itemCount.textContent = files.length + (files.length === 1 ? ' item' : ' items')

          // Mostrar estado vacío si no hay archivos
          if (files.length === 0) {
            this.emptyState.classList.remove('hidden')
            if (type === 'files') {
              this.filesGrid.classList.add('hidden')
            } else {
              this.imagesGrid.classList.add('hidden')
            }
            return
          }

          // Renderizar archivos según el tipo
          if (type === 'files') {
            this.renderFiles(files)
            this.filesGrid.classList.remove('hidden')
          } else {
            this.renderImages(files)
            this.imagesGrid.classList.remove('hidden')
          }
        } else {
          // console.error('Error al cargar elementos de la papelera:', data.message || data.error)
          this.showFlashMessage('Error al cargar elementos de la papelera', 'error')
        }
      })
      .catch(error => {
        // console.error('Error al cargar elementos de la papelera:', error)
        this.showFlashMessage('Error al cargar elementos de la papelera', 'error')
        this.loadingIndicator.classList.add('hidden')
      })
  },

  /**
   * Renderizar archivos en la papelera
   */
  renderFiles: function (files) {
    this.filesGrid.innerHTML = ''

    files.forEach(file => {
      const fileItem = document.createElement('div')
      fileItem.className = 'trash-item'

      const fileName = document.createElement('div')
      fileName.className = 'font-medium mb-2 truncate'
      fileName.textContent = file.original_name || file.name

      const fileInfo = document.createElement('div')
      fileInfo.className = 'text-sm text-neutral-500 dark:text-neutral-400 mb-3'

      // Formatear la fecha si está disponible
      let deletedDate = 'Desconocido'
      if (file.deleted_at) {
        try {
          const date = new Date(file.deleted_at)
          deletedDate = date.toLocaleString()
        } catch (e) {
          // console.error('Error al formatear fecha:', e)
          deletedDate = file.deleted_at
        }
      }

      fileInfo.textContent = `Eliminado: ${deletedDate}`

      const actions = document.createElement('div')
      actions.className = 'flex justify-end mt-auto space-x-2'

      const restoreBtn = document.createElement('button')
      restoreBtn.className = 'bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition'
      restoreBtn.textContent = 'Restaurar'
      restoreBtn.addEventListener('click', () => this.restoreFile(file.name))

      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition'
      deleteBtn.textContent = 'Eliminar'
      deleteBtn.addEventListener('click', () => this.permanentlyDeleteFile(file.name))

      actions.appendChild(restoreBtn)
      actions.appendChild(deleteBtn)

      fileItem.appendChild(fileName)
      fileItem.appendChild(fileInfo)
      fileItem.appendChild(actions)

      this.filesGrid.appendChild(fileItem)
    })
  },

  /**
   * Obtener el nombre de la colección a partir de la URL del navegador
   * @returns {string} - Nombre de la colección
   */
  getCollectionFromUrl: function() {
    try {
      // Obtener la URL del navegador y eliminar cualquier parámetro o hash
      const pathname = window.location.pathname.split('?')[0].split('#')[0];
      
      // Dividir por '/' y filtrar elementos vacíos
      const pathSegments = pathname.split('/').filter(segment => segment.trim() !== '');
      
      // Buscar el patrón '/collections/{nombre-coleccion}/' en la URL
      const collectionsIndex = pathSegments.indexOf('collections');
      if (collectionsIndex !== -1 && collectionsIndex + 1 < pathSegments.length) {
        // El segmento después de 'collections' es el nombre de la colección
        return pathSegments[collectionsIndex + 1];
      }
      
      // Si el último segmento tiene extensión de archivo (como .php), tomar el penúltimo
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment && lastSegment.includes('.')) {
        // Probablemente es un archivo, intentar con el penúltimo segmento si existe
        if (pathSegments.length > 1) {
          return pathSegments[pathSegments.length - 2];
        }
      } else if (pathSegments.length > 0) {
        // Si el último segmento no tiene extensión, es probablemente un directorio
        return lastSegment;
      }
      
      // Intentar obtener desde cualquier elemento de datos
      const pageData = document.querySelector('[data-collection]');
      if (pageData && pageData.dataset.collection) {
        return pageData.dataset.collection;
      }
    } catch (error) {
      console.error('Error al obtener la colección de la URL:', error);
    }
    
    // Si todo falla, intentar con window.currentCollection
    return window.currentCollection || 'blog'; // Usamos 'blog' como fallback en lugar de 'default'
  },

  /**
   * Corregir una URL para que incluya la ruta correcta a la colección
   * @param {string} url - URL a corregir
   * @returns {string} - URL corregida
   */
  normalizeUrl: function(url) {
    if (!url) return url;
    
    // 1. Obtener el nombre de la colección de la URL del navegador
    const collection = this.getCollectionFromUrl();
    
    // 2. Comprobar si la URL ya está formada correctamente
    if (url.includes(`/collections/${collection}/recycle/images/`)) {
      return url; // Ya tiene la ruta correcta
    }
    
    // 3. Reemplazar la ruta incorrecta con la correcta
    if (url.includes('/recycle/images/')) {
      // Obtener la parte relevante de la ruta (después de '/recycle/images/')
      const relevantPath = url.split('/recycle/images/')[1] || '';
      // Reconstruir la URL con la colección correcta
      url = `/content/collections/${collection}/recycle/images/${relevantPath}`;
    }
    
    // 4. Limpiar posibles barras dobles
    url = url.replace(/([^:])\/{2,}/g, '$1/');
    
    return url;
  },

  /**
   * Renderizar imágenes en la papelera
   */
  renderImages: function (images) {
    this.imagesGrid.innerHTML = ''

    images.forEach(image => {
      const imageItem = document.createElement('div')
      imageItem.className = 'trash-image'

      const imagePreview = document.createElement('div')
      imagePreview.className = 'h-32 bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center overflow-hidden'

      // Si la imagen tiene una URL de vista previa, normalizarla
      if (image.preview_url) {
        const img = document.createElement('img')
        // Normalizar la URL antes de asignarla
        img.src = this.normalizeUrl(image.preview_url)
        img.className = 'max-h-full max-w-full object-contain'
        img.onerror = function () {
          // Si la imagen no se puede cargar, mostrar un icono genérico
          imagePreview.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          `
        }
        imagePreview.appendChild(img)
      } else {
        // Icono de imagen genérico
        imagePreview.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        `
      }

      const imageInfo = document.createElement('div')
      imageInfo.className = 'p-3'

      const imageName = document.createElement('div')
      imageName.className = 'font-medium truncate'
      imageName.textContent = image.original_name || image.name

      // Si hay una ruta, mostrarla (normalizarla antes)
      let normalizedPath = '';
      if (image.path) {
        // Normalizar la ruta antes de mostrarla
        normalizedPath = this.normalizeUrl(image.path);
        const imagePath = document.createElement('div')
        imagePath.className = 'text-xs text-neutral-400 dark:text-neutral-500 mt-1 truncate'
        imagePath.textContent = `Ruta: ${normalizedPath}`
        imageInfo.appendChild(imagePath)
      }

      // Formatear la fecha si está disponible
      let deletedDate = 'Desconocido'
      if (image.deleted_at) {
        try {
          const date = new Date(image.deleted_at)
          deletedDate = date.toLocaleString()
        } catch (e) {
          // console.error('Error al formatear fecha:', e)
          deletedDate = image.deleted_at
        }
      }

      const imageDate = document.createElement('div')
      imageDate.className = 'text-xs text-neutral-500 dark:text-neutral-400 mt-1'
      imageDate.textContent = `Eliminado: ${deletedDate}`

      const actions = document.createElement('div')
      actions.className = 'flex justify-between mt-2 space-x-2'

      const restoreBtn = document.createElement('button')
      restoreBtn.className = 'bg-green-500 text-white px-2 py-1 rounded text-xs flex-1 hover:bg-green-600 transition'
      restoreBtn.textContent = 'Restaurar'
      // Usar la ruta normalizada para restaurar
      restoreBtn.addEventListener('click', () => this.restoreImage(image.name, normalizedPath || ''))

      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'bg-red-500 text-white px-2 py-1 rounded text-xs flex-1 hover:bg-red-600 transition'
      deleteBtn.textContent = 'Eliminar'
      // Usar la ruta normalizada para la eliminación permanente
      deleteBtn.addEventListener('click', () => this.permanentlyDeleteImage(image.name, normalizedPath || ''))

      actions.appendChild(restoreBtn)
      actions.appendChild(deleteBtn)

      imageInfo.appendChild(imageName)
      imageInfo.appendChild(imageDate)
      imageInfo.appendChild(actions)

      imageItem.appendChild(imagePreview)
      imageItem.appendChild(imageInfo)

      this.imagesGrid.appendChild(imageItem)
    })
  },

  /**
   * Restaurar un archivo desde la papelera
   */
  restoreFile: function (filename) {
    if (!confirm(`¿Estás seguro de que deseas restaurar "${filename}"?`)) {
      return
    }

    // Mostrar indicador de carga
    this.loadingIndicator.classList.remove('hidden')
    this.filesGrid.classList.add('hidden')

    // Obtener la colección actual
    const collection = window.currentCollection || ''

    // Enviar solicitud para restaurar
    fetch(window.getApiUrl('?action=restore'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `filename=${encodeURIComponent(filename)}&collection=${encodeURIComponent(collection)}`
    })
      .then(response => response.json())
      .then(data => {
        // Ocultar indicador de carga
        this.loadingIndicator.classList.add('hidden')
        this.filesGrid.classList.remove('hidden')

        if (data.success) {
          // Recargar lista
          this.loadRecycleBinItems()
          this.showFlashMessage(`Archivo "${filename}" restaurado correctamente`, 'success')
        } else {
          // console.error('Error al restaurar archivo:', data.message || data.error)
          this.showFlashMessage('Error al restaurar archivo: ' + (data.message || data.error), 'error')
        }
      })
      .catch(error => {
        // console.error('Error al restaurar archivo:', error)
        this.showFlashMessage('Error al restaurar archivo', 'error')
        this.loadingIndicator.classList.add('hidden')
        this.filesGrid.classList.remove('hidden')
      })
  },

  /**
   * Eliminar permanentemente un archivo de la papelera
   */
  permanentlyDeleteFile: function (filename) {
    if (!confirm(`¿Estás seguro de que deseas eliminar PERMANENTEMENTE "${filename}"? Esta acción no se puede deshacer.`)) {
      return
    }

    // Mostrar indicador de carga
    this.loadingIndicator.classList.remove('hidden')
    this.filesGrid.classList.add('hidden')

    // Enviar solicitud para eliminar permanentemente
    fetch(window.getApiUrl('?action=permanentdelete'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `filename=${encodeURIComponent(filename)}`
    })
      .then(response => response.json())
      .then(data => {
        // Ocultar indicador de carga
        this.loadingIndicator.classList.add('hidden')
        this.filesGrid.classList.remove('hidden')

        if (data.success) {
          // Recargar lista
          this.loadRecycleBinItems()
          this.showFlashMessage(`Archivo "${filename}" eliminado permanentemente`, 'success')
        } else {
          // console.error('Error al eliminar archivo:', data.message || data.error)
          this.showFlashMessage('Error al eliminar archivo: ' + (data.message || data.error), 'error')
        }
      })
      .catch(error => {
        // console.error('Error al eliminar archivo:', error)
        this.showFlashMessage('Error al eliminar archivo', 'error')
        this.loadingIndicator.classList.add('hidden')
        this.filesGrid.classList.remove('hidden')
      })
  },

  /**
   * Restaurar una imagen desde la papelera
   */
  restoreImage: function (imageName, path = '') {
    if (!confirm(`¿Estás seguro de que deseas restaurar "${imageName}"?`)) {
      return
    }

    // Mostrar indicador de carga
    this.loadingIndicator.classList.remove('hidden')
    this.imagesGrid.classList.add('hidden')

    // Obtener la colección actual
    const collection = window.currentCollection || ''

    // Enviar solicitud para restaurar
    fetch(window.getApiUrl('?action=restoreimage'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `imagename=${encodeURIComponent(imageName)}&collection=${encodeURIComponent(collection)}&path=${encodeURIComponent(path)}`
    })
      .then(response => response.json())
      .then(data => {
        // Ocultar indicador de carga
        this.loadingIndicator.classList.add('hidden')
        this.imagesGrid.classList.remove('hidden')

        if (data.success) {
          // Recargar lista
          this.loadRecycleBinItems()
          this.showFlashMessage(`Imagen "${imageName}" restaurada correctamente`, 'success')
        } else {
          // console.error('Error al restaurar imagen:', data.message || data.error)
          this.showFlashMessage('Error al restaurar imagen: ' + (data.message || data.error), 'error')
        }
      })
      .catch(error => {
        // console.error('Error al restaurar imagen:', error)
        this.showFlashMessage('Error al restaurar imagen', 'error')
        this.loadingIndicator.classList.add('hidden')
        this.imagesGrid.classList.remove('hidden')
      })
  },

  /**
   * Eliminar permanentemente una imagen de la papelera
   */
  permanentlyDeleteImage: function (imageName, path = '') {
    if (!confirm(`¿Estás seguro de que deseas eliminar PERMANENTEMENTE "${imageName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    // Mostrar indicador de carga
    this.loadingIndicator.classList.remove('hidden')
    this.imagesGrid.classList.add('hidden')

    // Obtener la colección actual
    const collection = window.currentCollection || ''

    // Enviar solicitud para eliminar permanentemente
    fetch(window.getApiUrl('?action=permanentdeleteimage'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `imagename=${encodeURIComponent(imageName)}&collection=${encodeURIComponent(collection)}&path=${encodeURIComponent(path)}`
    })
      .then(response => response.json())
      .then(data => {
        // Ocultar indicador de carga
        this.loadingIndicator.classList.add('hidden')
        this.imagesGrid.classList.remove('hidden')

        if (data.success) {
          // Recargar lista
          this.loadRecycleBinItems()
          this.showFlashMessage(`Imagen "${imageName}" eliminada permanentemente`, 'success')
        } else {
          // console.error('Error al eliminar imagen:', data.message || data.error)
          this.showFlashMessage('Error al eliminar imagen: ' + (data.message || data.error), 'error')
        }
      })
      .catch(error => {
        // console.error('Error al eliminar imagen:', error)
        this.showFlashMessage('Error al eliminar imagen', 'error')
        this.loadingIndicator.classList.add('hidden')
        this.imagesGrid.classList.remove('hidden')
      })
  },

  /**
   * Confirmar y vaciar la papelera de reciclaje
   */
  confirmEmptyRecycleBin: function () {
    // Evitar múltiples confirmaciones simultáneas
    if (this.isConfirmingEmpty) {
      return
    }

    this.isConfirmingEmpty = true

    try {
      // Determinar si estamos en la pestaña de archivos o imágenes
      const currentTabText = this.currentTab === 'files' ? 'archivos' : 'imágenes'

      // Opciones para el usuario
      const options = [
        `Vaciar solo ${currentTabText}`,
        'Vaciar toda la papelera (archivos e imágenes)',
        'Cancelar'
      ]

      const userChoice = confirm(`¿Deseas vaciar toda la papelera de reciclaje (archivos e imágenes)?\n\n- Presiona "Aceptar" para vaciar TODA la papelera\n- Presiona "Cancelar" para vaciar solo ${currentTabText}`)

      // Si el usuario cancela completamente
      if (userChoice === null) {
        return
      }

      // Determinar qué vaciar basado en la elección del usuario
      const type = userChoice ? 'all' : this.currentTab
      const typeText = type === 'all' ? 'toda la papelera' : (type === 'files' ? 'archivos' : 'imágenes')

      // Confirmar la acción con una advertencia clara
      if (!confirm(`ADVERTENCIA: ¿Estás seguro de que deseas vaciar ${typeText}?\n\nEsta acción eliminará PERMANENTEMENTE todos los elementos y NO SE PUEDE DESHACER.`)) {
        return
      }

      // Mostrar indicador de carga
      this.loadingIndicator.classList.remove('hidden')
      this.filesGrid.classList.add('hidden')
      this.imagesGrid.classList.add('hidden')

      // Obtener la colección actual
      const collection = window.currentCollection || ''

      // Enviar solicitud para vaciar la papelera
      fetch(window.getApiUrl('?action=emptyrecyclebin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `type=${encodeURIComponent(type)}&collection=${encodeURIComponent(collection)}`
      })
        .then(response => response.json())
        .then(data => {
          // Ocultar indicador de carga
          this.loadingIndicator.classList.add('hidden')
          this.filesGrid.classList.remove('hidden')
          this.imagesGrid.classList.remove('hidden')

          if (data.success) {
            // Actualizar la interfaz
            if (type === 'all' || type === 'files') {
              this.filesGrid.innerHTML = '<div class="col-span-full text-center py-4 text-neutral-500 dark:text-neutral-400">No hay archivos en la papelera</div>'
            }

            if (type === 'all' || type === 'images') {
              this.imagesGrid.innerHTML = '<div class="col-span-full text-center py-4 text-neutral-500 dark:text-neutral-400">No hay imágenes en la papelera</div>'
            }

            // Actualizar contador
            this.itemCount.textContent = '0 items'

            // Mostrar mensaje de éxito
            this.showFlashMessage(`${typeText} vaciada correctamente`, 'success')

            // Si vaciamos todo, actualizar ambas pestañas
            if (type === 'all') {
              this.switchTab(this.currentTab) // Recargar la pestaña actual
            }
          } else {
            // console.error(`Error al vaciar ${typeText}:`, data.message || data.error)
            this.showFlashMessage(`Error al vaciar ${typeText}: ${data.message || data.error}`, 'error')
          }
        })
        .catch(error => {
          // console.error(`Error al vaciar ${typeText}:`, error)
          this.showFlashMessage(`Error al vaciar ${typeText}`, 'error')
          this.loadingIndicator.classList.add('hidden')
          this.filesGrid.classList.remove('hidden')
          this.imagesGrid.classList.remove('hidden')
        })
        .finally(() => {
          // Restablecer la variable de bloqueo
          this.isConfirmingEmpty = false
        })
    } catch (error) {
      // console.error('Error en confirmEmptyRecycleBin:', error)
      this.isConfirmingEmpty = false
    }
  },

  /**
   * Mostrar mensaje flash
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de mensaje (success, error, warning, info)
   */
  showFlashMessage: function (message, type = 'info') {
    // Verificar si ya existe un mensaje flash
    let flashMessage = document.querySelector('.flash-message')

    // Si no existe, crearlo
    if (!flashMessage) {
      flashMessage = document.createElement('div')
      flashMessage.className = 'flash-message'
      document.body.appendChild(flashMessage)
    } else {
      // Si existe, asegurarse de que solo tenga la clase .flash-message
      flashMessage.className = 'flash-message'
    }

    // Establecer el tipo de mensaje con clases de color apropiadas
    switch (type) {
      case 'success':
        flashMessage.classList.add('bg-green-500', 'text-white')
        break
      case 'error':
        flashMessage.classList.add('bg-red-500', 'text-white')
        break
      case 'warning':
        flashMessage.classList.add('bg-yellow-500', 'text-white')
        break
      default:
        flashMessage.classList.add('bg-blue-500', 'text-white')
    }

    // Establecer el mensaje
    flashMessage.textContent = message

    // Mostrar el mensaje
    setTimeout(() => {
      flashMessage.classList.add('active')
    }, 10)

    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      flashMessage.classList.remove('active')
    }, 3000)
  }
}

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  // console.log('Auto-inicializando RecycleBinManager desde el propio módulo...')
  RecycleBinManager.init()
})

// Asegurarse de que el módulo esté disponible globalmente para depuración
if (typeof window !== 'undefined') {
  window.RecycleBinManager = RecycleBinManager
}
