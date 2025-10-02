<?php
require __DIR__ . '/utils.php';
require __DIR__ . '/db.php';

enable_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = $_GET['action'] ?? '';

try {
	if ($method === 'GET' && $path === 'all') {
		list_all();
	} elseif ($method === 'GET' && $path === 'mine') {
		list_mine();
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

function list_all(): void {
	$pdo = get_pdo();
	$rows = $pdo->query('SELECT id, name, description, points FROM badges ORDER BY id ASC')->fetchAll();
	send_json(200, ['badges' => $rows]);
}

function list_mine(): void {
	$claims = require_auth();
	$pdo = get_pdo();
	$stmt = $pdo->prepare('SELECT badge_id, unlocked_at FROM user_badges WHERE user_id = ?');
	$stmt->execute([$claims['sub']]);
	$rows = $stmt->fetchAll();
	send_json(200, ['user_badges' => $rows]);
}


