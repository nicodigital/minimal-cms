/**
 * CMS Application
 *
 * Archivo principal que inicializa todos los módulos del CMS
 */

// Importar módulos
import { ThemeManager } from './modules/theme.js'
import { EditorManager } from './modules/editor.js'
import { FileManager } from './modules/files.js'
import { TagsManager } from './modules/tags.js'
import { SearchManager } from './modules/search.js'
import { MediaManager } from './modules/media.js'
import { FieldManager } from './modules/fields.js'
import { mainImageManager } from './modules/mainImage.js'
import { RecycleBinManager } from './modules/recyclebin.js'

// Crear objeto global App
window.App = {
  FileManager,
  ThemeManager,
  EditorManager,
  TagsManager,
  SearchManager,
  MediaManager,
  FieldManager,
  mainImageManager,
  RecycleBinManager
}

// Exponer FileManager globalmente para compatibilidad
window.FileManager = FileManager

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
  // console.log('Initializing CMS application...')

  // Inicializar módulos
  initializeModules()

  // Configurar eventos globales
  setupGlobalEvents()

  // Verificar si hay un archivo especificado en la URL para cargarlo automáticamente
  checkUrlParams()

  // console.log('CMS application initialized')
})

/**
 * Inicializar todos los módulos del CMS
 */
function initializeModules () {
  // Inicializar gestor de temas
  ThemeManager.init()
  // console.log('Theme manager initialized')

  // Inicializar gestor de campos
  FieldManager.init()
  // console.log('Field manager initialized')

  // Inicializar editor
  EditorManager.init()
  // console.log('Editor manager initialized')

  // Inicializar gestor de archivos
  FileManager.init()
  // console.log('File manager initialized')

  // Inicializar gestor de etiquetas
  TagsManager.init()
  // console.log('Tags manager initialized')

  // Inicializar gestor de búsqueda
  SearchManager.init()
  // console.log('Search manager initialized')

  // Inicializar gestor de medios
  MediaManager.init()
  // console.log('Media manager initialized')

  // Inicializar gestor de imagen principal
  mainImageManager.init()
  // console.log('Main image manager initialized')

  // Inicializar gestor de papelera de reciclaje
  RecycleBinManager.init()
  // console.log('Recycle bin manager initialized')
}

/**
 * Configurar eventos globales del CMS
 */
function setupGlobalEvents () {
  // Manejar eventos de creación de nuevo archivo
  const newFileBtn = document.querySelector('.new-file-btn')
  if (newFileBtn) {
    newFileBtn.addEventListener('click', function () {
      // Notificar al gestor de campos que se está creando un nuevo archivo
      FieldManager.handleNewFile()
    })
  }

  // Manejar eventos de guardado de archivo
  const saveBtn = document.querySelector('.save-btn')
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      // Recolectar valores de campos personalizados antes de guardar
      const customFieldValues = FieldManager.collectCustomFieldValues()
      // console.log('Custom field values collected for saving:', customFieldValues)
    })
  }

  // Manejar eventos de cambio de tema
  document.addEventListener('themeChanged', function (e) {
    // console.log('Theme changed to:', e.detail.theme)

    // Actualizar editor si existe
    if (EditorManager.updateEditorTheme) {
      EditorManager.updateEditorTheme(e.detail.theme)
    }
  })

  // Manejar eventos de carga de archivo
  document.addEventListener('fileLoaded', function (e) {
    // console.log('File loaded:', e.detail.filename)

    // Extraer campos personalizados del contenido
    if (e.detail.content) {
      FieldManager.extractCustomFields(e.detail.content)
    }

    // Actualizar etiquetas si existen
    if (e.detail.content) {
      TagsManager.extractTags(e.detail.content)
    }
  })

  // Manejar eventos de error
  document.addEventListener('cmsError', function (e) {
    console.error('CMS Error:', e.detail.message)
    alert('Error: ' + e.detail.message)
  })
}

/**
 * Verificar si hay un archivo especificado en la URL para cargarlo automáticamente
 */
function checkUrlParams () {
  const urlParams = new URLSearchParams(window.location.search)
  const fileParam = urlParams.get('file')

  if (fileParam) {
    // console.log('Loading file from URL parameter:', fileParam)
    // Esperar un poco para asegurarse de que FileManager esté completamente inicializado
    setTimeout(() => {
      FileManager.loadFile(fileParam)
    }, 100)
  }
}

/**
 * Crear un evento personalizado
 * @param {string} eventName - Nombre del evento
 * @param {object} detail - Detalles del evento
 * @returns {CustomEvent} - Evento personalizado
 */
function createCustomEvent (eventName, detail = {}) {
  return new CustomEvent(eventName, {
    bubbles: true,
    cancelable: true,
    detail
  })
}

/**
 * Disparar un evento personalizado
 * @param {string} eventName - Nombre del evento
 * @param {object} detail - Detalles del evento
 */
function dispatchCustomEvent (eventName, detail = {}) {
  const event = createCustomEvent(eventName, detail)
  document.dispatchEvent(event)
}
