<?php
require_once 'config.php';
header('Content-Type: text/plain');

try {
    $pdo = getDB();
    $jsonPath = __DIR__ . '/../data/library.json';
    
    if (!file_exists($jsonPath)) {
        die("Error: library.json not found at $jsonPath\n");
    }

    $data = json_decode(file_get_contents($jsonPath), true);
    if (!$data) {
        die("Error: Failed to parse library.json\n");
    }

    echo "--- DATA MIGRATION STARTED ---\n";

    // 1. Import Users
    if (isset($data['users'])) {
        $stmt = $pdo->prepare("INSERT INTO users (user_id, name, email, password, role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)");
        foreach ($data['users'] as $user) {
            $stmt->execute([
                $user['user_id'],
                $user['name'],
                $user['email'],
                $user['password'],
                $user['role']
            ]);
            echo "User Imported: {$user['name']}\n";
        }
    }

    // 2. Import Books (and Authors)
    if (isset($data['books'])) {
        foreach ($data['books'] as $book) {
            // Get or Create Author
            $authorName = $book['author'] ?? 'Unknown Author';
            $authStmt = $pdo->prepare("SELECT author_id FROM authors WHERE name = ?");
            $authStmt->execute([$authorName]);
            $authorId = $authStmt->fetchColumn();

            if (!$authorId) {
                $insAuth = $pdo->prepare("INSERT INTO authors (name) VALUES (?)");
                $insAuth->execute([$authorName]);
                $authorId = $pdo->lastInsertId();
                echo "Author Created: $authorName\n";
            }

            // Insert Book
            $bookStmt = $pdo->prepare("INSERT INTO books (book_id, title, isbn, author_id, category_name, quantity) 
                                      VALUES (?, ?, ?, ?, ?, ?)
                                      ON DUPLICATE KEY UPDATE title=VALUES(title), quantity=VALUES(quantity)");
            $bookStmt->execute([
                $book['book_id'],
                $book['title'],
                $book['isbn'] ?? null,
                $authorId,
                $book['category'] ?? 'General',
                $book['quantity'] ?? 0
            ]);
            echo "Book Imported: {$book['title']}\n";
        }
    }

    // 3. Import Transactions
    if (isset($data['transactions'])) {
        $stmt = $pdo->prepare("INSERT INTO transactions (transaction_id, user_id, book_id, issue_date, return_date, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status)");
        foreach ($data['transactions'] as $txn) {
            $stmt->execute([
                $txn['transaction_id'],
                $txn['user_id'],
                $txn['book_id'],
                $txn['issue_date'],
                $txn['return_date'],
                $txn['status']
            ]);
        }
        echo "Transactions Imported: " . count($data['transactions']) . "\n";
    }

    echo "\n--- MIGRATION COMPLETED SUCCESSFULLY ---\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
