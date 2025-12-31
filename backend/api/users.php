<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

if ($method === 'GET') {
    // Return all users (filtered by role if needed, currently returning all members/librarians)
    // Security Note: In a real app, ensure only librarians can access this.
    
    $stmt = $pdo->query("SELECT user_id, name, email, role, nid, dob, mobile, address, working_hours FROM users ORDER BY user_id DESC");
    $users = $stmt->fetchAll();

    // Parse address JSON for frontend
    foreach ($users as &$user) {
        if (!empty($user['address'])) {
            $user['address'] = json_decode($user['address'], true);
        }
    }

    sendSuccess('Users retrieved', ['data' => $users]);
} else {
    sendError('Invalid method');
}
