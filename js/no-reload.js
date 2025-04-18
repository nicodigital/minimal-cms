/**
 * Prevención de recarga de página
 * 
 * Este script previene cualquier recarga de página no deseada después de guardar cambios
 * en el editor SimpleMDE.
 */

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  // Interceptar cualquier intento de recarga de página
  const originalHistoryPushState = history.pushState;
  const originalHistoryReplaceState = history.replaceState;
  const originalWindowLocation = Object.getOwnPropertyDescriptor(window, 'location');

  // Prevenir cambios en window.location después de guardar
  let isAfterSave = false;
  
  // Escuchar el evento de guardado
  document.addEventListener('afterFileSave', function(e) {
    console.log('Archivo guardado:', e.detail.filename);
    isAfterSave = true;
    
    // Restablecer la bandera después de un tiempo
    setTimeout(() => {
      isAfterSave = false;
    }, 1000);
  });

  // Interceptar cambios en window.location
  if (originalWindowLocation && originalWindowLocation.set) {
    Object.defineProperty(window, 'location', {
      ...originalWindowLocation,
      set: function(value) {
        // Si estamos después de guardar, prevenir la redirección
        if (isAfterSave) {
          console.log('Prevención de redirección después de guardar');
          return;
        }
        
        // De lo contrario, permitir el comportamiento normal
        return originalWindowLocation.set.call(this, value);
      }
    });
  }

  // Interceptar history.pushState
  history.pushState = function() {
    if (isAfterSave) {
      console.log('Prevención de history.pushState después de guardar');
      return;
    }
    return originalHistoryPushState.apply(this, arguments);
  };

  // Interceptar history.replaceState
  history.replaceState = function() {
    if (isAfterSave) {
      console.log('Prevención de history.replaceState después de guardar');
      return;
    }
    return originalHistoryReplaceState.apply(this, arguments);
  };

  // Interceptar formularios que puedan causar recargas
  document.addEventListener('submit', function(e) {
    // Si el formulario se envía después de guardar, prevenir el envío
    if (isAfterSave) {
      console.log('Prevención de envío de formulario después de guardar');
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // Interceptar clics en enlaces que puedan causar recargas
  document.addEventListener('click', function(e) {
    // Si el clic es en un enlace después de guardar, prevenir la navegación
    if (isAfterSave && e.target.tagName === 'A') {
      console.log('Prevención de navegación por enlace después de guardar');
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  console.log('Sistema de prevención de recarga instalado');
});
