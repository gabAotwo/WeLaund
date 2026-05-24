<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['GET', 'POST', 'OPTIONS']);

require_once __DIR__ . '/../../config/Session.php';
start_session();

require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../config/Subscriptions.php';

AuthController::requireRole('owner');

$shopId = $_SESSION['shop_id'] ?? '';
$ownerId = $_SESSION['user_id'] ?? '';
if (!$shopId || !$ownerId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No shop associated with this owner.']);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $method = trim((string)($input['payment_method'] ?? 'Manual'));
        $reference = trim((string)($input['reference_number'] ?? ''));
        $proofUrl = trim((string)($input['proof_url'] ?? ''));

        if ($reference === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Reference number is required.']);
            exit;
        }

        $ok = Subscriptions::submitOwnerPayment($shopId, $ownerId, $method, $reference, $proofUrl);
        echo json_encode(['success' => $ok, 'message' => $ok ? 'Subscription payment submitted for review.' : 'Submission failed.']);
        exit;
    }

    echo json_encode(['success' => true, 'data' => Subscriptions::getOwnerSubscription($shopId)]);
} catch (Throwable $e) {
    error_log('[owner/subscription.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error. Please check backend logs.']);
}
