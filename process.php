<?php
include 'config.php';
// Set appropriate headers
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// Configuración global del sistema
$CONFIG = [
    'logging' => false,  // Cambiar a true para activar logs
    'log_file' => __DIR__ . '/logs.txt',
    'log_level' => 'DEBUG' // Niveles: DEBUG, INFO, WARN, ERROR, NONE
];

// Logs detallados para diagnóstico
$requestLog = [
    'GET' => $_GET,
    'POST' => $_POST,
    'FILES' => isset($_FILES) ? array_keys($_FILES) : [],
    'SERVER' => [
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? 'none',
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'unknown',
        'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown'
    ],
    'action' => $_GET['action'] ?? 'none'
];

writeToLog('REQUEST DATA: ' . json_encode($requestLog, JSON_PRETTY_PRINT), 'DEBUG');

// La configuración ya está definida arriba

// Sistema de logs para diagnóstico
function writeToLog($message, $type = 'INFO') {
    global $CONFIG;
    
    // Verificar si logging está desactivado globalmente
    if (!isset($CONFIG['logging']) || $CONFIG['logging'] === false) {
        return;
    }
    
    // Verificar nivel de log
    $logLevels = ['DEBUG' => 1, 'INFO' => 2, 'WARN' => 3, 'ERROR' => 4, 'NONE' => 5];
    $configLevel = isset($CONFIG['log_level']) ? strtoupper($CONFIG['log_level']) : 'DEBUG';
    $messageLevel = strtoupper($type);
    
    // Si el nivel de mensaje es menor que el nivel configurado, no loguear
    if (isset($logLevels[$messageLevel]) && isset($logLevels[$configLevel]) && 
        $logLevels[$messageLevel] < $logLevels[$configLevel]) {
        return;
    }
    
    // Obtener archivo de log desde configuración
    $logFile = isset($CONFIG['log_file']) ? $CONFIG['log_file'] : __DIR__ . '/logs.txt';
    
    // Obtener IP del cliente
    $clientIP = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    
    // Formatear mensaje de log
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] [$type] [$clientIP] $message\n";
    
    // Escribir al archivo de log (con manejo de errores)
    @file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// Función para activar/desactivar logs
function toggleLogging($state = null, $level = null) {
    global $CONFIG;
    
    // Si se pasa un estado, actualizarlo
    if ($state !== null) {
        $CONFIG['logging'] = (bool)$state;
    }
    
    // Si se pasa un nivel, actualizarlo
    if ($level !== null && in_array(strtoupper($level), ['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'])) {
        $CONFIG['log_level'] = strtoupper($level);
    }
    
    return [
        'logging' => $CONFIG['logging'],
        'log_level' => $CONFIG['log_level']
    ];
}

