<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Profile.php';

class ProfileController {
    private $db;
    private $profile;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->profile = new Profile($this->db);
    }

    public function createOrUpdateProfile() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return ['error' => 'Invalid request method'];
        }

        session_start();
        if (!isset($_SESSION['user_id'])) {
            return ['error' => 'Unauthorized access'];
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!$data) {
            return ['error' => 'Missing profile data'];
        }

        $this->profile->user_id = $_SESSION['user_id'];
        $this->profile->full_name = isset($data->full_name) ? htmlspecialchars(strip_tags($data->full_name)) : null;
        $this->profile->phone = isset($data->phone) ? htmlspecialchars(strip_tags($data->phone)) : null;
        $this->profile->address = isset($data->address) ? htmlspecialchars(strip_tags($data->address)) : null;
        $this->profile->bio = isset($data->bio) ? htmlspecialchars(strip_tags($data->bio)) : null;
        $this->profile->company_name = isset($data->company_name) ? htmlspecialchars(strip_tags($data->company_name)) : null;
        $this->profile->company_website = isset($data->company_website) ? htmlspecialchars(strip_tags($data->company_website)) : null;

        // Handle file uploads
        if (isset($_FILES['resume']) && $_SESSION['user_type'] === 'jobseeker') {
            $this->profile->resume_path = $this->handleFileUpload($_FILES['resume'], 'resumes');
        }

        if (isset($_FILES['company_logo']) && $_SESSION['user_type'] === 'company') {
            $this->profile->company_logo = $this->handleFileUpload($_FILES['company_logo'], 'logos');
        }

        $existing_profile = $this->profile->getProfileByUserId($_SESSION['user_id']);

        if ($existing_profile) {
            if ($this->profile->update()) {
                return ['message' => 'Profile updated successfully'];
            }
        } else {
            if ($this->profile->create()) {
                return ['message' => 'Profile created successfully'];
            }
        }

        return ['error' => 'Failed to save profile'];
    }

    public function getProfile() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            return ['error' => 'Unauthorized access'];
        }

        $profile = $this->profile->getProfileByUserId($_SESSION['user_id']);
        
        if ($profile) {
            return ['profile' => $profile];
        }

        return ['error' => 'Profile not found'];
    }

    private function handleFileUpload($file, $directory) {
        $target_dir = __DIR__ . "/../uploads/" . $directory . "/";
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $file_name = uniqid() . '.' . $file_extension;
        $target_file = $target_dir . $file_name;

        $allowed_types = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
        if (!in_array($file_extension, $allowed_types)) {
            throw new Exception('Invalid file type');
        }

        if (move_uploaded_file($file['tmp_name'], $target_file)) {
            return $directory . '/' . $file_name;
        }

        throw new Exception('Failed to upload file');
    }
}
?> 