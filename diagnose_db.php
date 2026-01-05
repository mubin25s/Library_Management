<?php
// Force plain text output
header('Content-Type: text/plain');

require_once 'backend/api/config.php';

echo "--- ATHENA LIBRARY DIAGNOSTIC ---\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "\n\n";

try {
    echo "1. Testing Database Connection...\n";
    $pdo = getDB();
    echo "   ✅ Connection Successful!\n\n";

    echo "2. Checking Tables...\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (empty($tables)) {
        echo "   ❌ NO TABLES FOUND! Did you run database.sql?\n";
    } else {
        echo "   Found tables: " . implode(', ', $tables) . "\n";
        
        foreach(['users', 'books', 'authors', 'transactions', 'reviews'] as $table) {
            if (in_array($table, $tables)) {
                 $count = $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
                 echo "   ✅ $table table exists ($count rows)\n";
            } else {
                 echo "   ❌ $table table is MISSING!\n";
            }
        }
    }
    echo "\n";

    echo "3. Sample Book Fetch (First 1)...\n";
    $book = $pdo->query("SELECT * FROM books LIMIT 1")->fetch();
    if ($book) {
        echo "   ✅ Book found: " . ($book['title'] ?? 'No Title') . " (ID: " . ($book['book_id'] ?? '?') . ")\n";
        echo "   Checking Encoding: " . json_encode($book) ? "   ✅ JSON Encoding OK\n" : "   ❌ JSON Encoding FAILED (Check special characters)\n";
    } else {
        echo "   ⚠️ No books in database.\n";
    }

} catch (Exception $e) {
    echo "\n❌ FATAL ERROR: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}

echo "\n--- END DIAGNOSTIC ---\n";
?>
