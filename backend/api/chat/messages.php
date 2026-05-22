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

if (!$myId || !$role) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$db = Database::getConnection();

function getUserDetails(string $id, PDO $db): ?array {
    $stmt = $db->prepare("SELECT id, 'customer' as role, shop_id FROM customers WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $res = $stmt->fetch();
    if ($res) return $res;

    $stmt = $db->prepare("SELECT id, 'staff' as role, shop_id FROM staff WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $res = $stmt->fetch();
    if ($res) return $res;

    $stmt = $db->prepare("SELECT id, 'owner' as role, NULL as shop_id FROM owners WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $res = $stmt->fetch();
    if ($res) return $res;

    $stmt = $db->prepare("SELECT id, 'super_admin' as role, NULL as shop_id FROM super_admins WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $res = $stmt->fetch();
    if ($res) return $res;

    return null;
}

function validateChatPermission(array $u1, array $u2, PDO $db): bool {
    if ($u1['id'] === $u2['id']) return false;

    $r1 = $u1['role'];
    $r2 = $u2['role'];

    // Block check first
    if ($r1 === 'customer' || $r2 === 'customer') {
        $stmt = $db->prepare("
            SELECT 1 FROM customer_blocks 
            WHERE (blocker_id = :id1 AND blocked_id = :id2)
               OR (blocker_id = :id2 AND blocked_id = :id1)
        ");
        $stmt->execute([':id1' => $u1['id'], ':id2' => $u2['id']]);
        if ($stmt->fetch()) {
            return false;
        }
    }

    if ($r1 === 'customer' && $r2 === 'customer') {
        $stmt = $db->prepare("
            SELECT status FROM customer_connections
            WHERE ((sender_id = :id1 AND receiver_id = :id2) OR (sender_id = :id2 AND receiver_id = :id1))
              AND status = 'accepted'
        ");
        $stmt->execute([':id1' => $u1['id'], ':id2' => $u2['id']]);
        return (bool)$stmt->fetch();
    }

    $roles = [$r1, $r2];
    sort($roles);

    if ($roles === ['owner', 'super_admin']) {
        return true;
    }

    if ($roles === ['owner', 'staff']) {
        $owner = ($r1 === 'owner') ? $u1 : $u2;
        $staff = ($r1 === 'staff') ? $u1 : $u2;
        $stmt = $db->prepare("SELECT 1 FROM laundry_shops WHERE id = :shop_id AND owner_id = :owner_id");
        $stmt->execute([':shop_id' => $staff['shop_id'], ':owner_id' => $owner['id']]);
        return (bool)$stmt->fetch();
    }

    if ($roles === ['staff', 'staff']) {
        return ($u1['shop_id'] !== null && $u1['shop_id'] === $u2['shop_id']);
    }

    if ($roles === ['customer', 'staff']) {
        return ($u1['shop_id'] !== null && $u1['shop_id'] === $u2['shop_id']);
    }

    return false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $roomId = $_GET['room_id'] ?? '';
    if (!$roomId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing room_id']);
        exit;
    }

    try {
        // Verify room and membership
        $stmt = $db->prepare("SELECT user_one_id, user_two_id FROM chat_rooms WHERE id = :room_id");
        $stmt->execute([':room_id' => $roomId]);
        $room = $stmt->fetch();

        if (!$room) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Chat room not found']);
            exit;
        }

        if ($room['user_one_id'] !== $myId && $room['user_two_id'] !== $myId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized access to this chat room']);
            exit;
        }

        // Check if there is an active block
        $stmt = $db->prepare("
            SELECT 1 FROM customer_blocks 
            WHERE (blocker_id = :id1 AND blocked_id = :id2)
               OR (blocker_id = :id2 AND blocked_id = :id1)
        ");
        $stmt->execute([':id1' => $room['user_one_id'], ':id2' => $room['user_two_id']]);
        if ($stmt->fetch()) {
            // If blocked, we return empty message history or indicate blocked
            echo json_encode([
                'success' => true,
                'messages' => [],
                'is_blocked' => true
            ]);
            exit;
        }

        // Mark messages as read
        $stmt = $db->prepare("
            UPDATE chat_messages 
            SET is_read = TRUE 
            WHERE room_id = :room_id AND sender_id != :my_id AND is_read = FALSE
        ");
        $stmt->execute([':room_id' => $roomId, ':my_id' => $myId]);

        // Get messages
        $stmt = $db->prepare("
            SELECT id, sender_id, message_text, image_url, is_read, created_at
            FROM chat_messages
            WHERE room_id = :room_id
            ORDER BY created_at ASC
        ");
        $stmt->execute([':room_id' => $roomId]);
        $messages = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'messages' => $messages,
            'is_blocked' => false
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
    $roomId = $input['room_id'] ?? '';
    $messageText = $input['message_text'] ?? null;
    $imageUrl = $input['image_url'] ?? null;

    if (!$roomId || (!$messageText && !$imageUrl)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing room_id, message_text, or image_url']);
        exit;
    }

    try {
        // Verify room
        $stmt = $db->prepare("SELECT user_one_id, user_two_id FROM chat_rooms WHERE id = :room_id");
        $stmt->execute([':room_id' => $roomId]);
        $room = $stmt->fetch();

        if (!$room) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Chat room not found']);
            exit;
        }

        if ($room['user_one_id'] !== $myId && $room['user_two_id'] !== $myId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized to send message to this room']);
            exit;
        }

        $otherId = ($room['user_one_id'] === $myId) ? $room['user_two_id'] : $room['user_one_id'];

        $u1 = getUserDetails($myId, $db);
        $u2 = getUserDetails($otherId, $db);

        if (!$u1 || !$u2) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }

        if (!validateChatPermission($u1, $u2, $db)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'You do not have permission to message this user (either blocked or not connected)']);
            exit;
        }

        // Insert message
        $stmt = $db->prepare("
            INSERT INTO chat_messages (room_id, sender_id, message_text, image_url, is_read)
            VALUES (:room_id, :sender_id, :message_text, :image_url, FALSE)
            RETURNING id, sender_id, message_text, image_url, is_read, created_at
        ");
        $stmt->execute([
            ':room_id' => $roomId,
            ':sender_id' => $myId,
            ':message_text' => $messageText,
            ':image_url' => $imageUrl
        ]);
        $newMessage = $stmt->fetch();

        echo json_encode([
            'success' => true,
            'message' => $newMessage
        ]);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
}
