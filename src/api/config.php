<?php
// Basic configuration for MySQL and JWT

return [
	'db' => [
		'host' => getenv('MYSQL_HOST') ?: 'localhost',
		'port' => getenv('MYSQL_PORT') ?: '3306',
		'database' => getenv('MYSQL_DATABASE') ?: 'caloriewise',
		'user' => getenv('MYSQL_USER') ?: 'root',
		'password' => getenv('MYSQL_PASSWORD') ?: '',
		'charset' => 'utf8mb4'
	],
	'jwt' => [
		'secret' => getenv('JWT_SECRET') ?: 'change_this_secret',
		'expires_in' => 60 * 60 * 24 * 7 // 7 days
	]
];


