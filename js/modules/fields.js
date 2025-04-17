/**
 * Field Manager
 *
 * Maneja la funcionalidad de campos personalizados en el CMS
 */
export const FieldManager = {
  // Path configuration
  paths: {
    root: window.PATHS ? window.PATHS.ROOT : '/',
    cms: window.PATHS ? window.PATHS.CMS : '/content/',
    media: window.PATHS ? window.PATHS.MEDIA : '../../../public/img'
  },
  customFieldValues: {},

  init: function () {
    // Inicializar campos de fecha al cargar la página
    this.initializeDateFields()

    // Inicializar botones de galería
    this.initializeGalleryButtons()
    
    // Inicializar botones de imagen
    this.initializeImageButtons()

    // Ocultar campos personalizados inicialmente
    this.hideCustomFields()
    
    // Configurar listener para el evento de nuevo archivo creado
    document.addEventListener('newFileCreated', () => {
      // console.log('Nuevo archivo creado: aplicando valores por defecto a los campos')
      this.handleNewFile()
    })

    // console.log('Field manager initialized')
  },
  
  // Inicializar botones para abrir el modal de selección de imagen
  initializeImageButtons: function () {
    // Buscar todos los botones de selección de imagen
    const imageButtons = document.querySelectorAll('.image-select')
    
    // Depuración: Mostrar los botones encontrados
    // console.log('Botones de imagen encontrados:', imageButtons.length)
    // imageButtons.forEach((btn, index) => {
    //   console.log(`Botón ${index}:`, {
    //     id: btn.getAttribute('data-image-id'),
    //     mode: btn.getAttribute('data-media-mode'),
    //     text: btn.textContent.trim()
    //   })
    // })

    // Configurar evento para cada botón
    imageButtons.forEach(button => {
      // Remover eventos anteriores para evitar duplicados
      const oldClickListener = button._clickListener
      if (oldClickListener) {
        button.removeEventListener('click', oldClickListener)
      }

      // Crear nuevo manejador de eventos
      const clickHandler = (e) => {
        e.preventDefault()
        // Depuración: Mostrar información del evento de clic
        console.log('Clic en botón de imagen:', e.target)
        
        // Obtener el ID del campo de imagen
        const imageId = button.getAttribute('data-image-id')
        console.log('ID de imagen:', imageId)

        // Verificar si el modal existe
        const mediaModal = document.getElementById('media-modal')
        if (!mediaModal) {
          console.error('Error: El modal de la biblioteca de medios no existe en el DOM')
          alert('Error: No se pudo abrir la biblioteca de medios. Por favor, recarga la página.')
          return
        }

        // Abrir directamente el modal de la Biblioteca de Medios
        if (window.App && window.App.MediaManager) {
          console.log('Abriendo modal directamente con MediaManager')
          try {
            // Asegurarse de que el modal esté visible
            mediaModal.classList.remove('hidden')
            mediaModal.style.display = ''
            document.body.classList.add('overflow-hidden')
            
            // Llamar al método openModal
            window.App.MediaManager.openModal('image', imageId)
          } catch (error) {
            console.error('Error al abrir el modal:', error)
            // Mostrar el modal manualmente como último recurso
            mediaModal.classList.remove('hidden')
            mediaModal.style.display = ''
            document.body.classList.add('overflow-hidden')
          }
        } else {
          console.error('MediaManager no está disponible')
          // Intentar con el evento como fallback
          console.log('Disparando evento selectForImage como fallback')
          document.dispatchEvent(new CustomEvent('selectForImage', {
            detail: {
              active: true,
              imageId
            }
          }))
          
          // Mostrar el modal manualmente como último recurso
          mediaModal.classList.remove('hidden')
          mediaModal.style.display = ''
          document.body.classList.add('overflow-hidden')
        }
      }

      // Guardar referencia al manejador para poder eliminarlo más tarde
      button._clickListener = clickHandler
      
      // Añadir el evento
      button.addEventListener('click', clickHandler)
    })
    
    // Configurar eventos para los botones de eliminar imagen
    document.addEventListener('click', (e) => {
      if (e.target.closest('.image-remove')) {
        const removeBtn = e.target.closest('.image-remove')
        const imageWrapper = removeBtn.closest('.image-preview-wrapper')
        const imageField = removeBtn.closest('.image-field')
        const hiddenInput = imageField.querySelector('.image-data')
        
        // Limpiar la vista previa y el valor del campo
        if (imageWrapper && hiddenInput) {
          imageWrapper.remove()
          hiddenInput.value = ''
          
          // Actualizar el texto del botón
          const selectButton = imageField.querySelector('.image-select')
          if (selectButton) {
            selectButton.textContent = 'Select Image'
          }
        }
      }
    })
  },

  // Inicializar botones para abrir el modal de galería
  initializeGalleryButtons: function () {
    // Buscar todos los botones de galería
    const galleryButtons = document.querySelectorAll('.gallery-add-images')

    // Configurar evento para cada botón
    galleryButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Obtener el ID de la galería
        const galleryId = button.getAttribute('data-gallery-id')

        // Disparar evento para abrir el modal en modo galería
        document.dispatchEvent(new CustomEvent('selectForGallery', {
          detail: {
            active: true,
            galleryId
          }
        }))
      })
    })
  },

  // Mostrar secciones de campos personalizados
  showCustomFields: function () {
    const leftFieldsSection = document.querySelector('.custom-fields-section.left-fields')
    const rightFieldsSection = document.querySelector('.custom-fields-section.right-fields')
    const mainFieldsSection = document.querySelector('.custom-fields-section.main-fields')

    if (leftFieldsSection) leftFieldsSection.classList.remove('hidden')
    if (rightFieldsSection) rightFieldsSection.classList.remove('hidden')
    if (mainFieldsSection) mainFieldsSection.classList.remove('hidden')
  },

  // Ocultar secciones de campos personalizados
  hideCustomFields: function () {
    const leftFieldsSection = document.querySelector('.custom-fields-section.left-fields')
    const rightFieldsSection = document.querySelector('.custom-fields-section.right-fields')
    const mainFieldsSection = document.querySelector('.custom-fields-section.main-fields')

    if (leftFieldsSection) leftFieldsSection.classList.add('hidden')
    if (rightFieldsSection) rightFieldsSection.classList.add('hidden')
    if (mainFieldsSection) mainFieldsSection.classList.add('hidden')
  },

  // Extraer campos personalizados del contenido
  extractCustomFields: function (content) {
    // console.log('Extrayendo campos personalizados...')
    this.customFieldValues = {}

    // Verificar si el contenido tiene front matter (entre --- y ---)
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
    const match = content.match(frontMatterRegex)

    if (match && match[1]) {
      // Analizar front matter
      const frontMatter = match[1]
      // console.log('Front matter encontrado:', frontMatter)

      // Extraer campos personalizados
      const lines = frontMatter.split('\n')
      lines.forEach(line => {
        const fieldMatch = line.match(/^([a-zA-Z0-9_]+):\s*(.*?)$/)
        if (fieldMatch && fieldMatch[1] !== 'categories') {
          const fieldName = fieldMatch[1]
          let fieldValue = fieldMatch[2].trim()

          // Obtener el tipo de campo si existe
          const fieldConfig = document.querySelector(`[name="${fieldName}"]`);
          const fieldType = fieldConfig ? fieldConfig.getAttribute('data-type') : null;

          // Solo quitar comillas para campos que no son select ni date
          if (fieldType !== 'select' && fieldType !== 'date') {
            if (/^["'].*["']$/.test(fieldValue)) {
              fieldValue = fieldValue.substring(1, fieldValue.length - 1);
            }
          }

          // Intentar parsear JSON para campos como gallery que contienen arrays
          if (fieldName === 'gallery' || fieldName === 'tags' || (fieldValue.startsWith('[') && fieldValue.endsWith(']'))) {
            try {
              // Intentar parsear como JSON
              const jsonValue = JSON.parse(fieldValue)
              this.customFieldValues[fieldName] = jsonValue
              // console.log(`Campo ${fieldName} parseado como JSON:`, jsonValue)
            } catch (e) {
              // Si falla el parseo JSON, intentar parsear manualmente
              if (fieldValue.startsWith('[') && fieldValue.endsWith(']')) {
                const arrayContent = fieldValue.substring(1, fieldValue.length - 1)
                const items = arrayContent.split(',').map(item => {
                  item = item.trim()
                  // Quitar comillas si existen
                  if (/^["'].*["']$/.test(item)) {
                    return item.substring(1, item.length - 1)
                  }
                  return item
                }).filter(item => item.length > 0)

                this.customFieldValues[fieldName] = items
                // console.log(`Campo ${fieldName} parseado manualmente como array:`, items)
              } else {
                // Si no es un array, usar el valor como string
                this.customFieldValues[fieldName] = fieldValue
              }
            }
          } else {
            // Para campos normales, usar el valor como string
            this.customFieldValues[fieldName] = fieldValue
          }
        }
      })

      // Buscar específicamente el campo excerpt que podría estar en formato multilínea
      const excerptMatch = frontMatter.match(/excerpt:\s*["']?([\s\S]*?)["']?(?=\n[a-zA-Z0-9_]+:|$)/)
      if (excerptMatch && excerptMatch[1]) {
        let excerptValue = excerptMatch[1].trim()
        // Eliminar comillas si están presentes
        if (/^["'].*["']$/.test(excerptValue)) {
          excerptValue = excerptValue.substring(1, excerptValue.length - 1)
        }
        this.customFieldValues.excerpt = excerptValue
        // console.log('Excerpt encontrado:', excerptValue)
      }
    }

    // console.log('Valores de campos personalizados extraídos:', this.customFieldValues)

    // Actualizar campos personalizados con los valores extraídos
    this.updateCustomFieldsWithValues(this.customFieldValues)

    // Mostrar secciones de campos personalizados
    this.showCustomFields()

    // Disparar evento para notificar que los campos personalizados han sido actualizados
    document.dispatchEvent(new CustomEvent('customFieldsUpdated', {
      detail: {
        values: this.customFieldValues
      }
    }))
  },

  // Actualizar campos personalizados con valores del front matter
  updateCustomFieldsWithValues: function (values) {
    if (!values) return
    // console.log('Actualizando campos personalizados con valores:', values)

    // Mostrar secciones de campos personalizados
    this.showCustomFields()

    // Recorrer todos los campos personalizados
    const customFields = document.querySelectorAll('.custom-field')
    customFields.forEach(field => {
      const fieldName = field.dataset.fieldName
      if (fieldName && values[fieldName] !== undefined) {
        const fieldValue = values[fieldName]
        // console.log(`Actualizando campo ${fieldName} con valor:`, fieldValue)

        // Buscar el input/select/textarea dentro del campo
        const input = field.querySelector(`[name="custom_fields[${fieldName}]"]`)

        if (input) {
          // Manejar diferentes tipos de campos
          if (input.type === 'checkbox') {
            input.checked = fieldValue === 'true' || fieldValue === true
          } else if (input.tagName === 'SELECT') {
            // Verificar si el select tiene opciones
            if (input.options.length <= 1 && input.hasAttribute('data-options')) {
              // Si solo tiene la opción por defecto o ninguna, cargar las opciones desde los atributos data
              try {
                const optionValues = JSON.parse(input.getAttribute('data-options'))
                const optionLabels = JSON.parse(input.getAttribute('data-option-labels'))

                // Limpiar opciones existentes excepto la primera (-- Select --)
                while (input.options.length > 1) {
                  input.remove(1)
                }

                // Añadir las opciones
                for (let i = 0; i < optionValues.length; i++) {
                  const option = document.createElement('option')
                  option.value = optionValues[i]
                  option.textContent = optionLabels[i]
                  option.className = 'text-neutral-800 dark:text-white bg-white dark:bg-neutral-800'
                  input.appendChild(option)
                }
              } catch (e) {
                console.error('Error al cargar opciones del select:', e)
              }
            }

            // Establecer el valor seleccionado
            input.value = fieldValue
            // Forzar un evento change para asegurar que se actualicen las UI dependientes
            input.dispatchEvent(new Event('change', { bubbles: true }))
          } else if (input.classList.contains('gallery-data')) {
            // Para campos de tipo gallery
            this.updateGalleryField(field, fieldValue)
          } else if (input.classList.contains('tags-data')) {
            // Para campos de tipo tags
            this.updateTagsField(field, fieldValue)
          } else if (input.classList.contains('image-data')) {
            // Para campos de tipo image
            this.updateImageField(field, fieldValue)
          } else {
            // Para campos normales (text, textarea, etc.)
            input.value = fieldValue
            // Forzar un evento input para asegurar que se actualicen las UI dependientes
            input.dispatchEvent(new Event('input', { bubbles: true }))
          }
        }
      } else if (fieldName) {
        // console.log(`Campo ${fieldName} no tiene valor definido en el frontmatter`)
        // Limpiar el campo si no hay valor definido
        const input = field.querySelector(`[name="custom_fields[${fieldName}]"]`)
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = false
          } else if (input.tagName === 'SELECT') {
            // Verificar si el select tiene opciones
            if (input.options.length <= 1 && input.hasAttribute('data-options')) {
              // Si solo tiene la opción por defecto o ninguna, cargar las opciones desde los atributos data
              try {
                const optionValues = JSON.parse(input.getAttribute('data-options'))
                const optionLabels = JSON.parse(input.getAttribute('data-option-labels'))

                // Limpiar opciones existentes excepto la primera (-- Select --)
                while (input.options.length > 1) {
                  input.remove(1)
                }

                // Añadir las opciones
                for (let i = 0; i < optionValues.length; i++) {
                  const option = document.createElement('option')
                  option.value = optionValues[i]
                  option.textContent = optionLabels[i]
                  option.className = 'text-neutral-800 dark:text-white bg-white dark:bg-neutral-800'
                  input.appendChild(option)
                }
              } catch (e) {
                console.error('Error al cargar opciones del select:', e)
              }
            }

            input.selectedIndex = 0
            input.dispatchEvent(new Event('change', { bubbles: true }))
          } else if (input.classList.contains('gallery-data')) {
            this.updateGalleryField(field, [])
          } else if (input.classList.contains('tags-data')) {
            this.updateTagsField(field, [])
          } else if (input.classList.contains('image-data')) {
            // Para campos de tipo image cuando no existe en el front matter
            this.updateImageField(field, '')
          } else {
            input.value = ''
            input.dispatchEvent(new Event('input', { bubbles: true }))
          }
        }
      }
    })
  },

  // Manejar la creación de un nuevo archivo
  handleNewFile: function () {
    // Limpiar valores de campos personalizados
    this.customFieldValues = {}

    // Obtener valores por defecto de los campos configurados
    const defaultValues = {}

    // Recorrer todos los campos personalizados
    const customFields = document.querySelectorAll('.custom-field')
    customFields.forEach(field => {
      const fieldName = field.dataset.fieldName
      const defaultAttr = field.dataset.defaultValue

      // Si el campo tiene un valor por defecto configurado, usarlo
      if (fieldName && defaultAttr) {
        defaultValues[fieldName] = defaultAttr
      }
    })

    // Para el campo status, establecer "published" como valor por defecto
    if (document.querySelector('.custom-field[data-field-name="status"]')) {
      defaultValues.status = 'published'
    }

    // console.log('Applying default values for new file:', defaultValues)

    // Actualizar campos con valores por defecto
    this.updateCustomFieldsWithValues(defaultValues)

    // Reiniciar campos de fecha
    this.initializeDateFields()
  },

  // Actualizar campo de tipo gallery con imágenes
  updateGalleryField: function (galleryField, galleryValue) {
    // console.log('Actualizando campo gallery con valor:', galleryValue)

    // Obtener el contenedor de imágenes y el input oculto
    const imagesContainer = galleryField.querySelector('.gallery-images-container')
    const hiddenInput = galleryField.querySelector('.gallery-data')

    if (!imagesContainer || !hiddenInput) {
      // console.error('No se encontró el contenedor de imágenes o el input oculto para la galería')
      return
    }

    // Limpiar el contenedor de imágenes
    imagesContainer.innerHTML = ''

    // Convertir el valor a array si es necesario
    let galleryImages = galleryValue
    if (typeof galleryValue === 'string') {
      try {
        galleryImages = JSON.parse(galleryValue)
      } catch (e) {
        // Si no es JSON válido, intentar dividir por comas
        galleryImages = galleryValue.split(',').map(item => item.trim())
      }
    }

    // Asegurarse de que sea un array
    if (!Array.isArray(galleryImages)) {
      galleryImages = galleryImages ? [galleryImages] : []
    }

    // console.log('Imágenes de la galería procesadas:', galleryImages)

    // Actualizar el input oculto con el valor JSON
    hiddenInput.value = JSON.stringify(galleryImages)

    // Crear elementos para cada imagen
    galleryImages.forEach(imagePath => {
      if (!imagePath) return

      // Determinar la ruta completa para mostrar la imagen
      let displayPath = imagePath
      if (imagePath.startsWith('/')) {
        displayPath = `../../../public${imagePath}`
      } else if (!imagePath.startsWith('http') && !imagePath.startsWith('../../../public')) {
        displayPath = `../../../public/${imagePath}`
      }

      // Crear el elemento de imagen
      const imageItem = document.createElement('div')
      imageItem.className = 'gallery-image-item relative border border-neutral-300 dark:border-neutral-700 rounded overflow-hidden'

      imageItem.innerHTML = `
        <img src="${displayPath}" class="w-full h-20 object-cover">
        <button type="button" class="gallery-remove-image absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center" data-path="${imagePath}">
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

          // Actualizar el input oculto
          const currentImages = JSON.parse(hiddenInput.value || '[]')
          const updatedImages = currentImages.filter(path => path !== imagePath)
          hiddenInput.value = JSON.stringify(updatedImages)
        })
      }

      imagesContainer.appendChild(imageItem)
    })

    // Disparar un evento personalizado para notificar que la galería ha sido actualizada
    galleryField.dispatchEvent(new CustomEvent('galleryUpdated', {
      bubbles: true,
      detail: { galleryImages }
    }))
  },

  // Actualizar campo de tipo tags con etiquetas
  updateTagsField: function (tagsField, tagsValue) {
    // console.log('Actualizando campo tags con valor:', tagsValue)

    // Obtener elementos del campo
    const tagsId = tagsField.querySelector('.tags-field')?.dataset.tagsId
    const tagsList = tagsField.querySelector('.tags-list')
    const tagsData = tagsField.querySelector('.tags-data')
    const tagInput = tagsField.querySelector('.tag-input')
    const addTagBtn = tagsField.querySelector('.add-tag')

    if (!tagsList || !tagsData) {
      // console.error('No se encontraron los elementos necesarios para el campo de tags')
      return
    }

    // Limpiar lista de etiquetas
    tagsList.innerHTML = ''

    // Convertir valor a array si no lo es
    let tagsArray = tagsValue
    if (!Array.isArray(tagsArray)) {
      if (typeof tagsArray === 'string') {
        try {
          tagsArray = JSON.parse(tagsArray)
        } catch (e) {
          tagsArray = tagsArray.split(',').map(tag => tag.trim())
        }
      } else {
        tagsArray = []
      }
    }

    // Filtrar valores vacíos
    tagsArray = tagsArray.filter(tag => tag && tag.trim())

    // console.log('Tags procesados:', tagsArray)

    // Actualizar input oculto con el valor JSON
    tagsData.value = JSON.stringify(tagsArray)

    // Crear elementos para cada etiqueta
    tagsArray.forEach(tag => {
      if (tag && tag.trim()) {
        this.addTagToField(tagsField, tag.trim())
      }
    })

    // Configurar eventos para añadir/eliminar etiquetas
    if (addTagBtn && tagInput) {
      // Eliminar eventos previos para evitar duplicados
      const newAddTagBtn = addTagBtn.cloneNode(true)
      addTagBtn.parentNode.replaceChild(newAddTagBtn, addTagBtn)

      const newTagInput = tagInput.cloneNode(true)
      tagInput.parentNode.replaceChild(newTagInput, tagInput)

      // Añadir etiqueta al hacer clic en el botón
      newAddTagBtn.addEventListener('click', () => {
        const tagValue = newTagInput.value.trim()
        if (tagValue) {
          this.addTagToField(tagsField, tagValue)
          newTagInput.value = ''
          this.updateTagsDataField(tagsField)
        }
      })

      // Añadir etiqueta al presionar Enter
      newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          const tagValue = newTagInput.value.trim()
          if (tagValue) {
            this.addTagToField(tagsField, tagValue)
            newTagInput.value = ''
            this.updateTagsDataField(tagsField)
          }
        }
      })
    }

    // Disparar un evento personalizado para notificar que las etiquetas han sido actualizadas
    tagsField.dispatchEvent(new CustomEvent('tagsUpdated', {
      bubbles: true,
      detail: { tagsArray }
    }))
  },

  // Añadir una etiqueta al campo
  addTagToField: function (tagsField, tag) {
    const tagsList = tagsField.querySelector('.tags-list')
    if (!tagsList) return

    // Verificar si la etiqueta ya existe
    const existingTags = Array.from(tagsList.querySelectorAll('.tag-item span')).map(span => span.textContent)
    if (existingTags.includes(tag)) return

    // Crear elemento para la etiqueta
    const tagElement = document.createElement('div')
    tagElement.className = 'tag-item bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-sm flex items-center'
    tagElement.innerHTML = `
      <span>${tag}</span>
      <button type="button" class="tag-remove ml-1 text-red-500 hover:text-red-700 dark:hover:text-red-400" data-tag="${tag}">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    `

    // Configurar evento para eliminar la etiqueta
    const removeBtn = tagElement.querySelector('.tag-remove')
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        tagElement.remove()
        this.updateTagsDataField(tagsField)
      })
    }

    tagsList.appendChild(tagElement)
  },

  // Actualizar el campo oculto con los datos de las etiquetas
  updateTagsDataField: function (tagsField) {
    const tagsItems = tagsField.querySelectorAll('.tag-item')
    const hiddenInput = tagsField.querySelector('.tags-data')
    
    if (!hiddenInput) return
    
    const tags = []
    tagsItems.forEach(item => {
      const tagText = item.querySelector('span').textContent
      tags.push(tagText)
    })
    
    // Actualizar el valor del input oculto
    hiddenInput.value = JSON.stringify(tags)
    // console.log('Tags actualizados:', tags)
  },
  
  // Actualizar campo de tipo imagen con la imagen seleccionada
  updateImageField: function (imageField, imagePath) {
    const imageContainer = imageField.querySelector('.image-container')
    const hiddenInput = imageField.querySelector('.image-data')
    
    if (!imageContainer || !hiddenInput) return
    
    // Limpiar el contenedor de imagen
    imageContainer.innerHTML = ''
    
    // Si no hay imagen o la ruta está vacía, limpiar el campo y actualizar el botón
    if (!imagePath || imagePath === '') {
      // Limpiar el valor del input oculto
      hiddenInput.value = ''
      
      // Actualizar el texto del botón a "Select Image"
      const selectButton = imageField.querySelector('.image-select')
      if (selectButton) {
        selectButton.textContent = 'Select Image'
      }
      
      return
    }
    
    // Establecer el valor en el input oculto
    hiddenInput.value = imagePath
    
    // Construir la ruta correcta para la vista previa
    let displayPath = imagePath
    if (imagePath.startsWith('/')) {
      // Si comienza con /, añadir el prefijo ../../../public
      displayPath = `../../../public${imagePath}`
    } else if (imagePath.includes('public/img')) {
      // Si ya contiene public/img, asegurarse de que tenga la estructura correcta
      displayPath = imagePath.replace(/^(\.\.\/)*/,'../../../')
    } else if (!imagePath.startsWith('../../../public/') && !imagePath.startsWith('http')) {
      // Para otros casos, añadir el prefijo completo
      displayPath = `../../../public/${imagePath}`
    }
    
    // Crear el elemento de vista previa
    const previewWrapper = document.createElement('div')
    previewWrapper.className = 'image-preview-wrapper'
    
    previewWrapper.innerHTML = `
      <img src="${displayPath}">
      <button type="button" class="image-remove absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600" data-path="${imagePath}">
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
  },
  
  // Recolectar valores de campos personalizados
  collectCustomFieldValues: function () {
    const values = {}

    // Obtener todos los campos personalizados de todas las secciones
    const leftFields = document.querySelectorAll('.custom-fields-section.left-fields .custom-field')
    const rightFields = document.querySelectorAll('.custom-fields-section.right-fields .custom-field')
    const mainFields = document.querySelectorAll('.custom-fields-section.main-fields .custom-field')
    const allFields = [...leftFields, ...rightFields, ...mainFields]

    // Log para depuración
    // console.log('Found custom fields:', allFields.length)

    allFields.forEach(field => {
      const fieldName = field.getAttribute('data-field-name')

      // Primero verificar si es un checkbox
      const checkboxInput = field.querySelector('input[type="checkbox"]')
      
      if (fieldName && checkboxInput) {
        // Para checkboxes, guardar el estado booleano
        values[fieldName] = checkboxInput.checked ? 'true' : 'false'
        // console.log(`Checkbox ${fieldName} = ${checkboxInput.checked}`)
        return
      }

      // Buscar inputs especiales (tags, gallery)
      const specialInput = field.querySelector('.tags-data, .gallery-data')

      // Si no hay input especial, buscar inputs normales
      const regularInput = field.querySelector('input:not(.tags-data):not(.gallery-data), textarea, select')

      // Usar el input especial si existe, de lo contrario usar el input regular
      const input = specialInput || regularInput

      if (fieldName && input) {
        // Para campos especiales como tags, que almacenan datos en formato JSON
        if (input.classList.contains('tags-data') || input.classList.contains('gallery-data')) {
          try {
            // Intentar parsear el valor como JSON
            values[fieldName] = JSON.parse(input.value)
          } catch (e) {
            // Si falla el parseo, usar el valor tal cual
            values[fieldName] = input.value
          }
        } else {
          // Para campos normales, usar el valor directamente
          values[fieldName] = input.value
        }
        // console.log(`Field ${fieldName} = "${input.value}"`)
      } else {
        // console.warn('Field missing name attribute or input element:', field)
      }
    })

    // console.log('Collected values:', values)
    return values
  },

  // Inicializar campos de fecha
  initializeDateFields: function () {
    // Encontrar todos los inputs de selector de fecha
    const dateFields = document.querySelectorAll('input.date-picker')

    if (dateFields.length === 0) {
      // console.log('No date fields found')
      return
    }

    // Los navegadores modernos ya tienen un selector de fecha con type="date"
    dateFields.forEach(field => {
      // Agregar event listener para formatear la fecha si es necesario
      field.addEventListener('change', function () {
        const dateValue = this.value
        // console.log(`Date field ${this.name} changed to: ${dateValue}`)
      })

      // Importante: solo inicializar con la fecha actual si el campo está vacío
      // y si estamos creando un nuevo archivo (no al cargar un archivo existente)
      const fieldName = field.getAttribute('name') || field.getAttribute('data-field-name')

      if (!field.value) {
        // Si el campo está vacío, establecer la fecha actual
        const today = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
        field.value = today
        // console.log(`Date field ${fieldName} initialized with today's date: ${field.value}`)

        // Disparar evento change para asegurar que cualquier listener sea notificado
        const event = new Event('change', { bubbles: true })
        field.dispatchEvent(event)
      }
    })

    // console.log(`Initialized ${dateFields.length} date fields`)
  }
}
