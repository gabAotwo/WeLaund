<?php
declare(strict_types=1);
ini_set('display_errors', '0');
error_reporting(0);
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['GET', 'OPTIONS']);

require_once __DIR__ . '/../../config/Session.php';
start_session();

require_once __DIR__ . '/../../config/Database.php';

if (empty($_SESSION['logged_in'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$myId = $_SESSION['user_id'] ?? '';

if (!$myId) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$db = Database::getConnection();

try {
    $stmt = $db->prepare("
        SELECT COUNT(*) as unread_count 
        FROM chat_messages m
        JOIN chat_rooms r ON m.room_id = r.id
        WHERE (r.user_one_id = :my_id OR r.user_two_id = :my_id)
          AND m.sender_id != :my_id
          AND m.is_read = FALSE
          AND NOT EXISTS (
              SELECT 1 FROM customer_blocks cb
              WHERE (cb.blocker_id = r.user_one_id AND cb.blocked_id = r.user_two_id)
                 OR (cb.blocker_id = r.user_two_id AND cb.blocked_id = r.user_one_id)
          )
    ");
    $stmt->execute([':my_id' => $myId]);
    $res = $stmt->fetch();
    $unreadCount = (int)($res['unread_count'] ?? 0);

    echo json_encode([
        'success' => true,
        'unread_count' => $unreadCount
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
