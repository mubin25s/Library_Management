<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';

echo "Database Connection Test: ";
try {
    $pdo = getDB();
    echo "Success";
} catch (Exception $e) {
    echo "Fail: " . $e->getMessage();
}
echo "<br>";

echo "Fetching Books: ";
try {
    $stmt = $pdo->query("SELECT * FROM books LIMIT 1");
    $books = $stmt->fetchAll();
    echo "Success (Count: " . count($books) . ")";
} catch (Exception $e) {
    echo "Fail: " . $e->getMessage();
}
?>
