<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Job.php';
require_once __DIR__ . '/../models/Application.php';

class JobController {
    private $db;
    private $job;
    private $application;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->job = new Job($this->db);
        $this->application = new Application($this->db);
    }

    public function createJob() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return ['error' => 'Invalid request method'];
        }

        session_start();
        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'company') {
            return ['error' => 'Unauthorized access'];
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!$data || !isset($data->title) || !isset($data->description) || !isset($data->job_type)) {
            return ['error' => 'Missing required fields'];
        }

        $this->job->company_id = $_SESSION['user_id'];
        $this->job->title = htmlspecialchars(strip_tags($data->title));
        $this->job->description = htmlspecialchars(strip_tags($data->description));
        $this->job->requirements = isset($data->requirements) ? htmlspecialchars(strip_tags($data->requirements)) : null;
        $this->job->location = isset($data->location) ? htmlspecialchars(strip_tags($data->location)) : null;
        $this->job->salary_range = isset($data->salary_range) ? htmlspecialchars(strip_tags($data->salary_range)) : null;
        $this->job->job_type = htmlspecialchars(strip_tags($data->job_type));

        if ($this->job->create()) {
            return ['message' => 'Job created successfully'];
        }

        return ['error' => 'Failed to create job'];
    }

    public function getJobs() {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $per_page = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 10;

        $result = $this->job->read($page, $per_page);
        $total = $this->job->getTotal();
        $total_pages = ceil($total / $per_page);

        $jobs = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $jobs[] = $row;
        }

        return [
            'jobs' => $jobs,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $per_page,
                'total_pages' => $total_pages,
                'total_records' => $total
            ]
        ];
    }

    public function getCompanyJobs() {
        session_start();
        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'company') {
            return ['error' => 'Unauthorized access'];
        }

        $result = $this->job->getJobsByCompany($_SESSION['user_id']);
        $jobs = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $jobs[] = $row;
        }

        return ['jobs' => $jobs];
    }

    public function updateJob() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            return ['error' => 'Invalid request method'];
        }

        session_start();
        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'company') {
            return ['error' => 'Unauthorized access'];
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!$data || !isset($data->id) || !isset($data->title) || !isset($data->description)) {
            return ['error' => 'Missing required fields'];
        }

        $this->job->id = $data->id;
        $this->job->company_id = $_SESSION['user_id'];
        $this->job->title = htmlspecialchars(strip_tags($data->title));
        $this->job->description = htmlspecialchars(strip_tags($data->description));
        $this->job->requirements = isset($data->requirements) ? htmlspecialchars(strip_tags($data->requirements)) : null;
        $this->job->location = isset($data->location) ? htmlspecialchars(strip_tags($data->location)) : null;
        $this->job->salary_range = isset($data->salary_range) ? htmlspecialchars(strip_tags($data->salary_range)) : null;
        $this->job->job_type = isset($data->job_type) ? htmlspecialchars(strip_tags($data->job_type)) : null;
        $this->job->status = isset($data->status) ? htmlspecialchars(strip_tags($data->status)) : 'active';

        if ($this->job->update()) {
            return ['message' => 'Job updated successfully'];
        }

        return ['error' => 'Failed to update job'];
    }

    public function deleteJob() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return ['error' => 'Invalid request method'];
        }

        session_start();
        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'company') {
            return ['error' => 'Unauthorized access'];
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!$data || !isset($data->id)) {
            return ['error' => 'Missing job ID'];
        }

        $this->job->id = $data->id;
        $this->job->company_id = $_SESSION['user_id'];

        if ($this->job->delete()) {
            return ['message' => 'Job deleted successfully'];
        }

        return ['error' => 'Failed to delete job'];
    }

    public function applyForJob() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return ['error' => 'Invalid request method'];
        }

        session_start();
        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'jobseeker') {
            return ['error' => 'Unauthorized access'];
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!$data || !isset($data->job_id)) {
            return ['error' => 'Missing job ID'];
        }

        if ($this->application->checkExistingApplication($data->job_id, $_SESSION['user_id'])) {
            return ['error' => 'You have already applied for this job'];
        }

        $this->application->job_id = $data->job_id;
        $this->application->user_id = $_SESSION['user_id'];

        if ($this->application->apply()) {
            return ['message' => 'Application submitted successfully'];
        }

        return ['error' => 'Failed to submit application'];
    }

    public function getJobApplications() {
        session_start();
        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'company') {
            return ['error' => 'Unauthorized access'];
        }

        $job_id = isset($_GET['job_id']) ? (int)$_GET['job_id'] : 0;
        if (!$job_id) {
            return ['error' => 'Missing job ID'];
        }

        $result = $this->application->getJobApplications($job_id);
        $applications = [];
        while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $applications[] = $row;
        }

        return ['applications' => $applications];
    }

    public function updateApplicationStatus() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            return ['error' => 'Invalid request method'];
        }

        session_start();
        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'company') {
            return ['error' => 'Unauthorized access'];
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!$data || !isset($data->application_id) || !isset($data->status)) {
            return ['error' => 'Missing required fields'];
        }

        $this->application->id = $data->application_id;
        $this->application->status = htmlspecialchars(strip_tags($data->status));

        if ($this->application->updateStatus()) {
            return ['message' => 'Application status updated successfully'];
        }

        return ['error' => 'Failed to update application status'];
    }
}
?> 