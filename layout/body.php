<body class="h-screen overflow-hidden">
  <?php include __DIR__ . '/header.php'; ?>
  <div class="flex flex-col md:flex-row mx-auto">
    <?php 
      include __DIR__ . '/aside-left.php'; 
      include __DIR__ . '/main.php';
      include __DIR__ . '/aside-right.php'; 
    ?>
  </div>
  <?php 
    include __DIR__ . '/partials/media-library.php'; 
    include __DIR__ . '/actions.php'; 
    include __DIR__ . '/partials/recycle-bin.php'; 
  ?>
  <script type="module" src="<?= PARENT_URI . 'js/scripts.js' . $clear_cache?>"></script>
</body>
</html>