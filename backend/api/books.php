<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

if ($method === 'GET') {
    try {
        // Fetch Books with Author Names
        $sql = "SELECT b.*, a.name as author_name, a.author_id 
                FROM books b 
                LEFT JOIN authors a ON b.author_id = a.author_id";
        $stmt = $pdo->query($sql);
        $books = $stmt->fetchAll();
        
        // Add Reviews
        foreach($books as &$book) {
            try {
                // Fetch reviews for this book
                $rStmt = $pdo->prepare("SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE book_id = ?");
                $rStmt->execute([$book['book_id']]);
                $book['reviews'] = $rStmt->fetchAll();
            } catch (PDOException $e) {
                $book['reviews'] = [];
            }
        }
        
        sendSuccess('Books retrieved', ['data' => $books]);
    } catch (PDOException $e) {
        sendError('Failed to retrieve books from database: ' . $e->getMessage());
    }

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['title']) || empty($data['quantity'])) {
        sendError('Title and Quantity required');
    }

    try {
        $sql = "INSERT INTO books (title, isbn, author_id, category_name, quantity, year_published, language) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['title'],
            $data['isbn'] ?? null,
            $data['author_id'] ?? null,
            $data['category_name'] ?? 'General',
            $data['quantity'],
            $data['year_published'] ?? null,
            $data['language'] ?? 'English'
        ]);
        sendSuccess('Book added successfully');
    } catch (PDOException $e) {
        sendError('Failed to add book: ' . $e->getMessage());
    }

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $_GET['id'] ?? null;
    
    if (!$id || empty($data['title'])) {
        sendError('ID and Title required');
    }

    try {
        $sql = "UPDATE books SET title = ?, isbn = ?, author_id = ?, category_name = ?, quantity = ?, year_published = ?, language = ? WHERE book_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['title'],
            $data['isbn'] ?? null,
            $data['author_id'] ?? null,
            $data['category_name'] ?? 'General',
            $data['quantity'],
            $data['year_published'] ?? null,
            $data['language'] ?? 'English',
            $id
        ]);
        sendSuccess('Book updated successfully');
    } catch (PDOException $e) {
        sendError('Failed to update book: ' . $e->getMessage());
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendError('ID required');

    $stmt = $pdo->prepare("DELETE FROM books WHERE book_id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() > 0) {
        sendSuccess('Book deleted');
    } else {
        sendError('Book not found');
    }
}
