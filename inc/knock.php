<?php
class Knock {
    protected $options = [
        'users_dir' => 'users',
        'cookie_expire' => 604800, // 1 week
        'cookie_path' => '/',
        'cookie_domain' => '',
        'cookie_secure' => false,
        'cookie_httponly' => true,
        'cookie_name' => 'knock_auth',
        'cookie_samesite' => 'Strict',
        'session_key' => 'knock_user',
        'whitelist' => [],
        'debug' => false
    ];

    public function __construct($options = []) {
        $this->options = array_merge($this->options, $options);
        $this->startSession();
    }

    protected function startSession() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function login($username, $password) {
        $user_file = $this->options['users_dir'] . '/' . $username . '.php';
        
        if (!file_exists($user_file)) {
            return false;
        }
        
        $user = include $user_file;
        
        if (!isset($user['password'])) {
            return false;
        }
        
        // Verify password using SHA256
        if (hash('sha256', $password) !== $user['password']) {
            return false;
        }
        
        // Set session
        $_SESSION[$this->options['session_key']] = $username;
        
        // Set cookie if remember me is enabled
        setcookie(
            $this->options['cookie_name'],
            $username,
            time() + $this->options['cookie_expire'],
            $this->options['cookie_path'],
            $this->options['cookie_domain'],
            $this->options['cookie_secure'],
            $this->options['cookie_httponly']
        );
        
        return true;
    }

    public function logout() {
        // Clear session
        if (isset($_SESSION[$this->options['session_key']])) {
            unset($_SESSION[$this->options['session_key']]);
        }
        
        // Clear cookie
        setcookie(
            $this->options['cookie_name'],
            '',
            time() - 3600,
            $this->options['cookie_path'],
            $this->options['cookie_domain'],
            $this->options['cookie_secure'],
            $this->options['cookie_httponly']
        );
        
        return true;
    }

    public function isLoggedIn() {
        // Check if user is in session
        if (isset($_SESSION[$this->options['session_key']])) {
            return true;
        }
        
        // Check if user is in cookie
        if (isset($_COOKIE[$this->options['cookie_name']])) {
            $username = $_COOKIE[$this->options['cookie_name']];
            $user_file = $this->options['users_dir'] . '/' . $username . '.php';
            
            if (file_exists($user_file)) {
                $_SESSION[$this->options['session_key']] = $username;
                return true;
            }
        }
        
        return false;
    }

    public function getCurrentUser() {
        if (isset($_SESSION[$this->options['session_key']])) {
            return $_SESSION[$this->options['session_key']];
        }
        
        return null;
    }
}
