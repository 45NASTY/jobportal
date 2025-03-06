<?php
require_once __DIR__ . '/../config/database.php';

class User {
    private $conn;
    private $table = 'users';

    public $id;
    public $username;
    public $email;
    public $password;
    public $user_type;
    public $error;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function register() {
        // Validate input
        if (!$this->validateInput()) {
            return false;
        }

        // Check if email already exists
        if ($this->emailExists()) {
            $this->error = "Email already exists";
            return false;
        }

        // Check if username already exists
        if ($this->usernameExists()) {
            $this->error = "Username already exists";
            return false;
        }

        $query = "INSERT INTO " . $this->table . " SET username=:username, email=:email, password=:password, user_type=:user_type";
        $stmt = $this->conn->prepare($query);

        // Hash password
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);

        // Bind parameters
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":user_type", $this->user_type);

        try {
            if($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                return true;
            }
        } catch(PDOException $e) {
            $this->error = "Registration failed: " . $e->getMessage();
            return false;
        }

        $this->error = "Registration failed";
        return false;
    }

    private function validateInput() {
        // Validate email
        if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            $this->error = "Invalid email format";
            return false;
        }

        // Validate username (alphanumeric, 3-50 characters)
        if (!preg_match('/^[a-zA-Z0-9]{3,50}$/', $this->username)) {
            $this->error = "Username must be alphanumeric and between 3-50 characters";
            return false;
        }

        // Validate password (minimum 6 characters)
        if (strlen($this->password) < 6) {
            $this->error = "Password must be at least 6 characters long";
            return false;
        }

        // Validate user type
        if (!in_array($this->user_type, ['jobseeker', 'company'])) {
            $this->error = "Invalid user type";
            return false;
        }

        return true;
    }

    private function emailExists() {
        $query = "SELECT id FROM " . $this->table . " WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC) ? true : false;
    }

    private function usernameExists() {
        $query = "SELECT id FROM " . $this->table . " WHERE username = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->username);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC) ? true : false;
    }

    public function login() {
        $query = "SELECT id, username, password, user_type FROM " . $this->table . " WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row && password_verify($this->password, $row['password'])) {
            $this->id = $row['id'];
            $this->username = $row['username'];
            $this->user_type = $row['user_type'];
            return true;
        }
        return false;
    }

    public function getUserById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?> 