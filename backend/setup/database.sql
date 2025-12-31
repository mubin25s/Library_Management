CREATE DATABASE IF NOT EXISTS library_management;

USE library_management;

-- 1. Users Table (Enhanced)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('librarian', 'member') DEFAULT 'member',
    nid VARCHAR(50),
    dob DATE,
    address TEXT, -- Store JSON or full string
    mobile VARCHAR(20),
    working_hours VARCHAR(50), -- For Librarians
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Authors Table (New)
CREATE TABLE IF NOT EXISTS authors (
    author_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dob DATE,
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Books Table (Enhanced)
CREATE TABLE IF NOT EXISTS books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) UNIQUE,
    author_id INT,
    category_name VARCHAR(50), -- Storing string directly as per frontend logic
    quantity INT DEFAULT 0,
    year_published INT,
    language VARCHAR(50),
    cover_image VARCHAR(255),
    description TEXT,
    FOREIGN KEY (author_id) REFERENCES authors (author_id) ON DELETE SET NULL
);

-- 4. Transactions Table (Enhanced)
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    book_id INT,
    issue_date DATE NOT NULL,
    return_date DATE NOT NULL,
    actual_return_date DATE,
    status ENUM(
        'issued',
        'returned',
        'overdue'
    ) DEFAULT 'issued',
    notes TEXT,
    fine DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books (book_id) ON DELETE CASCADE
);

-- 5. Reviews Table (New)
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT,
    user_id INT,
    rating INT CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books (book_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Seed Data: Admin
INSERT INTO
    users (
        name,
        email,
        password,
        role,
        working_hours
    )
VALUES (
        'Admin Librarian',
        'admin@library.com',
        'password',
        'librarian',
        '9:00 AM - 5:00 PM'
    )
ON DUPLICATE KEY UPDATE
    name = name;

-- Seed Data: Authors
INSERT INTO
    authors (author_id, name, dob, country)
VALUES (
        101,
        'F. Scott Fitzgerald',
        '1896-09-24',
        'USA'
    ),
    (
        102,
        'George Orwell',
        '1903-06-25',
        'UK'
    ),
    (
        103,
        'Robert Martin',
        '1952-12-05',
        'USA'
    )
ON DUPLICATE KEY UPDATE
    name = name;

-- Seed Data: Books
INSERT INTO
    books (
        book_id,
        title,
        isbn,
        author_id,
        category_name,
        quantity,
        year_published,
        language
    )
VALUES (
        1,
        'The Great Gatsby',
        '978-0743273565',
        101,
        'Fiction',
        5,
        1925,
        'English'
    ),
    (
        2,
        '1984',
        '978-0451524935',
        102,
        'Dystopian',
        8,
        1949,
        'English'
    ),
    (
        3,
        'Clean Code',
        '978-0132350884',
        103,
        'Tech',
        3,
        2008,
        'English'
    )
ON DUPLICATE KEY UPDATE
    title = title;