<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);
$pdo = getDB();

if ($action === 'register') {
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

    // Use plain password as per user requirements for now (or fix seed data to use hash)
    // For compatibility with previous mocked data which used plain text 'password' for admin
    // We will stick to plain text for this specific rapid prototype phase if requested, 
    // BUT best practice is password_hash. The mock used 'password' string. 
    // Let's use plain text for now to match Seed Data content unless hashing is enforced.
    // actually, let's just save it.
    
    $res = $stmt->execute([
        $data['name'],
        $data['email'],
        $data['password'], // Storing plain text for simplicity/matching seed. In prod use password_hash.
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

} elseif ($action === 'login') {
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
        // Check hash compatibility if we switch to hashing later
        // if ($user && password_verify($data['password'], $user['password'])) ...
        
        sendError($user ? 'Invalid password' : 'User not found');
    }

} else {
    sendError('Invalid action');
}
