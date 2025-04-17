<?php
/**
 * Manejador centralizado para el login de colecciones
 * Este archivo contiene toda la lógica de procesamiento de login para evitar
 * la duplicación de código en los archivos login.php de cada colección.
 */

// Evitar acceso directo a este archivo
if (!defined('MINIMAL_CMS')) {
    die('Acceso directo no permitido');
}

// Calcular la ruta base para los recursos
$scriptPath = $_SERVER['SCRIPT_FILENAME'];
$contentPos = strpos($scriptPath, 'content');
if ($contentPos !== false) {
    $basePath = substr($scriptPath, 0, $contentPos + 8) . '/'; // +8 para incluir 'content/'
    $basePath = str_replace($_SERVER['DOCUMENT_ROOT'], '', $basePath);
} else {
    // Fallback: usar ruta relativa
    $basePath = '../../';
}

// Rutas absolutas para asegurar que los archivos se encuentren correctamente
$rootPath = $GLOBALS['rootPath']; // Usamos la variable global definida en el archivo principal

// Verificar la existencia del directorio de usuarios
$usersDir = $rootPath . 'users';

// Mostrar información sobre la ruta de usuarios en localhost
if (is_localhost()) {
    echo "<!-- Dir de usuarios: {$usersDir} (" . (is_dir($usersDir) ? 'existe' : 'no existe') . ") -->";
    
    // Listar archivos en el directorio de usuarios
    if (is_dir($usersDir)) {
        echo "<!-- Archivos en el directorio: ";
        foreach (glob($usersDir . '/*.php') as $userFile) {
            echo basename($userFile) . ' ';
        }
        echo " -->";
    }
}

// Inicializar Knock con la ruta correcta a los usuarios (ruta absoluta)
$knock = new Knock([
    'users_dir' => $usersDir,
    'debug' => true
]);

// Crear un log de depuración
$debugInfo = [
    'usersDir' => $usersDir,
    'exists' => is_dir($usersDir) ? 'SI' : 'NO',
    'rootPath' => $rootPath,
    'scriptPath' => $_SERVER['SCRIPT_FILENAME'],
    'requestUri' => $_SERVER['REQUEST_URI'],
    'postSubmitted' => isset($_POST['username']) ? 'SI' : 'NO'
];

// Compartir la instancia de Knock con el archivo de markup
$error = '';

// Si ya está autenticado, redirigir a la página principal
if ($knock->isLoggedIn()) {
    // Corregir la redirección para apuntar al índice de la colección actual
    $redirectUrl = './';
    header('Location: ' . $redirectUrl);
    exit;
}

// Procesar el formulario de inicio de sesión
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $honeypot = $_POST['email_address'] ?? null; // Capturar el campo honeypot
    
    // Verificar reCAPTCHA si está habilitado
    $recaptcha_valid = true; // Por defecto, asumimos válido si no está habilitado
    
    if (get_config('recaptcha.enabled', false)) {
        $recaptcha_response = $_POST['g-recaptcha-response'] ?? '';
        
        if (empty($recaptcha_response)) {
            $error = 'Por favor, complete el captcha';
            $recaptcha_valid = false;
        } else {
            // Verificar respuesta de reCAPTCHA con Google
            $recaptcha_secret = get_config('recaptcha.secret_key');
            $recaptcha_verify = file_get_contents('https://www.google.com/recaptcha/api/siteverify?secret=' . urlencode($recaptcha_secret) . '&response=' . urlencode($recaptcha_response) . '&remoteip=' . urlencode($_SERVER['REMOTE_ADDR']));
            $recaptcha_verify_response = json_decode($recaptcha_verify, true);
            
            if (!isset($recaptcha_verify_response['success']) || $recaptcha_verify_response['success'] !== true) {
                $error = 'Verificación de captcha fallida';
                $recaptcha_valid = false;
            }
        }
    }
    
    // Proceder con el login solo si el captcha es válido
    if ($recaptcha_valid) {
        // Añadir info de login al debug
        $debugInfo['loginAttempt'] = true;
        $debugInfo['username'] = $username;
        $debugInfo['honeypot_triggered'] = !empty($honeypot);
        
        // Intentar login y capturar resultado
        $loginResult = $knock->login($username, $password, $honeypot);
        $debugInfo['loginResult'] = $loginResult ? 'SUCCESS' : 'FAILED';
        
        if ($loginResult) {
            // Verificar que la sesión se haya iniciado correctamente
            $debugInfo['isLoggedInAfter'] = $knock->isLoggedIn() ? 'YES' : 'NO';
            
            if ($knock->isLoggedIn()) {
                header('Location: index.php');
                exit;
            } else {
                $error = 'La sesión no se inició correctamente';
            }
        } else {
            $error = 'Usuario o contraseña incorrectos';
        }
    }
}

// Definir variables para el script de reCAPTCHA
$recaptcha_enabled = get_config('recaptcha.enabled', false);
$recaptcha_site_key = get_config('recaptcha.site_key', '');
$recaptcha_version = get_config('recaptcha.version', 'v2');

// Incluir el markup del login
// Asegurar que estamos usando la ruta correcta para el markup
include $rootPath . 'layout/partials/login-markup.php';

// Añadir script de reCAPTCHA después del markup
if ($recaptcha_enabled):
?>
<script>
  // Función para cargar el script de reCAPTCHA de forma asíncrona
  function loadRecaptchaScript() {
    var script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=<?php echo ($recaptcha_version === 'v3') ? $recaptcha_site_key : 'explicit'; ?>';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
  
  // Cargar el script cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    loadRecaptchaScript();
    
    <?php if ($recaptcha_version === 'v3'): ?>
    // Para reCAPTCHA v3, añadir token al formulario antes de enviar
    document.querySelector('form').addEventListener('submit', function(e) {
      e.preventDefault();
      grecaptcha.ready(function() {
        grecaptcha.execute('<?php echo $recaptcha_site_key; ?>', {action: 'login'})
          .then(function(token) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'g-recaptcha-response';
            input.value = token;
            document.querySelector('form').appendChild(input);
            document.querySelector('form').submit();
          });
      });
    });
    <?php endif; ?>
  });
</script>
<?php endif; ?>
