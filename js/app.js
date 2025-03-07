// API URL Configuration
const API_URL = '/jobportal/api/index.php';

// State Management
let currentUser = null;
let currentPage = 'jobs';

// DOM Elements
const contentDiv = document.getElementById('content');
const alertContainer = document.getElementById('alert-container');
const navLinks = document.querySelectorAll('[data-page]');
const logoutButton = document.getElementById('logout');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    checkAuthStatus();
    setupNavigationEvents();
    handleInitialNavigation();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    handleInitialNavigation();
});

function handleInitialNavigation() {
    // Get the page from the URL hash or default to 'jobs'
    const hash = window.location.hash.slice(1);
    const page = hash || 'jobs';
    
    // If user is a company and trying to access jobs page, redirect to manage-jobs
    if (currentUser && currentUser.user_type === 'company' && page === 'jobs') {
        navigateToPage('manage-jobs');
        return;
    }
    
    // Allow job seekers to access the jobs page
    if (page && document.getElementById(`${page}-template`)) {
        loadPage(page);
    } else {
        loadPage('jobs');
    }
}

// Navigation Functions
function setupNavigationEvents() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.getAttribute('data-page');
            if (page) {
                navigateToPage(page);
            }
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

function navigateToPage(page) {
    currentPage = page;
    loadPage(page);
    // Update URL without causing a server request
    const baseUrl = window.location.pathname.split('/jobportal')[0] + '/jobportal';
    window.history.pushState({}, '', `${baseUrl}#${page}`);
}

function loadPage(page) {
    console.log('Loading page:', page);
    const template = document.getElementById(`${page}-template`);
    if (!template) {
        console.error(`Template not found for page: ${page}`);
        return;
    }

    contentDiv.innerHTML = template.innerHTML;
    console.log('Template loaded into content div');

    // Add autocomplete="off" to all forms to prevent browser caching
    const forms = contentDiv.querySelectorAll('form');
    forms.forEach(form => {
        form.setAttribute('autocomplete', 'off');
        // Clear all form fields
        form.reset();
    });

    // Clear all input fields and textareas
    const inputs = contentDiv.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.value = '';
    });

    switch (page) {
        case 'jobs':
            console.log('Initializing jobs page');
            loadJobs();
            break;
        case 'login':
            setupLoginForm();
            break;
        case 'register':
            setupRegisterForm();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'post-job':
            setupPostJobForm();
            break;
        case 'manage-jobs':
            loadCompanyJobs();
            break;
    }
}

