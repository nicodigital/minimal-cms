<div class="collection-buttons flex space-x-2">
  <?php
  // Obtener el directorio raíz (content)
  $rootDir = dirname(dirname(dirname(__FILE__))); // Subir tres niveles: partials -> layout -> content

  // Directorios a excluir
  $excludeDirs = ['demo'];

  // Obtener todos los directorios dentro de 'collections'
  $collectionsDir = $rootDir . '/collections';
  $dirs = array_filter(glob($collectionsDir . '/*'), 'is_dir');

  // Filtrar solo las colecciones válidas (directorios que no están en la lista de exclusión)
  $validCollections = array_filter($dirs, function($dir) use ($excludeDirs) {
    return !in_array(basename($dir), $excludeDirs);
  });
  
  // Solo mostrar los botones si hay más de una colección
  if (count($validCollections) > 1) {
    // Detectar la colección actual de manera más robusta
    $currentCollection = '';
    
    // Método 1: Detectar por URL
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    $uriParts = explode('/', trim($requestUri, '/'));
    
    // Buscar primero el directorio 'collections' y luego la colección
    $collectionsFound = false;
    for ($i = 0; $i < count($uriParts); $i++) {
      if ($uriParts[$i] === 'collections') {
        $collectionsFound = true;
        // Verificar si el siguiente elemento es una colección válida
        if (isset($uriParts[$i+1]) && !in_array($uriParts[$i+1], $excludeDirs) && is_dir($collectionsDir . '/' . $uriParts[$i+1])) {
          $currentCollection = $uriParts[$i+1];
          break;
        }
      }
    }
    
    // Buscar por nombre de colección como respaldo
    if (!$collectionsFound) {
      foreach ($uriParts as $part) {
        if (!empty($part) && is_dir($collectionsDir . '/' . $part) && !in_array($part, $excludeDirs)) {
          $currentCollection = $part;
          break;
        }
      }
    }
    
    // Método 2: Detectar por script actual si el método 1 falló
    if (empty($currentCollection) && isset($_SERVER['SCRIPT_FILENAME'])) {
      $scriptPath = $_SERVER['SCRIPT_FILENAME'];
      $pathParts = explode(DIRECTORY_SEPARATOR, $scriptPath);
      
      // Buscar primero 'collections' y luego la colección
      for ($i = 0; $i < count($pathParts); $i++) {
        if ($pathParts[$i] === 'collections') {
          if (isset($pathParts[$i+1]) && !in_array($pathParts[$i+1], $excludeDirs) && is_dir($collectionsDir . '/' . $pathParts[$i+1])) {
            $currentCollection = $pathParts[$i+1];
            break;
          }
        }
      }
      
      // Buscar directamente por nombre de colección si lo anterior falla
      if (empty($currentCollection)) {
        foreach ($pathParts as $part) {
          if (!empty($part) && is_dir($collectionsDir . '/' . $part) && !in_array($part, $excludeDirs)) {
            $currentCollection = $part;
            break;
          }
        }
      }
    }
    
    // Método 3: Detectar por HTTP_REFERER si los métodos anteriores fallaron
    if (empty($currentCollection) && isset($_SERVER['HTTP_REFERER'])) {
      $refererParts = parse_url($_SERVER['HTTP_REFERER']);
      if (isset($refererParts['path'])) {
        $pathParts = explode('/', trim($refererParts['path'], '/'));
        
        // Buscar primero 'collections' y luego la colección
        for ($i = 0; $i < count($pathParts); $i++) {
          if ($pathParts[$i] === 'collections') {
            if (isset($pathParts[$i+1]) && !in_array($pathParts[$i+1], $excludeDirs) && is_dir($collectionsDir . '/' . $pathParts[$i+1])) {
              $currentCollection = $pathParts[$i+1];
              break;
            }
          }
        }
        
        // Buscar directamente por nombre de colección si lo anterior falla
        if (empty($currentCollection)) {
          foreach ($pathParts as $part) {
            if (!empty($part) && is_dir($collectionsDir . '/' . $part) && !in_array($part, $excludeDirs)) {
              $currentCollection = $part;
              break;
            }
          }
        }
      }
    }
    
    // Detectar la ruta base del CMS (para cuando está en un subdirectorio)
    $basePath = '';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    
    // Extraer la ruta base del script actual
    $scriptPath = dirname($scriptName);
    $scriptPathParts = explode('/', trim($scriptPath, '/'));
    
    // Encontrar el directorio 'content' en la ruta
    $contentIndex = array_search('content', $scriptPathParts);
    if ($contentIndex !== false) {
      // Construir la ruta base hasta el directorio 'content'
      $basePath = '/' . implode('/', array_slice($scriptPathParts, 0, $contentIndex + 1)) . '/';
    } else {
      // Fallback: intentar detectar por REQUEST_URI
      $uriParts = explode('/', trim($requestUri, '/'));
      $contentIndex = array_search('content', $uriParts);
      if ($contentIndex !== false) {
        $basePath = '/' . implode('/', array_slice($uriParts, 0, $contentIndex + 1)) . '/';
      }
    }
    
    // Si todo falla, usar una detección simple basada en el nombre del directorio raíz
    if (empty($basePath)) {
      $basePath = '/' . basename(dirname($rootDir)) . '/' . basename($rootDir) . '/';
    }
    
    // Crear un botón para cada directorio que no esté en la lista de exclusión
    foreach ($validCollections as $dir) {
      $dirName = basename($dir);
      
      // Determinar si este es el botón de la colección actual
      $isActive = ($dirName === $currentCollection);
      $activeClass = $isActive 
        ? 'btn active' 
        : 'btn neutral';
      
      // Generar el botón con la ruta base detectada y considerando el directorio 'collections'
      echo '<a href="' . $basePath . 'collections/' . $dirName . '/" class="' . $activeClass . ' px-3 py-2 rounded transition cursor-pointer capitalize">' . $dirName . '</a>';
    }
  } elseif (count($validCollections) === 0) {
    // Si no se encontraron colecciones, mostrar un mensaje
    echo '<span class="text-neutral-500 dark:text-neutral-400 italic">No collections found</span>';
  }
  // Si hay exactamente 1 colección, no mostramos nada
  ?>
</div>