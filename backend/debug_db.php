<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once 'api/config.php';

$response = [];

try {
    $pdo = getDB();
    // Check Connection
    $response['connection'] = 'Success';
    
    // Check Tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $response['tables'] = $tables;
    
    // Check Users Table Structure
    if(in_array('users', $tables)) {
        $stmt = $pdo->query("DESCRIBE users");
        $response['users_structure'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Check if any users exist
        $stmt = $pdo->query("SELECT count(*) as count FROM users");
        $response['user_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    } else {
        $response['error'] = 'Users table missing!';
    }
    
} catch (Exception $e) {
    $response['error'] = $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT);
