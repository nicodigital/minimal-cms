/**
 * Sistema de control de logs para GridBox 2.0
 * Permite activar/desactivar logs y cambiar niveles de registro
 * desde la consola del navegador
 */

const LogControl = {
  // URL base para las peticiones
  apiUrl: (window.API_BASE_PATH || '') + 'process.php',

  /**
     * Activa los logs del sistema
     * @returns {Promise} Promesa con la respuesta
     */
  activate: function () {
    return this._toggleStatus('on')
      .then(response => {
        console.log('✅ Logs activados exitosamente')
        return response
      })
  },

  /**
     * Desactiva los logs del sistema
     * @returns {Promise} Promesa con la respuesta
     */
  deactivate: function () {
    return this._toggleStatus('off')
      .then(response => {
        console.log('⛔ Logs desactivados')
        return response
      })
  },

  /**
     * Cambia el nivel de logs
     * @param {string} level - Nivel de logs (DEBUG, INFO, WARN, ERROR, NONE)
     * @returns {Promise} Promesa con la respuesta
     */
  setLevel: function (level) {
    const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE']
    level = level.toUpperCase()

    if (!validLevels.includes(level)) {
      console.error(`❌ Nivel inválido: ${level}. Use uno de: ${validLevels.join(', ')}`)
      return Promise.reject('Nivel inválido')
    }

    return fetch(`${this.apiUrl}?action=logs&level=${level}`)
      .then(response => response.json())
      .then(data => {
        console.log(`🔄 Nivel de logs cambiado a: ${level}`)
        return data
      })
  },

  /**
     * Obtiene el estado actual de los logs
     * @returns {Promise} Promesa con el estado
     */
  getStatus: function () {
    return fetch(`${this.apiUrl}?action=logs`)
      .then(response => response.json())
      .then(data => {
        console.log('📊 Estado actual de logs:', {
          activo: data.logging,
          nivel: data.log_level
        })
        return data
      })
  },

  /**
     * Método interno para activar/desactivar logs
     * @param {string} status - 'on' o 'off'
     * @returns {Promise} Promesa con la respuesta
     * @private
     */
  _toggleStatus: function (status) {
    return fetch(`${this.apiUrl}?action=logs&status=${status}`)
      .then(response => response.json())
  }
}

// Añadir al ámbito global para acceso desde consola
window.LogControl = LogControl

// Mensaje informativo en consola
console.log('%c GridBox 2.0 - Control de logs disponible', 'background: #333; color: #7CFC00; padding: 5px; border-radius: 5px;')
console.log('Use las siguientes funciones en consola:')
console.log('- LogControl.activate() - Para activar logs')
console.log('- LogControl.deactivate() - Para desactivar logs')
console.log('- LogControl.setLevel("DEBUG|INFO|WARN|ERROR|NONE") - Para cambiar nivel')
console.log('- LogControl.getStatus() - Para ver estado actual')
