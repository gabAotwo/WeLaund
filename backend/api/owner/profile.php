<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['GET', 'PUT', 'PATCH', 'OPTIONS']);
require_once __DIR__ . '/../../config/Session.php';
start_session();
require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../controllers/OwnerController.php';
AuthController::requireRole('owner');

$owner = new OwnerController((string)($_SESSION['shop_id'] ?? ''));

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['success' => true, 'data' => $owner->getProfile($_SESSION['user_id'])]); exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $ok = $owner->updatePassword($_SESSION['user_id'], $input['current'] ?? '', $input['new'] ?? '');
    echo json_encode(['success' => $ok, 'message' => $ok ? 'Password changed' : 'Incorrect current password']); exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input  = json_decode(file_get_contents('php://input'), true);
    $result = $owner->updateEmail($_SESSION['user_id'], $input['new_email'] ?? '', $input['current_password'] ?? '');
    echo json_encode($result); exit;
}
