<script>
  // Script para manejar las operaciones de Git
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando script de Git');
    
    // Elementos del DOM
    const gitButton = document.getElementById('git-button');
    const gitModal = document.getElementById('git-modal');
    const closeModal = document.querySelector('.close-modal');
    const closeBtn = document.getElementById('git-close-btn');
    const gitOutput = document.getElementById('git-output');
    const gitStatusOutput = document.getElementById('git-status-output');
    const gitRepoPath = document.getElementById('git-repo-path');
    const commitMessage = document.getElementById('commit-message');
    
    // Verificar si los elementos existen
    if (!gitButton || !gitModal) {
      console.warn('Elementos de Git no encontrados');
      return;
    }
    
    // Función para abrir el modal
    function openGitModal() {
      gitModal.style.display = 'block';
      gitModal.classList.remove('hidden');
      // Cargar el estado inicial del repositorio
      executeGitCommand('status');
    }
    
    // Función para cerrar el modal
    function closeGitModal() {
      gitModal.style.display = 'none';
      gitModal.classList.add('hidden');
    }
    
    // Configurar eventos para abrir/cerrar el modal
    gitButton.addEventListener('click', openGitModal);
    if (closeModal) closeModal.addEventListener('click', closeGitModal);
    if (closeBtn) closeBtn.addEventListener('click', closeGitModal);
    
    // Cerrar el modal al hacer clic fuera del contenido
    window.addEventListener('click', function(event) {
      if (event.target === gitModal) {
        closeGitModal();
      }
    });
    
    // Función para ejecutar comandos Git mediante AJAX
    function executeGitCommand(action, params = {}) {
      // Mostrar indicador de carga
      const targetOutput = action === 'status' ? gitStatusOutput : gitOutput;
      targetOutput.textContent = 'Ejecutando comando...';
      
      // Preparar datos para enviar
      const data = new FormData();
      data.append('action', action);
      
      // Añadir parámetros adicionales
      for (const key in params) {
        if (params.hasOwnProperty(key)) {
          data.append(key, params[key]);
        }
      }
      
      // Enviar solicitud AJAX
      fetch('process.php?action=git', {
        method: 'POST',
        body: data
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          targetOutput.textContent = data.output;
          if (data.repoPath) {
            gitRepoPath.textContent = data.repoPath;
          }
          // Si la acción fue status, actualizar también el estado general
          if (action !== 'status' && gitStatusOutput) {
            // Actualizar el estado después de cualquier acción
            executeGitCommand('status');
          }
        } else {
          targetOutput.textContent = 'Error: ' + data.error;
        }
      })
      .catch(error => {
        targetOutput.textContent = 'Error en la comunicación: ' + error.message;
        console.error('Error:', error);
      });
    }
    
    // Configurar eventos para los botones de acción Git
    document.querySelectorAll('.git-btn[data-action]').forEach(button => {
      button.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        let params = {};
        
        // Acciones específicas que requieren parámetros adicionales
        if (action === 'commit') {
          params.message = commitMessage.value.trim();
          if (!params.message) {
            alert('Por favor, ingresa un mensaje de commit');
            return;
          }
        }
        
        // Ejecutar el comando Git
        executeGitCommand(action, params);
      });
    });
  });
</script>