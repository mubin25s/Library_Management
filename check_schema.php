<?php
require_once 'backend/api/config.php';
try {
    $pdo = getDB();
    echo "TABLES:\n";
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        echo "- " . $row[0] . "\n";
    }
    
    echo "\nBOOKS STRUCTURE:\n";
    $stmt = $pdo->query("DESCRIBE books");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }

    echo "\nAUTHORS STRUCTURE:\n";
    $stmt = $pdo->query("DESCRIBE authors");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
