<?php
// inc/fields-helper.php
// Helper functions for handling custom fields

/**
 * Get all configured fields
 * 
 * @return array Array of field configurations
 */
function getConfiguredFields() {
    // Detectar la colección actual basada en el parámetro GET, la URL o el referer
    $collection = isset($_GET['collection']) ? $_GET['collection'] : '';
    
    // Si el parámetro collection fue proporcionado y el directorio existe, usarlo directamente
    if (!empty($collection) && is_dir(__DIR__ . '/../collections/' . $collection)) {
        // Log para depuración
        error_log("Colección detectada desde parámetro GET: {$collection}");
    } else {
        // Reset collection si no existe el directorio
        $collection = '';
        
        // Intentar detectar la colección desde la URL actual
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        $uriParts = explode('/', trim($requestUri, '/'));
        
        // Verificar si alguna parte de la URL coincide con una colección conocida
        foreach ($uriParts as $part) {
            if (is_dir(__DIR__ . '/../collections/' . $part)) {
                $collection = $part;
                error_log("Colección detectada desde URL: {$collection}");
                break;
            }
        }
        
        // Si no se encontró en la URL, intentar con el referer
        if (empty($collection) && isset($_SERVER['HTTP_REFERER'])) {
            $refererParts = parse_url($_SERVER['HTTP_REFERER']);
            if (isset($refererParts['path'])) {
                $pathParts = explode('/', trim($refererParts['path'], '/'));
                foreach ($pathParts as $part) {
                    if (is_dir(__DIR__ . '/../collections/' . $part)) {
                        $collection = $part;
                        error_log("Colección detectada desde referer: {$collection}");
                        break;
                    }
                }
            }
        }
    }
    
    // Cargar la configuración de la colección detectada
    if (!empty($collection) && file_exists(__DIR__ . '/../collections/' . $collection . '/fields.php')) {
        error_log("Cargando campos desde: /../collections/{$collection}/fields.php");
        $fieldsConfig = include __DIR__ . '/../collections/' . $collection . '/fields.php';
    } else {
        // Intentar cargar desde la ubicación antigua por compatibilidad
        if (!empty($collection) && file_exists(__DIR__ . '/../' . $collection . '/fields.php')) {
            error_log("Cargando campos desde ubicación antigua: /../{$collection}/fields.php");
            $fieldsConfig = include __DIR__ . '/../' . $collection . '/fields.php';
        } else {
            // Si no hay configuración disponible, devolver el editor por defecto
            error_log("No se encontró configuración de campos para la colección: {$collection}");
            $fieldsConfig = [
                [
                    'name' => 'editor',
                    'label' => '',
                    'location' => 'main',
                    'type' => 'editor',
                ],
            ];
        }
    }
    
    return $fieldsConfig;
}

/**
 * Get fields for a specific sidebar location
 * 
 * @param string $location The sidebar location ('left' or 'right')
 * @return array Fields for the specified location
 */
function getFieldsByLocation($location) {
    $allFields = getConfiguredFields();
    return array_filter($allFields, function($field) use ($location) {
        return $field['location'] === $location;
    });
}

/**
 * Check if editor field is enabled in configuration
 * 
 * @return bool True if editor is enabled, false otherwise
 */
function isEditorEnabled() {
    $allFields = getConfiguredFields();
    foreach ($allFields as $field) {
        if ($field['type'] === 'editor' && $field['location'] === 'main') {
            return true;
        }
    }
    return false;
}

/**
 * Get fields for the main area
 * 
 * @return array Fields for the main area
 */
function getMainFields() {
    $allFields = getConfiguredFields();
    return array_filter($allFields, function($field) {
        return $field['location'] === 'main';
    });
}

/**
 * Render a field based on its configuration
 * 
 * @param array $field Field configuration
 * @param array $values Current field values
 * @return string HTML for the field
 */
