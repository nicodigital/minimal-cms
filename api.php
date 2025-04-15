<?php
// Redirige todas las solicitudes a process.php
// Esto es necesario para mantener compatibilidad con código que puede estar
// llamando a api.php en lugar de process.php

// Transferir todos los parámetros GET y POST
require_once 'process.php';
