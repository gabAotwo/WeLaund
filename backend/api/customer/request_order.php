<?php
declare(strict_types=1);
ini_set('display_errors', '0');
error_reporting(0);
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/Cors.php';

require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../controllers/CustomerController.php';

require_once __DIR__ . '/../../config/Session.php';
start_session();
AuthController::requireRole('customer');

$customer = new CustomerController($_SESSION['user_id']);
$deliveryEnabled = static function ($value): bool {
    return $value === true || $value === 1 || $value === '1' || $value === 't' || $value === 'true';
};

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $services = $customer->getShopServices($_SESSION['shop_id']);
    $shop     = $customer->getShop();
    if ($shop) {
        $shop['delivery_available'] = $deliveryEnabled($shop['delivery_available'] ?? false);
        $shop['delivery_fee']       = (float)$shop['delivery_fee'];
    }
    echo json_encode(['success' => true, 'data' => $services, 'shop' => $shop]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $type  = $input['type']           ?? 'Pickup';
    $pm    = $input['payment_method'] ?? 'Manual';
    $notes = $input['notes']          ?? '';
    $refNum = $input['reference_number'] ?? '';
    $dAddr  = $input['delivery_address'] ?? '';
    $dFee   = (float)($input['delivery_fee'] ?? 0);
    $total  = (float)($input['total_amount'] ?? 0);

    try {
        if ($type === 'Delivery') {
            $shop = $customer->getShop();
            if (!$shop || !$deliveryEnabled($shop['delivery_available'] ?? false)) {
                echo json_encode(['success' => false, 'message' => 'Delivery is currently unavailable for this shop.']);
                exit;
            }
            $dFee = (float)($shop['delivery_fee'] ?? 0);
        }

        $ref = $customer->createRequest($_SESSION['shop_id'], $type, $pm, $notes, $refNum, $dAddr, $dFee, $total);
        echo json_encode(['success' => true, 'ref' => $ref, 'message' => 'Request sent!']);
    } catch (\Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to send request: ' . $e->getMessage()]);
    }
    exit;
}
