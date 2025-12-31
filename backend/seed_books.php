<?php
require_once 'api/config.php';

try {
    // 1. Insert Categories
    $categories = ['Fiction', 'Science', 'History', 'Technology', 'Philosophy'];
    $stmt = $conn->prepare("INSERT IGNORE INTO categories (name) VALUES (?)");
    foreach ($categories as $cat) {
        $stmt->execute([$cat]);
    }

    // 2. Insert Authors
    $authors = ['J.K. Rowling', 'George Orwell', 'Isaac Asimov', 'Yuval Noah Harari', 'Walter Isaacson'];
    $stmt = $conn->prepare("INSERT IGNORE INTO authors (name) VALUES (?)");
    foreach ($authors as $auth) {
        $stmt->execute([$auth]);
    }

    // 3. Helper to get IDs
    function getId($conn, $table, $name) {
        $stmt = $conn->prepare("SELECT " . substr($table, 0, -1) . "_id FROM $table WHERE name = ?");
        $stmt->execute([$name]);
        return $stmt->fetchColumn();
    }

    // 4. Insert Books
    $books = [
        [
            'title' => 'Harry Potter and the Sorcerer\'s Stone',
            'author' => 'J.K. Rowling',
            'category' => 'Fiction',
            'quantity' => 5,
            'isbn' => '9780590353427'
        ],
        [
            'title' => '1984',
            'author' => 'George Orwell',
            'category' => 'Fiction',
            'quantity' => 10,
            'isbn' => '9780451524935'
        ],
        [
            'title' => 'Sapiens: A Brief History of Humankind',
            'author' => 'Yuval Noah Harari',
            'category' => 'History',
            'quantity' => 3,
            'isbn' => '9780062316097'
        ],
        [
            'title' => 'Foundation',
            'author' => 'Isaac Asimov',
            'category' => 'Science',
            'quantity' => 7,
            'isbn' => '9780553293357'
        ],
        [
            'title' => 'Steve Jobs',
            'author' => 'Walter Isaacson',
            'category' => 'Technology',
            'quantity' => 4,
            'isbn' => '9781451648539'
        ]
    ];

    $stmt = $conn->prepare("INSERT INTO books (title, author_id, category_id, quantity, isbn) VALUES (?, ?, ?, ?, ?)");

    foreach ($books as $book) {
        $authId = getId($conn, 'authors', $book['author']);
        $catId = getId($conn, 'categories', $book['category']);
        
        // Check duplicate
        $check = $conn->prepare("SELECT book_id FROM books WHERE isbn = ?");
        $check->execute([$book['isbn']]);
        if($check->rowCount() == 0) {
            $stmt->execute([$book['title'], $authId, $catId, $book['quantity'], $book['isbn']]);
            echo "Inserted: {$book['title']}\n";
        }
    }

    echo "Database seeded successfully!";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
