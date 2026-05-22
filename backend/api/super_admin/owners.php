<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['GET', 'PUT', 'OPTIONS']);
require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../controllers/SuperAdminController.php';
require_once __DIR__ . '/../../config/Session.php';
start_session();
if (empty($_SESSION['logged_in']) || ($_SESSION['role'] ?? '') !== 'super_admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$controller = new SuperAdminController();

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input  = json_decode(file_get_contents('php://input'), true);
    $id     = $input['id']     ?? '';
    $action = $input['action'] ?? '';

    if ($action === 'reset_password') {
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'id required']);
            exit;
        }
        $res = $controller->resetOwnerPassword($id);
        echo json_encode($res);
        exit;
    }

    $status = $input['status'] ?? '';
    if (!$id || !$status) {
        echo json_encode(['success' => false, 'message' => 'id and status required']);
        exit;
    }
    $ok = $controller->setOwnerStatus($id, $status);
    echo json_encode(['success' => $ok, 'message' => $ok ? 'Status updated' : 'Update failed']);
    exit;
}

echo json_encode(['success' => true, 'data' => $controller->getAllOwners()]);
