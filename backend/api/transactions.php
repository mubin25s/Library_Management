<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$pdo = getDB();
$data = json_decode(file_get_contents("php://input"), true);

// GET: Fetch History
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    
    $sql = "SELECT t.*, b.title, u.name as user_name 
            FROM transactions t
            JOIN books b ON t.book_id = b.book_id
            JOIN users u ON t.user_id = u.user_id";
    
    if ($userId) {
        $sql .= " WHERE t.user_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->query($sql);
    }
    
    $txns = $stmt->fetchAll();
    sendSuccess('History retrieved', ['data' => $txns]);
}

// POST Actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    if ($action === 'issue') {
        // Issue Book
        // 1. Check Quantity
        $qCheck = $pdo->prepare("SELECT quantity FROM books WHERE book_id = ?");
        $qCheck->execute([$data['book_id']]);
        $qty = $qCheck->fetchColumn();
        
        if ($qty < 1) sendError('Book unavailable');

        try {
            $pdo->beginTransaction();
            
            // Decr Quantity
            $upd = $pdo->prepare("UPDATE books SET quantity = quantity - 1 WHERE book_id = ?");
            $upd->execute([$data['book_id']]);

            // Insert Transaction
            $due = date('Y-m-d', strtotime('+' . ($data['days'] ?? 7) . ' days'));
            $ins = $pdo->prepare("INSERT INTO transactions (user_id, book_id, issue_date, return_date, status, notes) VALUES (?, ?, CURDATE(), ?, 'issued', ?)");
            $ins->execute([$data['user_id'], $data['book_id'], $due, $data['notes'] ?? '']);
            
            $pdo->commit();
            sendSuccess('Book issued');
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError('Issue failed: ' . $e->getMessage());
        }

    } elseif ($action === 'return') {
        $txnId = $data['transaction_id'];
        
        // Get Book ID
        $bStmt = $pdo->prepare("SELECT book_id, status FROM transactions WHERE transaction_id = ?");
        $bStmt->execute([$txnId]);
        $txn = $bStmt->fetch(); // Use fetch directly on the statement

        if (!$txn || $txn['status'] !== 'issued') sendError('Invalid return');

        try {
            $pdo->beginTransaction();

            // Update Transaction
            $upd = $pdo->prepare("UPDATE transactions SET status = 'returned', actual_return_date = CURDATE() WHERE transaction_id = ?");
            $upd->execute([$txnId]);

            // Incr Quantity
            $bUpd = $pdo->prepare("UPDATE books SET quantity = quantity + 1 WHERE book_id = ?");
            $bUpd->execute([$txn['book_id']]);

            $pdo->commit();
            sendSuccess('Book returned');
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError('Return failed');
        }

    } elseif ($action === 'extend') {
        $txnId = $data['transaction_id'];
        $stmt = $pdo->prepare("UPDATE transactions SET return_date = DATE_ADD(return_date, INTERVAL 7 DAY) WHERE transaction_id = ?");
        if($stmt->execute([$txnId])) {
            sendSuccess('Loan extended');
        } else {
            sendError('Extend failed');
        }
    }
}
