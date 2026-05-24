<?php
// ============================================================
//  backend/controllers/AuthController.php
//  UPDATED to align with detailed schema
// ============================================================
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Subscriptions.php';

class AuthController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function login(string $credential, string $password, string $role): bool|string
    {
        $credential = strtolower(trim($credential));

        if ($role === 'auto') {
            $roles = ['super_admin', 'owner', 'staff', 'customer'];
            foreach ($roles as $r) {
                $res = $this->login($credential, $password, $r);
                if ($res === true) return true;
                // Return immediately for specific known messages
                if ($res === 'SHOP_SUSPENDED') return $res;
                if (is_string($res) && strpos($res, 'Your account') !== false) return $res;
            }
            return 'Invalid email or password.';
        }

        switch ($role) {
            case 'super_admin': return $this->loginSuperAdmin($credential, $password);
            case 'owner':       return $this->loginOwner($credential, $password);
            case 'staff':       return $this->loginStaff($credential, $password);
            case 'customer':    return $this->loginCustomer($credential, $password);
            default:            return 'Invalid role.';
        }
    }

    private function loginSuperAdmin(string $credential, string $password): bool|string
    {
        $stmt = $this->db->prepare(
            'SELECT id, username, email, password_hash, status FROM super_admins 
             WHERE email = :c OR username = :c LIMIT 1'
        );
        $stmt->execute([':c' => $credential]);
        $user = $stmt->fetch();

        if (!$user) return 'Account not found.';
        if ($user['status'] !== 'active') return 'Account inactive.';
        if (!password_verify($password, $user['password_hash'])) return 'Incorrect password.';

        $this->startSession($user['id'], $user['username'], $user['username'], $user['email'], 'super_admin', '', '', $user['status']);
        return true;
    }

    private function loginOwner(string $email, string $password): bool|string
    {
        Subscriptions::enforceOverdue();
        $stmt = $this->db->prepare(
            'SELECT o.id, o.first_name, o.last_name, o.password_hash, o.status, o.shop_id, s.shop_name
             FROM owners o
             JOIN laundry_shops s ON s.owner_id = o.id -- note: alignment check, usually shop points to owner
             WHERE o.email = :email LIMIT 1'
        );
        // Special fix: schema.txt says shop has owner_id
        // Re-checking schema.txt... yes, table: laundry_shops -> owner_id (FK to owners)
        $stmt = $this->db->prepare(
            'SELECT o.id, o.first_name, o.last_name, o.password_hash, o.status, s.id AS shop_id, s.shop_name
             FROM owners o
             LEFT JOIN laundry_shops s ON s.owner_id = o.id
             WHERE o.email = :email LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) return 'Account not found.';
        if ($user['status'] !== 'active') return 'Your account has been suspended by the developer. Please contact support.';
        if (!password_verify($password, $user['password_hash'])) return 'Incorrect password.';

        $fullName = $user['first_name'] . ' ' . $user['last_name'];
        $this->startSession($user['id'], $fullName, $user['first_name'], $email, 'owner', (string)$user['shop_id'], (string)$user['shop_name'], $user['status']);
        return true;
    }

    private function loginStaff(string $email, string $password): bool|string
    {
        Subscriptions::enforceOverdue();
        $stmt = $this->db->prepare(
            'SELECT st.id, st.first_name, st.last_name, st.password_hash, st.status, st.shop_id, s.shop_name,
                    o.status AS owner_status
             FROM staff st
             JOIN laundry_shops s ON s.id = st.shop_id
             JOIN owners o        ON o.id = s.owner_id
             WHERE st.email = :email LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) return 'Account not found.';
        if ($user['owner_status'] !== 'active') return 'SHOP_SUSPENDED';
        if ($user['status'] !== 'active') return 'Your account has been suspended by the developer. Please contact support.';
        if (!password_verify($password, $user['password_hash'])) return 'Incorrect password.';

        $fullName = $user['first_name'] . ' ' . $user['last_name'];
        $this->startSession($user['id'], $fullName, $user['first_name'], $email, 'staff', $user['shop_id'], $user['shop_name'], $user['status']);
        return true;
    }

    private function loginCustomer(string $email, string $password): bool|string
    {
        Subscriptions::enforceOverdue();
        $stmt = $this->db->prepare(
            'SELECT c.id, c.first_name, c.last_name, c.password_hash, c.status, c.shop_id, s.shop_name,
                    o.status AS owner_status
             FROM customers c
             JOIN laundry_shops s ON s.id = c.shop_id
             JOIN owners o        ON o.id = s.owner_id
             WHERE c.email = :email LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) return 'Account not found.';
        if ($user['owner_status'] !== 'active') return 'SHOP_SUSPENDED';
        if ($user['status'] === 'Pending') return 'Your account is pending, please wait for approval.';
        if ($user['status'] === 'Disapproved') return 'Your registration was rejected by the shop staff.';
        if ($user['status'] === 'Inactive') return 'Your account is currently inactive.';
        if ($user['status'] !== 'Approved') return 'Access denied. Please contact support.';

        if (!password_verify($password, $user['password_hash'])) return 'Incorrect password.';

        $fullName = $user['first_name'] . ' ' . $user['last_name'];
        $this->startSession($user['id'], $fullName, $user['first_name'], $email, 'customer', $user['shop_id'], $user['shop_name'], $user['status']);
        return true;
    }

    private function startSession($id, $fullName, $firstName, $email, $role, $shopId = '', $shopName = '', $status = 'active'): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            require_once __DIR__ . '/../config/Session.php';
            start_session();
        }
        session_regenerate_id(true);
        $_SESSION['user_id']    = $id;
        $_SESSION['user_name']  = $fullName;
        $_SESSION['first_name'] = $firstName;
        $_SESSION['email']      = $email;
        $_SESSION['role']       = $role;
        $_SESSION['shop_id']    = $shopId;
        $_SESSION['shop_name']  = $shopName;
        $_SESSION['status']     = $status;
        $_SESSION['logged_in']  = true;
    }

    public function logout(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        session_unset();
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Logged out']);
        exit;
    }

    public static function requireRole(string ...$roles): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (empty($_SESSION['logged_in']) || !in_array($_SESSION['role'] ?? '', $roles, true)) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
    }
}
