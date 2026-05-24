<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['GET', 'POST', 'OPTIONS']);

require_once __DIR__ . '/../../config/Session.php';
start_session();

require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../controllers/OwnerController.php';

AuthController::requireRole('owner');

$shopId = $_SESSION['shop_id'] ?? '';
if (!$shopId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No shop associated with this owner.']);
    exit;
}

$owner = new OwnerController($shopId);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $customerId = $input['id'] ?? $input['customer_id'] ?? '';
        $status = $input['status'] ?? '';

        if (!$customerId || !$status) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'id and status required']);
            exit;
        }

        $ok = $owner->updateCustomerStatus($customerId, $status);
        echo json_encode(['success' => $ok, 'message' => $ok ? 'Customer updated' : 'Update failed']);
        exit;
    }

    $status = $_GET['status'] ?? 'all';
    echo json_encode([
        'success' => true,
        'data' => $owner->getCustomers($status),
    ]);
} catch (Throwable $e) {
    error_log('[owner/customers.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error. Please check backend logs.']);
}