function renderField($field, $values = []) {
    $name = $field['name'];
    $label = $field['label'];
    $type = $field['type'];
    $value = isset($values[$name]) ? $values[$name] : '';
    $placeholder = isset($field['placeholder']) ? $field['placeholder'] : '';
    $default = isset($field['default']) ? $field['default'] : '';
    
    $html = '<div class="custom-field mb-6" data-field-name="' . $name . '"';
    
    // Add default value as data attribute if specified
    if (!empty($default)) {
        $html .= ' data-default-value="' . htmlspecialchars($default) . '"';
    }
    
    $html .= '>';
    $html .= '<label class="block text-lg font-medium mb-1">' . htmlspecialchars($label) . '</label>';
    
    switch ($type) {
        case 'text':
            $html .= '<input type="text" name="custom_fields[' . $name . ']" value="' . htmlspecialchars($value) . '" placeholder="' . htmlspecialchars($placeholder) . '" class="w-full border rounded p-2 bg-transparent border-neutral-300 dark:border-neutral-700">';
            break;
            
        case 'number':
            $min = isset($field['min']) ? ' min="' . htmlspecialchars($field['min']) . '"' : '';
            $max = isset($field['max']) ? ' max="' . htmlspecialchars($field['max']) . '"' : '';
            $step = isset($field['step']) ? ' step="' . htmlspecialchars($field['step']) . '"' : '';
            $description = isset($field['description']) ? $field['description'] : '';
            
            $html .= '<input type="number" name="custom_fields[' . $name . ']" value="' . htmlspecialchars($value) . '"' . $min . $max . $step . ' placeholder="' . htmlspecialchars($placeholder) . '" class="w-full border rounded p-2 bg-transparent border-neutral-300 dark:border-neutral-700">';
            
            // If there's a description, show it below the input
            if (!empty($description)) {
                $html .= '<p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">' . htmlspecialchars($description) . '</p>';
            }
            break;
            
        case 'textarea':
            $html .= '<textarea name="custom_fields[' . $name . ']" placeholder="' . htmlspecialchars($placeholder) . '" class="w-full border rounded p-2 bg-transparent border-neutral-300 dark:border-neutral-700" rows="3">' . htmlspecialchars($value) . '</textarea>';
            break;
            
        case 'select':
            $html .= '<select name="custom_fields[' . $name . ']" class="w-full border rounded p-2 bg-transparent text-neutral-800 dark:text-white border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800"';
            
            // Añadir opciones como atributos data para que JavaScript pueda acceder a ellas
            $optionValues = array_keys($field['options']);
            $optionLabels = array_values($field['options']);
            $html .= ' data-options="' . htmlspecialchars(json_encode($optionValues)) . '"';
            $html .= ' data-option-labels="' . htmlspecialchars(json_encode($optionLabels)) . '"';
            
            $html .= '>';
            
            // Add empty option if no value is selected
            if (empty($value)) {
                $html .= '<option value="" class="text-neutral-800 dark:text-white bg-white dark:bg-neutral-800">-- Select --</option>';
            }
            
            foreach ($field['options'] as $optionValue => $optionLabel) {
                $selected = $value === $optionValue ? ' selected' : '';
                $html .= '<option value="' . htmlspecialchars($optionValue) . '"' . $selected . ' class="text-neutral-800 dark:text-white bg-white dark:bg-neutral-800">' . htmlspecialchars($optionLabel) . '</option>';
            }
            
            $html .= '</select>';
            break;
            
        case 'date':
            $format = isset($field['format']) ? $field['format'] : 'YYYY-MM-DD';
            $html .= '<input type="date" name="custom_fields[' . $name . ']" value="' . htmlspecialchars($value) . '" class="date-picker w-full border rounded p-2 bg-transparent dark:text-white border-neutral-300 dark:border-neutral-700" data-format="' . htmlspecialchars($format) . '">';
            break;
            
        case 'editor':
            // Editor field is handled separately in the main layout
            $html .= '<div class="editor-field-placeholder"></div>';
            break;
            
        case 'gallery':
            $description = isset($field['description']) ? $field['description'] : '';
            $galleryValues = [];
            
            // Parse the value if it exists
            if (!empty($value)) {
                // If the value is already an array, use it directly
                if (is_array($value)) {
                    $galleryValues = $value;
                } else {
                    // Try to parse JSON string
                    $decoded = json_decode($value, true);
                    if (is_array($decoded)) {
                        $galleryValues = $decoded;
                    } else {
                        // Fallback: treat as comma-separated string
                        $galleryValues = array_map('trim', explode(',', $value));
                    }
                }
            }
            
            // Create a unique ID for this gallery field
            $galleryId = 'gallery-' . $name . '-' . uniqid();
            
            $html .= '<div class="gallery-field" data-gallery-id="' . $galleryId . '">';
            
            // Description if available
            if (!empty($description)) {
                $html .= '<p class="text-sm text-neutral-500 dark:text-neutral-400 mb-2">' . htmlspecialchars($description) . '</p>';
            }
            
            // Container for selected images
            $html .= '<div class="gallery-images-container">';
            
            // Display existing images if any
            foreach ($galleryValues as $imagePath) {
                // Convert to full path for display
                $displayPath = $imagePath;
                if (strpos($imagePath, '/') === 0) {
                    $displayPath = '../../../public' . $imagePath;
                } elseif (strpos($imagePath, 'http') !== 0 && strpos($imagePath, '../../../public') !== 0) {
                    // Si no es una URL completa y no comienza con ../../../public, añadir el prefijo
                    $displayPath = '../../../public/' . $imagePath;
                }
                
                $html .= '<div class="gallery-image-item">';
                $html .= '<img src="' . htmlspecialchars($displayPath) . '" class="w-full h-20 object-cover">';
                $html .= '<button type="button" class="gallery-remove-image" data-path="' . htmlspecialchars($imagePath) . '">';
                $html .= '<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">';
                $html .= '<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />';
                $html .= '</svg>';
                $html .= '</button>';
                $html .= '</div>';
            }
            
            $html .= '</div>';
            
            // Add image button
            $html .= '<button type="button" class="gallery-add-images btn neutral" data-media-mode="gallery" data-gallery-id="' . $galleryId . '">';
            $html .= 'Add Images';
            $html .= '</button>';
            
            // Hidden input to store the gallery data
            $jsonValue = htmlspecialchars(json_encode($galleryValues));
            $html .= '<input type="hidden" name="custom_fields[' . $name . ']" class="gallery-data" value=\'' . $jsonValue . '\'>';
            
            $html .= '</div>';
            break;
            
        case 'tags':
            // Parse the value if it exists
            $tagsValues = [];
            
            if (!empty($value)) {
                // If the value is already an array, use it directly
                if (is_array($value)) {
                    $tagsValues = $value;
                } else {
                    // Try to parse JSON string
                    $decoded = json_decode($value, true);
                    if (is_array($decoded)) {
                        $tagsValues = $decoded;
                    } else {
                        // Fallback: treat as comma-separated string
                        $tagsValues = array_map('trim', explode(',', $value));
                    }
                }
            }
            
            $description = isset($field['description']) ? $field['description'] : '';
            
            // Create a unique ID for this tags field
            $tagsId = 'tags-' . $name . '-' . uniqid();
            
            $html .= '<div class="tags-field" data-tags-id="' . $tagsId . '">';
            
            // Description if available
            if (!empty($description)) {
                $html .= '<p class="text-sm text-neutral-500 dark:text-neutral-400 mb-2">' . htmlspecialchars($description) . '</p>';
            }
            
            // Container for tags
            $html .= '<div class="tags-list flex flex-wrap gap-2 mb-3">';
            
            // Display existing tags if any
            foreach ($tagsValues as $tag) {
                $html .= '<div class="tag-item bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-sm flex items-center">';
                $html .= '<span>' . htmlspecialchars($tag) . '</span>';
                $html .= '<button type="button" class="tag-remove ml-1 text-red-500 hover:text-red-700 dark:hover:text-red-400" data-tag="' . htmlspecialchars($tag) . '">';
                $html .= '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">';
                $html .= '<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />';
                $html .= '</svg>';
                $html .= '</button>';
                $html .= '</div>';
            }
            
            $html .= '</div>';
            
            // Input for adding new tags
            $html .= '<div class="flex gap-2">';
            $html .= '<input type="text" class="tag-input border rounded p-2 flex-grow text-sm bg-transparent border-neutral-300 dark:border-neutral-700" placeholder="Add new tag">';
            $html .= '<button type="button" class="add-tag btn neutral">Add</button>';
            $html .= '</div>';
            
            // Hidden input to store the tags data
            $jsonValue = htmlspecialchars(json_encode($tagsValues));
            $html .= '<input type="hidden" name="custom_fields[' . $name . ']" class="tags-data" value=\'' . $jsonValue . '\'>';
            
            $html .= '</div>';
            break;
            
        case 'checkbox':
            // Determinar si el checkbox debe estar marcado
            $checked = false;
            if (!empty($value)) {
                // Convertir varios formatos posibles a boolean
                if (is_string($value)) {
                    $checked = in_array(strtolower($value), ['true', '1', 'yes', 'on']);
                } else {
                    $checked = (bool)$value;
                }
            } else if (!empty($default)) {
                // Usar el valor por defecto si está definido
                $checked = in_array(strtolower($default), ['true', '1', 'yes', 'on']);
            }
            
            $checkedAttr = $checked ? ' checked' : '';
            $description = isset($field['description']) ? $field['description'] : '';
            
            // Crear un contenedor flexible para el checkbox y su etiqueta
            $html .= '<div class="checkbox-wrapper flex items-center">';
            $html .= '<input type="checkbox" id="' . $name . '_checkbox" name="custom_fields[' . $name . ']" value="true"' . $checkedAttr . ' class="checkbox-input mr-2 h-5 w-5">';
            
            // Si hay una descripción, mostrarla como una etiqueta secundaria
            if (!empty($description)) {
                $html .= '<label for="' . $name . '_checkbox" class="text-sm text-neutral-600 dark:text-neutral-400">' . htmlspecialchars($description) . '</label>';
            }
            
            // Añadir un campo oculto para asegurar que se envíe un valor incluso si el checkbox no está marcado
            $html .= '<input type="hidden" name="custom_fields_checkbox_state[' . $name . ']" value="included">';
            $html .= '</div>';
            break;
    }
    
    $html .= '</div>';
    return $html;
}

