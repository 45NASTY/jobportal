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
    const template = document.getElementById(`${page}-template`);
    if (!template) return;

    contentDiv.innerHTML = template.innerHTML;

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
    
    if (localStorage.getItem('user_type') === 'company') {
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
                updateUIForAuthenticatedUser();
                // Redirect to manage-jobs for company users, jobs for job seekers
                if (currentUser.user_type === 'company') {
                    localStorage.setItem('user_type', 'company');
                    navigateToPage('manage-jobs');
                } else {
                    localStorage.setItem('user_type', 'jobseeker');
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
        const response = await fetch(`${API_URL}?action=jobs&page=${page}`);
        const data = await response.json();

        const jobsList = document.getElementById('jobs-list');
        jobsList.innerHTML = '';

        data.jobs.forEach(job => {
            const jobCard = createJobCard(job);
            jobsList.appendChild(jobCard);
        });

        createPagination(data.pagination);
    } catch (error) {
        showAlert('Error loading jobs', 'danger');
    }
}

function createJobCard(job) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    col.innerHTML = `
        <div class="card job-card">
            <div class="card-body">
                <h5 class="card-title">${job.title}</h5>
                <p class="company-name">${job.company_name || 'Company Name'}</p>
                <div class="job-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Location N/A'}</span>
                    <span><i class="fas fa-clock"></i> ${job.job_type}</span>
                </div>
                <p class="job-description">${job.description.substring(0, 150)}...</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-primary">${job.salary_range || 'Salary N/A'}</span>
                    ${currentUser && currentUser.user_type === 'jobseeker' ? 
                        `<button class="btn btn-primary btn-sm apply-btn" data-job-id="${job.id}">Apply Now</button>` :
                        ''}
                </div>
            </div>
        </div>
    `;

    const applyBtn = col.querySelector('.apply-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => applyForJob(job.id));
    }

    return col;
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

async function applyForJob(jobId) {
    if (!currentUser) {
        showAlert('Please login to apply for jobs', 'warning');
        navigateToPage('login');
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
                action: 'apply',
                job_id: jobId
            }),
            credentials: 'include'
        });

        const data = await response.json();
        if (data.error) {
            showAlert(data.error, 'danger');
        } else {
            showAlert('Application submitted successfully', 'success');
        }
    } catch (error) {
        showAlert('Error submitting application', 'danger');
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
    } catch (error) {
        showAlert('Error loading company jobs', 'danger');
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