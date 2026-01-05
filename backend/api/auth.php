<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);
$pdo = getDB();

if ($action === 'register') {
    try {
        // Validate
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            sendError('Missing required fields');
        }

        // Check duplicate
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            sendError('Email already registered');
        }

        // Insert
        $sql = "INSERT INTO users (name, email, password, role, nid, dob, address, mobile, working_hours) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        // Address Object -> String
        $address = isset($data['address']) ? json_encode($data['address']) : null;

        $res = $stmt->execute([
            $data['name'],
            $data['email'],
            $data['password'],
            $data['role'] ?? 'member',
            $data['nid'] ?? null,
            $data['dob'] ?? null,
            $address,
            $data['mobile'] ?? null,
            $data['working_hours'] ?? null
        ]);

        if ($res) {
            sendSuccess('Registration successful');
        } else {
            sendError('Registration failed');
        }
    } catch (PDOException $e) {
        sendError('Database Error during registration: ' . $e->getMessage());
    }

} elseif ($action === 'login') {
    try {
        if (empty($data['email']) || empty($data['password'])) {
            sendError('Missing required fields');
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();

        if ($user && $user['password'] === $data['password']) {
            // Parse address if JSON
            if($user['address']) {
                $user['address'] = json_decode($user['address'], true);
            }
            unset($user['password']);
            sendSuccess('Login successful', ['user' => $user]);
        } else {
            sendError($user ? 'Invalid password' : 'User not found');
        }
    } catch (PDOException $e) {
        sendError('Database Error during login: ' . $e->getMessage());
    }

} else {
    sendError('Invalid action');
}
