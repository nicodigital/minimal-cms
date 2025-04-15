<?php

$knock = new Knock();
// Verificar si el usuario está autenticado
if (!$knock->isLoggedIn()) {
    header('Location: login.php');
    exit;
}
// Procesar la solicitud de cierre de sesión
if (isset($_GET['logout'])) {
    $knock->logout();
    header('Location: login.php');
    exit;
}