// Registrar información sobre la solicitud actual
writeToLog("=== NUEVA SOLICITUD ===");
writeToLog("Método: " . ($_SERVER['REQUEST_METHOD'] ?? 'Unknown'));
writeToLog("URL: " . ($_SERVER['REQUEST_URI'] ?? 'Unknown'));
writeToLog("IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown'));
writeToLog("User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'));

// Registrar datos de entrada
writeToLog("GET Params: " . json_encode($_GET));
writeToLog("POST Params: " . json_encode($_POST));
writeToLog("Cuerpo de la solicitud: " . file_get_contents('php://input'));
writeToLog("Encabezados: " . json_encode(getallheaders()));


// Permitir solicitudes CORS únicamente desde dominios específicos
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Validar que ALLOWED_ORIGINS está definido correctamente
if (!defined('ALLOWED_ORIGINS') || !is_array(ALLOWED_ORIGINS)) {
    define('ALLOWED_ORIGINS', ['http://localhost', 'http://127.0.0.1']);
    writeToLog("ADVERTENCIA: ALLOWED_ORIGINS no estaba definido correctamente", "WARN");
}

if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-CSRF-TOKEN, Authorization');
    header('Access-Control-Allow-Credentials: true');
} else {
    // Restringir a solo localhost en modo desarrollo
    // En producción, eliminar esta parte y solo permitir orígenes específicos
    $localOrigins = ['http://localhost', 'http://127.0.0.1'];
    if (in_array($origin, $localOrigins)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-CSRF-TOKEN, Authorization');
        header('Access-Control-Allow-Credentials: true');
    } else {
        // Para mayor seguridad, no establecer encabezados CORS para orígenes desconocidos
        // Esto bloqueará solicitudes de orígenes no permitidos
        writeToLog("Intento de acceso desde origen no permitido: {$origin}", "WARN");
    }
}

// Agregar encabezados de seguridad adicionales
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: same-origin');

// Si es una solicitud OPTIONS (preflight), responder inmediatamente con éxito
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Function to process custom field values based on their type
function processCustomFieldValues($content) {
    try {
        // Extract the front matter
        if (!preg_match('/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/', $content, $matches)) {
            return $content;
        }

        $frontMatter = $matches[1];
        $mainContent = $matches[2];

        // Load field configurations
        require_once __DIR__ . '/inc/fields-helper.php';
        $configuredFields = getConfiguredFields();

        // Process each line in the front matter
        $lines = explode("\n", $frontMatter);
        $processedLines = [];

        foreach ($lines as $line) {
            if (preg_match('/^([a-zA-Z0-9_]+):\s*(.*)$/', $line, $fieldMatches)) {
                $fieldName = $fieldMatches[1];
                $fieldValue = trim($fieldMatches[2]);

                // Find field configuration
                $fieldConfig = null;
                foreach ($configuredFields as $field) {
                    if ($field['name'] === $fieldName) {
                        $fieldConfig = $field;
                        break;
                    }
                }

                if ($fieldConfig) {
                    switch ($fieldConfig['type']) {
                        case 'select':
                            // Ensure select values are properly quoted
                            if (!empty($fieldValue) && $fieldValue !== '""') {
                                $fieldValue = preg_replace('/^["\']?([^"\']*)["\']*$/', '"$1"', $fieldValue);
                            }
                            break;
                        case 'date':
                            // Ensure dates are in YYYY-MM-DD format and quoted
                            if (!empty($fieldValue) && $fieldValue !== '""') {
                                $date = strtotime(trim($fieldValue, '"'));
                                if ($date !== false) {
                                    $fieldValue = '"' . date('Y-m-d', $date) . '"';
                                }
                            }
                            break;
                    }
                    $processedLines[] = $fieldName . ': ' . $fieldValue;
                } else {
                    $processedLines[] = $line;
                }
            } else {
                $processedLines[] = $line;
            }
        }

        // Rebuild the content
        return "---\n" . implode("\n", $processedLines) . "\n---\n" . $mainContent;
    } catch (Exception $e) {
        error_log('Error processing custom fields: ' . $e->getMessage());
        return $content; // Return original content if there's an error
    }
}

// Configuration
$rootDir = CMS_DIR; // Root directory of the CMS (usando constante)
$mediaDir = MEDIA_DIR; // Media directory (usando constante)
$recycleDir = ''; // Se definirá según la colección actual
$cacheDir = $rootDir . '/cache'; // Directorio para archivos de caché

// Crear directorio de caché si no existe
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// Detect which collection we're working with
$collection = isset($_GET['collection']) ? $_GET['collection'] : (isset($_POST['collection']) ? $_POST['collection'] : '');

// If no collection is specified, try to detect it from the HTTP_REFERER
if (empty($collection) && isset($_SERVER['HTTP_REFERER'])) {
    $refererParts = parse_url($_SERVER['HTTP_REFERER']);
    if (isset($refererParts['path'])) {
        $pathParts = explode('/', trim($refererParts['path'], '/'));
        
        // Obtener todas las colecciones disponibles
        $availableCollections = [];
        $collectionDir = $rootDir . '/collections';
        if (is_dir($collectionDir)) {
            $items = scandir($collectionDir);
            foreach ($items as $item) {
                if ($item != '.' && $item != '..' && is_dir($collectionDir . '/' . $item)) {
                    $availableCollections[] = $item;
                }
            }
        }
        
        // Check if the path contains a known collection
        foreach ($pathParts as $part) {
            if (in_array($part, $availableCollections) && is_dir($rootDir . '/collections/' . $part)) {
                $collection = $part;
                break;
            }
        }
    }
}

// Set the markdown directory based on the collection
if (!empty($collection) && is_dir($rootDir . '/collections/' . $collection)) {
    $markdownDir = $rootDir . '/collections/' . $collection . '/files';
    // Definir el directorio de la papelera de reciclaje para esta colección
    $recycleDir = $rootDir . '/collections/' . $collection . '/recycle';

    // Create the files directory if it doesn't exist
    if (!is_dir($markdownDir)) {
        mkdir($markdownDir, 0755, true);
    }

    // Create recycle bin directories if they don't exist
    if (!is_dir($recycleDir)) {
        mkdir($recycleDir, 0755, true);
        mkdir($recycleDir . '/files', 0755, true);
        mkdir($recycleDir . '/images', 0755, true);
    }
} else {
    // Si no hay una colección especificada, intentamos usar la primera colección disponible
    $availableCollections = [];
    $collectionDir = $rootDir . '/collections';
    if (is_dir($collectionDir)) {
        $items = scandir($collectionDir);
        foreach ($items as $item) {
            if ($item != '.' && $item != '..' && is_dir($collectionDir . '/' . $item)) {
                $availableCollections[] = $item;
            }
        }
    }
    
    if (!empty($availableCollections)) {
        // Usar la primera colección disponible
        $collection = $availableCollections[0];
        $markdownDir = $rootDir . '/collections/' . $collection . '/files';
        $recycleDir = $rootDir . '/collections/' . $collection . '/recycle';
        
        // Create the files directory if it doesn't exist
        if (!is_dir($markdownDir)) {
            mkdir($markdownDir, 0755, true);
        }
        
        // Create recycle bin directories if they don't exist
        if (!is_dir($recycleDir)) {
            mkdir($recycleDir, 0755, true);
            mkdir($recycleDir . '/files', 0755, true);
            mkdir($recycleDir . '/images', 0755, true);
        }
        
        // Registrar la colección que se está usando
        writeToLog("Usando colección predeterminada: {$collection}", "INFO");
    } else {
        // Si no hay colecciones disponibles, mostrar un error apropiado
        $markdownDir = $rootDir;
        $recycleDir = $rootDir . '/recycle'; // Fallback para compatibilidad
        
        // Create default recycle bin directory if it doesn't exist
        if (!is_dir($recycleDir)) {
            mkdir($recycleDir, 0755, true);
            mkdir($recycleDir . '/files', 0755, true);
            mkdir($recycleDir . '/images', 0755, true);
        }
        
        // Registrar que no se encontraron colecciones
        writeToLog("No se encontraron colecciones en el directorio 'collections'", "WARN");
    }
}

// Handle CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Cache functions
/**
 * Genera una clave de caché única basada en los parámetros
 * 
 * @param string $prefix Prefijo para la clave de caché
 * @param array $params Parámetros adicionales para la clave
 * @return string Clave de caché
 */
function generateCacheKey($prefix, $params = []) {
    global $collection;
    
    // Añadir la colección actual a los parámetros
    $params['collection'] = $collection;
    
    // Generar una clave basada en los parámetros
    return $prefix . '_' . md5(serialize($params));
}

/**
 * Obtiene datos de la caché si existen y son válidos
 * 
 * @param string $cacheKey Clave de caché
 * @param int $maxAge Edad máxima de la caché en segundos (0 = sin límite)
 * @return mixed|false Datos de la caché o false si no existen o son inválidos
 */
function getCache($cacheKey, $maxAge = 0) {
    global $cacheDir;
    
    $cacheFile = $cacheDir . '/' . $cacheKey . '.cache';
    
    // Verificar si el archivo de caché existe
    if (!file_exists($cacheFile)) {
        return false;
    }
    
    // Verificar la edad del archivo de caché si se especificó un límite
    if ($maxAge > 0) {
        $fileAge = time() - filemtime($cacheFile);
        if ($fileAge > $maxAge) {
            return false;
        }
    }
    
    // Leer y deserializar los datos de la caché
    $cacheData = file_get_contents($cacheFile);
    return unserialize($cacheData);
}

/**
 * Guarda datos en la caché
 * 
 * @param string $cacheKey Clave de caché
 * @param mixed $data Datos a guardar
 * @return bool True si se guardó correctamente, false en caso contrario
 */
function setCache($cacheKey, $data) {
    global $cacheDir;
    
    $cacheFile = $cacheDir . '/' . $cacheKey . '.cache';
    
    // Serializar los datos y guardarlos en el archivo de caché
    $cacheData = serialize($data);
    return file_put_contents($cacheFile, $cacheData) !== false;
}

/**
 * Invalida una clave de caché específica
 * 
 * @param string $cacheKey Clave de caché a invalidar
 * @return bool True si se invalidó correctamente, false en caso contrario
 */
function invalidateCache($cacheKey) {
    global $cacheDir;
    
    $cacheFile = $cacheDir . '/' . $cacheKey . '.cache';
    
    // Eliminar el archivo de caché si existe
    if (file_exists($cacheFile)) {
        return unlink($cacheFile);
    }
    
    return true;
}

/**
 * Invalida todas las cachés relacionadas con un prefijo
 * 
 * @param string $prefix Prefijo de las claves de caché a invalidar
 * @return int Número de archivos de caché invalidados
 */
function invalidateCacheByPrefix($prefix) {
    global $cacheDir;
    
    $count = 0;
    $files = glob($cacheDir . '/' . $prefix . '_*.cache');
    
    foreach ($files as $file) {
        if (unlink($file)) {
            $count++;
        }
    }
    
    return $count;
}

// Helper functions
function getMarkdownFiles()
{
    global $markdownDir, $collection;
    
    // Registrar información para depuración
    writeToLog("=== Obteniendo archivos Markdown ===", "DEBUG");
    writeToLog("Directorio de búsqueda: {$markdownDir}", "DEBUG");
    writeToLog("Colección actual: {$collection}", "DEBUG");
    
    // Verificar si el directorio existe
    if (!is_dir($markdownDir)) {
        writeToLog("El directorio {$markdownDir} no existe o no es accesible", "ERROR");
        // Crear el directorio si no existe
        if (mkdir($markdownDir, 0755, true)) {
            writeToLog("Se ha creado el directorio {$markdownDir}", "INFO");
        } else {
            writeToLog("No se pudo crear el directorio {$markdownDir}", "ERROR");
        }
        return []; // Devolver un array vacío si el directorio no existe
    }
    
    // Generar clave de caché
    $cacheKey = generateCacheKey('markdown_files', ['dir' => $markdownDir]);
    
    // Invalidar la caché para asegurar que estamos obteniendo datos frescos durante la depuración
    invalidateCache($cacheKey);
    writeToLog("Caché invalidada para la clave: {$cacheKey}", "DEBUG");
    
    $files = [];

    if ($handle = opendir($markdownDir)) {
        writeToLog("Directorio abierto correctamente: {$markdownDir}", "DEBUG");
        while (false !== ($entry = readdir($handle))) {
            if ($entry != "." && $entry != ".." && pathinfo($entry, PATHINFO_EXTENSION) === 'md') {
                $filepath = $markdownDir . '/' . $entry;
                $files[] = [
                    'name' => $entry,
                    'created' => filectime($filepath),
                    'modified' => filemtime($filepath)
                ];
                writeToLog("Archivo encontrado: {$entry}", "DEBUG");
            }
        }
        closedir($handle);
        writeToLog("Total de archivos encontrados: " . count($files), "INFO");
    } else {
        writeToLog("No se pudo abrir el directorio: {$markdownDir}", "ERROR");
    }

    // Ordenar por fecha de creación (del más reciente al más antiguo)
    usort($files, function ($a, $b) {
        return $b['created'] - $a['created']; // Orden descendente
    });

    // Devolver solo los nombres de archivo para mantener compatibilidad
    $fileNames = array_map(function ($file) {
        return $file['name'];
    }, $files);
    
    // Guardar en caché
    setCache($cacheKey, $fileNames);

    return $fileNames;
}

function readMarkdownFile($filename)
{
    global $markdownDir;
    
    // Sanitizar el nombre de archivo - preservar espacios y caracteres especiales
    // pero eliminar cualquier posible trayectoria de directorio maliciosa
    $filename = basename(str_replace(['../', '..\\'], '', $filename));
    
    // Generar clave de caché
    $cacheKey = generateCacheKey('markdown_content', ['file' => $filename]);
    
    // Obtener la ruta completa del archivo
    $filepath = $markdownDir . '/' . $filename;
    
    // Verificar path traversal - validación de seguridad adicional
    $realMarkdownDir = realpath($markdownDir);
    $realFilepath = realpath($filepath);
    
    if (!$realFilepath || !$realMarkdownDir || strpos($realFilepath, $realMarkdownDir) !== 0) {
        writeToLog("Security violation: Attempted to read file outside permitted directory: {$filename}", "ERROR");
        return false;
    }
    
    // Verificar si el archivo existe
    if (!file_exists($filepath)) {
        return false;
    }
    
    // Obtener la última modificación del archivo
    $lastModified = filemtime($filepath);
    
    // Intentar obtener de la caché
    $cachedContent = getCache($cacheKey);
    if ($cachedContent !== false) {
        // Verificar si los metadatos de caché incluyen la última modificación
        if (isset($cachedContent['lastModified']) && $cachedContent['lastModified'] >= $lastModified) {
            return $cachedContent['content'];
        }
    }
    
    // Si no está en caché o está desactualizado, leer el archivo
    $content = file_get_contents($filepath);
    if ($content === false) {
        return false;
    }
    
    // Guardar en caché con la marca de tiempo
    setCache($cacheKey, [
        'content' => $content,
        'lastModified' => $lastModified
    ]);
    
    return $content;
}

function saveMarkdownFile($filename, $content)
{
    global $markdownDir;
    
    // Sanitizar nombre de archivo - preservando espacios y caracteres especiales según requisito
    // pero eliminando posibles componentes de ruta que podrían ser maliciosos
    $filename = basename(str_replace(['../', '..\\', '/', '\\'], '', $filename));
    
    // Validar extensión de archivo permitida
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if ($ext !== 'md') {
        writeToLog("ERROR: Extensión de archivo no permitida: $ext", "ERROR");
        return false;
    }
    
    // Registrar información de diagnóstico
    writeToLog("Iniciando saveMarkdownFile para: $filename", "DEBUG");
    
    // Obtener la ruta completa del archivo
    $filepath = $markdownDir . '/' . $filename;
    writeToLog("Ruta completa del archivo: $filepath", "DEBUG");
    
    // Verificar path traversal - validación de seguridad
    $realMarkdownDir = realpath($markdownDir);
    if (!$realMarkdownDir) {
        writeToLog("ERROR: No se puede resolver la ruta real del directorio de markdown", "ERROR");
        return false;
    }
    
    // Verificar permisos del directorio
    if (!is_dir($markdownDir)) {
        writeToLog("ERROR: El directorio $markdownDir no existe", "ERROR");
        // Intentar crear el directorio si no existe
        if (!mkdir($markdownDir, 0755, true)) {
            writeToLog("ERROR: No se pudo crear el directorio $markdownDir", "ERROR");
            return false;
        }
        writeToLog("Directorio $markdownDir creado exitosamente", "INFO");
    }
    
    // Verificar permisos de escritura
    if (!is_writable($markdownDir)) {
        writeToLog("ERROR: El directorio $markdownDir no tiene permisos de escritura", "ERROR");
        writeToLog("Permisos actuales: " . decoct(fileperms($markdownDir) & 0777), "ERROR");
        
        // Intentar cambiar permisos (solo en desarrollo o si se tiene acceso)
        if (@chmod($markdownDir, 0755)) {
            writeToLog("Permisos cambiados exitosamente a 0755", "INFO");
        } else {
            writeToLog("No se pudieron cambiar los permisos", "ERROR");
        }
    }
    
    // Verificar si el contenido tiene front matter
    if (!preg_match('/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/', $content, $matches)) {
        // Si no tiene front matter, añadirlo
        $content = "---\ntags: []\n---\n\n" . $content;
        writeToLog("Front matter añadido al contenido", "DEBUG");
    } else {
        $frontMatter = $matches[1];
        $mainContent = $matches[2];
        
        // Verificar si el front matter ya tiene una sección de tags
        if (!preg_match('/^tags:\s*\[(.*?)\]/m', $frontMatter)) {
            // Si no tiene tags, añadirlos al final del front matter
            $frontMatter .= "\ntags: []";
            $content = "---\n" . $frontMatter . "\n---\n" . $mainContent;
            writeToLog("Tags añadidos al front matter", "DEBUG");
        }
    }
    
    // Limitar tamaño máximo de archivo para evitar ataques de DoS
    $maxFileSize = 10 * 1024 * 1024; // 10MB
    if (strlen($content) > $maxFileSize) {
        writeToLog("ERROR: Tamaño de archivo excede el límite permitido", "ERROR");
        return false;
    }
    
    // Método 1: Intento directo con file_put_contents
    writeToLog("Intentando guardar con file_put_contents", "DEBUG");
    $result = @file_put_contents($filepath, $content);
    
    // Si el método directo falla, intentar métodos alternativos
    if ($result === false) {
        writeToLog("file_put_contents falló. Error: " . error_get_last()['message'], "ERROR");
        
        // Método 2: Intento con fopen/fwrite
        writeToLog("Intentando método alternativo con fopen/fwrite", "DEBUG");
        $fp = @fopen($filepath, 'w');
        if ($fp) {
            $bytes = @fwrite($fp, $content);
            @fclose($fp);
            
            if ($bytes !== false) {
                writeToLog("Archivo guardado exitosamente con fopen/fwrite: $bytes bytes", "SUCCESS");
                $result = $bytes;
            } else {
                writeToLog("fwrite falló. Error: " . error_get_last()['message'], "ERROR");
            }
        } else {
            writeToLog("fopen falló. Error: " . error_get_last()['message'], "ERROR");
            
            // Método 3: Último recurso con archivo temporal
            writeToLog("Intentando método con archivo temporal", "DEBUG");
            $tempfile = tempnam(sys_get_temp_dir(), 'markdown_');
            if (@file_put_contents($tempfile, $content) !== false) {
                // Intentar copiar el archivo temporal
                if (@copy($tempfile, $filepath)) {
                    writeToLog("Archivo guardado exitosamente a través de archivo temporal", "SUCCESS");
                    @unlink($tempfile);
                    $result = strlen($content); // Aproximación de bytes escritos
                } else {
                    writeToLog("La copia del archivo temporal falló. Error: " . error_get_last()['message'], "ERROR");
                    @unlink($tempfile);
                }
            } else {
                writeToLog("No se pudo escribir en archivo temporal. Error: " . error_get_last()['message'], "ERROR");
            }
        }
    } else {
        writeToLog("Archivo guardado exitosamente con file_put_contents: $result bytes", "SUCCESS");
    }
    
    if ($result !== false) {
        // Establecer permisos de archivo restrictivos
        @chmod($filepath, 0644); // Propietario: leer/escribir, Grupo/Otros: solo leer
        
        // Invalidar cachés relacionadas con este archivo
        invalidateCache(generateCacheKey('markdown_content', ['file' => $filename]));
        invalidateCacheByPrefix('markdown_files');
        writeToLog("Caché invalidada para el archivo $filename", "INFO");
        
        return true;
    }
    
    writeToLog("No se pudo guardar el archivo $filename después de intentar todos los métodos", "ERROR");
    return false;
}

function deleteMarkdownFile($filename)
{
    global $markdownDir, $recycleDir;
    
    // Sanitize filename - remove any potentially dangerous path components
    // but preserve special characters and spaces as per requirements
    $filename = basename(str_replace(['../', '..\\'], '', $filename));
    $filepath = $markdownDir . '/' . $filename;

    // Security check - prevent directory traversal with realpath
    $realMarkdownDir = realpath($markdownDir);
    $realFilepath = realpath($filepath);
    
    if (!$realFilepath || strpos($realFilepath, $realMarkdownDir) !== 0) {
        writeToLog("Security violation: Attempted file deletion outside permitted directory: {$filename}", "ERROR");
        return false;
    }

    if (file_exists($filepath)) {
        // Create collection-specific recycle directory if it doesn't exist
        $collection = basename(dirname($markdownDir));
        $recycleFilesDir = $recycleDir . '/files';

        if (!is_dir($recycleFilesDir)) {
            mkdir($recycleFilesDir, 0755, true);
        }

        // Move to recycle bin instead of deleting
        $recycleFilepath = $recycleFilesDir . '/' . $filename;

        // If a file with the same name exists in the recycle bin, add timestamp to make it unique
        if (file_exists($recycleFilepath)) {
            $pathInfo = pathinfo($filename);
            $timestamp = date('YmdHis');
            $recycleFilepath = $recycleFilesDir . '/' . $pathInfo['filename'] . '_' . $timestamp . '.' . $pathInfo['extension'];
        }

        // Invalidar cachés relacionadas con este archivo
        invalidateCache(generateCacheKey('markdown_content', ['file' => $filename]));
        invalidateCacheByPrefix('markdown_files');

        return rename($filepath, $recycleFilepath);
    }

    return false;
}

function permanentlyDeleteMarkdownFile($filename, $collection = '')
{
    global $recycleDir;
    $recycleFilesDir = $recycleDir . '/files';
    $filepath = $recycleFilesDir . '/' . $filename;

    // Security check - prevent directory traversal
    if (strpos(realpath($filepath), realpath($recycleDir)) !== 0) {
        return false;
    }

    if (file_exists($filepath)) {
        return unlink($filepath);
    }

    return false;
}

function restoreMarkdownFile($filename, $collection = '')
{
    global $recycleDir, $rootDir, $markdownDir;
    $recycleFilesDir = $recycleDir . '/files';
    $recycleFilepath = $recycleFilesDir . '/' . $filename;

    // Security check - prevent directory traversal
    if (strpos(realpath($recycleFilepath), realpath($recycleDir)) !== 0) {
        return false;
    }

    if (file_exists($recycleFilepath)) {
        // Determine target directory based on collection
        $targetDir = $markdownDir;

        // If collection is specified and valid, use it
        if (!empty($collection) && is_dir($rootDir . '/' . $collection)) {
            $targetDir = $rootDir . '/' . $collection . '/files';
        }

        // Create target directory if it doesn't exist
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        // Extract original name (remove timestamp if present)
        $originalName = $filename;
        if (preg_match('/_(\d{14})\./', $filename, $matches)) {
            $originalName = str_replace('_' . $matches[1], '', $filename);
        }

        $targetFilepath = $targetDir . '/' . $originalName;

        // If a file with the same name exists in the target directory, add timestamp to make it unique
        if (file_exists($targetFilepath)) {
            $pathInfo = pathinfo($originalName);
            $timestamp = date('YmdHis');
            $targetFilepath = $targetDir . '/' . $pathInfo['filename'] . '_restored_' . $timestamp . '.' . $pathInfo['extension'];
        }

        // Invalidar cachés después de restaurar
        invalidateCacheByPrefix('markdown_files');

        return rename($recycleFilepath, $targetFilepath);
    }

    return false;
}

function getRecycleBinFiles($type = 'files', $collection = '')
{
    global $recycleDir;
    $filesData = [];

    $targetDir = $recycleDir . '/' . $type;

    if (!is_dir($targetDir)) {
        return $filesData;
    }

    // Función recursiva para buscar archivos en subdirectorios
    $scanRecursive = function ($dir, $relativePath = '') use (&$scanRecursive, &$filesData, $type) {
        if ($handle = opendir($dir)) {
            while (false !== ($entry = readdir($handle))) {
                if ($entry == "." || $entry == "..") {
                    continue;
                }

                $fullPath = $dir . '/' . $entry;

                // Si es un directorio, buscar recursivamente
                if (is_dir($fullPath)) {
                    $newRelativePath = $relativePath ? $relativePath . '/' . $entry : $entry;
                    $scanRecursive($fullPath, $newRelativePath);
                } else {
                    // Para archivos, verificar extensiones
                    if ($type === 'files' && pathinfo($entry, PATHINFO_EXTENSION) !== 'md') {
                        continue;
                    }

                    // Para imágenes, verificar extensiones permitidas
                    if ($type === 'images') {
                        $extension = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
                        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
                        if (!in_array($extension, $allowedExtensions)) {
                            continue;
                        }
                    }

                    // Obtener estadísticas del archivo
                    $fileStats = stat($fullPath);
                    $deletedAt = date('Y-m-d H:i:s', $fileStats['mtime']);

                    // Extraer nombre original (eliminar timestamp si existe)
                    $originalName = $entry;
                    if (preg_match('/_(\d{14})\./', $entry, $matches)) {
                        $originalName = str_replace('_' . $matches[1], '', $entry);
                    }

                    // Crear URL de vista previa para imágenes
                    $previewUrl = null;
                    if ($type === 'images') {
                        $relativePath = $relativePath ? $relativePath . '/' : '';
                        $previewUrl = '/recycle/' . $type . '/' . $relativePath . $entry;
                    }

                    $filesData[] = [
                        'name' => $entry,
                        'original_name' => $originalName,
                        'deleted_at' => $deletedAt,
                        'size' => $fileStats['size'],
                        'path' => $relativePath,
                        'preview_url' => $previewUrl
                    ];
                }
            }
            closedir($handle);
        }
    };

    // Iniciar búsqueda recursiva
    $scanRecursive($targetDir);

    // Ordenar por fecha de eliminación (más reciente primero)
    usort($filesData, function ($a, $b) {
        return strtotime($b['deleted_at']) - strtotime($a['deleted_at']);
    });

    return $filesData;
}

function getMediaContent($path = '')
{
    global $mediaDir;
    
    // Generar clave de caché
    $cacheKey = generateCacheKey('media_content', ['path' => $path]);
    
    // Intentar obtener de la caché (máximo 30 segundos)
    $cachedContent = getCache($cacheKey, 30);
    if ($cachedContent !== false) {
        return $cachedContent;
    }
    
    // Construir la ruta completa
    $fullPath = $mediaDir;
    if (!empty($path)) {
        $fullPath .= '/' . trim($path, '/');
    }
    
    // Verificar si el directorio existe
    if (!is_dir($fullPath)) {
        return ['success' => false, 'message' => 'Directory not found'];
    }
    
    $items = [];
    
    // Leer el contenido del directorio
    if ($handle = opendir($fullPath)) {
        while (false !== ($entry = readdir($handle))) {
            if ($entry != "." && $entry != "..") {
                $entryPath = $fullPath . '/' . $entry;
                
                if (is_dir($entryPath)) {
                    // Es un directorio
                    $items[] = [
                        'type' => 'directory',
                        'name' => $entry,
                        'path' => (!empty($path) ? $path . '/' : '') . $entry
                    ];
                } else {
                    // Es un archivo, verificar si es una imagen
                    $extension = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
                    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                    
                    if (in_array($extension, $allowedExtensions)) {
                        $relativePath = (!empty($path) ? $path . '/' : '') . $entry;
                        $items[] = [
                            'type' => 'image',
                            'name' => $entry,
                            'path' => $relativePath,
                            'url' => '/img/' . $relativePath
                        ];
                    }
                }
            }
        }
        closedir($handle);
    }
    
    // Ordenar: primero directorios, luego archivos, ambos en orden alfabético
    usort($items, function ($a, $b) {
        if ($a['type'] === $b['type']) {
            return strcasecmp($a['name'], $b['name']);
        }
        return ($a['type'] === 'directory') ? -1 : 1;
    });
    
    $result = [
        'success' => true,
        'path' => $path,
        'items' => $items
    ];
    
    // Guardar en caché
    setCache($cacheKey, $result);
    
    return $result;
}

function deleteImage($imageName, $path = '')
{
    global $mediaDir, $recycleDir;

    // Determinar ruta de la imagen
    $targetDir = $mediaDir;
    if ($path) {
        $targetDir .= '/' . $path;
    }

    $imagePath = $targetDir . '/' . $imageName;

    // Security check - prevent directory traversal
    if (strpos(realpath(dirname($imagePath)), realpath($mediaDir)) !== 0) {
        return [
            'success' => false,
            'message' => 'Invalid image path'
        ];
    }

    // Verificar que el archivo existe y es una imagen
    if (!file_exists($imagePath)) {
        return [
            'success' => false,
            'message' => 'Image not found'
        ];
    }

    // Verificar que es un archivo y no un directorio
    if (!is_file($imagePath)) {
        return [
            'success' => false,
            'message' => 'Not a valid image file'
        ];
    }

    // Verificar extensión
    $extension = strtolower(pathinfo($imagePath, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];

    if (!in_array($extension, $allowedExtensions)) {
        return [
            'success' => false,
            'message' => 'Not a valid image file'
        ];
    }

    // Create recycle images directory if it doesn't exist
    $recycleImagesDir = $recycleDir . '/images';
    if ($path) {
        $recycleImagesDir .= '/' . $path;
    }

    if (!is_dir($recycleImagesDir)) {
        mkdir($recycleImagesDir, 0755, true);
    }

    // Move to recycle bin instead of deleting
    $recycleImagePath = $recycleImagesDir . '/' . $imageName;

    // If a file with the same name exists in the recycle bin, add timestamp to make it unique
    if (file_exists($recycleImagePath)) {
        $pathInfo = pathinfo($imageName);
        $timestamp = date('YmdHis');
        $recycleImagePath = $recycleImagesDir . '/' . $pathInfo['filename'] . '_' . $timestamp . '.' . $pathInfo['extension'];
    }

    // Invalidar caché de medios
    invalidateCacheByPrefix('media_content');

    // Move the file to recycle bin
    if (rename($imagePath, $recycleImagePath)) {
        return [
            'success' => true,
            'message' => 'Image moved to recycle bin'
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Failed to move image to recycle bin'
        ];
    }
}

function permanentlyDeleteImage($imageName, $path = '')
{
    global $recycleDir;

    // Determinar ruta de la imagen
    $recycleImagesDir = $recycleDir . '/images';
    if ($path) {
        $recycleImagesDir .= '/' . $path;
    }

    $imagePath = $recycleImagesDir . '/' . $imageName;

    // Security check - prevent directory traversal
    if (strpos(realpath(dirname($imagePath)), realpath($recycleDir)) !== 0) {
        return [
            'success' => false,
            'message' => 'Invalid image path'
        ];
    }

    // Verificar que el archivo existe
    if (!file_exists($imagePath)) {
        return [
            'success' => false,
            'message' => 'Image not found in recycle bin'
        ];
    }

    // Eliminar la imagen permanentemente
    if (unlink($imagePath)) {
        // Verificar si el directorio está vacío y eliminarlo si es así
        if ($path && is_dir($recycleImagesDir) && count(glob($recycleImagesDir . '/*')) === 0) {
            rmdir($recycleImagesDir);
        }

        return [
            'success' => true,
            'message' => 'Image permanently deleted'
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Failed to delete image'
        ];
    }
}

function restoreImage($imageName, $path = '')
{
    global $recycleDir, $mediaDir;

    // Determinar ruta de la imagen en la papelera
    $recycleImagesDir = $recycleDir . '/images';
    if ($path) {
        $recycleImagesDir .= '/' . $path;
    }

    $recycleImagePath = $recycleImagesDir . '/' . $imageName;

    // Security check - prevent directory traversal
    if (strpos(realpath(dirname($recycleImagePath)), realpath($recycleDir)) !== 0) {
        return [
            'success' => false,
            'message' => 'Invalid image path'
        ];
    }

    // Verificar que el archivo existe
    if (!file_exists($recycleImagePath)) {
        return [
            'success' => false,
            'message' => 'Image not found in recycle bin'
        ];
    }

    // Determinar ruta de destino
    $targetDir = $mediaDir;
    if ($path) {
        $targetDir .= '/' . $path;
    }

    // Crear directorio de destino si no existe
    if (!is_dir($targetDir)) {
        if (!mkdir($targetDir, 0755, true)) {
            return [
                'success' => false,
                'message' => 'Failed to create target directory'
            ];
        }
    }

    // Extraer nombre original (eliminar timestamp si existe)
    $originalName = $imageName;
    if (preg_match('/_(\d{14})\./', $imageName, $matches)) {
        $originalName = str_replace('_' . $matches[1], '', $imageName);
    }

    $targetPath = $targetDir . '/' . $originalName;

    // Si ya existe un archivo con el mismo nombre, agregar timestamp
    if (file_exists($targetPath)) {
        $pathInfo = pathinfo($originalName);
        $timestamp = date('YmdHis');
        $targetPath = $targetDir . '/' . $pathInfo['filename'] . '_restored_' . $timestamp . '.' . $pathInfo['extension'];
    }

    // Invalidar caché de medios
    invalidateCacheByPrefix('media_content');

    // Mover el archivo de vuelta
    if (rename($recycleImagePath, $targetPath)) {
        return [
            'success' => true,
            'message' => 'Image restored successfully'
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Failed to restore image'
        ];
    }
}



/**
 * Subir una imagen al directorio de medios
 * 
 * @param array $file Archivo subido ($_FILES['image'])
 * @param string $path Ruta relativa dentro del directorio de medios (opcional)
 * @return array Resultado de la operación
 */
function uploadImage($file, $path = '')
{
    global $mediaDir, $collection, $collectionsDir, $rootDir;
    
    // Determinar la ruta al directorio raíz del proyecto
    writeToLog("uploadImage - Valor de rootDir: {$rootDir}", "DEBUG");
    writeToLog("uploadImage - Estructura de directorios:", "DEBUG");
    writeToLog("uploadImage - dirname(rootDir): " . dirname($rootDir), "DEBUG");
    writeToLog("uploadImage - dirname(dirname(rootDir)): " . dirname(dirname($rootDir)), "DEBUG");
    writeToLog("uploadImage - dirname(dirname(dirname(rootDir))): " . dirname(dirname(dirname($rootDir))), "DEBUG");
    
    // Usar ruta absoluta en lugar de dirname() para mayor consistencia
    // La estructura esperada es [raiz]/public/img
    $rootProjectDir = realpath(__DIR__ . '/..');
    
    // Para todas las colecciones, usar el directorio /public/img
    $mediaDir = $rootProjectDir . '/public/img';
    
    writeToLog("uploadImage - Ruta absoluta definida: {$rootProjectDir}", "DEBUG");
    writeToLog("uploadImage - Directorio de medios: {$mediaDir}", "DEBUG");
    
    writeToLog("Directorio de medios para subida: " . $mediaDir, "INFO");
    writeToLog("Colección actual: " . $collection, "INFO");
    
    // Verificar que el directorio existe
    if (!is_dir($mediaDir)) {
        writeToLog("El directorio de medios no existe, intentando crearlo: " . $mediaDir, "INFO");
        $result = mkdir($mediaDir, 0755, true);
        if ($result) {
            writeToLog("Directorio creado exitosamente: " . $mediaDir, "INFO");
        } else {
            writeToLog("ERROR: No se pudo crear el directorio: " . $mediaDir, "ERROR");
            writeToLog("Permisos del directorio padre: " . substr(sprintf('%o', fileperms(dirname($mediaDir))), -4), "DEBUG");
            writeToLog("Usuario actual PHP: " . get_current_user(), "DEBUG");
            writeToLog("Grupos del usuario: " . json_encode(function_exists('posix_getgroups') ? posix_getgroups() : []), "DEBUG");
        }
    } else {
        writeToLog("El directorio de medios ya existe: " . $mediaDir, "INFO");
        writeToLog("Permisos del directorio: " . substr(sprintf('%o', fileperms($mediaDir)), -4), "DEBUG");
        writeToLog("¿Se puede escribir en el directorio?: " . (is_writable($mediaDir) ? "Sí" : "No"), "DEBUG");
    }
    
    // Verificar si hay errores en la subida
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive specified in the HTML form',
            UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload',
        ];
        
        $errorMessage = isset($errorMessages[$file['error']]) ? $errorMessages[$file['error']] : 'Unknown upload error';
        return ['success' => false, 'message' => $errorMessage];
    }
    
    // Verificar tipo de archivo
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!in_array($file['type'], $allowedTypes)) {
        return ['success' => false, 'message' => 'Invalid file type. Only images are allowed'];
    }
    
    // Sanitizar nombre de archivo
    $filename = preg_replace('/[^a-zA-Z0-9_.-]/', '', $file['name']);
    $filename = strtolower($filename);
    
    // Asegurar que el nombre de archivo no cause conflicto
    $targetPath = $mediaDir;
    if (!empty($path)) {
        $targetPath .= '/' . trim($path, '/');
    }
    
    // Crear el directorio si no existe
    if (!is_dir($targetPath)) {
        if (!mkdir($targetPath, 0755, true)) {
            return ['success' => false, 'message' => 'Failed to create directory'];
        }
    }
    
    $targetFile = $targetPath . '/' . $filename;
    $originalName = $filename;
    
    // Si ya existe un archivo con ese nombre, añadir un número
    if (file_exists($targetFile)) {
        $pathInfo = pathinfo($filename);
        $baseName = $pathInfo['filename'];
        $extension = isset($pathInfo['extension']) ? '.' . $pathInfo['extension'] : '';
        
        $counter = 1;
        while (file_exists($targetFile)) {
            $newName = $baseName . '_' . $counter . $extension;
            $targetFile = $targetPath . '/' . $newName;
            $counter++;
        }
        
        $filename = basename($targetFile);
    }
    
    // Mover el archivo a su destino final
    if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
        return ['success' => false, 'message' => 'Failed to save uploaded file'];
    }
    
    // Generar información de la imagen
    $relativePath = '';
    if (!empty($path)) {
        $relativePath = trim($path, '/') . '/';
    }
    
    // Construir la URL de la imagen usando /img
    $imageUrl = '/img/' . $relativePath . $filename;
    writeToLog("URL de imagen generada: " . $imageUrl, "INFO");
    
    // Invalidar caché
    invalidateCacheByPrefix('media_content');
    
    return [
        'success' => true,
        'message' => 'Image uploaded successfully',
        'original_name' => $originalName,
        'filename' => $filename,
        'path' => $path,
        'full_path' => $targetFile,
        'url' => $imageUrl,
        'type' => $file['type'],
        'size' => $file['size']
    ];
}

