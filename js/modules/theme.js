/**
 * Theme Manager
 *
 * Maneja la funcionalidad de cambio de tema claro/oscuro
 */
export const ThemeManager = {
  htmlElement: null,
  themeToggle: null,
  moonIcon: null,
  sunIcon: null,

  initTheme: function () {
    const htmlElement = document.documentElement
    const theme = localStorage.getItem('theme')

    // Aplicar tema basado en preferencia guardada o preferencia del sistema
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }

    // Guardar referencia al elemento HTML
    this.htmlElement = htmlElement

    // console.log('Theme initialized:', this.getCurrentTheme())
  },

  init: function () {
    // Asegurar que tenemos la referencia al elemento HTML
    this.htmlElement = document.documentElement

    // Buscar el botón de cambio de tema
    this.themeToggle = document.getElementById('theme-toggle')

    if (this.themeToggle) {
      // Buscar los iconos dentro del botón
      this.moonIcon = this.themeToggle.querySelector('.moon')
      this.sunIcon = this.themeToggle.querySelector('.sun')

      // Actualizar los iconos según el tema actual
      this.updateIcons()

      // Configurar el evento de clic en el botón
      this.setupThemeToggle()

      // console.log('Theme manager initialized')
    } else {
      // console.warn('Theme toggle button not found')

      // Intentar buscar el botón después de un tiempo
      setTimeout(() => {
        this.themeToggle = document.getElementById('theme-toggle')
        if (this.themeToggle) {
          this.moonIcon = this.themeToggle.querySelector('.moon')
          this.sunIcon = this.themeToggle.querySelector('.sun')
          this.updateIcons()
          this.setupThemeToggle()
          // console.log('Theme manager initialized after delay')
        }
      }, 500)
    }
  },

  updateIcons: function () {
    if (this.moonIcon && this.sunIcon) {
      const isDark = this.htmlElement.classList.contains('dark')

      if (isDark) {
        this.moonIcon.classList.remove('hidden')
        this.sunIcon.classList.add('hidden')
      } else {
        this.moonIcon.classList.add('hidden')
        this.sunIcon.classList.remove('hidden')
      }

      // console.log('Icons updated for theme:', isDark ? 'dark' : 'light')
    }
  },

  setupThemeToggle: function () {
    if (!this.themeToggle) return

    // Eliminar eventos previos para evitar duplicados
    this.themeToggle.removeEventListener('click', this._handleThemeToggle)

    // Crear una función de manejador y guardarla para poder eliminarla después
    this._handleThemeToggle = () => {
      this.toggleTheme()
    }

    // Añadir el evento de clic
    this.themeToggle.addEventListener('click', this._handleThemeToggle)

    // console.log('Theme toggle event listener set up')
  },

  toggleTheme: function () {
    // Cambiar la clase dark en el elemento HTML
    this.htmlElement.classList.toggle('dark')

    // Determinar el tema actual después del cambio
    const isDark = this.htmlElement.classList.contains('dark')

    // Guardar la preferencia en localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light')

    // Actualizar los iconos
    this.updateIcons()

    // Disparar un evento personalizado para notificar del cambio de tema
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: {
        theme: isDark ? 'dark' : 'light'
      }
    }))

    // console.log('Theme toggled to:', isDark ? 'dark' : 'light')
  },

  getCurrentTheme: function () {
    return this.htmlElement.classList.contains('dark') ? 'dark' : 'light'
  }
}

// Inicializar el tema inmediatamente para evitar parpadeos
ThemeManager.initTheme()

// Configurar el resto de la funcionalidad cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  ThemeManager.init()
})
