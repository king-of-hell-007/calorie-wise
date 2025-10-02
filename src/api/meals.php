<?php
require __DIR__ . '/utils.php';
require __DIR__ . '/db.php';

enable_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = $_GET['action'] ?? '';

try {
	if ($method === 'GET' && $path === 'today') {
		list_today();
	} elseif ($method === 'POST' && $path === 'create') {
		create_meal();
	} elseif ($method === 'GET' && $path === 'range') {
		list_range();
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

function list_today(): void {
	$claims = require_auth();
	$pdo = get_pdo();
	$stmt = $pdo->prepare('SELECT total_calories, total_protein, total_carbs, total_fat FROM meal_entries WHERE user_id = ? AND DATE(created_at) = CURDATE()');
	$stmt->execute([$claims['sub']]);
	$rows = $stmt->fetchAll();
	send_json(200, ['meals' => $rows]);
}

function list_range(): void {
	$claims = require_auth();
	$start = $_GET['start'] ?? '';
	$end = $_GET['end'] ?? '';
	if ($start === '' || $end === '') send_json(400, ['error' => 'start and end required']);
	$pdo = get_pdo();
	$stmt = $pdo->prepare('SELECT DATE(created_at) as day, SUM(total_calories) as total_calories, SUM(total_protein) as total_protein, SUM(total_carbs) as total_carbs, SUM(total_fat) as total_fat FROM meal_entries WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ? GROUP BY DATE(created_at) ORDER BY day ASC');
	$stmt->execute([$claims['sub'], $start, $end]);
	$rows = $stmt->fetchAll();
	send_json(200, ['days' => $rows]);
}

function create_meal(): void {
	$claims = require_auth();
	$input = json_decode(file_get_contents('php://input'), true) ?: [];
	$fields = ['meal_slot','image_url','analyzer_json','total_calories','total_protein','total_carbs','total_fat','confidence'];
	$data = [];
	foreach ($fields as $f) {
		$data[$f] = $input[$f] ?? null;
	}
	$pdo = get_pdo();
	$sql = 'INSERT INTO meal_entries (user_id, meal_slot, image_url, analyzer_json, total_calories, total_protein, total_carbs, total_fat, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
	$pdo->prepare($sql)->execute([
		$claims['sub'],
		$data['meal_slot'],
		$data['image_url'],
		json_encode($data['analyzer_json']),
		$data['total_calories'],
		$data['total_protein'],
		$data['total_carbs'],
		$data['total_fat'],
		$data['confidence'],
	]);
	send_json(201, ['success' => true]);
}


