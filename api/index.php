<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/JobController.php';
require_once __DIR__ . '/../controllers/ProfileController.php';

$auth = new AuthController();
$job = new JobController();
$profile = new ProfileController();

// Get the request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// If it's a POST request, get the raw input and parse JSON
$input = file_get_contents('php://input');
$data = json_decode($input);

// Get action from POST data if available
if (($method === 'POST' || $method === 'PUT') && $data && isset($data->action)) {
    $action = $data->action;
}

try {
    $response = null;

    switch ($action) {
        // Auth actions
        case 'register':
            if ($method === 'POST') {
                $response = $auth->register();
            }
            break;
        case 'login':
            if ($method === 'POST') {
                $response = $auth->login();
            }
            break;
        case 'logout':
            $response = $auth->logout();
            break;

        // Job actions
        case 'jobs':
            if ($method === 'GET') {
                $response = $job->getJobs();
            } elseif ($method === 'POST') {
                $response = $job->createJob();
            } elseif ($method === 'PUT') {
                $response = $job->updateJob();
            }
            break;

        case 'delete_job':
            if ($method === 'POST') {
                $response = $job->deleteJob();
            }
            break;

        case 'company_jobs':
            $response = $job->getCompanyJobs();
            break;

        case 'apply':
            if ($method === 'POST') {
                $response = $job->applyForJob();
            }
            break;

        case 'applications':
            if ($method === 'GET') {
                $response = $job->getJobApplications();
            } elseif ($method === 'PUT') {
                $response = $job->updateApplicationStatus();
            }
            break;

        // Profile actions
        case 'profile':
            if ($method === 'GET') {
                $response = $profile->getProfile();
            } elseif ($method === 'POST') {
                $response = $profile->createOrUpdateProfile();
            }
            break;

        default:
            http_response_code(404);
            $response = ['error' => 'Action not found: ' . $action];
    }

    if ($response === null) {
        http_response_code(400);
        $response = ['error' => 'Invalid request method for action: ' . $action];
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 