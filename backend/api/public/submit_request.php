<?php
declare(strict_types=1);
ini_set('display_errors', '0');
error_reporting(0);
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['POST', 'OPTIONS']);

require_once __DIR__ . '/../../config/Database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$ownerName       = trim($input['owner_name']       ?? '');
$email           = trim($input['email']            ?? '');
$phone           = trim($input['phone']            ?? '');
$shopName        = trim($input['shop_name']        ?? '');
$shopDescription = trim($input['shop_description'] ?? '');

if (!$ownerName || !$email || !$phone || !$shopName) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'All required fields must be filled.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

$db = Database::getConnection();

// Prevent duplicate pending requests from same email
$check = $db->prepare("SELECT id FROM owner_requests WHERE email = :email AND status = 'pending'");
$check->execute([':email' => strtolower($email)]);
if ($check->fetch()) {
    echo json_encode(['success' => false, 'message' => 'A pending request with this email already exists.']);
    exit;
}

$stmt = $db->prepare(
    'INSERT INTO owner_requests (owner_name, email, phone, shop_name, shop_description)
     VALUES (:name, :email, :phone, :shop, :desc)'
);
$ok = $stmt->execute([
    ':name'  => $ownerName,
    ':email' => strtolower($email),
    ':phone' => $phone,
    ':shop'  => $shopName,
    ':desc'  => $shopDescription,
]);

echo json_encode([
    'success' => $ok,
    'message' => $ok
        ? 'Your application has been submitted! We will review it and contact you shortly.'
        : 'Failed to submit application. Please try again.',
]);
