/**
 * Editor Manager
 *
 * Maneja la configuración del editor SimpleMDE y sus atajos de teclado
 */
export const EditorManager = {
  // Path configuration
  paths: {
    root: window.PATHS ? window.PATHS.ROOT : '/',
    cms: window.PATHS ? window.PATHS.CMS : '/content/',
    media: window.PATHS ? window.PATHS.MEDIA : '../../../public/img'
  },
  editor: null,

  init: function () {
    // Inicializar SimpleMDE
    this.editor = new SimpleMDE({
      element: document.getElementById('editor'),
      spellChecker: false,
      autosave: {
        enabled: true
      },
      toolbar: ["heading","bold", "italic", "quote", "unordered-list", "ordered-list", "code", "link", "image"],
      shortcuts: {
        // Override and extend default shortcuts
        toggleBold: 'Ctrl-B',
        toggleItalic: 'Ctrl-I',
        drawLink: 'Ctrl-K',
        toggleHeadingSmaller: 'Ctrl-H',
        toggleHeadingBigger: 'Shift-Ctrl-H',
        cleanBlock: 'Ctrl-E',
        drawImage: 'Ctrl-Alt-I',
        toggleBlockquote: "Ctrl-'",
        toggleOrderedList: 'Ctrl-Alt-L',
        toggleUnorderedList: 'Ctrl-L',
        toggleCodeBlock: 'Ctrl-Alt-C',
        togglePreview: 'Ctrl-P',
        toggleSideBySide: 'F9',
        toggleFullScreen: 'F11'
      }
    })

    // Deshabilitar el editor inicialmente
    this.editor.codemirror.setOption('readOnly', true)

    // Limpiar el editor al inicializar
    this.clearEditor()

    // Configurar atajos de teclado
    this.setupEditorShortcuts()

    // Exponer el editor globalmente para que otros módulos puedan acceder a él
    window.editor = this.editor

    // console.log('Editor manager initialized')

    return this.editor
  },

  // Configurar atajos de teclado para el editor
  setupEditorShortcuts: function () {
    const saveBtn = document.querySelector('.save-file')
    const self = this

    this.editor.codemirror.setOption('extraKeys', {
      // Add Ctrl+S to save the file
      'Ctrl-S': function (cm) {
        if (!saveBtn || !saveBtn.disabled) {
          // Disparar evento de guardado
          document.dispatchEvent(new CustomEvent('editorSave'))
        }
        return false // Prevent default browser save dialog
      },
      // Ensure Ctrl+Z and Ctrl+Y work as expected for undo/redo
      'Ctrl-Z': function (cm) {
        cm.undo()
        return false
      },
      'Ctrl-Y': function (cm) {
        cm.redo()
        return false
      },
      'Shift-Ctrl-Z': function (cm) {
        cm.redo()
        return false
      }
    })
  },

  // Actualizar el tema del editor
  updateEditorTheme: function (theme) {
    if (!this.editor) return

    const cm = this.editor.codemirror
    const wrapper = cm.getWrapperElement()

    if (theme === 'dark') {
      wrapper.classList.add('cm-s-dark')
      wrapper.classList.remove('cm-s-light')
    } else {
      wrapper.classList.add('cm-s-light')
      wrapper.classList.remove('cm-s-dark')
    }
  },

  // Obtener el contenido del editor
  getContent: function () {
    return this.editor ? this.editor.value() : ''
  },

  // Establecer el contenido del editor
  setContent: function (content) {
    if (this.editor) {
      this.editor.value(content)
    }
  },

  // Habilitar el editor
  enable: function () {
    if (this.editor) {
      this.editor.codemirror.setOption('readOnly', false)
    }
  },

  // Deshabilitar el editor
  disable: function () {
    if (this.editor) {
      this.editor.codemirror.setOption('readOnly', true)
    }
  },

  // Obtener la instancia del editor
  getEditor: function () {
    return this.editor
  },

  // Limpiar el contenido del editor
  clearEditor: function () {
    if (this.editor) {
      this.editor.value('')
    }
  }
}
