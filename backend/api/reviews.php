<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['book_id']) || empty($data['user_id']) || empty($data['rating'])) {
        sendError('Missing required fields (book_id, user_id, rating)');
    }

    try {
        $sql = "INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['book_id'],
            $data['user_id'],
            $data['rating'],
            $data['comment'] ?? ''
        ]);
        sendSuccess('Review added successfully');
    } catch (PDOException $e) {
        sendError('Failed to add review: ' . $e->getMessage());
    }
} elseif ($method === 'GET') {
    $bookId = $_GET['book_id'] ?? null;
    if (!$bookId) {
        sendError('Book ID required');
    }

    try {
        $stmt = $pdo->prepare("SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE book_id = ? ORDER BY review_date DESC");
        $stmt->execute([$bookId]);
        $reviews = $stmt->fetchAll();
        sendSuccess('Reviews retrieved', ['data' => $reviews]);
    } catch (PDOException $e) {
        sendError('Failed to fetch reviews: ' . $e->getMessage());
    }
} else {
    sendError('Invalid method');
}
