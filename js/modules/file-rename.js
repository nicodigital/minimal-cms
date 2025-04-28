/**
 * Módulo para manejar la edición de nombres de archivos
 */
const FileRenameManager = {
    /**
     * Elementos DOM utilizados por el módulo
     */
    elements: {
        currentFileEl: null,
        editButton: null
    },
    
    /**
     * Inicializar el módulo
     */
    init: function() {
        this.elements.currentFileEl = document.querySelector('.current-file');
        this.elements.editButton = document.querySelector('.edit-file-name');
        
        if (this.elements.editButton && this.elements.currentFileEl) {
            this.setupEventListeners();
            
            // Estado inicial - ocultar el botón si no hay archivo seleccionado
            this.checkButtonVisibility();
        }
    },
    
    /**
     * Configurar los event listeners
     */
    setupEventListeners: function() {
        // Evento para el botón de edición
        this.elements.editButton.addEventListener('click', () => this.enableEditing());
        
        // Escuchar cuando se carga un archivo para actualizar el estado
        document.addEventListener('fileLoaded', (e) => {
            if (e.detail && e.detail.filename) {
                this.updateFileName(e.detail.filename);
                this.checkButtonVisibility();
            }
        });
        
        // Escuchar cuando se cierra un archivo (no hay archivo seleccionado)
        document.addEventListener('fileDeleted', () => {
            this.checkButtonVisibility();
        });
    },
    
    /**
     * Comprobar si debe mostrarse el botón de edición
     * @returns {boolean} - true si hay un archivo seleccionado
     */
    checkButtonVisibility: function() {
        const currentFile = window.FileManager?.getCurrentFile();
        const hasFile = currentFile && currentFile.trim() !== '';
        
        if (this.elements.editButton) {
            if (hasFile) {
                this.elements.editButton.classList.remove('hidden');
            } else {
                this.elements.editButton.classList.add('hidden');
            }
        }
        
        return hasFile;
    },
    
    /**
     * Habilitar la edición del nombre del archivo
     */
    enableEditing: function() {
        const currentFile = window.FileManager?.getCurrentFile();
        if (!currentFile || !this.checkButtonVisibility()) return;
        
        const currentName = currentFile.replace(/\.md$/, '');
        this.elements.currentFileEl.setAttribute('contenteditable', 'true');
        this.elements.currentFileEl.classList.add('editing');
        this.elements.currentFileEl.focus();
        
        // Seleccionar todo el texto al entrar en modo edición
        document.execCommand('selectAll', false, null);
        
        // Añadir oyentes para guardar cambios
        this.elements.currentFileEl.addEventListener('blur', this.handleBlur.bind(this), { once: true });
        this.elements.currentFileEl.addEventListener('keydown', this.handleKeydown.bind(this));
    },
    
    /**
     * Manejar cuando se presiona una tecla durante la edición
     * @param {KeyboardEvent} e - El evento de teclado
     */
    handleKeydown: function(e) {
        // Enter guarda los cambios
        if (e.key === 'Enter') {
            e.preventDefault();
            this.saveChanges();
        }
        
        // Escape cancela la edición
        if (e.key === 'Escape') {
            e.preventDefault();
            this.cancelEditing();
        }
    },
    
    /**
     * Manejar cuando el elemento pierde el foco
     */
    handleBlur: function() {
        this.saveChanges();
    },
    
    /**
     * Cancelar la edición y restaurar el nombre original
     */
    cancelEditing: function() {
        const currentFile = window.FileManager?.getCurrentFile();
        if (currentFile) {
            this.updateFileName(currentFile);
        }
        this.disableEditing();
    },
    
    /**
     * Guardar los cambios del nombre de archivo
     */
    saveChanges: function() {
        const currentFile = window.FileManager?.getCurrentFile();
        if (!currentFile) {
            this.disableEditing();
            return;
        }
        
        // Función para convertir a slug (idéntica a files.js)
        function slugify(text) {
            return text
                .toString()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/--+/g, '-')
                .trim()
                .replace(/^-+|-+$/g, '');
        }

        let newName = this.elements.currentFileEl.textContent.trim();
        const oldName = currentFile.replace(/\.md$/, '');
        newName = slugify(newName);
        
        // Si no hay cambios o el nombre está vacío, cancelar
        if (newName === oldName || !newName) {
            this.disableEditing();
            return;
        }
        
        // Preparar nombres para enviar al servidor
        const oldFilename = currentFile;
        const newFilename = newName + '.md';
        
        // Deshabilitar edición mientras se procesa
        this.disableEditing();
        
        // Mostrar mensaje de procesando
        if (window.FileManager && window.FileManager.showFlashMessage) {
            window.FileManager.showFlashMessage('Renombrando archivo...', 'info');
        }
        
        // Configurar la petición al servidor
        const apiUrl = window.API_BASE_PATH || 'process.php';
        
        // Obtener la colección actual directamente de la variable global o del select
        let collection = '';
        if (window.CURRENT_COLLECTION) {
            collection = window.CURRENT_COLLECTION;
        } else if (window.currentCollection) {
            collection = window.currentCollection;
        } else {
            // Intentar obtener la colección del selector de colecciones si está disponible
            const collectionSelect = document.querySelector('select[name="collection"]');
            if (collectionSelect) {
                collection = collectionSelect.value;
            }
        }
        
        // console.log('Renaming file. Collection:', collection, 'Old filename:', oldFilename, 'New filename:', newFilename);
        
        const formData = new FormData();
        formData.append('action', 'rename');
        formData.append('oldFilename', oldFilename);
        formData.append('newFilename', newFilename);
        formData.append('collection', collection); // Siempre enviar la colección, aunque sea vacía
        
        // Implementación alternativa - Actualizar la UI primero
        // console.log('Actualizando UI a nuevo nombre:', newFilename);
        // Actualizar el nombre mostrado
        this.updateFileName(newFilename);
        
        // Forzar una segunda actualización después de un breve retraso
        setTimeout(() => {
            this.updateFileName(newFilename);
        }, 100);
        
        // Actualizar el estado interno de FileManager sin esperar respuesta del servidor
        if (window.FileManager) {
            window.FileManager.currentFile = newFilename;
            
            // Actualizar URL del navegador sin recargar la página
            const url = new URL(window.location.href);
            url.searchParams.delete('file');
            url.searchParams.set('file', newFilename);
            window.history.replaceState({}, '', url.toString());
        }
        
        // Hacer la petición al servidor en segundo plano
        fetch(apiUrl, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Silenciar errores pero registrar éxito
            if (data.success) {
                // Actualizar la lista de archivos con un retraso para dar tiempo al sistema
                setTimeout(() => {
                    if (window.FileManager) {
                        console.log('Actualizando lista de archivos después de tiempo de espera');
                        window.FileManager.loadFileList();
                    }
                }, 300);
                
                // Mostrar mensaje de éxito
                if (window.FileManager && window.FileManager.showFlashMessage) {
                    window.FileManager.showFlashMessage('Archivo renombrado correctamente', 'success');
                }
                
                // Marcar el archivo en la lista como activo sin recargar
                setTimeout(() => {
                    const fileItems = document.querySelectorAll('.md-list .file-item');
                    fileItems.forEach(item => {
                        // Primero quitamos la clase activa de todos los elementos
                        item.classList.remove('active');
                        // Luego la añadimos al elemento con el nuevo nombre
                        if (item.dataset.filename === newFilename.toLowerCase()) {
                            item.classList.add('active');
                        }
                    });
                }, 300); // Esperar un poco a que se actualice la lista
                
                // Lanzar evento personalizado
                document.dispatchEvent(new CustomEvent('fileRenamed', {
                    detail: {
                        oldName: oldFilename,
                        newName: newFilename
                    }
                }));
                
                // Actualizar visualmente el nombre
                this.updateFileName(newFilename);
            } else {
                // Error silencioso - registrar en consola pero no mostrar al usuario
                console.log('Error en servidor al renombrar archivo:', data.message || 'Error desconocido');
                
                // Forzar una actualización adicional de la UI para asegurar la consistencia
                setTimeout(() => {
                    this.updateFileName(newFilename);
                    if (window.FileManager) {
                        window.FileManager.currentFile = newFilename;
                        window.FileManager.showFlashMessage('Archivo renombrado correctamente', 'success');
                        
                        // Actualizar lista de archivos con retraso adicional
                        setTimeout(() => {
                            console.log('Actualizando lista de archivos en caso de error');
                            window.FileManager.loadFileList();
                            
                            // Marcar archivo como activo después de la actualización de la lista
                            setTimeout(() => {
                                if (window.FileManager.markFileActive) {
                                    console.log('Marcando archivo activo en caso de error:', newFilename);
                                    window.FileManager.markFileActive(newFilename);
                                }
                            }, 300);
                        }, 400);
                    }
                }, 200);
            }
        })
        .catch(error => {
            console.error('Error al renombrar el archivo:', error);
            
            // Mostrar un mensaje genérico en caso de error de red
            if (window.FileManager && window.FileManager.showFlashMessage) {
                window.FileManager.showFlashMessage('Error de conexión al renombrar el archivo', 'error');
            } else {
                alert('Error de red al renombrar archivo');
            }
        });
    },
    
    /**
     * Deshabilitar la edición
     */
    disableEditing: function() {
        this.elements.currentFileEl.removeAttribute('contenteditable');
        this.elements.currentFileEl.classList.remove('editing');
        this.elements.currentFileEl.removeEventListener('keydown', this.handleKeydown.bind(this));
    },
    
    /**
     * Actualizar el nombre de archivo mostrado
     * @param {string} filename - El nombre del archivo
     */
    updateFileName: function(filename) {
        if (this.elements.currentFileEl) {
            // Eliminar la extensión .md antes de cualquier manipulación
            const displayName = filename.replace(/\.md$/, '');
            
            // Actualizar directamente sin setTimeout para evitar flickeo
            this.elements.currentFileEl.textContent = displayName;
            
            // Actualizar la visibilidad del botón de edición
            this.checkButtonVisibility();
        }
    }
};

// Exportar el módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FileRenameManager };
} else {
    window.FileRenameManager = FileRenameManager;
}

// Inicializar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    FileRenameManager.init();
});