/**
 * Extract custom field values from front matter
 * 
 * @param string $content Markdown content with front matter
 * @return array Field values from front matter
 */
function extractFieldValuesFromFrontMatter($content) {
    $values = [];
    
    // Check if content has front matter (between --- and ---)
    $frontMatterRegex = '/^---\s*\n([\s\S]*?)\n---\s*\n/';
    $match = preg_match($frontMatterRegex, $content, $matches);
    
    if ($match && isset($matches[1])) {
        $frontMatter = $matches[1];
        $lines = explode("\n", $frontMatter);
        
        foreach ($lines as $line) {
            // Look for field: value pattern
            if (preg_match('/^([a-zA-Z0-9_]+):\s*(.*)$/', $line, $fieldMatches)) {
                $fieldName = $fieldMatches[1];
                $fieldValue = trim($fieldMatches[2]);
                
                // Get field type if available
                $fieldType = '';
                $configuredFields = getConfiguredFields();
                foreach ($configuredFields as $field) {
                    if ($field['name'] === $fieldName) {
                        $fieldType = $field['type'];
                        break;
                    }
                }

                // Only remove quotes for non-select and non-date fields
                if ($fieldType !== 'select' && $fieldType !== 'date') {
                    if (preg_match('/^[\'"](.*)[\'"]\s*$/', $fieldValue, $valueMatches)) {
                        $fieldValue = $valueMatches[1];
                    }
                }
                
                // Try to decode JSON values (for arrays like gallery)
                if ($fieldName == 'gallery' || strpos($fieldValue, '[') === 0) {
                    $jsonDecoded = json_decode($fieldValue, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $fieldValue = $jsonDecoded;
                    } else {
                        // Si falla la decodificación JSON pero parece un array, intentar parsearlo manualmente
                        if (strpos($fieldValue, '[') === 0 && strpos($fieldValue, ']') !== false) {
                            $arrayContent = substr($fieldValue, 1, -1); // Quitar los corchetes
                            $items = explode(',', $arrayContent);
                            $parsedArray = [];
                            foreach ($items as $item) {
                                $item = trim($item);
                                // Quitar comillas si existen
                                if (preg_match('/^[\'"](.*)[\'"]\s*$/', $item, $itemMatches)) {
                                    $item = $itemMatches[1];
                                }
                                if (!empty($item)) {
                                    $parsedArray[] = $item;
                                }
                            }
                            $fieldValue = $parsedArray;
                        }
                    }
                }
                
                $values[$fieldName] = $fieldValue;
            }
        }
    }
    
    return $values;
}

