<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['GET', 'POST', 'OPTIONS']);

require_once __DIR__ . '/../../config/Session.php';
start_session();

require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../config/Subscriptions.php';

AuthController::requireRole('super_admin');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $action = (string)($input['action'] ?? 'review');

        if ($action === 'update_billing') {
            $shopId = (string)($input['shop_id'] ?? '');
            $monthlyFee = (float)($input['subscription_monthly_fee'] ?? 0);
            $dueDate = trim((string)($input['subscription_due_date'] ?? ''));
            $status = trim((string)($input['subscription_status'] ?? 'active'));
            $note = trim((string)($input['note'] ?? ''));

            if (!$shopId || $monthlyFee <= 0 || !in_array($status, ['active', 'pending_review', 'overdue'], true)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Valid shop, fee, and status are required.']);
                exit;
            }

            $ok = Subscriptions::updateShopBilling($shopId, $monthlyFee, $dueDate !== '' ? $dueDate : null, $status, $note);
            echo json_encode(['success' => $ok, 'message' => $ok ? 'Billing settings updated.' : 'Billing update failed.']);
            exit;
        }

        $paymentId = (string)($input['id'] ?? '');
        $status = (string)($input['status'] ?? '');
        $note = trim((string)($input['note'] ?? ''));

        if (!$paymentId || !in_array($status, ['Approved', 'Rejected'], true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Valid id and status are required.']);
            exit;
        }

        $ok = Subscriptions::reviewPayment($paymentId, $status, (string)$_SESSION['user_id'], $note);
        echo json_encode(['success' => $ok, 'message' => $ok ? 'Subscription payment reviewed.' : 'Review failed.']);
        exit;
    }

    echo json_encode(['success' => true, 'data' => Subscriptions::getSuperAdminBilling()]);
} catch (Throwable $e) {
    error_log('[super_admin/subscriptions.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error. Please check backend logs.']);
}
