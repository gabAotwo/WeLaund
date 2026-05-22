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

$role = $_SESSION['role'] ?? '';
$myId = $_SESSION['user_id'] ?? '';
$shopId = $_SESSION['shop_id'] ?? null;

if (!$myId || !$role) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$db = Database::getConnection();

try {
    $contacts = [];

    if ($role === 'customer') {
        // 1. Staff in their shop
        if ($shopId) {
            $stmt = $db->prepare("
                SELECT id, first_name, last_name, email, role, profile_photo 
                FROM staff 
                WHERE shop_id = :shop_id AND status = 'active'
                ORDER BY first_name ASC
            ");
            $stmt->execute([':shop_id' => $shopId]);
            $staffMembers = $stmt->fetchAll();
            foreach ($staffMembers as $s) {
                $contacts[] = [
                    'id' => $s['id'],
                    'name' => trim($s['first_name'] . ' ' . ($s['last_name'] ?? '')),
                    'email' => $s['email'],
                    'role' => 'staff (' . $s['role'] . ')',
                    'profile_photo' => $s['profile_photo'],
                    'connection_status' => null
                ];
            }
        }

        // 2. Other customers in the system (with connection status, excluding blocked)
        $stmt = $db->prepare("
            SELECT u.id, u.first_name, u.last_name, u.email, u.profile_photo,
                   c.status as conn_status, c.sender_id as conn_sender
            FROM customers u
            LEFT JOIN customer_connections c ON 
              ((c.sender_id = :my_id AND c.receiver_id = u.id) OR (c.sender_id = u.id AND c.receiver_id = :my_id))
            WHERE u.id != :my_id AND u.status = 'Approved'
              AND NOT EXISTS (
                  SELECT 1 FROM customer_blocks cb
                  WHERE (cb.blocker_id = :my_id AND cb.blocked_id = u.id)
                     OR (cb.blocker_id = u.id AND cb.blocked_id = :my_id)
              )
            ORDER BY u.first_name ASC
        ");
        $stmt->execute([':my_id' => $myId]);
        $otherCustomers = $stmt->fetchAll();
        foreach ($otherCustomers as $c) {
            $status = 'none';
            if ($c['conn_status'] === 'accepted') {
                $status = 'accepted';
            } elseif ($c['conn_status'] === 'pending') {
                $status = ($c['conn_sender'] === $myId) ? 'pending_sent' : 'pending_received';
            }
            
            $contacts[] = [
                'id' => $c['id'],
                'name' => trim($c['first_name'] . ' ' . ($c['last_name'] ?? '')),
                'email' => $c['email'],
                'role' => 'customer',
                'profile_photo' => $c['profile_photo'],
                'connection_status' => $status
            ];
        }

    } elseif ($role === 'staff') {
        // 1. Owner of their shop
        if ($shopId) {
            $stmt = $db->prepare("
                SELECT o.id, o.first_name, o.last_name, o.email, o.profile_photo
                FROM owners o
                JOIN laundry_shops s ON s.owner_id = o.id
                WHERE s.id = :shop_id AND o.status = 'active'
            ");
            $stmt->execute([':shop_id' => $shopId]);
            $owner = $stmt->fetch();
            if ($owner) {
                $contacts[] = [
                    'id' => $owner['id'],
                    'name' => trim($owner['first_name'] . ' ' . ($owner['last_name'] ?? '')),
                    'email' => $owner['email'],
                    'role' => 'owner',
                    'profile_photo' => $owner['profile_photo'],
                    'connection_status' => null
                ];
            }

            // 2. Other staff in the same shop
            $stmt = $db->prepare("
                SELECT id, first_name, last_name, email, role, profile_photo 
                FROM staff 
                WHERE shop_id = :shop_id AND id != :my_id AND status = 'active'
                ORDER BY first_name ASC
            ");
            $stmt->execute([':shop_id' => $shopId, ':my_id' => $myId]);
            $otherStaff = $stmt->fetchAll();
            foreach ($otherStaff as $s) {
                $contacts[] = [
                    'id' => $s['id'],
                    'name' => trim($s['first_name'] . ' ' . ($s['last_name'] ?? '')),
                    'email' => $s['email'],
                    'role' => 'staff (' . $s['role'] . ')',
                    'profile_photo' => $s['profile_photo'],
                    'connection_status' => null
                ];
            }

            // 3. Customers registered in their shop
            $stmt = $db->prepare("
                SELECT id, first_name, last_name, email, profile_photo 
                FROM customers 
                WHERE shop_id = :shop_id AND status = 'Approved'
                ORDER BY first_name ASC
            ");
            $stmt->execute([':shop_id' => $shopId]);
            $customers = $stmt->fetchAll();
            foreach ($customers as $c) {
                $contacts[] = [
                    'id' => $c['id'],
                    'name' => trim($c['first_name'] . ' ' . ($c['last_name'] ?? '')),
                    'email' => $c['email'],
                    'role' => 'customer',
                    'profile_photo' => $c['profile_photo'],
                    'connection_status' => null
                ];
            }
        }

    } elseif ($role === 'owner') {
        // 1. Superadmins
        $stmt = $db->prepare("
            SELECT id, username, email 
            FROM super_admins 
            WHERE status = 'active'
            ORDER BY username ASC
        ");
        $stmt->execute();
        $admins = $stmt->fetchAll();
        foreach ($admins as $a) {
            $contacts[] = [
                'id' => $a['id'],
                'name' => $a['username'],
                'email' => $a['email'],
                'role' => 'super_admin',
                'profile_photo' => null,
                'connection_status' => null
            ];
        }

        // 2. Staff in their own shops
        $stmt = $db->prepare("
            SELECT st.id, st.first_name, st.last_name, st.email, st.role, st.profile_photo, sh.shop_name
            FROM staff st
            JOIN laundry_shops sh ON st.shop_id = sh.id
            WHERE sh.owner_id = :owner_id AND st.status = 'active'
            ORDER BY sh.shop_name ASC, st.first_name ASC
        ");
        $stmt->execute([':owner_id' => $myId]);
        $staffMembers = $stmt->fetchAll();
        foreach ($staffMembers as $s) {
            $contacts[] = [
                'id' => $s['id'],
                'name' => trim($s['first_name'] . ' ' . ($s['last_name'] ?? '')),
                'email' => $s['email'],
                'role' => 'staff (' . $s['role'] . ') @ ' . $s['shop_name'],
                'profile_photo' => $s['profile_photo'],
                'connection_status' => null
            ];
        }

    } elseif ($role === 'super_admin') {
        // 1. Owners
        $stmt = $db->prepare("
            SELECT id, first_name, last_name, email, profile_photo 
            FROM owners 
            WHERE status = 'active'
            ORDER BY first_name ASC
        ");
        $stmt->execute();
        $owners = $stmt->fetchAll();
        foreach ($owners as $o) {
            $contacts[] = [
                'id' => $o['id'],
                'name' => trim($o['first_name'] . ' ' . ($o['last_name'] ?? '')),
                'email' => $o['email'],
                'role' => 'owner',
                'profile_photo' => $o['profile_photo'],
                'connection_status' => null
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'contacts' => $contacts
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
