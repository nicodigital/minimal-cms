<?php 
// $clear_cache = "";
$clear_cache = "?v=" . time();
?>
<!DOCTYPE html>
<html lang="en" data-parent="<?= PARENT_URI ?>" data-media-library="<?= MEDIA_URI ?>" data-assets-uri="<?= ASSETS_URI ?>" data-root-uri="<?= ROOT_URI ?>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minimal CMS</title>
  <?php include PARENT_URI . '/inc/header-scripts.php'; ?>
  <link rel="stylesheet" href="<?= PARENT_URI . 'css/style.css' . $clear_cache?>">
  <link rel="stylesheet" href="<?= PARENT_URI . 'css/simplemde.min.css'?>">
  <script src="<?= PARENT_URI . 'js/simplemde.min.js'?>"></script>
  <?php include PARENT_URI . '/inc/header-styles.php'; ?>
</head>