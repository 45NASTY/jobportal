<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Profile.php';

class AuthController {
    private $db;
    private $user;
    private $profile;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
        $this->profile = new Profile($this->db);
    }

    public function register() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return ['error' => 'Invalid request method'];
        }

        // Get JSON input
        $json = file_get_contents("php://input");
        $data = json_decode($json);

        if (!$data) {
            return ['error' => 'Invalid JSON data'];
        }

        // Validate required fields
        if (!isset($data->username) || !isset($data->email) || !isset($data->password) || !isset($data->user_type)) {
            return ['error' => 'Missing required fields'];
        }

        // Set user properties
        $this->user->username = htmlspecialchars(strip_tags($data->username));
        $this->user->email = htmlspecialchars(strip_tags($data->email));
        $this->user->password = $data->password;
        $this->user->user_type = htmlspecialchars(strip_tags($data->user_type));

        // Attempt to register
        if ($this->user->register()) {
            // Create initial profile
            $this->profile->user_id = $this->user->id;
            $this->profile->create();
            
            return [
                'success' => true,
                'message' => 'Registration successful'
            ];
        }

        // Return error if registration failed
        return [
            'success' => false,
            'error' => $this->user->error ?? 'Registration failed'
        ];
    }

    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return ['error' => 'Invalid request method'];
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!$data || !isset($data->email) || !isset($data->password)) {
            return ['error' => 'Missing required fields'];
        }

        $this->user->email = htmlspecialchars(strip_tags($data->email));
        $this->user->password = $data->password;

        if ($this->user->login()) {
            session_start();
            $_SESSION['user_id'] = $this->user->id;
            $_SESSION['username'] = $this->user->username;
            $_SESSION['user_type'] = $this->user->user_type;

            return [
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $this->user->id,
                    'username' => $this->user->username,
                    'user_type' => $this->user->user_type
                ]
            ];
        }

        return [
            'success' => false,
            'error' => 'Invalid credentials'
        ];
    }

    public function logout() {
        session_start();
        session_destroy();
        return [
            'success' => true,
            'message' => 'Logout successful'
        ];
    }

    public function isLoggedIn() {
        session_start();
        return isset($_SESSION['user_id']);
    }

    public function getCurrentUser() {
        if ($this->isLoggedIn()) {
            return [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'user_type' => $_SESSION['user_type']
            ];
        }
        return null;
    }
}
?> 