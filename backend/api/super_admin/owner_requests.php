<?php
declare(strict_types=1);
ini_set('display_errors', '0');
error_reporting(0);
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['GET', 'PUT', 'OPTIONS']);

require_once __DIR__ . '/../../config/Session.php';
start_session();

if (empty($_SESSION['logged_in']) || ($_SESSION['role'] ?? '') !== 'super_admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once __DIR__ . '/../../controllers/SuperAdminController.php';
$controller = new SuperAdminController();
$method     = $_SERVER['REQUEST_METHOD'];

// GET /api/super_admin/owner_requests.php?status=pending
if ($method === 'GET') {
    $status = $_GET['status'] ?? 'pending';
    echo json_encode(['success' => true, 'data' => $controller->getOwnerRequests($status)]);
    exit;
}

// PUT — approve or reject
if ($method === 'PUT') {
    $input  = json_decode(file_get_contents('php://input'), true) ?? [];
    $id     = (int) ($input['id']     ?? 0);
    $action = $input['action'] ?? '';

    if (!$id || !in_array($action, ['approve', 'reject'], true)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Invalid request.']);
        exit;
    }

    if ($action === 'approve') {
        echo json_encode($controller->approveOwnerRequest($id, $_SESSION['user_id']));
    } else {
        $ok = $controller->rejectOwnerRequest($id);
        echo json_encode(['success' => $ok, 'message' => $ok ? 'Request rejected.' : 'Failed or already processed.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