// Authentication Functions
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_URL}?action=profile`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.error) {
            currentUser = data.profile;
            updateUIForAuthenticatedUser();
            
            // After refresh, redirect company users to manage-jobs and hide landing page
            if (currentUser.user_type === 'company') {
                const landingPageSections = document.getElementById('landing-page-sections');
                if (landingPageSections) {
                    landingPageSections.style.display = 'none';
                }
                // Only navigate to manage-jobs if we're on the landing page
                if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#jobs') {
                    navigateToPage('manage-jobs');
                }
            }
        } else {
            updateUIForUnauthenticatedUser();
        }
    } catch (error) {
        updateUIForUnauthenticatedUser();
    }
}

function updateUIForAuthenticatedUser() {
    document.querySelectorAll('.logged-in').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.logged-out').forEach(el => el.style.display = 'none');
    
    const landingPageSections = document.getElementById('landing-page-sections');
    
    if (currentUser.user_type === 'company') {
        document.querySelectorAll('.company-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.jobseeker-only').forEach(el => el.style.display = 'none');
        // Hide landing page sections for company users
        if (landingPageSections) {
            landingPageSections.style.display = 'none';
        }
    } else {
        document.querySelectorAll('.company-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.jobseeker-only').forEach(el => el.style.display = 'block');
        // Show landing page sections for job seekers
        if (landingPageSections) {
            landingPageSections.style.display = 'block';
        }
    }
}

function updateUIForUnauthenticatedUser() {
    document.querySelectorAll('.logged-in').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.logged-out').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.company-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.jobseeker-only').forEach(el => el.style.display = 'none');
    
    // Show landing page sections for unauthenticated users
    const landingPageSections = document.getElementById('landing-page-sections');
    if (landingPageSections) {
        landingPageSections.style.display = 'block';
    }
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            action: 'login'
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await response.json();
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                currentUser = data.user;
                showAlert('Login successful', 'success');
                
                // Update UI based on user type
                updateUIForAuthenticatedUser();
                
                // Redirect based on user type
                if (currentUser.user_type === 'company') {
                    navigateToPage('manage-jobs');
                } else {
                    // For job seekers, show the jobs page
                    navigateToPage('jobs');
                }
            }
        } catch (error) {
            showAlert('An error occurred during login', 'danger');
        }
    });
}

function setupRegisterForm() {
    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            user_type: document.getElementById('user-type').value,
            action: 'register'
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Registration successful. Please login.', 'success');
                navigateToPage('login');
            }
        } catch (error) {
            showAlert('An error occurred during registration', 'danger');
            console.error('Registration error:', error);
        }
    });
}

async function logout() {
    try {
        await fetch(API_URL + '?action=logout', {
            credentials: 'include'
        });
        currentUser = null;
        updateUIForUnauthenticatedUser();
        navigateToPage('jobs');
        showAlert('Logged out successfully', 'success');
    } catch (error) {
        showAlert('An error occurred during logout', 'danger');
    }
}

// Job Functions
async function loadJobs(page = 1) {
    try {
        console.log('Loading jobs for page:', page);
        const response = await fetch(`${API_URL}?action=jobs&page=${page}`);
        const data = await response.json();
        console.log('Jobs API response:', data);

        const jobsList = document.getElementById('jobs-list');
        if (!jobsList) {
            console.error('Jobs list container not found');
            return;
        }

        jobsList.innerHTML = '';

        if (!data.jobs || data.jobs.length === 0) {
            console.log('No jobs found in response');
            jobsList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        No jobs available at the moment.
                    </div>
                </div>`;
            return;
        }

        console.log(`Rendering ${data.jobs.length} jobs`);
        data.jobs.forEach(job => {
            const jobCard = createJobCard(job);
            jobsList.appendChild(jobCard);
        });

        // Create pagination only if there are jobs
        if (data.pagination && data.pagination.total_pages > 1) {
            console.log('Creating pagination:', data.pagination);
            createPagination(data.pagination);
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        const jobsList = document.getElementById('jobs-list');
        if (jobsList) {
            jobsList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Error loading jobs. Please try again later.
                    </div>
                </div>`;
        }
        showAlert('Error loading jobs', 'danger');
    }
}

function createJobCard(job) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';

    col.innerHTML = `
        <div class="card job-card h-100" style="cursor: pointer;" data-job-id="${job.id}">
            <div class="card-body">
                <h5 class="card-title">${job.title}</h5>
                <p class="company-name text-muted mb-2">${job.company_name || 'Company Name'}</p>
                <div class="job-meta mb-3">
                    <span class="me-3"><i class="fas fa-map-marker-alt me-1"></i> ${job.location || 'Location N/A'}</span>
                    <span><i class="fas fa-clock me-1"></i> ${job.job_type}</span>
                </div>
                <p class="job-description mb-3">${job.description ? job.description.substring(0, 150) + '...' : 'No description available'}</p>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                    <span class="text-primary fw-bold">${job.salary_range || 'Salary N/A'}</span>
                    <span class="text-muted"><small>Click to view details</small></span>
                </div>
            </div>
        </div>
    `;

    // Add click event to the entire card
    const card = col.querySelector('.job-card');
    card.addEventListener('click', () => loadJobDetails(job.id));

    return col;
}

async function loadJobDetails(jobId) {
    try {
        const response = await fetch(`${API_URL}?action=job_details&id=${jobId}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.error) {
            showAlert(data.error, 'danger');
            return;
        }

        // Load the job details template
        loadPage('job-details');
        
        // Fill in the job details
        const job = data.job;
        document.querySelector('.job-title').textContent = job.title;
        document.querySelector('.company-name').textContent = job.company_name;
        document.querySelector('.job-location').textContent = job.location || 'Location N/A';
        document.querySelector('.job-type').textContent = job.job_type;
        document.querySelector('.salary-range').textContent = job.salary_range || 'Salary N/A';
        document.querySelector('.job-description').textContent = job.description;
        document.querySelector('.job-requirements').textContent = job.requirements;
        document.querySelector('.posted-date').textContent = new Date(job.created_at).toLocaleDateString();

        // Show/hide application section based on user type
        const applicationSection = document.getElementById('application-section');
        if (!currentUser) {
            applicationSection.innerHTML = `
                <a href="#" class="btn btn-primary" data-page="login">Login to Apply</a>
            `;
        } else if (currentUser.user_type === 'company') {
            applicationSection.style.display = 'none';
        }

        // Setup application form
        setupJobApplicationForm(jobId);

    } catch (error) {
        console.error('Error loading job details:', error);
        showAlert('Error loading job details', 'danger');
    }
}

