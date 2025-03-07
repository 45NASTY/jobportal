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

    // Include database connection
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

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
                    // Get page number from query string, default to 1
                    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                    $per_page = 9; // Number of jobs per page
                    $offset = ($page - 1) * $per_page;

                    try {
                        // Get total number of jobs
                        $count_query = "SELECT COUNT(*) as total FROM jobs";
                        $count_stmt = $conn->query($count_query);
                        $total_jobs = $count_stmt->fetchColumn();
                        $total_pages = ceil($total_jobs / $per_page);

                        // Get jobs for current page
                        $query = "SELECT j.*, u.username as company_name 
                                FROM jobs j 
                                LEFT JOIN users u ON j.company_id = u.id 
                                ORDER BY j.created_at DESC 
                                LIMIT :limit OFFSET :offset";
                        
                        $stmt = $conn->prepare($query);
                        $stmt->bindValue(':limit', $per_page, PDO::PARAM_INT);
                        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                        $stmt->execute();
                        
                        $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

                        echo json_encode([
                            'jobs' => $jobs,
                            'pagination' => [
                                'current_page' => $page,
                                'total_pages' => $total_pages,
                                'per_page' => $per_page,
                                'total_jobs' => $total_jobs
                            ]
                        ]);
                        exit;
                    } catch (PDOException $e) {
                        http_response_code(500);
                        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
                        exit;
                    }
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

            // Job Applications
            case 'job_applications':
    session_start();

                if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                    echo json_encode(['error' => "Invalid request method for action: job_applications"]);
                    exit;
                }
                
                if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'company') {
                    echo json_encode(['error' => "Unauthorized access"]);
                    exit;
                }
            
                $company_id = $_SESSION['user_id'];
                
                $query = "SELECT 
                    ja.id,
                    ja.job_id,
                    j.title as job_title,
                    u.username as applicant_name,
                    u.email,
                    p.phone,
                    ja.status,
                    ja.applied_at as applied_date
                FROM applications ja
                JOIN jobs j ON ja.job_id = j.id
                JOIN users u ON ja.user_id = u.id
                LEFT JOIN profiles p ON u.id = p.user_id
                WHERE j.company_id = :company_id
                ORDER BY ja.applied_at DESC";
                
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':company_id', $company_id, PDO::PARAM_INT);
                $stmt->execute();
                $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                header('Content-Type: application/json');
                echo json_encode(['applications' => $applications]);
                exit;
            

                if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                    echo json_encode(['error' => 'Invalid request method for action: update_application_status']);
                    exit;
                }
                
                case 'update_application_status':
                    session_start();
                    error_log('Received POST data: ' . file_get_contents('php://input'));
                
                                        // Check if user is logged in and is a company
                                        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'company') {
                                            echo json_encode(['error' => 'Unauthorized access']);
                                            exit;
                                        }
                                
                                        $data = json_decode(file_get_contents('php://input'), true);
                                        $application_id = $data['application_id'] ?? null;
                                        $status = $data['status'] ?? null;
                                
                                        if (!$application_id || !$status) {
                                            echo json_encode(['error' => 'Missing application ID or status']);
                                            exit;
                                        }
                                
                                        // Verify that this application belongs to a job posted by this company
                                        $query = "SELECT ja.id 
                                                FROM applications ja 
                                                JOIN jobs j ON ja.job_id = j.id 
                                                WHERE ja.id = :application_id AND j.company_id = :company_id";
                                        $stmt = $conn->prepare($query);
                                        $stmt->execute([
                                            ':application_id' => $application_id,
                                            ':company_id' => $_SESSION['user_id']
                                        ]);
                                
                                        if ($stmt->rowCount() === 0) {
                                            echo json_encode(['error' => 'Application not found or unauthorized']);
                                            exit;
                                        }
                                
                                        // Update the application status
                                        $update_query = "UPDATE applications SET status = :status WHERE id = :application_id";
                                        $stmt = $conn->prepare($update_query);
                                        $success = $stmt->execute([
                                            ':status' => $status,
                                            ':application_id' => $application_id
                                        ]);
                                
                                        if ($success) {
                                            echo json_encode(['message' => 'Application status updated successfully']);
                                            exit;
                                        } else {
                                            echo json_encode(['error' => 'Failed to update application status']);
                                            exit;
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

            case 'job_details':
                if ($method === 'GET') {
                    if (!isset($_GET['id'])) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Job ID is required']);
                        exit;
                    }

                    try {
                        $job_id = (int)$_GET['id'];
                        
                        $query = "SELECT j.*, u.username as company_name 
                                FROM jobs j 
                                LEFT JOIN users u ON j.company_id = u.id 
                                WHERE j.id = :job_id";
                        
                        $stmt = $conn->prepare($query);
                        $stmt->bindValue(':job_id', $job_id, PDO::PARAM_INT);
                        $stmt->execute();
                        
                        $job = $stmt->fetch(PDO::FETCH_ASSOC);
                        
                        if (!$job) {
                            http_response_code(404);
                            echo json_encode(['error' => 'Job not found']);
                            exit;
                        }

                        echo json_encode(['job' => $job]);
                        exit;
                    } catch (PDOException $e) {
                        http_response_code(500);
                        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
                        exit;
                    }
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