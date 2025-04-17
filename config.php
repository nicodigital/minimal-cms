<?php
// Definición de constantes para rutas
define('ROOT_URI', '/');
define('CURRENT_URI', './');
define('CMS_URI', '/content/');
define('PARENT_URI', '../../');
define('ASSETS_URI', '../../../public/'); // Ruta absoluta desde collections/blog/ a public/
define('MEDIA_URI', ASSETS_URI . 'img');
define('JS_URI', PARENT_URI . 'js');
define('CSS_URI', PARENT_URI . 'css');
define('INC_URI', PARENT_URI . 'inc');
define('LAYOUT_URI', PARENT_URI . 'layout');

// Constantes para directorios físicos
define('ROOT_DIR', dirname(__DIR__));
define('CMS_DIR', __DIR__);
define('MEDIA_DIR', ROOT_DIR . '/public/img');

define('ALLOWED_ORIGINS', [
  'https://nicolasgonzalez.dev',
  'http://localhost',
  'http://127.0.0.1'
]);