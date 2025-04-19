<?php
require_once __DIR__ . '/../env-loader.php';

return [
    'password' => EnvLoader::get('NICOLOOK_PASS'), 
];