<?php
// Common helpers: JSON response, CORS, JWT

function send_json(int $statusCode, array $payload): void {
	header('Content-Type: application/json');
	http_response_code($statusCode);
	echo json_encode($payload);
	exit;
}

function enable_cors(): void {
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
	header('Access-Control-Allow-Headers: Content-Type, Authorization');
	if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
		exit;
	}
}

function get_bearer_token(): ?string {
	$headers = getallheaders();
	if (!isset($headers['Authorization'])) return null;
	if (stripos($headers['Authorization'], 'Bearer ') !== 0) return null;
	return trim(substr($headers['Authorization'], 7));
}

function jwt_encode(array $claims): string {
	$config = require __DIR__ . '/config.php';
	$header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
	$payload = base64_encode(json_encode($claims));
	$signature = hash_hmac('sha256', $header . '.' . $payload, $config['jwt']['secret'], true);
	return $header . '.' . $payload . '.' . base64_encode($signature);
}

function jwt_decode(string $token): ?array {
	$config = require __DIR__ . '/config.php';
	$parts = explode('.', $token);
	if (count($parts) !== 3) return null;
	[$header, $payload, $signature] = $parts;
	$expected = base64_encode(hash_hmac('sha256', $header . '.' . $payload, $config['jwt']['secret'], true));
	if (!hash_equals($expected, $signature)) return null;
	$data = json_decode(base64_decode($payload), true);
	if (!is_array($data)) return null;
	if (isset($data['exp']) && time() > $data['exp']) return null;
	return $data;
}


