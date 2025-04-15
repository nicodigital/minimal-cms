<?php
// Este archivo espera que:
// 1. La variable $basePath esté definida
// 2. La instancia $knock de Knock ya esté creada
// 3. La variable $error ya esté definida
// 4. La lógica de login ya se haya procesado
// Todo esto debe estar en el archivo que lo incluye (login.php de cada colección)

// Verificar que tenemos lo necesario
if (!isset($basePath)) {
    $basePath = '../'; // Valor por defecto si no se ha definido
}
?>
<!DOCTYPE html>
<html lang="es" class="dark">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Minimal CMS</title>
  <link rel="stylesheet" href="<?php echo $basePath; ?>css/style.css">
  <?php
  // Incluir los estilos del header si existe el archivo
  $headerStylesPath = $basePath . 'inc/header-styles.php';
  if (file_exists($headerStylesPath)) {
    include $headerStylesPath;
  }
  ?>
  <style>
    /* Estilos adicionales específicos para la página de login */
    .login-page {
      /* Permalink - use to edit and share this gradient: https://colorzilla.com/gradient-editor/#424242+0,000000+100 */
      background: radial-gradient(ellipse at center, rgba(66, 66, 66, 1) 0%, rgba(0, 0, 0, 1) 100%);
      /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */

    }
  </style>
</head>

<body class="min-h-screen flex items-center justify-center bg-neutral-700 login-page">
  <div class="w-full max-w-md p-8 space-y-8 bg-neutral-700/75 rounded-lg shadow-xl">
    <div class="text-center">
      <div class="flex flex-col items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <path fill="currentColor" d="M9.86 21.43L9 22l-3-2l-3 2V3h18v7.2c-.63-.27-1.36-.27-2 .02V5H5v13.26l1-.66l3 2l.86-.6zm2-1.47L18 13.83l2.03 2.04L13.9 22h-2.04zm8.87-4.79l.98-.98c.2-.19.2-.52 0-.72l-1.32-1.32a.24.24 0 0 0-.08-.06a.5.5 0 0 0-.62.04l-.02.02l-.98.98z"></path>
        </svg>
        <h1 class="text-3xl font-bold text-white mb-2"> Minimal CMS </h1>
      </div>
      <p class="text-neutral-400">Inicia sesión para administrar tu contenido</p>
    </div>

    <?php if ($error): ?>
      <div class="bg-red-500 text-white p-4 rounded-md shadow">
        <?php echo $error; ?>
      </div>
    <?php endif; ?>

    <form method="post" class="mt-8 space-y-6">
      <div class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-300">Usuario</label>
          <input type="text" id="username" name="username" required
            class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent">
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300">Contraseña</label>
          <input type="password" id="password" name="password" required
            class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent">
        </div>
      </div>

      <?php if (isset($recaptcha_enabled) && $recaptcha_enabled): ?>
      <div class="mt-4">
        <?php if ($recaptcha_version === 'v2'): ?>
        <!-- reCAPTCHA v2 -->
        <div class="g-recaptcha" data-sitekey="<?php echo $recaptcha_site_key; ?>"></div>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
        <?php else: ?>
        <!-- reCAPTCHA v3 se maneja mediante JavaScript -->
        <input type="hidden" name="recaptcha-version" value="v3">
        <?php endif; ?>
      </div>
      <?php endif; ?>

      <div>
        <button type="submit"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors duration-200">
          Iniciar sesión
        </button>
      </div>
    </form>

    <div class="text-center mt-6">
      <p class="text-xs text-neutral-400"> <?= date('Y') ?> Minimal CMS</p>
    </div>
  </div>
</body>

</html>