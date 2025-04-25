<?php

// Función para detectar si estamos en localhost
function is_localhost() {
    $localhost_ips = ['127.0.0.1', '::1'];
    $server_name = strtolower($_SERVER['SERVER_NAME'] ?? '');
    
    return in_array($_SERVER['REMOTE_ADDR'], $localhost_ips) || 
           $server_name === 'localhost' || 
           strpos($server_name, '.local') !== false || 
           strpos($server_name, '.test') !== false;
}