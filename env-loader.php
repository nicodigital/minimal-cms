<?php
/**
 * Environment Variable Loader
 * 
 * Loads environment variables from a .env file.
 * This provides a simple solution without requiring third-party packages.
 */

class EnvLoader {
    /**
     * Load environment variables from .env file
     * 
     * @param string $path Path to .env file
     * @return bool True if file was loaded, false otherwise
     */
    public static function load($path) {
        if (!file_exists($path)) {
            return false;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return false;
        }

        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            // Parse the line
            list($name, $value) = static::parseLine($line);
            
            if (!empty($name)) {
                // Set as environment variable if it doesn't already exist
                if (!isset($_ENV[$name]) && !isset($_SERVER[$name])) {
                    $_ENV[$name] = $value;
                    // Also set in $_SERVER for compatibility
                    $_SERVER[$name] = $value;
                    // Use putenv for broader compatibility
                    putenv("$name=$value");
                }
            }
        }

        return true;
    }

    /**
     * Parse a line from the .env file
     * 
     * @param string $line Line from .env file
     * @return array Array with name and value
     */
    protected static function parseLine($line) {
        // Check if it contains an equal sign
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            // Remove quotes if present
            if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            }

            return [$name, $value];
        }

        return [null, null];
    }

    /**
     * Get environment variable
     * 
     * @param string $key Variable name
     * @param mixed $default Default value if not found
     * @return mixed Environment variable value or default
     */
    public static function get($key, $default = null) {
        $value = getenv($key);
        
        if ($value === false) {
            return $default;
        }
        
        return $value;
    }
}

// No permitir acceso directo a este archivo
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    header('HTTP/1.0 403 Forbidden');
    exit('Acceso prohibido');
}

// Automatically load the .env file
$envPath = __DIR__ . '/.env';
EnvLoader::load($envPath);
