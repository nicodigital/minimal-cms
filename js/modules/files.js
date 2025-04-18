/**
 * File Manager
 *
 * Maneja la funcionalidad de archivos en el CMS: listar, cargar, guardar, eliminar
 */
import { FieldManager } from './fields.js'

export const FileManager = {
  // Path configuration
  paths: {
    root: window.PATHS ? window.PATHS.ROOT : '/',
    cms: window.PATHS ? window.PATHS.CMS : '/content/',
    media: window.PATHS ? window.PATHS.MEDIA : '../../../public/img'
  },
  currentFile: '',
  mdList: null,
  saveBtn: null,
  currentFileEl: null,
  createNewBtn: null,
  formCreate: null,
  inputCreate: null,
  saveNewBtn: null,
  cancelNewBtn: null,
  mainImagePath: '',
  customFieldsVisibilityState: null,

  init: function () {
    // Inicializar elementos del DOM
    this.mdList = document.querySelector('.md-list')
    this.saveBtn = document.querySelector('.save-file')
    this.currentFileEl = document.querySelector('.current-file')
    this.createNewBtn = document.querySelector('.create-new')
    this.formCreate = document.querySelector('.form-create')
    this.inputCreate = document.querySelector('.create')
    this.saveNewBtn = document.querySelector('.save-new')
    this.cancelNewBtn = document.querySelector('.cancel-new')

    // Verificar que los elementos existan
    if (!this.mdList) {
      // console.warn('File list element not found')
      return
    }

    // Configurar eventos
    this.setupEventListeners()

    // Cargar lista de archivos inicialmente
    this.loadFileList()
    
    // Verificar si hay un parámetro 'file' en la URL
    this.checkUrlForFileParameter()

    // console.log('File manager initialized')
  },

  // Configurar event listeners
  setupEventListeners: function () {
    const self = this

    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.saveFile())
    }

    if (this.createNewBtn) {
      this.createNewBtn.addEventListener('click', () => this.showCreateForm())
    }

    if (this.cancelNewBtn) {
      this.cancelNewBtn.addEventListener('click', () => this.hideCreateForm())
    }

    if (this.saveNewBtn && this.inputCreate) {
      this.saveNewBtn.addEventListener('click', () => this.createNewFile())
    }

    // Manejar eventos de teclado globales
    document.addEventListener('keydown', (e) => {
      // Ctrl+S o Cmd+S para guardar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (this.currentFile && this.saveBtn && !this.saveBtn.disabled) {
          this.saveFile()
        }
      }
      
      // Ctrl+R o Cmd+R para guardar (alternativa)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        if (this.currentFile && this.saveBtn && !this.saveBtn.disabled) {
          this.saveFile()
          return false // Prevenir cualquier acción adicional del navegador
        }
      }
    })

    // Escuchar el evento mainImageSelected para guardar la ruta de la imagen principal
    document.addEventListener('mainImageSelected', (e) => {
      // console.log('FileManager: Evento mainImageSelected recibido', e.detail)
      if (e.detail && e.detail.path) {
        this.mainImagePath = e.detail.path
        // console.log('FileManager: mainImagePath actualizado a', this.mainImagePath)
      }
    })
  },

  // Mostrar formulario de creación
  showCreateForm: function () {
    if (this.formCreate) {
      this.formCreate.classList.remove('hidden')
      this.createNewBtn.classList.add('hidden')
    }
  },

  // Ocultar formulario de creación
  hideCreateForm: function () {
    if (this.formCreate) {
      this.formCreate.classList.add('hidden')
      this.createNewBtn.classList.remove('hidden')
      if (this.inputCreate) {
        this.inputCreate.value = ''
      }
    }
  },

  // Cargar lista de archivos
  loadFileList: function () {
    if (!this.mdList) return

    // Usar la función getApiUrl que maneja correctamente la colección
    const url = window.getApiUrl ? window.getApiUrl('?action=list') : 'process.php?action=list'

    // console.log('Loading file list from URL:', url)

    fetch(url, {
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(response => response.json())
      .then(files => {
        if (files.length === 0) {
          this.mdList.innerHTML = '<li class="py-2 text-gray-400 dark:text-neutral-800 italic">No markdown files found</li>'
          return
        }

        // Crear un fragmento para minimizar reflows
        const fragment = document.createDocumentFragment()

        // Crear una función de manejador de eventos reutilizable
        const handleFileClick = (file) => (e) => {
          // Solo cargar el archivo si no se hizo clic en el botón de eliminar
          if (!e.target.closest('.delete-file')) {
            this.loadFile(file)
          }
        }

        const handleDeleteClick = (file) => (e) => {
          e.stopPropagation()
          this.deleteFile(file)
        }

        files.forEach(file => {
          const li = document.createElement('li')
          li.className = 'file-item'
          li.dataset.filename = file.toLowerCase()
          li.dataset.searchableFilename = this.normalizeSearchString(file)

          // Usar textContent en lugar de innerHTML donde sea posible
          const fileNameSpan = document.createElement('span')
          fileNameSpan.className = 'file-name flex-grow'
          fileNameSpan.textContent = file

          const deleteButton = document.createElement('button')
          deleteButton.className = 'delete-file text-red-500 hover:text-red-700 dark:hover:text-red-400'
          deleteButton.dataset.file = file
          deleteButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          `

          // Añadir los elementos al li
          li.appendChild(fileNameSpan)
          li.appendChild(deleteButton)

          // Añadir un solo event listener al elemento li
          li.addEventListener('click', handleFileClick(file))

          // Añadir event listener al botón de eliminar
          deleteButton.addEventListener('click', handleDeleteClick(file))

          // Añadir al fragmento en lugar de directamente al DOM
          fragment.appendChild(li)
        })

        // Limpiar la lista antes de añadir los nuevos elementos
        this.mdList.innerHTML = ''

        // Añadir todos los elementos al DOM de una sola vez
        this.mdList.appendChild(fragment)
      })
      .catch(error => {
        console.error('Error loading file list:', error)
        this.mdList.innerHTML = '<li class="py-2 text-red-500">Error loading files</li>'
      })
  },

  // Normalizar string para búsqueda
  normalizeSearchString: function (str) {
    return str
      .toLowerCase()
      .replace(/[-_.]/g, ' ') // Reemplazar guiones, guiones bajos y puntos con espacios
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
      .trim()
  },

  // Cargar contenido de archivo
  loadFile: function (filename) {
    // console.log('Cargando archivo:', filename)
    this.currentFile = filename
    if (this.currentFileEl) {
      this.currentFileEl.textContent = filename
    }
    
    // Actualizar la URL con el parámetro file
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('file', filename);
    window.history.replaceState({}, '', currentUrl);

    // Actualizar la clase 'active' en la lista de archivos
    if (this.mdList) {
      // Remover la clase 'active' de todos los elementos
      const allItems = this.mdList.querySelectorAll('li')
      allItems.forEach(item => item.classList.remove('active'))

      // Añadir la clase 'active' al elemento seleccionado
      const selectedItem = this.mdList.querySelector(`li[data-filename="${filename.toLowerCase()}"]`)
      if (selectedItem) {
        selectedItem.classList.add('active')
      }
    }

    // Añadir un parámetro para evitar caché
    const cacheBuster = new Date().getTime()

    // Ocultar temporalmente los campos personalizados para evitar parpadeo
    this.hideCustomFieldsTemporarily()

    // Limpiar la variable de imagen principal
    this.mainImagePath = ''

    // Limpieza radical de campos personalizados (sin actualizar la UI todavía)
    this.radicalCleanupOfCustomFields(true)

    // Obtener la colección actual
    const collection = window.currentCollection || ''

    // Realizar la solicitud para cargar el archivo
    const apiUrl = window.API_BASE_PATH || 'api.php'
    const url = `${apiUrl}?action=read&file=${encodeURIComponent(filename)}&t=${cacheBuster}&collection=${encodeURIComponent(collection)}`

    // console.log('Loading file from URL:', url)

    fetch(url, {
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(response => response.text())
      .then(content => {
        if (window.editor) {
          window.editor.value(content)
          window.editor.codemirror.setOption('readOnly', false)
        }

        if (this.saveBtn) {
          this.saveBtn.disabled = false
        }

        // Extraer campos personalizados del contenido
        FieldManager.extractCustomFields(content)

        // Extraer la imagen principal del frontmatter
        this.extractMainImage(content)

        // Actualizar los campos con los nuevos valores antes de mostrarlos
        this.forceUpdateCustomFields()

        // Mostrar los campos personalizados nuevamente con los valores actualizados
        this.showCustomFieldsAgain()

        // Disparar evento de archivo cargado
        document.dispatchEvent(new CustomEvent('fileLoaded', {
          detail: {
            filename,
            content
          }
        }))
      })
      .catch(error => {
        console.error('Error loading file:', error)
        // Asegurarse de mostrar los campos incluso si hay un error
        this.showCustomFieldsAgain()
      })
  },

  // Extraer la imagen principal del frontmatter
  extractMainImage: function (content) {
    // console.log('Extrayendo imagen principal del frontmatter')

    // Extraer front matter
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
    const match = content.match(frontMatterRegex)

    if (match && match[1]) {
      const frontMatter = match[1]

      // Buscar el campo main_img en el frontmatter
      const mainImgRegex = /main_img\s*:\s*["']?([^"'\n]+)["']?/
      const mainImgMatch = frontMatter.match(mainImgRegex)

      if (mainImgMatch && mainImgMatch[1]) {
        const mainImgPath = mainImgMatch[1]
        // console.log('Imagen principal encontrada en frontmatter:', mainImgPath)

        // Actualizar la variable mainImagePath
        this.mainImagePath = mainImgPath

        // Actualizar el input oculto
        const mainImageInput = document.getElementById('main-image-path')
        if (mainImageInput) {
          mainImageInput.value = mainImgPath
        }

        // Actualizar la vista previa
        const mainImagePreview = document.getElementById('main-image-preview')
        const mainImagePlaceholder = document.getElementById('main-image-placeholder')
        const mainImageStatus = document.querySelector('.main-image-status')

        if (mainImagePreview && mainImagePlaceholder) {
          // Construir la ruta completa para la vista previa
          const fullPath = mainImgPath.startsWith('/')
            ? `../../../public${mainImgPath}`
            : `../../../public/${mainImgPath}`

          // Establecer la ruta y forzar la carga de la imagen
          mainImagePreview.src = fullPath

          // Mostrar la imagen y ocultar el placeholder
          mainImagePreview.classList.remove('hidden')
          mainImagePlaceholder.classList.add('hidden')

          if (mainImageStatus) {
            mainImageStatus.textContent = 'Image selected'
          }

          // console.log('Vista previa de imagen principal actualizada:', fullPath)
        } else {
          // console.warn('No se encontraron los elementos de vista previa de la imagen principal')
        }

        // Disparar evento de imagen principal cargada
        document.dispatchEvent(new CustomEvent('mainImageLoaded', {
          detail: {
            path: mainImgPath
          }
        }))
      } else {
        // console.log('No se encontró imagen principal en el frontmatter')
        this.clearMainImagePreview()
      }
    } else {
      // console.log('No se encontró frontmatter en el contenido')
      this.clearMainImagePreview()
    }
  },

  // Limpiar la vista previa de la imagen principal
  clearMainImagePreview: function () {
    // console.log('Limpiando vista previa de imagen principal')

    // Limpiar la variable mainImagePath
    this.mainImagePath = ''

    // Limpiar el input oculto
    const mainImageInput = document.getElementById('main-image-path')
    if (mainImageInput) {
      mainImageInput.value = ''
    }

    // Limpiar la vista previa
    const mainImagePreview = document.getElementById('main-image-preview')
    const mainImagePlaceholder = document.getElementById('main-image-placeholder')
    const mainImageStatus = document.querySelector('.main-image-status')

    if (mainImagePreview && mainImagePlaceholder) {
      mainImagePreview.src = ''
      mainImagePreview.classList.add('hidden')
      mainImagePlaceholder.classList.remove('hidden')

      if (mainImageStatus) {
        mainImageStatus.textContent = 'No image selected'
      }

      // console.log('Vista previa de imagen principal limpiada')
    } else {
      // console.warn('No se encontraron los elementos de vista previa de la imagen principal')
    }
  },

  // Guardar archivo
  saveFile: function () {
    if (!this.currentFile) return

    // Mostrar indicador de carga
    const saveIndicator = document.createElement('div')
    saveIndicator.className = 'fixed top-0 left-0 w-full h-1 bg-green-500 animate-pulse z-50'
    document.body.appendChild(saveIndicator)

    // Obtener contenido del editor
    let content = ''
    if (window.editor) {
      content = window.editor.value()
    }

    // Obtener valores de campos personalizados
    const fieldValues = FieldManager.collectCustomFieldValues()
    // console.log('Custom field values collected for saving:', fieldValues)

    // Obtener el valor del campo main_img desde el input oculto
    const mainImageInput = document.getElementById('main-image-path')
    if (mainImageInput && mainImageInput.value) {
      let imagePath = mainImageInput.value
      // Asegurarse que el path comience con barra
      if (imagePath && !imagePath.startsWith('/')) {
        imagePath = '/' + imagePath
      }
      this.mainImagePath = imagePath
    }

    // console.log('Main image path for saving:', this.mainImagePath)

    // Actualizar front matter con campos personalizados
    let updatedContent = content

    // Extraer front matter existente
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
    const match = content.match(frontMatterRegex)

    let newFrontMatter = '---\n'

    // Añadir campos personalizados
    for (const [name, value] of Object.entries(fieldValues)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Para arrays (como tags), formatear correctamente
          const arrayStr = value.map(item => {
            // Si el item es un string, añadir comillas
            return typeof item === 'string' ? `"${item}"` : item
          }).join(', ')
          newFrontMatter += `${name}: [${arrayStr}]\n`
        } else if (typeof value === 'object') {
          // Para otros objetos, convertir a JSON string
          newFrontMatter += `${name}: ${JSON.stringify(value)}\n`
        } else {
          // Para valores simples
          // Obtener el tipo de campo
          const fieldConfig = document.querySelector(`[name="${name}"]`)
          const fieldType = fieldConfig ? fieldConfig.getAttribute('data-type') : null

          let formattedValue = value
          if (typeof value === 'string') {
            // Quitar comillas existentes primero
            formattedValue = value.trim().replace(/^"|"$/g, '')

            // Obtener el tipo de campo desde window.fieldTypes o usar el tipo detectado
            const realFieldType = window.fieldTypes && window.fieldTypes[name] ? window.fieldTypes[name] : fieldType;
            // // console.log(`Formateando campo ${name} como tipo: ${realFieldType}`);
            
            // Formatear según el tipo de campo
            switch (realFieldType) {
              case 'select':
              case 'date':
                formattedValue = `"${formattedValue}"`
                break
              case 'textarea':
                // ENFOQUE SIMPLIFICADO: Dejar que PHP maneje el formato YAML
                // // console.log('Procesando textarea:', name);
                // // console.log('Valor original:', JSON.stringify(formattedValue));
                // // console.log('Contiene saltos de línea:', formattedValue.includes('\n'));
                // // console.log('Número de líneas:', formattedValue.split('\n').length);
                
                if (formattedValue.includes('\n')) {
                  // Detectar patrones de texto para usar diferentes separadores
                  const lines = formattedValue.split('\n');
                  let result = '';
                  let currentLineIndex = 0;
                  
                  while (currentLineIndex < lines.length) {
                    // Añadir la línea actual
                    result += lines[currentLineIndex];
                    
                    // Verificar si hay más líneas
                    if (currentLineIndex < lines.length - 1) {
                      // Verificar si la siguiente línea está vacía (indica nuevo párrafo)
                      if (currentLineIndex + 1 < lines.length && lines[currentLineIndex + 1].trim() === '') {
                        // Nuevo párrafo (doble pipe)
                        result += ' || ';
                        // Saltar la línea vacía
                        currentLineIndex += 2;
                      } else {
                        // Simple salto de línea (un pipe)
                        result += ' | ';
                        currentLineIndex++;
                      }
                    } else {
                      // Última línea
                      currentLineIndex++;
                    }
                  }
                  
                  // // console.log('Texto con separadores simplificados:', result);
                  
                  // Encerrar en comillas para formato YAML correcto
                  formattedValue = `"${result}"`;
                  
                  // Continuar con el proceso normal
                } else {
                  // Si es una sola línea, usar el formato normal con comillas
                  formattedValue = `"${formattedValue}"`;
                }
                break;
              default:
                // Para otros campos string que no son numéricos
                if (isNaN(formattedValue)) {
                  formattedValue = `"${formattedValue}"`
                }
            }
          }
          newFrontMatter += `${name}: ${formattedValue}\n`
        }
      }
    }

    // Añadir imagen principal si existe
    if (this.mainImagePath) {
      // Formatear el path para asegurar que tenga el formato correcto (comenzando con '/')
      let formattedPath = this.mainImagePath
      if (formattedPath && !formattedPath.startsWith('/')) {
        formattedPath = '/' + formattedPath
      }

      newFrontMatter += `main_img: "${formattedPath}"\n`
    }

    newFrontMatter += '---\n\n'

    // Reemplazar front matter existente o añadir uno nuevo
    if (match) {
      updatedContent = content.replace(frontMatterRegex, newFrontMatter)
    } else {
      updatedContent = newFrontMatter + content
    }

    // Disparar evento antes de guardar
    document.dispatchEvent(new CustomEvent('beforeFileSave', {
      detail: {
        filename: this.currentFile,
        content: updatedContent
      }
    }))

    // Guardar el archivo con el contenido actualizado
    this.saveFileToServer(updatedContent, saveIndicator)
  },

  // Método auxiliar para guardar el archivo en el servidor
  saveFileToServer: function (content, saveIndicator) {
    // Verificar que tenemos un nombre de archivo válido
    if (!this.currentFile) {
      console.error('Error: No filename specified!')
      alert('Error: No se ha especificado un nombre de archivo.')
      saveIndicator.remove()
      return
    }

    // console.log('Guardando archivo:', this.currentFile)

    // Detectar si hay imágenes base64 (no referencias markdown) y evaluar tamaño
    // Las imágenes base64 contienen 'data:image' seguido de 'base64'
    // Las imágenes en formato markdown tienen el formato: ![alt](url)
    const hasBase64Images = content.includes('data:image') && content.includes('base64')
    const contentLength = content.length

    // console.log('Tamaño del contenido:', contentLength, 'caracteres')
    // console.log('Contiene imágenes base64:', hasBase64Images ? 'Sí' : 'No')

    // Solo usamos XMLHttpRequest para imágenes base64 grandes, no para imágenes
    // referenciadas en formato markdown como ![alt](url)
    if (hasBase64Images && contentLength > 500000) {
      // console.log('Detectado contenido grande con imágenes base64. Usando XMLHttpRequest...')
      // console.log('Tamaño del contenido:', contentLength, 'caracteres')

      // Obtener la URL base
      const apiUrl = window.API_BASE_PATH || 'process.php'
      const collection = window.CURRENT_COLLECTION || ''

      // Construir URL con parámetros básicos
      const xhrUrl = `${apiUrl}?action=write&file=${encodeURIComponent(this.currentFile)}&collection=${encodeURIComponent(collection)}`
      // console.log('URL para XMLHttpRequest:', xhrUrl)

      // Crear y configurar el objeto XMLHttpRequest
      const xhr = new XMLHttpRequest()
      xhr.open('POST', xhrUrl, true)
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')

      // Manejar la respuesta
      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.success) {
            // console.log('Archivo guardado exitosamente via XMLHttpRequest')
            saveIndicator.remove()
            
            // Guardar el nombre del archivo actual
            const currentFileName = this.currentFile
            
            // Mostrar mensaje de éxito sin recargar la página
            this.showFlashMessage('Archivo guardado correctamente', 'success')
            
            // Disparar evento después de guardar (para que otros módulos puedan reaccionar)
            document.dispatchEvent(new CustomEvent('afterFileSave', {
              detail: {
                filename: currentFileName,
                success: true
              }
            }))
          } else {
            console.error('Error al guardar archivo:', response.message)
            alert('Error al guardar archivo: ' + response.message)
            saveIndicator.remove()
          }
        } catch (error) {
          console.error('Error al procesar respuesta:', error)
          alert('Error al guardar: ' + error.message)
          saveIndicator.remove()
        }
      }

      xhr.onerror = () => {
        console.error('Error de red al guardar archivo')
        alert('Error de red al guardar archivo. Por favor, intente nuevamente.')
        saveIndicator.remove()
      }

      // Enviar la petición con el contenido
      xhr.send('content=' + encodeURIComponent(content))
      return
    }

    // Para contenido normal, utilizamos fetch con URLSearchParams
    const params = new URLSearchParams()
    params.append('action', 'write')
    params.append('file', this.currentFile)
    params.append('content', content)

    // Obtener la URL base para fetch
    const apiUrl = window.API_BASE_PATH || 'process.php'
    const collection = window.CURRENT_COLLECTION || ''
    const url = `${apiUrl}?collection=${encodeURIComponent(collection)}`

    // console.log('URL para fetch:', url)
    // console.log('Tamaño del contenido:', contentLength, 'caracteres')

    // Opciones de fetch con URLSearchParams
    // CRÍTICO: Asegurarse de que params se convierta a string para el envío
    const fetchOptions = {
      method: 'POST',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: params.toString() // Convertir explícitamente a string.toString()
    }

    // console.log('Body enviado:', params.toString().substring(0, 150) + '...')
    // console.log('Fetch options:', JSON.stringify(fetchOptions, (key, value) => {
    //   // No mostrar el contenido del cuerpo de la solicitud en la consola
    //   if (key === 'body') return '[Request Body]'
    //   return value
    // }, 2))

    // Función para procesar respuestas del servidor
    const processResponse = (response, method) => {
      // Guardar la URL para diagnóstico
      const requestUrl = response.url

      // console.log(`Respuesta recibida (${method}) - Status:`, response.status, 'Status Text:', response.statusText)
      // console.log('URL completa de la solicitud:', requestUrl)
      // console.log('Encabezados de respuesta:', JSON.stringify(Object.fromEntries([...response.headers])))

      // Verificar si la respuesta es exitosa (código 200-299)
      if (!response.ok) {
        console.error(`Error HTTP (${method}):`, response.status, response.statusText)
        return response.text().then(text => {
          console.error(`Contenido de respuesta de error (${method}):`, text)
          throw new Error(`Error HTTP ${response.status}: ${text.substring(0, 150)}... (URL: ${requestUrl})`)
        })
      }

      // Intentar parsear como JSON
      return response.text().then(text => {
        // console.log(`Respuesta completa (${method}):`, text)
        try {
          return JSON.parse(text)
        } catch (e) {
          // console.error(`Error al parsear JSON (${method}):`, e)
          // console.log(`Respuesta recibida (${method}) (primeros 150 caracteres):`, text.substring(0, 150))
          throw new Error(`Respuesta no válida: ${text.substring(0, 150)}... (URL: ${requestUrl})`)
        }
      })
    }

    // Intentar primero con POST
    return fetch(url, fetchOptions)
      .then(response => processResponse(response, 'POST'))
      .catch(error => {
        // console.error('Error en método POST:', error)
        // console.log('Intentando método alternativo GET...')

        // Construir URL para método alternativo vía GET
        const getUrl = `${apiUrl}?action=write&file=${encodeURIComponent(this.currentFile)}&content=${encodeURIComponent(content)}&secure_write=true&collection=${encodeURIComponent(collection)}`

        // console.log('URL alternativa (truncada):', getUrl.substring(0, 150) + '...')

        // Opciones para solicitud GET
        const getOptions = {
          method: 'GET',
          credentials: 'include',
          mode: 'cors',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache'
          }
        }

        // Intentar con método GET
        return fetch(getUrl, getOptions)
          .then(response => processResponse(response, 'GET'))
      })
      .then(data => {
        if (data.success) {
          // Eliminar el indicador de carga
          saveIndicator.remove()

          // Guardar el nombre del archivo actual
          const currentFileName = this.currentFile

          // Mostrar mensaje de éxito sin recargar la página
          this.showFlashMessage('Archivo guardado correctamente', 'success')

          // Disparar evento después de guardar (para que otros módulos puedan reaccionar)
          document.dispatchEvent(new CustomEvent('afterFileSave', {
            detail: {
              filename: currentFileName,
              success: true
            }
          }))
        } else {
          // Mostrar mensaje de error
          alert('Error saving file: ' + (data.error || 'Unknown error'))

          // Eliminar el indicador de carga
          saveIndicator.remove()

          // Disparar evento de error
          document.dispatchEvent(new CustomEvent('fileSaveError', {
            detail: {
              filename: this.currentFile,
              error: data.error || 'Unknown error'
            }
          }))
        }
      })
      .catch(error => {
        console.error('Error saving file:', error)
        alert('Error saving file: ' + error.message)

        // Eliminar el indicador de carga
        saveIndicator.remove()

        // Disparar evento de error
        document.dispatchEvent(new CustomEvent('fileSaveError', {
          detail: {
            filename: this.currentFile,
            error: error.message
          }
        }))
      })
  },

  // Crear nuevo archivo
  createNewFile: function () {
    const filename = this.inputCreate ? this.inputCreate.value.trim() : ''

    if (!filename) {
      alert('Please enter a filename')
      return
    }

    // Añadir extensión .md si no está presente
    const newFilename = filename.endsWith('.md') ? filename : `${filename}.md`

    // Crear contenido inicial con la fecha actual en el frontmatter
    const today = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD

    // Obtener valores por defecto de los campos configurados
    const defaultValues = {}

    // Recorrer todos los campos personalizados para obtener sus valores por defecto
    const customFields = document.querySelectorAll('.custom-field')
    customFields.forEach(field => {
      const fieldName = field.dataset.fieldName
      const defaultValue = field.dataset.defaultValue

      // Si el campo tiene un valor por defecto configurado, guardarlo
      if (fieldName && defaultValue) {
        defaultValues[fieldName] = defaultValue
      }
    })

    // Establecer valores por defecto conocidos para campos específicos
    defaultValues.publish_date = today
    defaultValues.status = 'published'

    // Construir el frontmatter con todos los valores por defecto
    let frontMatter = '---\n'

    // Añadir cada valor por defecto al frontmatter
    for (const [name, value] of Object.entries(defaultValues)) {
      if (value !== undefined && value !== null && value !== '') {
        // Formatear correctamente según el tipo de valor
        if (typeof value === 'string') {
          frontMatter += `${name}: "${value}"\n`
        } else {
          frontMatter += `${name}: ${value}\n`
        }
      }
    }

    frontMatter += '---\n\n'

    const initialContent = frontMatter

    const apiUrl = window.API_BASE_PATH || 'api.php'
    const collection = window.CURRENT_COLLECTION || ''
    const url = `${apiUrl}?collection=${encodeURIComponent(collection)}`

    // console.log('Creating new file using URL:', url)

    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `action=create&file=${encodeURIComponent(newFilename)}&content=${encodeURIComponent(initialContent)}`
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.loadFileList()
          this.loadFile(newFilename)
          this.hideCreateForm()

          // Disparar evento de nuevo archivo creado
          document.dispatchEvent(new CustomEvent('newFileCreated', {
            detail: {
              filename: newFilename
            }
          }))
        } else {
          alert('Error creating file: ' + data.message)
        }
      })
      .catch(error => {
        console.error('Error creating file:', error)
        alert('Error creating file')
      })
  },

  // Eliminar archivo
  deleteFile: function (filename) {
    if (!confirm(`¿Estás seguro de que deseas mover "${filename}" a la papelera de reciclaje?`)) {
      return
    }

    const apiUrl = window.API_BASE_PATH || 'api.php'
    const collection = window.CURRENT_COLLECTION || ''
    const url = `${apiUrl}?collection=${encodeURIComponent(collection)}`

    // console.log('Deleting file using URL:', url)

    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `action=delete&filename=${encodeURIComponent(filename)}`
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Mostrar mensaje de éxito
          this.showFlashMessage('Archivo movido a la papelera de reciclaje', 'success')

          this.loadFileList()

          if (this.currentFile === filename) {
            this.currentFile = ''

            if (this.currentFileEl) {
              this.currentFileEl.textContent = 'Select a file'
            }

            if (window.editor) {
              window.editor.value('')
              window.editor.codemirror.setOption('readOnly', true)
            }

            if (this.saveBtn) {
              this.saveBtn.disabled = true
            }

            // Disparar evento de archivo eliminado
            document.dispatchEvent(new CustomEvent('fileDeleted', {
              detail: {
                filename
              }
            }))
          }
        } else {
          alert('Error al mover el archivo a la papelera: ' + data.message)
        }
      })
      .catch(error => {
        console.error('Error al mover el archivo a la papelera:', error)
        alert('Error al mover el archivo a la papelera')
      })
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
  },

  // Obtener el archivo actual
  getCurrentFile: function () {
    return this.currentFile
  },
  
  // Verificar si hay un parámetro 'file' en la URL y cargar el archivo si existe
  checkUrlForFileParameter: function() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');
    
    if (fileParam) {
      // Esperar a que la lista de archivos se cargue antes de intentar cargar el archivo
      setTimeout(() => {
        // Verificar si el archivo existe en la lista
        const fileItem = this.mdList.querySelector(`li[data-filename="${fileParam.toLowerCase()}"]`);
        if (fileItem) {
          this.loadFile(fileParam);
        }
      }, 500); // Esperar 500ms para asegurar que la lista de archivos está cargada
    }
  },

  // Método para ocultar temporalmente los campos personalizados
  hideCustomFieldsTemporarily: function () {
    // Guardar el estado actual de visibilidad de las secciones
    this.customFieldsVisibilityState = {
      leftFields: !document.querySelector('.custom-fields-section.left-fields')?.classList.contains('hidden'),
      rightFields: !document.querySelector('.custom-fields-section.right-fields')?.classList.contains('hidden'),
      mainFields: !document.querySelector('.custom-fields-section.main-fields')?.classList.contains('hidden')
    }

    // Ocultar todos los campos personalizados
    const allCustomFields = document.querySelectorAll('.custom-field')

    allCustomFields.forEach(field => {
      // Guardar el estado original de opacidad para restaurarlo después
      field.dataset.originalOpacity = field.style.opacity || '1'
      field.style.opacity = '0'
      field.style.transition = 'none' // Desactivar transiciones durante la carga
    })

    // console.log(`Ocultados temporalmente ${allCustomFields.length} campos personalizados`)
  },

  // Método para mostrar los campos personalizados nuevamente
  showCustomFieldsAgain: function () {
    // console.log('Mostrando campos personalizados nuevamente')

    // Forzar la visibilidad de las secciones de campos personalizados
    // Llamar directamente al método de FieldManager para mostrar los campos
    FieldManager.showCustomFields()

    // Mostrar todos los campos personalizados con una transición suave
    const allCustomFields = document.querySelectorAll('.custom-field')
    // console.log(`Encontrados ${allCustomFields.length} campos personalizados para mostrar`)

    if (allCustomFields.length === 0) {
      // console.warn('No se encontraron campos personalizados. Verificando secciones...')

      // Verificar si las secciones están presentes pero ocultas
      const sections = document.querySelectorAll('.custom-fields-section')
      // console.log(`Encontradas ${sections.length} secciones de campos personalizados`)

      sections.forEach(section => {
        if (section.classList.contains('hidden')) {
          // console.log(`Sección ${section.className} está oculta, mostrándola`)
          section.classList.remove('hidden')
        }
      })

      // Intentar buscar los campos nuevamente después de mostrar las secciones
      setTimeout(() => {
        const newCustomFields = document.querySelectorAll('.custom-field')
        // console.log(`Ahora se encontraron ${newCustomFields.length} campos personalizados`)
      }, 10)
    }

    // Pequeño retraso para asegurar que los valores se hayan actualizado
    setTimeout(() => {
      // Asegurarse de que las secciones estén visibles nuevamente
      FieldManager.showCustomFields()

      // Mostrar cada campo con una transición suave
      document.querySelectorAll('.custom-field').forEach(field => {
        field.style.transition = 'opacity 0.2s ease-in-out'
        field.style.opacity = '1'
        // console.log(`Campo ${field.dataset.fieldName} mostrado con opacidad 1`)
      })

      // Forzar la visibilidad de los campos
      document.querySelectorAll('.custom-fields-section').forEach(section => {
        section.classList.remove('hidden')
        section.style.display = 'block'
      })

      // console.log('Campos personalizados mostrados con transición suave')
    }, 50)
  },

  // Método para limpiar radicalmente todos los campos personalizados
  radicalCleanupOfCustomFields: function (silentMode = false) {
    // console.log('Limpieza radical de campos personalizados', silentMode ? '(modo silencioso)' : '')

    // Resetear valores en FieldManager
    FieldManager.customFieldValues = {}

    // Obtener todos los campos personalizados
    const allCustomFields = document.querySelectorAll('.custom-field')
    let cleanedFields = 0

    // Limpiar cada campo según su tipo
    allCustomFields.forEach(field => {
      const fieldName = field.dataset.fieldName
      if (!fieldName) return

      // Buscar elementos de entrada según el tipo de campo
      const inputs = field.querySelectorAll('input, textarea, select')
      const isGallery = field.querySelector('.gallery-data') !== null
      const isTags = field.querySelector('.tags-data') !== null

      if (isGallery) {
        // Limpiar campo de tipo galería
        const imagesContainer = field.querySelector('.gallery-images-container')
        const hiddenInput = field.querySelector('.gallery-data')

        if (imagesContainer) {
          imagesContainer.innerHTML = ''
        }

        if (hiddenInput) {
          hiddenInput.value = '[]'
        }
        cleanedFields++
      } else if (isTags) {
        // Limpiar campo de tipo tags
        const tagsList = field.querySelector('.tags-list')
        const tagsData = field.querySelector('.tags-data')

        if (tagsList) {
          tagsList.innerHTML = ''
        }

        if (tagsData) {
          tagsData.value = '[]'
        }
        cleanedFields++
      } else {
        // Limpiar campos estándar (input, textarea, select)
        inputs.forEach(input => {
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false
          } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0
            if (!silentMode) {
              input.dispatchEvent(new Event('change', { bubbles: true }))
            }
          } else {
            input.value = ''
            if (!silentMode) {
              input.dispatchEvent(new Event('input', { bubbles: true }))
            }
          }
          cleanedFields++
        })
      }
    })

    // console.log(`Limpiados ${cleanedFields} campos personalizados`)
  },

  // Método para forzar la actualización de campos personalizados
  forceUpdateCustomFields: function () {
    // Obtener todos los campos personalizados
    const allCustomFields = document.querySelectorAll('.custom-field')
    let updatedFields = 0

    // Actualizar cada campo según su tipo y valor en FieldManager.customFieldValues
    allCustomFields.forEach(field => {
      const fieldName = field.dataset.fieldName
      if (!fieldName) return

      const fieldValue = FieldManager.customFieldValues[fieldName]

      // Determinar el tipo de campo
      const isGallery = field.querySelector('.gallery-data') !== null
      const isTags = field.querySelector('.tags-data') !== null

      if (isGallery) {
        // Actualizar campo de tipo galería
        FieldManager.updateGalleryField(field, fieldValue || [])
        updatedFields++
      } else if (isTags) {
        // Actualizar campo de tipo tags
        FieldManager.updateTagsField(field, fieldValue || [])
        updatedFields++
      } else {
        // Actualizar campos estándar (input, textarea, select)
        const inputs = field.querySelectorAll('input, textarea, select')

        inputs.forEach(input => {
          if (input.type === 'checkbox') {
            input.checked = fieldValue === 'true' || fieldValue === true
          } else if (input.tagName === 'SELECT') {
            if (fieldValue) {
              input.value = fieldValue
            } else {
              input.selectedIndex = 0
            }
            input.dispatchEvent(new Event('change', { bubbles: true }))
          } else {
            input.value = fieldValue || ''
            input.dispatchEvent(new Event('input', { bubbles: true }))
          }
          updatedFields++
        })
      }
    })

    // console.log(`Actualizados ${updatedFields} campos personalizados`)
  }
}
