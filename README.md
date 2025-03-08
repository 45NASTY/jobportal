# Elevate Workforce Solutions - Job Portal

A modern web-based job portal platform that connects employers and job seekers. This platform allows companies to post job opportunities and manage their listings while enabling job seekers to explore and apply for positions.

## Features

- **Job Listings Management**
  - Companies can create, update, and delete job postings
  - Detailed job descriptions with requirements and salary information
  - Job type and location specifications

- **Company Profiles**
  - Custom company profiles with logos
  - Company-specific job listing management
  - Secure authentication system

- **User Interface**
  - Responsive design for all devices
  - Paginated job listings
  - Active job filtering

## Technology Stack

- PHP 7.4+
- MySQL Database
- XAMPP Server
- HTML5/CSS3
- JavaScript

## Installation

1. Install XAMPP on your system
2. Clone this repository to your XAMPP's htdocs folder:
   ```
   git clone [repository-url] c:/xampp/htdocs/jobportal
   ```
3. Start Apache and MySQL services in XAMPP Control Panel
4. Import the database schema (located in the `database` folder)
5. Configure the database connection in `config/database.php`

## Configuration

1. Update the database configuration in `config/database.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_database_name');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

## Usage

### For Companies
1. Register a company account
2. Create and manage job listings
3. Update company profile and logo
4. View and manage job applications

### For Job Seekers
1. Browse available job listings
2. Filter jobs by location and type
3. View detailed job descriptions
4. Apply for positions

## Project Structure

```
jobportal/
├── config/          # Configuration files
├── models/          # Database models
├── views/           # Frontend templates
├── controllers/     # Business logic
├── assets/         # Static resources
└── database/       # Database schema
```

## Security

- SQL injection prevention using prepared statements
- Password hashing for user security
- Session-based authentication
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and queries, please create an issue in the repository or contact the development team.