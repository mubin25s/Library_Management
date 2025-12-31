<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

if ($method === 'GET') {
    // Get Author by ID or ALL
    $id = $_GET['id'] ?? null;
    
    if($id) {
        // Single Author
        $stmt = $pdo->prepare("SELECT * FROM authors WHERE author_id = ?");
        $stmt->execute([$id]);
        $author = $stmt->fetch();
        
        if($author) {
            // Count books
            $cStmt = $pdo->prepare("SELECT COUNT(*) FROM books WHERE author_id = ?");
            $cStmt->execute([$id]);
            $author['book_count'] = $cStmt->fetchColumn();
            
            sendSuccess('Author found', ['author' => $author]);
        } else {
            sendError('Author not found');
        }
    } else {
        // All Authors
        $sql = "SELECT a.*, (SELECT COUNT(*) FROM books b WHERE b.author_id = a.author_id) as book_count 
                FROM authors a";
        $stmt = $pdo->query($sql);
        $authors = $stmt->fetchAll();
        sendSuccess('Authors retrieved', ['data' => $authors]); // 'data' field expected by frontend list
    }

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['name'])) {
        sendError('Author Name required');
    }

    // Check ID conflict if provided
    if(!empty($data['author_id'])) {
        $stmt = $pdo->prepare("SELECT author_id FROM authors WHERE author_id = ?");
        $stmt->execute([$data['author_id']]);
        if($stmt->fetch()) {
            sendError('Author ID already exists');
        }
    }

    $sql = "INSERT INTO authors (author_id, name, dob, country) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    try {
        $stmt->execute([
            $data['author_id'] ?? null, // Auto-inc if null
            $data['name'],
            $data['dob'] ?? null,
            $data['country'] ?? null
        ]);
        sendSuccess('Author added');
    } catch (PDOException $e) {
        sendError('Failed to add author: ' . $e->getMessage());
    }
}
