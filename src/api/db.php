<?php
// PDO MySQL connection helper

$config = require __DIR__ . '/config.php';

function get_pdo(): PDO {
	static $pdo = null;
	global $config;
	if ($pdo instanceof PDO) {
		return $pdo;
	}

	$dsn = sprintf(
		'mysql:host=%s;port=%s;dbname=%s;charset=%s',
		$config['db']['host'],
		$config['db']['port'],
		$config['db']['database'],
		$config['db']['charset']
	);

	$options = [
		PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		PDO::ATTR_EMULATE_PREPARES => false,
	];

	$pdo = new PDO($dsn, $config['db']['user'], $config['db']['password'], $options);
	return $pdo;
}


