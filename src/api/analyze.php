<?php
require __DIR__ . '/utils.php';
require __DIR__ . '/db.php';

enable_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	send_json(405, ['error' => 'Method not allowed']);
}

$token = get_bearer_token();
if (!$token || !jwt_decode($token)) {
	send_json(401, ['error' => 'Unauthorized']);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$image = $input['image'] ?? '';
if ($image === '') {
	send_json(400, ['error' => 'image is required']);
}

// Placeholder analysis result. Integrate real model later.
$result = [
	'status' => 'success',
	'food' => [[
		'name' => 'Sample Meal',
		'quantity' => '1 serving',
		'calories' => 450,
		'protein' => 25,
		'carbs' => 50,
		'fat' => 18,
		'confidence' => 0.85
	]],
	'total' => [
		'calories' => 450,
		'protein' => 25,
		'carbs' => 50,
		'fat' => 18
	],
];

send_json(200, $result);


