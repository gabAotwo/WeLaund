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
    try {
        $stmt = $db->prepare("
            WITH all_users AS (
                SELECT id, TRIM(first_name || ' ' || COALESCE(last_name, '')) AS name, 'customer' as role, profile_photo FROM customers
                UNION ALL
                SELECT id, TRIM(first_name || ' ' || COALESCE(last_name, '')) AS name, 'staff' as role, profile_photo FROM staff
                UNION ALL
                SELECT id, TRIM(first_name || ' ' || COALESCE(last_name, '')) AS name, 'owner' as role, profile_photo FROM owners
                UNION ALL
                SELECT id, username AS name, 'super_admin' as role, NULL as profile_photo FROM super_admins
            )
            SELECT r.id as room_id, r.created_at,
                   u.id as other_id, u.name as other_name, u.role as other_role, u.profile_photo as other_photo,
                   (
                       SELECT COUNT(*) FROM chat_messages m 
                       WHERE m.room_id = r.id AND m.sender_id = u.id AND m.is_read = FALSE
                   ) as unread_count,
                   (
                       SELECT m.message_text FROM chat_messages m 
                       WHERE m.room_id = r.id 
                       ORDER BY m.created_at DESC LIMIT 1
                   ) as last_message_text,
                   (
                       SELECT m.image_url FROM chat_messages m 
                       WHERE m.room_id = r.id 
                       ORDER BY m.created_at DESC LIMIT 1
                   ) as last_message_image,
                   COALESCE(
                       (SELECT m.created_at FROM chat_messages m WHERE m.room_id = r.id ORDER BY m.created_at DESC LIMIT 1),
                       r.created_at
                   ) as last_message_time
            FROM chat_rooms r
            JOIN all_users u ON (u.id = r.user_one_id OR u.id = r.user_two_id)
            WHERE (r.user_one_id = :my_id OR r.user_two_id = :my_id)
              AND u.id != :my_id
              AND NOT EXISTS (
                  SELECT 1 FROM customer_blocks cb
                  WHERE (cb.blocker_id = r.user_one_id AND cb.blocked_id = r.user_two_id)
                     OR (cb.blocker_id = r.user_two_id AND cb.blocked_id = r.user_one_id)
              )
            ORDER BY last_message_time DESC
        ");
        $stmt->execute([':my_id' => $myId]);
        $rooms = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'rooms' => $rooms
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
    $targetId = $input['target_id'] ?? '';

    if (!$targetId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing target_id']);
        exit;
    }

    try {
        $u1 = getUserDetails($myId, $db);
        $u2 = getUserDetails($targetId, $db);

        if (!$u1 || !$u2) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }

        if (!validateChatPermission($u1, $u2, $db)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'You do not have permission to chat with this user']);
            exit;
        }

        // Check if room already exists
        $stmt = $db->prepare("
            SELECT id FROM chat_rooms 
            WHERE (user_one_id = :my_id AND user_two_id = :target_id)
               OR (user_one_id = :target_id AND user_two_id = :my_id)
        ");
        $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
        $room = $stmt->fetch();

        if ($room) {
            echo json_encode([
                'success' => true,
                'room_id' => $room['id'],
                'message' => 'Existing room found'
            ]);
            exit;
        }

        // Create new room
        $stmt = $db->prepare("
            INSERT INTO chat_rooms (user_one_id, user_two_id) 
            VALUES (:my_id, :target_id)
            RETURNING id
        ");
        $stmt->execute([':my_id' => $myId, ':target_id' => $targetId]);
        $newRoom = $stmt->fetch();

        echo json_encode([
            'success' => true,
            'room_id' => $newRoom['id'],
            'message' => 'Room created'
        ]);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
}