function setupJobApplicationForm(jobId) {
    const showFormBtn = document.getElementById('show-application-form');
    const formContainer = document.getElementById('application-form-container');
    const applicationForm = document.getElementById('job-application-form');

    if (!showFormBtn || !formContainer || !applicationForm) return;

    showFormBtn.addEventListener('click', () => {
        showFormBtn.style.display = 'none';
        formContainer.style.display = 'block';
    });

    applicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const coverLetter = document.getElementById('cover-letter').value;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    action: 'apply',
                    job_id: jobId,
                    cover_letter: coverLetter
                }),
                credentials: 'include'
            });

            const data = await response.json();
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Application submitted successfully', 'success');
                // Hide the form after successful submission
                formContainer.style.display = 'none';
            }
        } catch (error) {
            showAlert('Error submitting application', 'danger');
        }
    });
}

function createPagination(pagination) {
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';

    for (let i = 1; i <= pagination.total_pages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === pagination.current_page ? 'active' : ''}`;
        
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = i;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            loadJobs(i);
        });

        li.appendChild(a);
        paginationElement.appendChild(li);
    }
}

// Profile Functions
async function loadProfile() {
    try {
        // Clear all form fields first
        const form = document.getElementById('profile-form');
        if (form) {
            form.reset();
        }

        const response = await fetch(`${API_URL}?action=profile`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.profile) {
            fillProfileForm(data.profile);
        }
    } catch (error) {
        showAlert('Error loading profile', 'danger');
    }
}

function fillProfileForm(profile) {
    if (currentUser.user_type === 'jobseeker') {
        document.getElementById('full-name').value = profile.full_name || '';
    }
    
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('address').value = profile.address || '';
    document.getElementById('bio').value = profile.bio || '';

    if (currentUser.user_type === 'company') {
        document.getElementById('company-website').value = profile.company_website || '';
    }
}

// Company Job Management Functions
async function loadCompanyJobs() {
    try {
        const response = await fetch(`${API_URL}?action=company_jobs`, {
            credentials: 'include'
        });
        const data = await response.json();

        const jobsList = document.getElementById('manage-jobs-list');
        jobsList.innerHTML = '';

        data.jobs.forEach(job => {
            const jobCard = createManageJobCard(job);
            jobsList.appendChild(jobCard);
        });

        // Load applications when manage-jobs page is loaded
        loadJobApplications();

        // Set up tab event listeners
        const applicationsTab = document.getElementById('applications-tab');
        if (applicationsTab) {
            applicationsTab.addEventListener('click', loadJobApplications);
        }
    } catch (error) {
        showAlert('Error loading company jobs', 'danger');
    }
}

async function loadJobApplications() {
    try {
        const response = await fetch(`${API_URL}?action=job_applications`, {
            credentials: 'include'
        });
        const data = await response.json();

        const applicationsList = document.getElementById('applications-list');
        if (!applicationsList) return;

        applicationsList.innerHTML = '';

        if (data.applications && data.applications.length > 0) {
            data.applications.forEach(application => {
                const row = createApplicationRow(application);
                applicationsList.appendChild(row);
            });
        } else {
            applicationsList.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No applications found</td>
                </tr>
            `;
        }
    } catch (error) {
        showAlert('Error loading applications', 'danger');
    }
}

