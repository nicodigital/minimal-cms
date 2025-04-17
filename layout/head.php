<?php 
// $clear_cache = "";
$clear_cache = "?v=" . time();
?>
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minimal CMS</title>
  <?php include PARENT_URI . '/inc/header-scripts.php'; ?>
  <link rel="stylesheet" href="<?= PARENT_URI . 'css/style.css' . $clear_cache?>">
  <script src="<?= PARENT_URI . 'js/simplemde.min.js'?>"></script>
</head>