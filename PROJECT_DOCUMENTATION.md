# Athena Library Management System - Project Documentation

## Project Overview
Athena Library is a comprehensive, full-stack web application designed to streamline the operations of a modern library. The project aims to provide a centralized platform for managing books, authors, members, and the borrowing lifecycle. By digitizing traditional library logs, Athena ensures data integrity, ease of access, and efficient inventory management for librarians while offering a seamless browsing and borrowing experience for members.

The name "Athena" symbolizes wisdom and knowledge, reflecting the project's core mission to facilitate learning and resource accessibility.

## Key Objectives
The primary goal of this project was to build a robust system that handles the complexities of library logistics. Specifically, it focuses on:
- **Efficiency**: Reducing manual paperwork and automating transaction tracking.
- **Scalability**: Designing a database schema that can handle thousands of records without performance degradation.
- **Security**: Implementing role-based access control to protect sensitive member data and administrative capabilities.
- **User Experience**: Creating a clean, intuitive interface that caters to both tech-savvy and non-technical users.

## Core Features
The system is divided into several modules, each serving a specific purpose:

### 1. Authentication & Role Management
- **Role-Based Access**: The system supports three distinct views: Librarian, Member, and Guest.
- **Admin Verification**: Librarians must provide an additional access code to register or login, ensuring administrative security.
- **Comprehensive Profiles**: Users provide detailed information including NID, Date of Birth, and multiple contact numbers.

### 2. Inventory Management (Librarian)
- **Book Cataloging**: Full CRUD (Create, Read, Update, Delete) operations for books.
- **Author Tracking**: A separate author database to maintain biographical data and link multiple works to a single creator.
- **Real-time Quantity Control**: Automated increments and decrements of book quantities based on borrowing transactions.

### 3. Member Experience
- **Digital Bookshelf**: Members can search for books by title, author, category, or ISBN.
- **Borrowing History**: A dedicated dashboard to view currently borrowed books and past records.
- **Reviews & Ratings**: An interactive section where members can rate books (1-5 stars) and leave detailed comments.
- **Return Tracking**: Clear visualization of return dates and overdue statuses.

### 4. Transactions & Logistics
- **Issue/Return Workflow**: A structured process for issuing books with defined return dates.
- **Fine Management**: Logic for calculating fines on overdue returns (as defined in the database schema).
- **Status Monitoring**: Systematic tagging of transactions as 'issued', 'returned', or 'overdue'.

## Tools and Techniques
Athena Library leverages a combination of modern web technologies and classic architectural patterns:

### Backend Technologies
- **PHP 7+**: Used for building the RESTful API layer. PHP's native ability to handle HTTP requests and database connections makes it a reliable choice for this scale.
- **PDO (PHP Data Objects)**: Employed for database interactions to prevent SQL injection and provide a consistent data interface.
- **RESTful API Design**: The backend is structured into clear endpoints (e.g., `books.php`, `users.php`, `transactions.php`) that communicate via JSON.
- **CORS Configuration**: Global CORS headers allow the frontend to communicate securely with the backend across different origins if needed.

### Frontend Technologies
- **HTML5 & CSS3**: Used for structure and styling. The design focuses on "Glassmorphism" and a dark-red/off-white (Irony White) professional color palette.
- **Vanilla JavaScript**: All dynamic behavior is handled with pure JavaScript (ES6+), avoiding the overhead of heavy frameworks while maintaining high performance.
- **Fetch API**: Utilized for asynchronous communication with the PHP backend, providing a smooth, single-page-application (SPA) feel.
- **Responsive Web Design**: CSS Flexbox and Grid layouts ensure the dashboards are accessible across various device sizes.

### Database Management
- **MySQL**: The primary relational database management system.
- **Relational Schema**: Data is normalized into separate tables (Users, Authors, Books, Transactions, Reviews) to minimize redundancy and maintain referential integrity.
- **Automated Setup**: The `config.php` file includes logic to automatically detect and initialize the database and tables from a `.sql` template if they are missing.

## Data Models & Schema
The project uses a highly structured database architecture:
- **Users**: Stores credentials, roles, and profile details (NID, DOB, Address, Working Hours).
- **Authors**: Includes biographical data like Date of Birth and Nationality.
- **Books**: Contains metadata, categorizations, and foreign keys linking to Authors.
- **Transactions**: Tracks the movement of physical books, including issue dates, return dates, and fine amounts.
- **Reviews**: Stores user-contributed content and ratings linked to specific books.

## Architectural Patterns
- **Separation of Concerns**: The project clearly separates the logic (Backend/API) from the presentation (Frontend).
- **State-Driven UI**: The frontend dashboards dynamically update based on the verification of user tokens and session data.
- **Modular Backend**: Each API endpoint is a self-contained module, making the code easier to maintain and debug.

## Installation and Technical Setup
To run Athena Library locally, the following steps are required:
1. **Server Environment**: Use a tool like XAMPP or WAMP to provide a local Apache server and MySQL instance.
2. **File Placement**: Move the project files into the `htdocs` (or equivalent) directory.
3. **Configuration**: The database connection parameters are defined in `backend/api/config.php`. By default, it connects to 'localhost' with the user 'root' and no password.
4. **Database Initialization**: On the first run, the system will automatically create the `library_management` database and populate the necessary tables using the provided seed data.
5. **Librarian Access**: An initial admin account is pre-seeded with the email `admin@library.com` and password `password`.

---
*Documentation generated for the Athena Library Management Project.*