function createApplicationRow(application) {
    const row = document.createElement('tr');
    
    const formattedDate = new Date(application.applied_date).toLocaleDateString();
    const statusClass = getStatusClass(application.status);
    
    row.innerHTML = `
        <td>${application.job_title}</td>
        <td>${application.applicant_name}</td>
        <td>${application.email}</td>
        <td>${formattedDate}</td>
        <td>
            <span class="badge ${statusClass}">${application.status}</span>
        </td>
        <td>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary view-application" 
                        data-application-id="${application.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-success update-status" 
                        data-application-id="${application.id}"
                        data-current-status="${application.status}">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        </td>
    `;

    // Add event listeners for action buttons
    row.querySelector('.view-application').addEventListener('click', () => 
        viewApplication(application)
    );
    
    row.querySelector('.update-status').addEventListener('click', () => 
        updateApplicationStatus(application)
    );

    return row;
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'bg-warning text-dark';
        case 'reviewed':
            return 'bg-info text-dark';
        case 'accepted':
            return 'bg-success';
        case 'rejected':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

async function viewApplication(application) {
    // Create and show modal with application details
    const modalHtml = `
        <div class="modal fade" id="applicationModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Application Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <h6>Job Title</h6>
                            <p>${application.job_title}</p>
                        </div>
                        <div class="mb-3">
                            <h6>Applicant Information</h6>
                            <p><strong>Name:</strong> ${application.applicant_name}</p>
                            <p><strong>Email:</strong> ${application.email}</p>
                            <p><strong>Phone:</strong> ${application.phone || 'N/A'}</p>
                        </div>
                        <div class="mb-3">
                            <h6>Cover Letter</h6>
                            <p>${application.cover_letter || 'No cover letter provided'}</p>
                        </div>
                        <div class="mb-3">
                            <h6>Status</h6>
                            <span class="badge ${getStatusClass(application.status)}">${application.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('applicationModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('applicationModal'));
    modal.show();
}

async function updateApplicationStatus(application) {
    console.log(application," this is app")
    const statuses = ['pending', 'reviewed', 'accepted', 'rejected'];
    const currentIndex = statuses.indexOf(application.status.toLowerCase());
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                action: 'update_application_status',
                application_id: application?.id,
                status: nextStatus
            }),
            credentials: 'include'
        });

        const data = await response.json();
        console.log(data, "this is data")
        if (data.error) {
            showAlert(data.error, 'danger');
        } else {
            showAlert('Application status updated successfully', 'success');
            loadJobApplications(); // Refresh the applications list
        }
    } catch (error) {
        showAlert(error, 'danger');
    }
}

function createManageJobCard(job) {
    const col = document.createElement('div');
    col.className = 'col-12 mb-3';

    col.innerHTML = `
        <div class="card job-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title mb-2">${job.title}</h5>
                        <p class="text-muted mb-2">
                            <i class="fas fa-map-marker-alt me-2"></i>${job.location || 'Location N/A'} 
                            <span class="mx-2">|</span> 
                            <i class="fas fa-clock me-2"></i>${job.job_type}
                            <span class="mx-2">|</span>
                            <i class="fas fa-money-bill-wave me-2"></i>${job.salary_range || 'Salary N/A'}
                        </p>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-danger btn-sm edit-job" data-job-id="${job.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-job" data-job-id="${job.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <p class="job-description mb-0">${job.description.substring(0, 200)}...</p>
            </div>
        </div>
    `;

    col.querySelector('.edit-job').addEventListener('click', () => editJob(job));
    col.querySelector('.delete-job').addEventListener('click', () => deleteJob(job.id));

    return col;
}

async function editJob(job) {
    const template = document.getElementById('post-job-template');
    if (!template) return;

    contentDiv.innerHTML = template.innerHTML;

    // Clear form fields first
    const form = document.getElementById('post-job-form');
    if (form) {
        form.reset();
        form.setAttribute('autocomplete', 'off');
    }

    // Fill the form with existing job data
    document.getElementById('job-title').value = job.title || '';
    document.getElementById('job-description').value = job.description || '';
    document.getElementById('job-requirements').value = job.requirements || '';
    document.getElementById('job-location').value = job.location || '';
    document.getElementById('salary-range').value = job.salary_range || '';
    document.getElementById('job-type').value = job.job_type || 'full-time';

    if (!form) return;

    // Update form title to indicate editing
    const formTitle = form.querySelector('.card-title');
    if (formTitle) formTitle.textContent = 'Edit Job';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            id: job.id,
            title: document.getElementById('job-title').value,
            description: document.getElementById('job-description').value,
            requirements: document.getElementById('job-requirements').value,
            location: document.getElementById('job-location').value,
            salary_range: document.getElementById('salary-range').value,
            job_type: document.getElementById('job-type').value,
            action: 'jobs'
        };

        try {
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await response.json();
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Job updated successfully', 'success');
                navigateToPage('manage-jobs');
            }
        } catch (error) {
            showAlert('Error updating job', 'danger');
            console.error('Job update error:', error);
        }
    });
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job?')) {
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                id: jobId,
                action: 'delete_job'
            }),
            credentials: 'include'
        });

        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'danger');
        } else {
            showAlert('Job deleted successfully', 'success');
            loadCompanyJobs(); // Refresh the jobs list
        }
    } catch (error) {
        showAlert('Error deleting job', 'danger');
        console.error('Job deletion error:', error);
    }
}

function setupPostJobForm() {
    const form = document.getElementById('post-job-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('job-title').value,
            description: document.getElementById('job-description').value,
            requirements: document.getElementById('job-requirements').value,
            location: document.getElementById('job-location').value,
            salary_range: document.getElementById('salary-range').value,
            job_type: document.getElementById('job-type').value,
            action: 'jobs'
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await response.json();
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Job posted successfully', 'success');
                navigateToPage('manage-jobs');
            }
        } catch (error) {
            showAlert('Error posting job', 'danger');
            console.error('Job posting error:', error);
        }
    });
}

// Utility Functions
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Initialize the application
navigateToPage('jobs'); 