<?php
require __DIR__ . '/utils.php';
require __DIR__ . '/db.php';

enable_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = $_GET['action'] ?? '';

try {
	if ($method === 'GET' && $path === 'me') {
		get_me();
	} elseif ($method === 'PUT' && $path === 'me') {
		update_me();
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

function get_me(): void {
	$claims = require_auth();
	$pdo = get_pdo();
	$stmt = $pdo->prepare('SELECT id, target_calories, protein_g, carbs_g, fat_g, current_streak_days, total_points, goal, onboarding_completed FROM profiles WHERE id = ? LIMIT 1');
	$stmt->execute([$claims['sub']]);
	$profile = $stmt->fetch();
	if (!$profile) send_json(404, ['error' => 'Profile not found']);
	send_json(200, ['profile' => $profile]);
}

function update_me(): void {
	$claims = require_auth();
	$input = json_decode(file_get_contents('php://input'), true) ?: [];
	$fields = ['target_calories','protein_g','carbs_g','fat_g','goal','onboarding_completed'];
	$updates = [];
	$params = [];
	foreach ($fields as $f) {
		if (array_key_exists($f, $input)) {
			$updates[] = "$f = ?";
			$params[] = $input[$f];
		}
	}
	if (!$updates) send_json(400, ['error' => 'No fields to update']);
	$params[] = $claims['sub'];
	$pdo = get_pdo();
	$sql = 'UPDATE profiles SET ' . implode(', ', $updates) . ' WHERE id = ?';
	$pdo->prepare($sql)->execute($params);
	send_json(200, ['success' => true]);
}


