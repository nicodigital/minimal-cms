<style>
  :root {
    --bg-main: #f3f4f6;
    --bg-main-switch: #cacaca;
    --bg-secondary: rgba(115, 115, 115, 0.1);
    --bg-tertiary: rgba(115, 115, 115, 0.2);
    --text-main: #111827;
    --text-secondary: #4b5563;
    --border-color: rgb(163 163 163);
    --primary: #6b7280;
    --primary-hover: #4b5563;
    --success: #10b981;
    --success-hover: #059669;
    --danger: #ef4444;
    --danger-hover: #dc2626;
    --select-bg: #ffffff;
    --select-text: #111827;
    --option-bg: #ffffff;
    --option-text: #111827;
  }

  .dark {
    --bg-main: #262626;
    --bg-main-switch: #555;
    --bg-secondary: rgba(115, 115, 115, 0.2);
    --bg-tertiary: rgba(115, 115, 115, 0.3);
    --text-main: #f9fafb;
    --text-secondary: #d1d5db;
    --border-color: #4f4f4f;
    --primary: #5d5d5d;
    --primary-hover: #888888;
    --success: #10b981;
    --success-hover: #34d399;
    --danger: #ef4444;
    --danger-hover: #f87171;
    --select-bg: #333333;
    --select-text: #ffffff;
    --option-bg: #333333;
    --option-text: #ffffff;
  }

  /* Estilos para el date picker en modo oscuro */
  .dark input[type="date"] {
    color-scheme: dark;
    color: var(--text-main);
    border-color: var(--border-color);
  }

  body {
    background-color: var(--bg-main);
    color: var(--text-main);
  }

  /* Estilos para los elementos select y option */
  select {
    background-color: var(--select-bg);
    color: var(--select-text);
    border-color: var(--border-color);
  }

  select option {
    background-color: var(--option-bg);
    color: var(--option-text);
  }

  /* Estilos específicos para Firefox */
  @-moz-document url-prefix() {
    select {
      background-color: var(--select-bg);
      color: var(--select-text);
    }

    select option {
      background-color: var(--option-bg);
      color: var(--option-text);
    }
  }

  .editor-toolbar,
  .CodeMirror {
    border-color: var(--border-color) !important;
  }

  .editor-toolbar{
    opacity: 1;
  }

  .CodeMirror {
    height: calc(100vh - 17rem);
    background-color: var(--bg-main);
    color: var(--text-main);
  }

  .editor-toolbar a {
    color: var(--text-main) !important;
  }

  .editor-toolbar a.active,
  .editor-toolbar a:hover {
    background-color: var(--border-color);
  }

  .tag-item {
    transition: all 0.2s;
  }

  .tag-item:hover .delete-tag {
    display: inline;
  }

  /* View Transitions API styles */
  .file-item {
    view-transition-name: file-item;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fade-out {
    from {
      opacity: 1;
      transform: translateY(0);
    }

    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }

  ::view-transition-old(file-item) {
    animation: 0.2s fade-out ease forwards;
  }

  ::view-transition-new(file-item) {
    animation: 0.3s fade-in ease forwards;
  }

  .md-list {
    view-transition-name: md-list;
  }

  /* Estilos para los elementos de la lista de archivos */
  .md-list li {
    background-color: var(--bg-secondary);
    border: none !important;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    margin-bottom: 0.25rem;
    transition: all 0.2s ease;
  }

  .md-list li .file-name {
    padding: 0.25rem 0;
    display: block;
    width: 100%;
  }

  /* Asegurar que el botón de eliminar tenga un área de clic adecuada */
  .md-list li .delete-file {
    padding: 0.25rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  /* Tema claro */


  .md-list li:hover {
    background-color: var(--bg-tertiary);
  }

  .md-list li.active {
    background-color: var(--bg-tertiary);
  }

  /* Tema oscuro */
  html.dark .md-list li {
    background-color: rgba(115, 115, 115, 0.2);
  }

  html.dark .md-list li:hover {
    background-color: rgba(115, 115, 115, 0.3);
  }

  html.dark .md-list li.active {
    background-color: rgba(115, 115, 115, 0.4);
  }

  /* Theme toggle */
  .theme-toggle {
    pointer-events: auto;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .theme-toggle:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  /* SELECTION - Light mode */
  ::-moz-selection {
    color: black;
    background-color: #d1d5db;
    /* gray-300 */
  }

  ::selection {
    color: black;
    background-color: #d1d5db;
    /* gray-300 */
  }

  /* SELECTION - Dark mode */
  html.dark ::-moz-selection {
    color: white;
    background-color: black;
  }

  html.dark ::selection {
    color: white;
    background-color: black;
  }

  /* SimpleMDE Editor Selection - Light mode */
  .CodeMirror .CodeMirror-selected {
    background-color: #d1d5db !important;
    /* gray-300 */
  }

  /* SimpleMDE Editor Selection - Dark mode */
  html.dark .CodeMirror .CodeMirror-selected {
    background-color: rgba(0, 0, 0, 0.3) !important;
    color: white !important;
  }

  /* SimpleMDE Cursor - Dark mode */
  html.dark .CodeMirror .CodeMirror-cursor {
    border-left: 1px solid white !important;
  }

  /* SimpleMDE Active Line - Dark mode */
  html.dark .CodeMirror .CodeMirror-activeline-background {
    background: rgba(255, 255, 255, 0.1) !important;
  }

  /* Solución específica para las líneas delimitadoras del Front Matter */
  .CodeMirror-line:nth-child(1) .cm-hr,
  .CodeMirror-line:nth-child(3) .cm-header {
    font-size: 160% !important;
    font-weight: bold !important;
    line-height: inherit !important;
  }

  /* Estilos adicionales para mejorar la apariencia del editor */
  .CodeMirror-gutters {
    border-right: 1px solid var(--border-color) !important;
    background-color: var(--bg-secondary) !important;
  }

</style>