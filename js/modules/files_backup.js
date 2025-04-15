// Copia de seguridad de la función saveFileToServer original
// Guardada el 13/04/2025
// Este archivo es una copia de respaldo en caso de que necesitemos restaurar
// la versión original de saveFileToServer

saveFileToServer: function (content, saveIndicator) {
  // Verificar que tenemos un nombre de archivo válido
  if (!this.currentFile) {
    console.error('Error: No filename specified!')
    alert('Error: No se ha especificado un nombre de archivo.')
    saveIndicator.remove()
    return
  }

  console.log('Guardando archivo:', this.currentFile)

  // Utilizar URLSearchParams en lugar de FormData
  const params = new URLSearchParams()
  params.append('action', 'write')
  params.append('file', this.currentFile)
  params.append('content', content)

  // Obtener la URL base
  const apiUrl = window.API_BASE_PATH || 'api.php'
  const collection = window.CURRENT_COLLECTION || ''
  const url = `${apiUrl}?collection=${encodeURIComponent(collection)}`

  console.log('URL:', url)
  console.log('Params:', params.toString())

  // Opciones de fetch con URLSearchParams
  const fetchOptions = {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: params.toString()
  }

  console.log('Fetch options:', JSON.stringify(fetchOptions, (key, value) => {
    // No mostrar el contenido del cuerpo de la solicitud en la consola
    if (key === 'body') return '[Request Body]'
    return value
  }, 2))

  fetch(url, fetchOptions)
    .then(response => {
      // Guardar la URL para diagnóstico
      const requestUrl = response.url

      console.log('Respuesta recibida - Status:', response.status, 'Status Text:', response.statusText)
      console.log('URL completa de la solicitud:', requestUrl)
      console.log('Encabezados de respuesta:', JSON.stringify(Object.fromEntries([...response.headers])))
      
      // Verificar si la respuesta es exitosa (código 200-299)
      if (!response.ok) {
        console.error('Error HTTP:', response.status, response.statusText)
        return response.text().then(text => {
          console.error('Contenido de respuesta de error:', text)
          throw new Error(`Error HTTP ${response.status}: ${text.substring(0, 150)}... (URL: ${requestUrl})`)
        })
      }

      // Intentar parsear como JSON
      return response.text().then(text => {
        console.log('Respuesta completa:', text)
        try {
          return JSON.parse(text)
        } catch (e) {
          console.error('Error al parsear JSON:', e)
          console.log('Respuesta recibida (primeros 150 caracteres):', text.substring(0, 150))
          throw new Error(`Respuesta no válida: ${text.substring(0, 150)}... (URL: ${requestUrl})`)
        }
      })
    })
    .then(data => {
      if (data.success) {
        // Eliminar el indicador de carga
        saveIndicator.remove()

        // Guardar el nombre del archivo actual para poder recargarlo después
        const currentFileName = this.currentFile

        // Disparar evento después de guardar (para que otros módulos puedan reaccionar)
        document.dispatchEvent(new CustomEvent('afterFileSave', {
          detail: {
            filename: currentFileName,
            success: true
          }
        }))

        // Recargar la página completamente para evitar problemas de caché
        // Usar un timestamp único como parámetro para forzar la recarga completa
        const timestamp = new Date().getTime()
        window.location.href = window.location.pathname +
          `?file=${encodeURIComponent(currentFileName)}&nocache=${timestamp}`
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
      console.error('Error en la solicitud:', error)
      
      // Mostrar mensaje de error
      alert('Error guardando el archivo: ' + error.message)
      
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
