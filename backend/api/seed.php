<?php
require_once 'config.php'; // This sets CORS and DB connection

try {
    $pdo = getDB();
    // 1. Insert Authors
    $authors = ['J.K. Rowling', 'George Orwell', 'Isaac Asimov', 'Yuval Noah Harari', 'Walter Isaacson'];
    $stmt = $pdo->prepare("INSERT IGNORE INTO authors (name) VALUES (?)");
    foreach ($authors as $auth) {
        $stmt->execute([$auth]);
    }

    // 3. Helper to get IDs
    function getId($pdo, $table, $name) {
        $stmt = $pdo->prepare("SELECT " . substr($table, 0, -1) . "_id FROM $table WHERE name = ?");
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

    $stmt = $pdo->prepare("INSERT INTO books (title, author_id, category_name, quantity, isbn) VALUES (?, ?, ?, ?, ?)");

    $inserted = 0;
    foreach ($books as $book) {
        $authId = getId($pdo, 'authors', $book['author']);
        
        // Check duplicate
        $check = $pdo->prepare("SELECT book_id FROM books WHERE isbn = ?");
        $check->execute([$book['isbn']]);
        if($check->rowCount() == 0) {
            $stmt->execute([$book['title'], $authId, $book['category'], $book['quantity'], $book['isbn']]);
            $inserted++;
        }
    }

    echo json_encode(['success' => true, 'message' => "Database seeded! Inserted $inserted new books."]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => "Error: " . $e->getMessage()]);
}
