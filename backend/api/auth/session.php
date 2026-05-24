<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['GET', 'OPTIONS']);

require_once __DIR__ . '/../../config/Session.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../config/Subscriptions.php';
start_session();

if (!empty($_SESSION['logged_in'])) {
    $role   = $_SESSION['role']    ?? '';
    $userId = $_SESSION['user_id'] ?? '';
    $suspended = false;

    try {
        $db = Database::getConnection();
        Subscriptions::enforceOverdue();

        // Live status check per role
        if ($role === 'owner') {
            $stmt = $db->prepare('SELECT status FROM owners WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $userId]);
            $row = $stmt->fetch();
            if ($row && $row['status'] !== 'active') $suspended = true;

        } elseif ($role === 'staff') {
            // Check staff status AND owner status
            $stmt = $db->prepare(
                'SELECT st.status AS staff_status, o.status AS owner_status
                 FROM staff st
                 JOIN laundry_shops s  ON s.id = st.shop_id
                 JOIN owners o         ON o.id = s.owner_id
                 WHERE st.id = :id LIMIT 1'
            );
            $stmt->execute([':id' => $userId]);
            $row = $stmt->fetch();
            if ($row && ($row['staff_status'] !== 'active' || $row['owner_status'] !== 'active')) {
                $suspended = true;
            }

        } elseif ($role === 'customer') {
            // Check customer status AND owner status
            $stmt = $db->prepare(
                'SELECT c.status AS cust_status, o.status AS owner_status
                 FROM customers c
                 JOIN laundry_shops s ON s.id = c.shop_id
                 JOIN owners o        ON o.id = s.owner_id
                 WHERE c.id = :id LIMIT 1'
            );
            $stmt->execute([':id' => $userId]);
            $row = $stmt->fetch();
            if ($row && ($row['cust_status'] !== 'Approved' || $row['owner_status'] !== 'active')) {
                $suspended = true;
            }
        }
    } catch (\Exception $e) {
        // DB error — don't block session, just skip live check
    }

    echo json_encode([
        'success'   => true,
        'suspended' => $suspended,
        'data'      => [
            'user_id'    => $_SESSION['user_id'],
            'user_name'  => $_SESSION['user_name'],
            'first_name' => $_SESSION['first_name'] ?? '',
            'email'      => $_SESSION['email'],
            'role'       => $_SESSION['role'],
            'shop_id'    => $_SESSION['shop_id'],
            'shop_name'  => $_SESSION['shop_name'],
            'status'     => $_SESSION['status'] ?? 'active',
        ],
    ]);
} else {
    echo json_encode(['success' => false, 'data' => null, 'message' => 'Not authenticated']);
}
