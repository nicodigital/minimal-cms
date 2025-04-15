<?php
/**
 * Archivo de configuración global
 * 
 * Contiene configuraciones globales para el CMS, incluyendo claves de API
 * y otras configuraciones que no deben estar en el código fuente.
 */

// Función para detectar si estamos en localhost
function is_localhost() {
    $localhost_ips = ['127.0.0.1', '::1'];
    $server_name = strtolower($_SERVER['SERVER_NAME'] ?? '');
    
    return in_array($_SERVER['REMOTE_ADDR'], $localhost_ips) || 
           $server_name === 'localhost' || 
           strpos($server_name, '.local') !== false || 
           strpos($server_name, '.test') !== false;
}

// Configuración de reCAPTCHA
$config = [
    'recaptcha' => [
        'site_key' => '6LcUIRYrAAAAAB_mXK7Fb0WkoOKpEdSKN3OdeBQN', // Clave de sitio para pruebas (reemplazar en producción)
        'secret_key' => '6LcUIRYrAAAAACg1iP56g9xkuocvDqasFcPYGmQj', // Clave secreta para pruebas (reemplazar en producción)
        'enabled' => !is_localhost(), // Desactivar en localhost, activar en producción
        'version' => 'v2', // Versión de reCAPTCHA: v2, v3
        'score_threshold' => 0.5 // Solo para v3: umbral de puntuación (0.0 - 1.0)
    ],
    
    // Otras configuraciones globales pueden añadirse aquí
    'debug' => false,
    'timezone' => 'America/Argentina/Buenos_Aires',
    'session_lifetime' => 86400 // 24 horas en segundos
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
