<script>
    // Aplicar el tema antes de que se renderice la página
    (function() {
      const theme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Aplicar tema basado en preferencia guardada o preferencia del sistema
      if (theme === 'dark' || (!theme && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Registrar un listener para cambios en la preferencia del sistema
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      });
      
      // console.log('Initial theme applied:', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    })();
  </script>

<!-- Define system paths and constants for JavaScript -->
<script>
    // Path constants from PHP
    window.PATHS = {
        ROOT: document.documentElement.dataset.rootUri || '/',
        CMS: document.documentElement.dataset.cmsUri || '/content/',
        PARENT: document.documentElement.dataset.parent || '../',
        ASSETS: document.documentElement.dataset.assetsUri || '../public/',
        MEDIA: document.documentElement.dataset.mediaLibrary || '../public/img',
        JS: document.documentElement.dataset.parent ? document.documentElement.dataset.parent + 'js/' : '../js/',
        CSS: document.documentElement.dataset.parent ? document.documentElement.dataset.parent + 'css/' : '../css/'
    };
    
    console.log('System paths loaded:', window.PATHS);
</script>

<!-- Define API base path and collection for collection-based structure -->
<?php
// Detectar automáticamente las colecciones disponibles en el directorio collections
$collections = [];
$collectionsDir = __DIR__ . '/../collections';

if (is_dir($collectionsDir)) {
    $items = scandir($collectionsDir);
    foreach ($items as $item) {
        if ($item != '.' && $item != '..' && is_dir($collectionsDir . '/' . $item)) {
            $collections[] = $item;
        }
    }
}

// Convertir el array de colecciones a formato JSON para JavaScript
$collectionsJson = json_encode($collections);
?>

<script>
    // Detect if we're in a collection subdirectory and set API path accordingly
    (function() {
      const pathParts = window.location.pathname.split('/');
      
      // Detect current collection
      let currentCollection = '';
      // Obtener las colecciones detectadas automáticamente desde PHP
      const knownCollections = <?php echo $collectionsJson; ?> || [];
      
      // Exponer las colecciones en una variable global para otros scripts
      window.knownCollections = knownCollections;
      let collectionsFound = false;
      
      // Primero verificamos si estamos en el directorio 'collections'
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'collections') {
          collectionsFound = true;
          // Si el siguiente elemento existe y es una colección conocida
          if (i+1 < pathParts.length && knownCollections.includes(pathParts[i+1])) {
            currentCollection = pathParts[i+1];
            break;
          }
        }
      }
      
      // Búsqueda de respaldo por si la detección anterior falla
      if (!currentCollection) {
        for (const part of pathParts) {
          if (knownCollections.includes(part)) {
            currentCollection = part;
            break;
          }
        }
      }
      
      // Set global variables for API path and collection
      window.CURRENT_COLLECTION = currentCollection;
      // Ajuste para la nueva estructura de directorios con colecciones en /collections/
      window.API_BASE_PATH = currentCollection ? '../../process.php' : './process.php';
      
      // Helper function to append collection parameter to API calls
      window.getApiUrl = function(endpoint) {
        const baseUrl = window.API_BASE_PATH + endpoint;
        const hasParams = baseUrl.includes('?');
        const connector = hasParams ? '&' : '?';
        
        return window.CURRENT_COLLECTION 
          ? baseUrl + connector + 'collection=' + encodeURIComponent(window.CURRENT_COLLECTION)
          : baseUrl;
      };
      
      // console.log('API configuration:', {
      //   basePath: window.API_BASE_PATH,
      //   collection: window.CURRENT_COLLECTION
      // });
    })();
</script>