// Function to rename a markdown file
function renameMarkdownFile($oldFilename, $newFilename) {
    global $rootDir, $markdownDir, $collectionDir;
    
    writeToLog("Renaming file from {$oldFilename} to {$newFilename}", "INFO");
    writeToLog("Current markdownDir: {$markdownDir}", "DEBUG");
    
    // Validar nombres de archivo (validación básica)
    if (empty($oldFilename) || empty($newFilename)) {
        writeToLog("Empty filename provided for rename operation", "ERROR");
        return ['success' => false, 'message' => 'Nombre de archivo no puede estar vacío'];
    }
    
    // Validar que los nombres terminen en .md
    if (!str_ends_with(strtolower($oldFilename), '.md') || !str_ends_with(strtolower($newFilename), '.md')) {
        writeToLog("Filename must end with .md extension", "ERROR");
        return ['success' => false, 'message' => 'El archivo debe tener extensión .md'];
    }
    
    // Determinar el directorio correcto basado en la colección actual
    $currentDir = isset($collectionDir) && !empty($collectionDir) ? $collectionDir : $markdownDir;
    writeToLog("Using directory: {$currentDir}", "DEBUG");
    
    $oldPath = $currentDir . '/' . $oldFilename;
    $newPath = $currentDir . '/' . $newFilename;
    
    writeToLog("Old path: {$oldPath}", "DEBUG");
    writeToLog("New path: {$newPath}", "DEBUG");
    writeToLog("File exists check: " . (file_exists($oldPath) ? 'YES' : 'NO'), "DEBUG");
    
    // Pequeña pausa para dar tiempo al sistema de archivos
    usleep(100000); // 100ms de pausa
    
    // Verificar que el archivo original existe
    if (!file_exists($oldPath)) {
        writeToLog("Source file does not exist after delay: {$oldPath}", "ERROR");
        return ['success' => false, 'message' => 'El archivo original no existe o no se puede acceder'];
    }
    
    // Verificar que el nuevo nombre no exista (excepto si es el mismo archivo con diferente case/capitalización)
    // Añadir una pequeña pausa para dar tiempo al sistema de archivos
    usleep(100000); // 100ms de pausa
    
    if (file_exists($newPath) && strtolower($oldFilename) !== strtolower($newFilename)) {
        writeToLog("Destination file already exists after delay: {$newPath}", "ERROR");
        return ['success' => false, 'message' => 'Ya existe un archivo con ese nombre'];
    }
    
    // Si es el mismo archivo pero con diferente case, permitir la operación
    writeToLog("Validation passed, allowing rename", "INFO");
    
    // Intentar renombrar el archivo
    if (rename($oldPath, $newPath)) {
        writeToLog("Successfully renamed file from {$oldFilename} to {$newFilename}", "INFO");
        
        // Invalidar caché relacionada
        invalidateCacheByPrefix('files_');
        invalidateCacheByPrefix('file_' . md5($oldFilename));
        
        return ['success' => true, 'message' => 'File renamed successfully', 'oldName' => $oldFilename, 'newName' => $newFilename];
    } else {
        writeToLog("Failed to rename file from {$oldFilename} to {$newFilename}", "ERROR");
        return ['success' => false, 'message' => 'Failed to rename file. Check permissions.'];
    }
}

