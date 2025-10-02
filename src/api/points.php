<?php
require __DIR__ . '/utils.php';
require __DIR__ . '/db.php';

enable_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = $_GET['action'] ?? '';

try {
	if ($method === 'POST' && $path === 'add') {
		add_points();
	} else {
		send_json(404, ['error' => 'Not found']);
	}
} catch (Throwable $e) {
	send_json(500, ['error' => 'Server error', 'message' => $e->getMessage()]);
}

function require_auth(): array {
	$token = get_bearer_token();
	if (!$token) send_json(401, ['error' => 'Unauthorized']);
	$claims = jwt_decode($token);
	if (!$claims) send_json(401, ['error' => 'Invalid token']);
	return $claims;
}

function add_points(): void {
	$claims = require_auth();
	$input = json_decode(file_get_contents('php://input'), true) ?: [];
	$points = (int)($input['points'] ?? 0);
	$reason = trim($input['reason'] ?? '');
	if ($points === 0) send_json(400, ['error' => 'points required']);
	$pdo = get_pdo();
	$pdo->prepare('INSERT INTO points_history (user_id, points, reason, created_at) VALUES (?, ?, ?, NOW())')->execute([$claims['sub'], $points, $reason]);
	$pdo->prepare('UPDATE profiles SET total_points = COALESCE(total_points, 0) + ? WHERE id = ?')->execute([$points, $claims['sub']]);
	send_json(200, ['success' => true]);
}


