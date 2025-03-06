<?php
require_once __DIR__ . '/../config/database.php';

class Profile {
    private $conn;
    private $table = 'profiles';

    public $id;
    public $user_id;
    public $full_name;
    public $phone;
    public $address;
    public $bio;
    public $resume_path;
    public $company_name;
    public $company_website;
    public $company_logo;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                SET user_id=:user_id, 
                    full_name=:full_name,
                    phone=:phone,
                    address=:address,
                    bio=:bio,
                    resume_path=:resume_path,
                    company_name=:company_name,
                    company_website=:company_website,
                    company_logo=:company_logo";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":bio", $this->bio);
        $stmt->bindParam(":resume_path", $this->resume_path);
        $stmt->bindParam(":company_name", $this->company_name);
        $stmt->bindParam(":company_website", $this->company_website);
        $stmt->bindParam(":company_logo", $this->company_logo);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table . "
                SET full_name=:full_name,
                    phone=:phone,
                    address=:address,
                    bio=:bio,
                    resume_path=:resume_path,
                    company_name=:company_name,
                    company_website=:company_website,
                    company_logo=:company_logo
                WHERE user_id=:user_id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":bio", $this->bio);
        $stmt->bindParam(":resume_path", $this->resume_path);
        $stmt->bindParam(":company_name", $this->company_name);
        $stmt->bindParam(":company_website", $this->company_website);
        $stmt->bindParam(":company_logo", $this->company_logo);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function getProfileByUserId($user_id) {
        $query = "SELECT * FROM " . $this->table . " WHERE user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?> 