<a id="preview-button" class="btn red disabled" title="Ver la página en el sitio web" href="#" target="_blank">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z"/></svg><span>Preview</span>
</a>

<!-- Script inline para asegurar que el botón funcione independientemente del módulo ES6 -->
<script>
  // Función para actualizar la URL del botón de preview basada en el archivo actual
  function updatePreviewButtonUrl() {
    // console.log('Actualizando URL del botón de preview (script inline)');
    
    // Obtener el botón
    const previewButton = document.getElementById('preview-button');
    if (!previewButton) {
      // console.error('Botón de preview no encontrado');
      return;
    }
    
    // Obtener el archivo actual desde FileManager
    let currentFile = '';
    if (window.FileManager && window.FileManager.currentFile) {
      currentFile = window.FileManager.currentFile;
      // console.log('Archivo actual desde FileManager:', currentFile);
    } else if (window.App && window.App.FileManager && window.App.FileManager.currentFile) {
      currentFile = window.App.FileManager.currentFile;
      // console.log('Archivo actual desde App.FileManager:', currentFile);
    }
    
    if (!currentFile) {
      // console.warn('No se encontró un archivo actual');
      previewButton.href = '#';
      previewButton.classList.add('disabled');
      
      // Prevenir navegación cuando está deshabilitado
      previewButton.onclick = function(e) {
        e.preventDefault();
        // alert('No hay un archivo seleccionado para previsualizar.');
      };
      return;
    }
    
    // Extraer la colección y el slug
    let collection = '';
    let slug = '';
    
    // Función para convertir texto a un slug válido para URLs
    function slugify(text) {
      return text
        .toString()                   // Convertir a string en caso de que sea un número
        .toLowerCase()                // Convertir a minúsculas
        .normalize('NFD')             // Normalizar caracteres (descomponer acentos)
        .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos (acentos)
        .replace(/[^\w\s-]/g, '')     // Eliminar caracteres no permitidos
        .replace(/\s+/g, '-')         // Reemplazar espacios por guiones
        .replace(/--+/g, '-')         // Eliminar guiones múltiples
        .trim()                       // Eliminar espacios al inicio y final
        .replace(/^-+|-+$/g, '');     // Eliminar guiones al inicio y final
    }
    
    // Obtener colección de la URL actual
    try {
      // Obtener la URL actual y extraer la colección como el último directorio
      const currentUrl = window.location.pathname;
      // Eliminar cualquier parámetro de consulta o hash
      const cleanUrl = currentUrl.split('?')[0].split('#')[0];
      // Dividir por '/' y filtrar elementos vacíos
      const urlParts = cleanUrl.split('/').filter(part => part.length > 0);
      // El último directorio en la URL es la colección actual
      if (urlParts.length > 0) {
        collection = urlParts[urlParts.length - 1];
        console.log('Colección obtenida de la URL:', collection);
      }
    } catch (e) {
      console.error('Error al obtener colección de la URL:', e);
    }
    
    // Si aún no tenemos colección, intentar obtenerla del currentFile
    if (!collection && currentFile) {
      if (currentFile.includes('/')) {
        // Si el path tiene formato "colección/archivo.md"
        const pathParts = currentFile.split('/');
        // La colección es el primer elemento de la ruta
        collection = pathParts[0];
        const fileName = pathParts[pathParts.length - 1];
        // Obtener el nombre sin extensión y convertir a slug
        const fileNameWithoutExt = fileName.replace(/\.md$/, '');
        slug = slugify(fileNameWithoutExt);
      } else {
        // Obtener el nombre sin extensión y convertir a slug
        const fileNameWithoutExt = currentFile.replace(/\.md$/, '');
        slug = slugify(fileNameWithoutExt);
      }
    } else if (!slug && currentFile) {
      // Si ya tenemos colección pero no slug, extraer slug del currentFile
      const fileName = currentFile.includes('/') 
        ? currentFile.split('/').pop() 
        : currentFile;
      const fileNameWithoutExt = fileName.replace(/\.md$/, '');
      slug = slugify(fileNameWithoutExt);
    }
    
    console.log('Colección final:', collection);
    console.log('Slug final:', slug);
    
    // Construir la URL de preview - Asegurarnos de que collection tenga un valor
    // Usar 'blog' como valor predeterminado si no se detecta la colección
    const previewUrl = `../../../${collection || 'blog'}/${slug}`;
    console.log('URL de preview generada:', previewUrl);
    
    // Actualizar el botón
    previewButton.href = previewUrl;
    previewButton.classList.remove('disabled');
    previewButton.onclick = null; // Eliminar el handler que previene la navegación
  }
  
  // Ejecutar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    // console.log('DOM cargado, configurando botón de preview');
    
    // Intentar actualizar inmediatamente
    setTimeout(updatePreviewButtonUrl, 1000);
    
    // Escuchar el evento fileLoaded
    document.addEventListener('fileLoaded', function(e) {
      // console.log('Evento fileLoaded detectado:', e.detail);
      setTimeout(updatePreviewButtonUrl, 500);
    });
  });
  
  // Si el DOM ya está cargado, ejecutar ahora
  if (document.readyState !== 'loading') {
    // console.log('DOM ya cargado, configurando botón de preview inmediatamente');
    setTimeout(updatePreviewButtonUrl, 1000);
  }
</script>