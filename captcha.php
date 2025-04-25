<?php
/**
 * Archivo de configuración global
 * 
 * Contiene configuraciones globales para el CMS, incluyendo claves de API
 * y otras configuraciones que no deben estar en el código fuente.
 */

// Cargar el gestor de variables de entorno
require_once __DIR__ . '/env.php';
require_once __DIR__ . '/inc/tools.php';

// Configuración de reCAPTCHA usando variables de entorno
$config = [
    'recaptcha' => [
        'site_key' => EnvLoader::get('RECAPTCHA_SITE_KEY'),
        'secret_key' => EnvLoader::get('RECAPTCHA_SECRET_KEY'),
        'enabled' => !is_localhost(),
        'version' => EnvLoader::get('RECAPTCHA_VERSION', 'v2'),
        'score_threshold' => (float)EnvLoader::get('RECAPTCHA_SCORE_THRESHOLD', 0.5)
    ],
    
    // Otras configuraciones globales pueden añadirse aquí
    'debug' => filter_var(EnvLoader::get('DEBUG', false), FILTER_VALIDATE_BOOLEAN),
    'timezone' => EnvLoader::get('TIMEZONE', 'America/Argentina/Buenos_Aires'),
    'session_lifetime' => (int)EnvLoader::get('SESSION_LIFETIME', 86400) // 24 horas en segundos
];

// Establecer zona horaria
date_default_timezone_set($config['timezone']);

// Función para obtener valores de configuración
function get_config($key = null, $default = null) {
    global $config;
    
    if ($key === null) {
        return $config;
    }
    
    // Soporte para notación con puntos (ej: 'recaptcha.site_key')
    if (strpos($key, '.') !== false) {
        $keys = explode('.', $key);
        $value = $config;
        
        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }
        
        return $value;
    }
    
    return isset($config[$key]) ? $config[$key] : $default;
}

// No permitir acceso directo a este archivo
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    header('HTTP/1.0 403 Forbidden');
    exit('Acceso prohibido');
}
