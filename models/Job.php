<?php
require_once __DIR__ . '/../config/database.php';

class Job {
    private $conn;
    private $table = 'jobs';

    public $id;
    public $company_id;
    public $title;
    public $description;
    public $requirements;
    public $location;
    public $salary_range;
    public $job_type;
    public $status;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                SET company_id=:company_id, 
                    title=:title, 
                    description=:description,
                    requirements=:requirements,
                    location=:location,
                    salary_range=:salary_range,
                    job_type=:job_type";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":company_id", $this->company_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":requirements", $this->requirements);
        $stmt->bindParam(":location", $this->location);
        $stmt->bindParam(":salary_range", $this->salary_range);
        $stmt->bindParam(":job_type", $this->job_type);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function read($page = 1, $per_page = 10) {
        $offset = ($page - 1) * $per_page;
        
        $query = "SELECT j.*, u.company_name, p.company_logo 
                FROM " . $this->table . " j
                LEFT JOIN users u ON j.company_id = u.id
                LEFT JOIN profiles p ON u.id = p.user_id
                WHERE j.status = 'active'
                ORDER BY j.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":limit", $per_page, PDO::PARAM_INT);
        $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt;
    }

    public function getTotal() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table . " WHERE status = 'active'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    public function update() {
        $query = "UPDATE " . $this->table . "
                SET title=:title, 
                    description=:description,
                    requirements=:requirements,
                    location=:location,
                    salary_range=:salary_range,
                    job_type=:job_type,
                    status=:status
                WHERE id=:id AND company_id=:company_id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":company_id", $this->company_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":requirements", $this->requirements);
        $stmt->bindParam(":location", $this->location);
        $stmt->bindParam(":salary_range", $this->salary_range);
        $stmt->bindParam(":job_type", $this->job_type);
        $stmt->bindParam(":status", $this->status);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id=:id AND company_id=:company_id";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":company_id", $this->company_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function getJobsByCompany($company_id) {
        $query = "SELECT * FROM " . $this->table . " WHERE company_id = ? ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $company_id);
        $stmt->execute();
        return $stmt;
    }
}
?> 