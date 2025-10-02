<?php
require __DIR__ . '/utils.php';
require __DIR__ . '/db.php';

enable_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = $_GET['action'] ?? '';

try {
	if ($method === 'GET' && $path === 'keys') {
		list_keys();
	} elseif ($method === 'POST' && $path === 'add') {
		add_key();
	} elseif ($method === 'PUT' && $path === 'toggle') {
		toggle_key();
	} elseif ($method === 'DELETE' && $path === 'delete') {
		delete_key();
	} else {
		send_json(404, ['error' => 'Not found']);
	}
} catch (Throwable $e) {
	send_json(500, ['error' => 'Server error', 'message' => $e->getMessage()]);
}

function list_keys(): void {
	$pdo = get_pdo();
	$rows = $pdo->query('SELECT * FROM admin_api_keys ORDER BY created_at DESC')->fetchAll();
	send_json(200, $rows);
}

function add_key(): void {
	$input = json_decode(file_get_contents('php://input'), true) ?: [];
	$key_name = trim($input['key_name'] ?? '');
	$key_value = trim($input['key_value'] ?? '');
	$provider = $input['provider'] ?? 'gemini';
	if ($key_name === '' || $key_value === '') send_json(400, ['error' => 'key_name and key_value required']);
	$pdo = get_pdo();
	$pdo->prepare('INSERT INTO admin_api_keys (key_name, key_value, provider, is_active, usage_count, error_count, created_at) VALUES (?, ?, ?, 1, 0, 0, NOW())')
		->execute([$key_name, $key_value, $provider]);
	send_json(201, ['success' => true]);
}

function toggle_key(): void {
	parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
	$id = $params['id'] ?? '';
	$is_active = $params['is_active'] ?? '';
	if ($id === '' || $is_active === '') send_json(400, ['error' => 'id and is_active required']);
	$pdo = get_pdo();
	$pdo->prepare('UPDATE admin_api_keys SET is_active = ? WHERE id = ?')->execute([$is_active ? 1 : 0, $id]);
	send_json(200, ['success' => true]);
}

function delete_key(): void {
	parse_str($_SERVER['QUERY_STRING'] ?? '', $params);
	$id = $params['id'] ?? '';
	if ($id === '') send_json(400, ['error' => 'id required']);
	$pdo = get_pdo();
	$pdo->prepare('DELETE FROM admin_api_keys WHERE id = ?')->execute([$id]);
	send_json(200, ['success' => true]);
}