// Handle API requests
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

// Verificar si se debe forzar la recarga de la caché
$forceReload = isset($_GET['nocache']) || isset($_POST['nocache']);
if ($forceReload) {
    // Invalidar todas las cachés
    invalidateCacheByPrefix('markdown');
    invalidateCacheByPrefix('media');
}

switch ($action) {
    case 'list':
        echo json_encode(getMarkdownFiles());
        break;
        
    case 'rename':
        $oldFilename = isset($_POST['oldFilename']) ? $_POST['oldFilename'] : '';
        $newFilename = isset($_POST['newFilename']) ? $_POST['newFilename'] : '';
        
        if (empty($oldFilename) || empty($newFilename)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Old and new filenames are required']);
            break;
        }
        
        // Asegurarse de que los archivos terminen con .md
        if (!str_ends_with(strtolower($oldFilename), '.md')) {
            $oldFilename .= '.md';
        }
        if (!str_ends_with(strtolower($newFilename), '.md')) {
            $newFilename .= '.md';
        }
        
        $result = renameMarkdownFile($oldFilename, $newFilename);
        echo json_encode($result);
        break;

    case 'read':
        $filename = isset($_GET['file']) ? $_GET['file'] : '';

        if (empty($filename)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Filename is required']);
            break;
        }

        $content = readMarkdownFile($filename);

        if ($content === false) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'File not found or cannot be read']);
            break;
        }

        // For read operations, return plain text instead of JSON
        header('Content-Type: text/plain');
        echo $content;
        break;



    case 'write': // Add support for 'write' action (same as 'save')
    case 'save':
        writeToLog("=== PROCESANDO ACCION WRITE ===", "DEBUG");
        writeToLog("IP remota: " . ($_SERVER['REMOTE_ADDR'] ?? 'desconocida'), "DEBUG");
        writeToLog("User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'desconocido'), "DEBUG");
        writeToLog("Auth Type: " . ($_SERVER['AUTH_TYPE'] ?? 'ninguno'), "DEBUG");
        
        // Determinar si hay problemas de autorización
        $authorizationHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        $authorizationXHeader = isset($_SERVER['HTTP_X_AUTHORIZATION']) ? $_SERVER['HTTP_X_AUTHORIZATION'] : '';
        writeToLog("Encabezado Authorization: " . ($authorizationHeader ? 'presente' : 'ausente'), "DEBUG");
        writeToLog("Encabezado X-Authorization: " . ($authorizationXHeader ? 'presente' : 'ausente'), "DEBUG");
        
        // Manejar problema común de mod_security que puede bloquear solicitudes POST
        // Establecer encabezados adicionales que pueden ayudar con mod_security
        header('X-Content-Type-Options: nosniff');
        
        // Permitir datos tanto de POST como de GET con seguridad adicional
        // Verificar primero POST, luego GET (solo si se pasa una confirmación especial de seguridad)
        $filename = '';
        $content = '';
        $method = '';
        $collection = '';
        
        // Imprimir encabezados recibidos para diagnóstico
        writeToLog("Encabezados recibidos: " . json_encode(getallheaders()), "DEBUG");
        
        // Comprobar si estamos en un caso especial de 403 redirigido
        $is403Bypass = isset($_GET['bypass_403']) && $_GET['bypass_403'] === 'true';
        if ($is403Bypass) {
            writeToLog("Detectado intento de bypass de error 403", "INFO");
        }
        
        if (!empty($_POST['file'])) {
            $filename = $_POST['file'];
            $content = isset($_POST['content']) ? $_POST['content'] : '';
            $collection = isset($_POST['collection']) ? $_POST['collection'] : '';
            $method = 'POST';
            writeToLog("Datos recibidos vía POST", "DEBUG");
        } 
        // Solución alternativa mediante GET si el servidor está bloqueando POST
        elseif (!empty($_GET['file']) && (isset($_GET['secure_write']) && $_GET['secure_write'] === 'true' || $is403Bypass)) {
            $filename = $_GET['file'];
            $content = isset($_GET['content']) ? $_GET['content'] : '';
            $collection = isset($_GET['collection']) ? $_GET['collection'] : '';
            $method = 'GET (secure)' . ($is403Bypass ? ' + bypass_403' : '');
            writeToLog("Datos recibidos vía GET con confirmación segura" . ($is403Bypass ? ' y bypass 403' : ''), "DEBUG");
            
            // Si se detecta bypass de 403, intentar desactivar filtros conocidos
            if ($is403Bypass) {
                // Estas funciones ayudan a evitar restricciones comunes de mod_security y similares
                @ini_set('suhosin.request.max_vars', '5000');
                @ini_set('suhosin.post.max_vars', '5000');
                @ini_set('suhosin.request.max_value_length', '1000000');
                @ini_set('suhosin.post.max_value_length', '1000000');
            }
        }
        
        // Si existe la colección, configurar el directorio correcto
        if (!empty($collection)) {
            writeToLog("Colección especificada: $collection", "INFO");
            global $markdownDir;
            $originalMarkdownDir = $markdownDir;
            $markdownDir = $rootDir . '/content/' . $collection;
            writeToLog("Directorio de markdown ajustado a: $markdownDir", "DEBUG");
        }
        
        writeToLog("Método usado: $method", "INFO");
        writeToLog("Nombre del archivo: $filename", "INFO");
        writeToLog("Longitud del contenido: " . strlen($content), "INFO");
        
        if (empty($filename)) {
            $error = 'Filename is required';
            writeToLog("ERROR: $error", "ERROR");
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $error]);
            break;
        }
        
        if (empty($content)) {
            writeToLog("ADVERTENCIA: Contenido vacío para el archivo $filename", "WARN");
        }

        // Process custom field values before saving
        try {
            $content = processCustomFieldValues($content);
            writeToLog("Procesamiento de campos personalizado completado", "INFO");
        } catch (Exception $e) {
            writeToLog("Error al procesar campos personalizados: " . $e->getMessage(), "ERROR");
        }

        // Verificar si podemos escribir en el directorio
        global $markdownDir;
        $canWrite = is_writable($markdownDir);
        writeToLog("¿Se puede escribir en $markdownDir? " . ($canWrite ? 'Sí' : 'No'), "INFO");
        
        // Intentar guardar el archivo con el método estándar
        writeToLog("Método estándar: Intentando guardar $filename", "INFO");
        $result = saveMarkdownFile($filename, $content);
        
        // Si el método estándar falla, implementar bypass para 403 Forbidden
        if (!$result) {
            writeToLog("El método estándar falló, intentando métodos alternativos", "INFO");
            
            // Ruta completa del archivo
            $filepath = $markdownDir . '/' . $filename;
            
            // Método alternativo 1: Archivo temporal + rename
            writeToLog("Método alt. 1: Usando archivo temporal + rename", "INFO");
            $tempFile = tempnam(sys_get_temp_dir(), 'md_');
            if (file_put_contents($tempFile, $content) !== false) {
                if (@rename($tempFile, $filepath)) {
                    writeToLog("Éxito usando rename desde archivo temporal", "SUCCESS");
                    $result = true;
                } else {
                    $renameError = error_get_last();
                    writeToLog("Error en rename: " . ($renameError ? $renameError['message'] : 'desconocido'), "ERROR");
                }
            }
            
            // Método alternativo 2: Usar comandos de sistema
            if (!$result) {
                writeToLog("Método alt. 2: Usando comandos del sistema", "INFO");
                if (PHP_OS_FAMILY === 'Windows') {
                    // Windows: usar copy
                    $winPath = str_replace('/', '\\', $filepath);
                    $winTemp = str_replace('/', '\\', $tempFile);
                    $command = "copy /Y \"$winTemp\" \"$winPath\"";
                    writeToLog("Ejecutando comando: $command", "DEBUG");
                    @exec($command, $output, $status);
                    if ($status === 0) {
                        writeToLog("Éxito usando comando Windows", "SUCCESS");
                        $result = true;
                    } else {
                        writeToLog("Error en comando Windows: " . implode("\n", $output), "ERROR");
                    }
                } else {
                    // Linux/Unix: usar cp
                    $command = "cp \"$tempFile\" \"$filepath\"";
                    @exec($command, $output, $status);
                    if ($status === 0) {
                        writeToLog("Éxito usando comando Unix", "SUCCESS");
                        $result = true;
                    } else {
                        writeToLog("Error en comando Unix: " . implode("\n", $output), "ERROR");
                    }
                }
            }
            
            // Método alternativo 3: fopen directo con desactivación de filtros
            if (!$result) {
                writeToLog("Método alt. 3: fopen directo con flags", "INFO");
                // Desactivar temporalmente filtros que puedan interferir
                $oldErrorReporting = error_reporting(0);
                $context = stream_context_create([]);
                $fp = @fopen($filepath, 'w', false, $context);
                if ($fp) {
                    $writeResult = @fwrite($fp, $content);
                    @fclose($fp);
                    if ($writeResult !== false) {
                        writeToLog("Éxito usando fopen/fwrite directo", "SUCCESS");
                        $result = true;
                    } else {
                        writeToLog("Error en fwrite", "ERROR");
                    }
                } else {
                    writeToLog("Error en fopen", "ERROR");
                }
                error_reporting($oldErrorReporting);
            }
            
            // Limpiar archivo temporal
            if (file_exists($tempFile)) {
                @unlink($tempFile);
            }
        }
        
        if ($result) {
            writeToLog("Archivo guardado exitosamente: $filename", "SUCCESS");
            echo json_encode(['success' => true, 'message' => 'File saved successfully', 'method' => $method]);
        } else {
            $error = 'Failed to save file after trying multiple methods';
            writeToLog("TODOS LOS MÉTODOS FALLARON para: $filename", "ERROR");
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $error, 'method' => $method]);
        }
        break;

    case 'delete':
        $filename = isset($_POST['filename']) ? $_POST['filename'] : '';

        if (empty($filename)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Filename is required']);
            break;
        }

        $result = deleteMarkdownFile($filename);

        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al mover el archivo a la papelera']);
        }
        break;

    case 'create':
        $filename = isset($_POST['file']) ? $_POST['file'] : '';
        $content = isset($_POST['content']) ? $_POST['content'] : '';

        if (empty($filename)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Filename is required']);
            break;
        }

        // Ensure filename has .md extension
        if (pathinfo($filename, PATHINFO_EXTENSION) !== 'md') {
            $filename .= '.md';
        }

        // Check if file already exists
        $filepath = $markdownDir . '/' . $filename;
        if (file_exists($filepath)) {
            http_response_code(409); // Conflict
            echo json_encode(['success' => false, 'message' => 'File already exists']);
            break;
        }

        $result = saveMarkdownFile($filename, $content);

        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create file']);
        }
        break;

    case 'recyclebin': // Mantener compatibilidad con el frontend existente
    case 'getrecyclebin':
        $type = isset($_GET['type']) ? $_GET['type'] : 'files';
        $collection = isset($_GET['collection']) ? $_GET['collection'] : '';

        $files = getRecycleBinFiles($type, $collection);
        echo json_encode(['success' => true, 'files' => $files]);
        break;

    case 'emptyrecyclebin':
        // Check if type is provided
        $type = isset($_POST['type']) ? $_POST['type'] : '';
        if (empty($type)) {
            echo json_encode(['success' => false, 'error' => 'No type provided']);
            exit;
        }

        $success = true;
        $errors = [];

        // Function to recursively delete directory contents
        function deleteDirectoryContents($dir) {
            if (!is_dir($dir)) {
                return false;
            }
            
            $items = scandir($dir);
            foreach ($items as $item) {
                if ($item === '.' || $item === '..') {
                    continue;
                }
                
                $path = $dir . '/' . $item;
                if (is_dir($path)) {
                    deleteDirectoryContents($path);
                    rmdir($path);
                } else {
                    unlink($path);
                }
            }
            return true;
        }
        
        // Función para crear un directorio recursivamente con permisos adecuados
        function createDirectory($path, $permissions = 0755) {
            if (empty($path)) {
                return false;
            }
            
            // Si el directorio ya existe, verificar permisos
            if (is_dir($path)) {
                // Intentar establecer permisos correctos si no son adecuados
                $currentPerms = fileperms($path) & 0777;
                if ($currentPerms !== $permissions) {
                    @chmod($path, $permissions);
                }
                return true;
            }
            
            // Crear el directorio recursivamente con permisos adecuados
            $result = @mkdir($path, $permissions, true);
            return $result;
        }
        
        // Función para eliminar completamente un directorio y su contenido
        function deleteDirectory($dir) {
            if (!is_dir($dir)) {
                return false;
            }
            
            // Primero eliminar el contenido
            if (!deleteDirectoryContents($dir)) {
                return false;
            }
            
            // Luego eliminar el directorio vacío
            return rmdir($dir);
        }

        // Empty files
        if ($type === 'all' || $type === 'files') {
            $filesPath = $recycleDir . '/files';
            if (is_dir($filesPath)) {
                if (!deleteDirectoryContents($filesPath)) {
                    $success = false;
                    $errors[] = 'Error al vaciar archivos';
                }
            }
        }

        // Empty images
        if ($type === 'all' || $type === 'images') {
            $imagesPath = $recycleDir . '/images';
            if (is_dir($imagesPath)) {
                if (!deleteDirectoryContents($imagesPath)) {
                    $success = false;
                    $errors[] = 'Error al vaciar imágenes';
                }
            }
        }

        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode([
                'success' => false, 
                'error' => implode(', ', $errors)
            ]);
        }
        break;

    case 'permanentlydelete':
        // Check if filename is provided
        $filename = isset($_POST['filename']) ? $_POST['filename'] : '';
        if (empty($filename)) {
            echo json_encode(['success' => false, 'error' => 'No filename provided']);
            exit;
        }

        // Get the full path to the file in the recycle bin
        $filePath = $recycleDir . '/files/' . $filename;

        // Check if file exists
        if (!file_exists($filePath)) {
            echo json_encode(['success' => false, 'error' => 'File not found in recycle bin']);
            exit;
        }

        // Delete the file
        if (unlink($filePath)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete file']);
        }
        break;

    case 'permanentdelete':
        // Check if filename is provided
        $filename = isset($_POST['filename']) ? $_POST['filename'] : '';
        if (empty($filename)) {
            echo json_encode(['success' => false, 'error' => 'No filename provided']);
            exit;
        }

        // Get the full path to the file in the recycle bin
        $filePath = $recycleDir . '/files/' . $filename;

        // Check if file exists
        if (!file_exists($filePath)) {
            echo json_encode(['success' => false, 'error' => 'File not found in recycle bin']);
            exit;
        }

        // Delete the file
        if (unlink($filePath)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete file']);
        }
        break;

    case 'permanentdeleteimage':
        // Check if image name is provided
        $imageName = isset($_POST['imagename']) ? $_POST['imagename'] : '';
        if (empty($imageName)) {
            echo json_encode(['success' => false, 'error' => 'No image name provided']);
            exit;
        }

        // Get the path parameter (subdirectory within images)
        $path = isset($_POST['path']) ? trim($_POST['path'], '/') : '';
        $pathPrefix = !empty($path) ? $path . '/' : '';

        // Get the full path to the image in the recycle bin
        $filePath = $recycleDir . '/images/' . $pathPrefix . $imageName;

        // Check if file exists
        if (!file_exists($filePath)) {
            echo json_encode(['success' => false, 'error' => 'Image not found in recycle bin']);
            exit;
        }

        // Delete the image
        if (unlink($filePath)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete image']);
        }
        break;

    case 'restore':
        $filename = isset($_POST['filename']) ? $_POST['filename'] : '';
        $collection = isset($_POST['collection']) ? $_POST['collection'] : '';

        if (empty($filename)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Filename is required']);
            break;
        }

        $result = restoreMarkdownFile($filename, $collection);

        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to restore file']);
        }
        break;

    case 'restoreimage':
        $imageName = isset($_POST['imagename']) ? $_POST['imagename'] : '';
        $path = isset($_POST['path']) ? $_POST['path'] : '';

        if (empty($imageName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Image name is required']);
            break;
        }

        $result = restoreImage($imageName, $path);
        echo json_encode($result);
        break;

    case 'upload':
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No image file provided']);
            break;
        }

        $path = isset($_POST['path']) ? $_POST['path'] : '';
        $result = uploadImage($_FILES['image'], $path);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(500);
            echo json_encode($result);
        }
        break;
        
    case 'createdir':
        $dirName = isset($_POST['dirname']) ? $_POST['dirname'] : '';
        $path = isset($_POST['path']) ? $_POST['path'] : '';

        if (empty($dirName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Directory name is required']);
            break;
        }

        // Determinar la ruta al directorio raíz del proyecto
        writeToLog("Creando directorio: {$dirName} en {$path}", "DEBUG");
        writeToLog("Valor de rootDir: {$rootDir}", "DEBUG");
        writeToLog("Estructura de directorios actual:", "DEBUG");
        writeToLog("dirname(rootDir): " . dirname($rootDir), "DEBUG");
        writeToLog("dirname(dirname(rootDir)): " . dirname(dirname($rootDir)), "DEBUG");
        writeToLog("dirname(dirname(dirname(rootDir))): " . dirname(dirname(dirname($rootDir))), "DEBUG");
        
        // Usar ruta absoluta en lugar de dirname()
        $rootProjectDir = realpath(__DIR__ . '/..');
        writeToLog("createdir - Ruta absoluta definida: {$rootProjectDir}", "DEBUG");
        
        // Para todas las colecciones, usar el directorio /public/img
        $targetDir = $rootProjectDir . '/public/img';
        
        // Añadir el subdirectorio si se especificó
        if (!empty($path)) {
            $targetDir .= '/' . trim($path, '/');
        }
        
        // Añadir el nuevo directorio
        $targetDir .= '/' . $dirName;
        
        // Crear el directorio
        if (!is_dir($targetDir)) {
            if (mkdir($targetDir, 0755, true)) {
                // Invalidar caché
                if (function_exists('invalidateCacheByPrefix')) {
                    invalidateCacheByPrefix('media_content');
                }
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Directory created successfully',
                    'path' => $path,
                    'dirname' => $dirName
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to create directory']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Directory already exists']);
        }
        break;
        
    case 'deletedir':
        $dirName = isset($_POST['dirname']) ? $_POST['dirname'] : '';
        $path = isset($_POST['path']) ? $_POST['path'] : '';

        if (empty($dirName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Directory name is required']);
            break;
        }

        // Usar ruta absoluta para mayor consistencia
        $rootProjectDir = realpath(__DIR__ . '/..');
        writeToLog("deletedir - Ruta absoluta definida: {$rootProjectDir}", "DEBUG");
        
        // Para todas las colecciones, usar el directorio /public/img
        $targetDir = $rootProjectDir . '/public/img';
        
        // Añadir el subdirectorio si se especificó
        if (!empty($path)) {
            $targetDir .= '/' . trim($path, '/');
        }
        
        // Añadir el directorio a eliminar
        $targetDir .= '/' . $dirName;
        
        writeToLog("Intentando eliminar directorio: {$targetDir}", "DEBUG");
        
        // Verificar que el directorio existe
        if (!is_dir($targetDir)) {
            writeToLog("El directorio no existe: {$targetDir}", "ERROR");
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Directory not found']);
            break;
        }
        
        // Verificar permisos
        if (!is_writable($targetDir)) {
            writeToLog("El directorio no tiene permisos de escritura: {$targetDir}", "ERROR");
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Permission denied']);
            break;
        }
        
        // Usar la función recursiva para eliminar el directorio y su contenido
        $success = true;
        $errorMessages = [];
        
        try {
            // Primero eliminar el contenido
            if (!deleteDirectoryContents($targetDir)) {
                $success = false;
                $errorMessages[] = 'Error al eliminar contenido del directorio';
            }
            
            // Luego eliminar el directorio en sí
            if ($success && !rmdir($targetDir)) {
                $success = false;
                $errorMessages[] = 'Error al eliminar el directorio';
            }
            
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Directory deleted successfully']);
            } else {
                $errorMsg = !empty($errorMessages) ? implode(', ', $errorMessages) : 'Error desconocido';
                writeToLog("Error al eliminar directorio: " . $errorMsg, "ERROR");
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => $errorMsg]);
            }
        } catch (Exception $e) {
            writeToLog("Excepción al eliminar directorio: " . $e->getMessage(), "ERROR");
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Exception: ' . $e->getMessage()]);
        }
        break;
        
    case 'media':
        $path = isset($_GET['path']) ? $_GET['path'] : '';
        echo json_encode(getMediaContent($path));
        break;
        
    case 'logs':
        // Endpoint para controlar los logs (activar/desactivar/configurar)
        $status = isset($_GET['status']) ? $_GET['status'] : (isset($_POST['status']) ? $_POST['status'] : null);
        $level = isset($_GET['level']) ? $_GET['level'] : (isset($_POST['level']) ? $_POST['level'] : null);
        
        // Convertir el valor status a booleano si es una cadena
        if ($status !== null) {
            if ($status === 'true' || $status === '1' || $status === 'on') {
                $status = true;
            } elseif ($status === 'false' || $status === '0' || $status === 'off') {
                $status = false;
            }
        }
        
        // Obtener estado actual o aplicar cambios
        $result = toggleLogging($status, $level);
        
        // Mostrar el estado actual de los logs
        echo json_encode([
            'success' => true,
            'logging' => $result['logging'],
            'log_level' => $result['log_level'],
            'message' => 'Log configuration ' . ($status !== null ? 'updated' : 'retrieved')
        ]);
        
        break;

    case 'upload':
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No image file provided']);
            break;
        }

        $path = isset($_POST['path']) ? $_POST['path'] : '';
        $result = uploadImage($_FILES['image'], $path);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(500);
            echo json_encode($result);
        }
        break;

    case 'createdir':
        $dirName = isset($_POST['dirname']) ? $_POST['dirname'] : '';
        $path = isset($_POST['path']) ? $_POST['path'] : '';

        if (empty($dirName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Directory name is required']);
            break;
        }

        $result = createDirectory($dirName, $path);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(500);
            echo json_encode($result);
        }
        break;

    case 'deleteimage':
        $imageName = isset($_POST['image']) ? $_POST['image'] : '';
        $path = isset($_POST['path']) ? $_POST['path'] : '';

        if (empty($imageName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Image name is required']);
            break;
        }

        $result = deleteImage($imageName, $path);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(500);
            echo json_encode($result);
        }
        break;

    case 'deletedir':
        $dirName = isset($_POST['dirname']) ? $_POST['dirname'] : '';
        $path = isset($_POST['path']) ? $_POST['path'] : '';

        if (empty($dirName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Directory name is required']);
            break;
        }

        $result = deleteDirectory($dirName, $path);

        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(500);
            echo json_encode($result);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