/**
 * Update front matter with custom field values
 * 
 * @param string $content Original content
 * @param array $fieldValues Field values to update
 * @return string Updated content with new front matter
 */
function updateFrontMatterWithFieldValues($content, $fieldValues) {
    // Extract existing front matter
    $frontMatterRegex = '/^---\s*\n([\s\S]*?)\n---\s*\n/';
    $match = preg_match($frontMatterRegex, $content, $matches);
    
    $frontMatter = [];
    $categories = [];
    
    if ($match && isset($matches[1])) {
        $existingFrontMatter = $matches[1];
        $lines = explode("\n", $existingFrontMatter);
        
        foreach ($lines as $line) {
            // Parse categories separately
            if (preg_match('/^categories:\s*\[(.*)\]$/', $line, $catMatches)) {
                $categoriesStr = $catMatches[1];
                preg_match_all('/"([^"]*)"/', $categoriesStr, $catItems);
                if (isset($catItems[1])) {
                    $categories = $catItems[1];
                }
                continue;
            }
            
            // Parse other fields
            if (preg_match('/^([a-zA-Z0-9_]+):\s*(.*)$/', $line, $fieldMatches)) {
                $fieldName = $fieldMatches[1];
                $fieldValue = trim($fieldMatches[2]);
                
                // Skip fields that will be updated
                if (isset($fieldValues[$fieldName])) {
                    continue;
                }
                
                $frontMatter[$fieldName] = $fieldValue;
            }
        }
    }
    
    // Get configured fields to check types
    $configuredFields = getConfiguredFields();

    // Add/update custom fields
    foreach ($fieldValues as $name => $value) {
        if (!empty($value)) {
            // Get field type if available
            $fieldType = '';
            foreach ($configuredFields as $field) {
                if ($field['name'] === $name) {
                    $fieldType = $field['type'];
                    break;
                }
            }

            // Handle different field types
            switch ($fieldType) {
                case 'select':
                    // Ensure select values are properly quoted
                    if (!empty($value)) {
                        // Remove existing quotes first
                        $value = trim($value, '"');
                        $value = '"' . str_replace('"', '\\"', $value) . '"';
                    }
                    break;
                case 'date':
                    // Ensure dates are in YYYY-MM-DD format and quoted
                    if (!empty($value)) {
                        // Remove existing quotes first
                        $value = trim($value, '"');
                        $date = strtotime($value);
                        if ($date !== false) {
                            $value = '"' . date('Y-m-d', $date) . '"';
                        }
                    }
                    break;
                case 'number':
                    // Ensure number values are stored as actual numbers
                    if (!empty($value)) {
                        // Convert string to float or integer based on the value
                        if (strpos($value, '.') !== false) {
                            // Value has decimal point, convert to float
                            $value = (float)$value;
                        } else {
                            // Value is a whole number, convert to integer
                            $value = (int)$value;
                        }
                    }
                    break;
                case 'checkbox':
                    // Manejar los valores booleanos para checkboxes
                    if (is_string($value)) {
                        // Convertir string a boolean
                        $boolValue = in_array(strtolower($value), ['true', '1', 'yes', 'on']);
                        $value = $boolValue ? 'true' : 'false';
                    } else {
                        // Convertir valor PHP a string boolean para frontmatter
                        $value = (bool)$value ? 'true' : 'false';
                    }
                    break;
                default:
                    // Default behavior for other types
                    if (is_string($value) && !is_numeric($value)) {
                        // Remove existing quotes first
                        $value = trim($value, '"');
                        $value = '"' . str_replace('"', '\\"', $value) . '"';
                    }
            }
            $frontMatter[$name] = $value;
        }
    }
    
    // Build new front matter
    $newFrontMatter = "---\n";
    
    // Add categories first if they exist
    if (!empty($categories)) {
        $categoriesStr = 'categories: [' . implode(', ', array_map(function($cat) {
            return '"' . $cat . '"';
        }, $categories)) . ']';
        $newFrontMatter .= $categoriesStr . "\n";
    }
    
    // Add other fields
    foreach ($frontMatter as $name => $value) {
        $newFrontMatter .= $name . ': ' . $value . "\n";
    }
    
    $newFrontMatter .= "---\n\n";
    
    // Replace existing front matter or add new one
    if ($match) {
        $content = preg_replace($frontMatterRegex, $newFrontMatter, $content, 1);
    } else {
        $content = $newFrontMatter . $content;
    }
    
    return $content;
}