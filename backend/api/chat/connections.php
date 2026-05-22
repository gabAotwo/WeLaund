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
        // 1. Fetch Accepted Friends
        $stmt = $db->prepare("
            SELECT c.id as connection_id, u.id as user_id, u.first_name, u.last_name, u.email
            FROM customer_connections c
            JOIN customers u ON (c.sender_id = u.id OR c.receiver_id = u.id)
            WHERE (c.sender_id = :my_id OR c.receiver_id = :my_id)
              AND c.status = 'accepted'
              AND u.id != :my_id
              AND NOT EXISTS (
                  SELECT 1 FROM customer_blocks cb
                  WHERE (cb.blocker_id = :my_id AND cb.blocked_id = u.id)
                     OR (cb.blocker_id = u.id AND cb.blocked_id = :my_id)
              )
            ORDER BY u.first_name ASC, u.last_name ASC
        ");
        $stmt->execute([':my_id' => $myId]);
        $accepted = $stmt->fetchAll();

        // 2. Fetch Sent Pending Requests
        $stmt = $db->prepare("
            SELECT c.id as connection_id, u.id as user_id, u.first_name, u.last_name, u.email
            FROM customer_connections c
            JOIN customers u ON c.receiver_id = u.id
            WHERE c.sender_id = :my_id AND c.status = 'pending'
              AND NOT EXISTS (
                  SELECT 1 FROM customer_blocks cb
                  WHERE (cb.blocker_id = :my_id AND cb.blocked_id = u.id)
                     OR (cb.blocker_id = u.id AND cb.blocked_id = :my_id)
              )
            ORDER BY u.first_name ASC, u.last_name ASC
        ");
        $stmt->execute([':my_id' => $myId]);
        $pendingSent = $stmt->fetchAll();

        // 3. Fetch Received Pending Requests
        $stmt = $db->prepare("
            SELECT c.id as connection_id, u.id as user_id, u.first_name, u.last_name, u.email
            FROM customer_connections c
            JOIN customers u ON c.sender_id = u.id
            WHERE c.receiver_id = :my_id AND c.status = 'pending'
              AND NOT EXISTS (
                  SELECT 1 FROM customer_blocks cb
                  WHERE (cb.blocker_id = :my_id AND cb.blocked_id = u.id)
                     OR (cb.blocker_id = u.id AND cb.blocked_id = :my_id)
              )
            ORDER BY u.first_name ASC, u.last_name ASC
        ");
        $stmt->execute([':my_id' => $myId]);
        $pendingReceived = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'accepted' => $accepted,
            'pending_sent' => $pendingSent,
            'pending_received' => $pendingReceived
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

        // Check block relationship
        $stmt = $db->prepare("
            SELECT 1 FROM customer_blocks 
            WHERE (blocker_id = :my_id AND blocked_id = :target_id)
               OR (blocker_id = :target_id AND blocked_id = :my_id)
        ");
        $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cannot request connections with blocked users']);
            exit;
        }

        if ($action === 'send') {
            // Check if connection already exists
            $stmt = $db->prepare("
                SELECT id, sender_id, receiver_id, status FROM customer_connections
                WHERE (sender_id = :my_id AND receiver_id = :target_id)
                   OR (sender_id = :target_id AND receiver_id = :my_id)
            ");
            $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
            $existing = $stmt->fetch();

            if ($existing) {
                if ($existing['status'] === 'accepted') {
                    echo json_encode(['success' => true, 'message' => 'Already connected']);
                    exit;
                }
                if ($existing['status'] === 'pending') {
                    if ($existing['sender_id'] === $myId) {
                        echo json_encode(['success' => true, 'message' => 'Request already sent']);
                        exit;
                    } else {
                        // The other sent it, so auto-accept
                        $stmt = $db->prepare("
                            UPDATE customer_connections 
                            SET status = 'accepted', updated_at = NOW() 
                            WHERE id = :id
                        ");
                        $stmt->execute([':id' => $existing['id']]);
                        echo json_encode(['success' => true, 'message' => 'Connection accepted']);
                        exit;
                    }
                }
            } else {
                // Insert new pending connection
                $stmt = $db->prepare("
                    INSERT INTO customer_connections (sender_id, receiver_id, status)
                    VALUES (:my_id, :target_id, 'pending')
                ");
                $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
                echo json_encode(['success' => true, 'message' => 'Request sent']);
                exit;
            }
        } elseif ($action === 'accept') {
            $stmt = $db->prepare("
                UPDATE customer_connections 
                SET status = 'accepted', updated_at = NOW() 
                WHERE sender_id = :target_id AND receiver_id = :my_id AND status = 'pending'
            ");
            $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Connection accepted']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No pending connection request found to accept']);
            }
            exit;
        } elseif ($action === 'reject') {
            $stmt = $db->prepare("
                DELETE FROM customer_connections 
                WHERE sender_id = :target_id AND receiver_id = :my_id AND status = 'pending'
            ");
            $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
            echo json_encode(['success' => true, 'message' => 'Request rejected']);
            exit;
        } elseif ($action === 'delete') {
            // Delete request or accepted connection
            $stmt = $db->prepare("
                DELETE FROM customer_connections 
                WHERE (sender_id = :my_id AND receiver_id = :target_id)
                   OR (sender_id = :target_id AND receiver_id = :my_id)
            ");
            $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
            echo json_encode(['success' => true, 'message' => 'Connection deleted']);
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
