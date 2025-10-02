<?php
require __DIR__ . '/utils.php';
require __DIR__ . '/db.php';

enable_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = $_GET['action'] ?? '';

try {
	if ($method === 'POST' && $path === 'register') {
		register();
	} elseif ($method === 'POST' && $path === 'login') {
		login();
	} elseif ($method === 'POST' && $path === 'logout') {
		logout();
	} else {
		send_json(404, ['error' => 'Not found']);
	}
} catch (Throwable $e) {
	send_json(500, ['error' => 'Server error', 'message' => $e->getMessage()]);
}

function register(): void {
	$input = json_decode(file_get_contents('php://input'), true) ?: [];
	$email = trim($input['email'] ?? '');
	$password = $input['password'] ?? '';
	if ($email === '' || $password === '') {
		send_json(400, ['error' => 'Email and password required']);
	}

	$pdo = get_pdo();
	$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
	$stmt->execute([$email]);
	if ($stmt->fetch()) {
		send_json(409, ['error' => 'Email already registered']);
	}

	$hash = password_hash($password, PASSWORD_BCRYPT);
	$pdo->prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, NOW())')->execute([$email, $hash]);
	$userId = $pdo->lastInsertId();

	// create profile row
	$pdo->prepare('INSERT INTO profiles (id, onboarding_completed, total_points) VALUES (?, 0, 0)')->execute([$userId]);

	$config = require __DIR__ . '/config.php';
	$token = jwt_encode([
		'sub' => $userId,
		'email' => $email,
		'iat' => time(),
		'exp' => time() + $config['jwt']['expires_in']
	]);

	send_json(201, ['token' => $token]);
}

function login(): void {
	$input = json_decode(file_get_contents('php://input'), true) ?: [];
	$email = trim($input['email'] ?? '');
	$password = $input['password'] ?? '';
	if ($email === '' || $password === '') {
		send_json(400, ['error' => 'Email and password required']);
	}

	$pdo = get_pdo();
	$stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ? LIMIT 1');
	$stmt->execute([$email]);
	$user = $stmt->fetch();
	if (!$user || !password_verify($password, $user['password_hash'])) {
		send_json(401, ['error' => 'Invalid credentials']);
	}

	$config = require __DIR__ . '/config.php';
	$token = jwt_encode([
		'sub' => (string)$user['id'],
		'email' => $email,
		'iat' => time(),
		'exp' => time() + $config['jwt']['expires_in']
	]);

	send_json(200, ['token' => $token]);
}

function logout(): void {
	// Stateless JWT; client deletes token.
	send_json(200, ['success' => true]);
}


