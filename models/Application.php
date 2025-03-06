<?php
require_once __DIR__ . '/../config/database.php';

class Application {
    private $conn;
    private $table = 'applications';

    public $id;
    public $job_id;
    public $user_id;
    public $status;
    public $applied_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function apply() {
        $query = "INSERT INTO " . $this->table . " SET job_id=:job_id, user_id=:user_id";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":job_id", $this->job_id);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function getUserApplications($user_id) {
        $query = "SELECT a.*, j.title, j.company_id, u.company_name 
                FROM " . $this->table . " a
                JOIN jobs j ON a.job_id = j.id
                JOIN users u ON j.company_id = u.id
                WHERE a.user_id = ?
                ORDER BY a.applied_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        $stmt->execute();
        return $stmt;
    }

    public function getJobApplications($job_id) {
        $query = "SELECT a.*, u.username, p.full_name, p.resume_path
                FROM " . $this->table . " a
                JOIN users u ON a.user_id = u.id
                LEFT JOIN profiles p ON u.id = p.user_id
                WHERE a.job_id = ?
                ORDER BY a.applied_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $job_id);
        $stmt->execute();
        return $stmt;
    }

    public function updateStatus() {
        $query = "UPDATE " . $this->table . " SET status=:status WHERE id=:id";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function checkExistingApplication($job_id, $user_id) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table . " WHERE job_id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $job_id);
        $stmt->bindParam(2, $user_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'] > 0;
    }
}
?> 