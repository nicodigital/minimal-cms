<?php
require_once __DIR__ . '/../env-loader.php';

return [
    // Reemplaza esto con el hash SHA256 de tu contraseña
    // https://emn178.github.io/online-tools/sha256.html
    'password' => EnvLoader::get('NICOLOOK_PASS'), 
];