<?php
ob_start(); // Trap any stray output (warnings, notices)

// Suppress HTML error output for API
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Custom Error Handler to ensure we always return JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) return;
    // For notices/warnings in CLI, just log them to stderr or ignore
    if (php_sapi_name() === 'cli') {
        fwrite(STDERR, "PHP Error [$errno]: $errstr in $errfile on line $errline\n");
        return;
    }
    // Only send fatal JSON error for real issues
    if ($errno === E_ERROR || $errno === E_USER_ERROR || $errno === E_CORE_ERROR || $errno === E_COMPILE_ERROR) {
        sendError("PHP Fatal Error [$errno]: $errstr in $errfile on line $errline", 500);
    }
});

set_exception_handler(function($e) {
    if (php_sapi_name() === 'cli') {
        fwrite(STDERR, "Unhandled Exception: " . $e->getMessage() . "\n");
        exit(1);
    }
    sendError("Unhandled Exception: " . $e->getMessage(), 500);
});

// Global CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    exit(0);
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'library_management');

function getDB() {
    try {
        // First, connect to MySQL without a database to see if we can at least reach the server
        $dsn_no_db = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
        $pdo = new PDO($dsn_no_db, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Check/Create Database
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "`");
        $pdo->exec("USE `" . DB_NAME . "`");

        // Now finalize the connection with the database selected
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        // Check if tables exist. If 'users' is missing, assume we need to run setup.
        $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() == 0) {
            // Locate database.sql in possible locations
            $sqlFile = __DIR__ . '/../setup/database.sql';
            if (file_exists($sqlFile)) {
                $sql = file_get_contents($sqlFile);
                // Remove the 'USE' statement from SQL file if present to avoid conflicts, 
                // though we already did it above.
                $pdo->exec($sql);
            }
        }

        return $pdo;
    } catch (PDOException $e) {
        // If we fail here, it's likely a host/user/pass issue or MySQL is not running.
        sendError('Database Connection Failed. Ensure XAMPP MySQL is START: ' . $e->getMessage(), 500);
    }
}

function sendError($msg, $code = 400) {
    if (ob_get_length()) ob_end_clean(); // Discard any stray output captured so far
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

function sendSuccess($msg, $data = []) {
    if (ob_get_length()) ob_end_clean(); // Discard any stray output captured so far
    echo json_encode(array_merge(['success' => true, 'message' => $msg], $data));
    exit;
}
