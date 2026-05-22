<?php
declare(strict_types=1);
ini_set('display_errors', '0');
error_reporting(0);
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['GET', 'POST', 'OPTIONS']);

require_once __DIR__ . '/../../config/Session.php';
start_session();

require_once __DIR__ . '/../../config/Database.php';

if (empty($_SESSION['logged_in'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$role = $_SESSION['role'] ?? '';
$myId = $_SESSION['user_id'] ?? '';

if ($role !== 'customer' || !$myId) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden. Customers only.']);
    exit;
}

$db = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT b.id as block_id, u.id as user_id, u.first_name, u.last_name, u.email
            FROM customer_blocks b
            JOIN customers u ON b.blocked_id = u.id
            WHERE b.blocker_id = :my_id
            ORDER BY u.first_name ASC, u.last_name ASC
        ");
        $stmt->execute([':my_id' => $myId]);
        $blocked = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'blocked' => $blocked
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $input['action'] ?? '';
    $targetId = $input['target_id'] ?? ''; // Other Customer UUID

    if (!$action || !$targetId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing action or target_id']);
        exit;
    }

    try {
        // Verify target_id exists and is a customer
        $stmt = $db->prepare("SELECT id FROM customers WHERE id = :id");
        $stmt->execute([':id' => $targetId]);
        $targetExists = $stmt->fetch();
        if (!$targetExists) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Target customer not found']);
            exit;
        }

        if ($action === 'block') {
            // Check if already blocked
            $stmt = $db->prepare("
                SELECT id FROM customer_blocks 
                WHERE blocker_id = :my_id AND blocked_id = :target_id
            ");
            $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => true, 'message' => 'Already blocked']);
                exit;
            }

            // Insert block
            $stmt = $db->prepare("
                INSERT INTO customer_blocks (blocker_id, blocked_id)
                VALUES (:my_id, :target_id)
            ");
            $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);

            // When blocking, we must delete any existing connection request or accepted connection
            $stmt = $db->prepare("
                DELETE FROM customer_connections 
                WHERE (sender_id = :my_id AND receiver_id = :target_id)
                   OR (sender_id = :target_id AND receiver_id = :my_id)
            ");
            $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);

            echo json_encode(['success' => true, 'message' => 'User blocked successfully']);
            exit;
        } elseif ($action === 'unblock') {
            $stmt = $db->prepare("
                DELETE FROM customer_blocks 
                WHERE blocker_id = :my_id AND blocked_id = :target_id
            ");
            $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
            echo json_encode(['success' => true, 'message' => 'User unblocked successfully']);
            exit;
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            exit;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
}
