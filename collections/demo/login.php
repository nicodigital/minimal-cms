<?php
/**
 * Login para la colección Demo
 * Usa el manejador centralizado para la lógica de login
 */

// Definir constante para prevenir acceso directo al manejador centralizado
define('MINIMAL_CMS', true);

// Definir la ruta raíz para el sistema
$rootPath = dirname(dirname(dirname(__FILE__))) . '/';

// Incluir dependencias necesarias
require_once $rootPath . 'inc/knock.php';
require_once $rootPath . 'captcha.php';

// Incluir el manejador centralizado de login
require_once $rootPath . 'inc/login-handler.php';