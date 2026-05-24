<?php
// ============================================================
//  controllers/SuperAdminController.php
//  Global oversight — no shop_id restriction
// ============================================================
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Subscriptions.php';

class SuperAdminController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // ─────────────────────────────────────────────────────────
    //  LAUNDRY SHOPS
    // ─────────────────────────────────────────────────────────

    public function getAllShops(): array
    {
        return $this->db
            ->query('SELECT s.id, s.shop_name, s.address, s.gcash_number, s.gcash_name, s.status, s.created_on,
                            o.first_name as owner_first, o.last_name as owner_last
                     FROM laundry_shops s
                     LEFT JOIN owners o ON o.id = s.owner_id
                     ORDER BY s.created_on DESC')
            ->fetchAll();
    }

    /**
     * Create owner first, then shop (owner_id NOT NULL constraint).
     */
    public function createShopWithOwner(
        string $shopName,
        string $shopAddress,
        string $shopContact,
        string $ownerFName,
        string $ownerLName,
        string $ownerEmail,
        string $ownerPassword,
        string $createdBy
    ): bool {
        $this->db->beginTransaction();
        try {
            // 1. Create owner
            $o = $this->db->prepare(
                'INSERT INTO owners (first_name, last_name, email, password_hash, created_by)
                 VALUES (:fn, :ln, :email, :pwd, :cb) RETURNING id'
            );
            $o->execute([
                ':fn'    => $ownerFName,
                ':ln'    => $ownerLName,
                ':email' => strtolower(trim($ownerEmail)),
                ':pwd'   => password_hash($ownerPassword, PASSWORD_BCRYPT),
                ':cb'    => $createdBy,
            ]);
            $ownerId = $o->fetchColumn();

            // 2. Create shop with owner_id
            $s = $this->db->prepare(
                'INSERT INTO laundry_shops
                    (owner_id, shop_name, address, contact_number, created_by)
                 VALUES (:oid, :name, :addr, :contact, :cb)'
            );
            $s->execute([
                ':oid'     => $ownerId,
                ':name'    => $shopName,
                ':addr'    => $shopAddress,
                ':contact' => $shopContact,
                ':cb'      => $createdBy,
            ]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function setShopStatus(string $shopId, string $status): bool
    {
        $allowed = ['active', 'inactive'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare(
            'UPDATE laundry_shops SET status = :status WHERE id = :id'
        );
        return $stmt->execute([':status' => $status, ':id' => $shopId]);
    }

    // ─────────────────────────────────────────────────────────
    //  SUPER ADMINS  (manage other SA accounts)
    // ─────────────────────────────────────────────────────────

    public function getSuperAdminProfile(string $id): ?array
    {
        $stmt = $this->db->prepare("SELECT id, username, email FROM super_admins WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public function updateSuperAdminEmail(string $id, string $newEmail, string $currentPassword): array
    {
        $stmt = $this->db->prepare("SELECT password_hash FROM super_admins WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $hash = $stmt->fetchColumn();
        if (!$hash || !password_verify($currentPassword, $hash))
            return ['success' => false, 'message' => 'Incorrect password.'];
        $stmt = $this->db->prepare("SELECT id FROM super_admins WHERE email = :email AND id != :id");
        $stmt->execute([':email' => strtolower(trim($newEmail)), ':id' => $id]);
        if ($stmt->fetch()) return ['success' => false, 'message' => 'Email already in use.'];
        $stmt = $this->db->prepare("UPDATE super_admins SET email = :email WHERE id = :id");
        $ok = $stmt->execute([':email' => strtolower(trim($newEmail)), ':id' => $id]);
        return ['success' => $ok, 'message' => $ok ? 'Email updated.' : 'Failed to update email.'];
    }

    public function updateSuperAdminPassword(string $id, string $current, string $new): bool
    {
        $stmt = $this->db->prepare("SELECT password_hash FROM super_admins WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $hash = $stmt->fetchColumn();
        if (!$hash || !password_verify($current, $hash)) return false;
        $stmt = $this->db->prepare("UPDATE super_admins SET password_hash = :hash WHERE id = :id");
        return $stmt->execute([':hash' => password_hash($new, PASSWORD_BCRYPT), ':id' => $id]);
    }

    public function getAllSuperAdmins(): array
    {
        return $this->db->query(
            'SELECT id, username, email, status, created_on FROM super_admins ORDER BY created_on DESC'
        )->fetchAll();
    }

    public function createSuperAdmin(string $username, string $email, string $password): bool
    {
        $stmt = $this->db->prepare(
            'INSERT INTO super_admins (username, email, password_hash) VALUES (:u, :e, :p)'
        );
        return $stmt->execute([
            ':u' => $username,
            ':e' => strtolower(trim($email)),
            ':p' => password_hash($password, PASSWORD_BCRYPT),
        ]);
    }

    public function setSuperAdminStatus(string $id, string $status): bool
    {
        $allowed = ['active', 'inactive'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare('UPDATE super_admins SET status = :status WHERE id = :id');
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }

    // ─────────────────────────────────────────────────────────
    //  OWNERS
    // ─────────────────────────────────────────────────────────

    public function getAllOwners(): array
    {
        return $this->db->query(
            "SELECT o.id, o.first_name, o.last_name, o.email, o.status, 
                    STRING_AGG(s.shop_name, ', ') as shop_name
             FROM owners o
             LEFT JOIN laundry_shops s ON s.owner_id = o.id
             GROUP BY o.id
             ORDER BY o.created_on DESC"
        )->fetchAll();
    }

    public function setOwnerStatus(string $ownerId, string $status): bool
    {
        $allowed = ['active', 'inactive'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare(
            'UPDATE owners SET status = :status WHERE id = :id'
        );
        return $stmt->execute([':status' => $status, ':id' => $ownerId]);
    }

    /**
     * Generate a secure 8-character temporary password that contains:
     * - Mix of uppercase and lowercase letters
     * - Mix of numbers
     * - Exactly 1 special character
     */
    private function generateSecureTempPassword(): string
    {
        $uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $lowers = 'abcdefghijkmnopqrstuvwxyz';
        $digits = '23456789';
        $specials = '@!#$%&*?';

        $password = '';
        $password .= $uppers[random_int(0, strlen($uppers) - 1)];
        $password .= $lowers[random_int(0, strlen($lowers) - 1)];
        $password .= $digits[random_int(0, strlen($digits) - 1)];
        $password .= $specials[random_int(0, strlen($specials) - 1)];

        $all = $uppers . $lowers . $digits;
        for ($i = 0; $i < 4; $i++) {
            $password .= $all[random_int(0, strlen($all) - 1)];
        }

        $chars = str_split($password);
        shuffle($chars);
        return implode('', $chars);
    }

    /**
     * Reset an owner's password to a secure temporary password and return it.
     */
    public function resetOwnerPassword(string $ownerId): array
    {
        $stmt = $this->db->prepare("SELECT email FROM owners WHERE id = :id");
        $stmt->execute([':id' => $ownerId]);
        $email = $stmt->fetchColumn();
        if (!$email) {
            return ['success' => false, 'message' => 'Owner not found.'];
        }

        $newPassword = $this->generateSecureTempPassword();
        $stmt = $this->db->prepare(
            "UPDATE owners SET password_hash = :hash WHERE id = :id"
        );
        $ok = $stmt->execute([
            ':hash' => password_hash($newPassword, PASSWORD_BCRYPT),
            ':id'   => $ownerId
        ]);

        return [
            'success' => $ok,
            'message' => $ok ? 'Password reset successfully.' : 'Failed to reset password.',
            'temp_password' => $newPassword,
            'email' => $email
        ];
    }

    // ─────────────────────────────────────────────────────────
    //  STAFF  (global view)
    // ─────────────────────────────────────────────────────────

    public function getAllStaff(): array
    {
        return $this->db->query(
            'SELECT st.id, st.first_name, st.last_name, st.email, st.status, s.shop_name
             FROM staff st
             JOIN laundry_shops s ON s.id = st.shop_id
             ORDER BY st.created_on DESC'
        )->fetchAll();
    }

    public function setStaffStatus(string $staffId, string $status): bool
    {
        $allowed = ['active', 'inactive'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare('UPDATE staff SET status = :status WHERE id = :id');
        return $stmt->execute([':status' => $status, ':id' => $staffId]);
    }

    // ─────────────────────────────────────────────────────────
    //  CUSTOMERS  (global view)
    // ─────────────────────────────────────────────────────────

    public function getAllCustomers(): array
    {
        return $this->db->query(
            'SELECT c.id, c.first_name, c.last_name, c.email, c.status, s.shop_name
             FROM customers c
             JOIN laundry_shops s ON s.id = c.shop_id
             ORDER BY c.last_updated DESC'
        )->fetchAll();
    }

    public function setCustomerStatus(string $customerId, string $status): bool
    {
        $allowed = ['Approved', 'Rejected', 'Pending', 'inactive'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare('UPDATE customers SET status = :status WHERE id = :id');
        return $stmt->execute([':status' => $status, ':id' => $customerId]);
    }

    // ─────────────────────────────────────────────────────────
    //  OWNER REQUESTS (B2B onboarding)
    // ─────────────────────────────────────────────────────────

    public function getOwnerRequests(string $status = 'pending'): array
    {
        $allowed = ['pending', 'approved', 'rejected', 'all'];
        if (!in_array($status, $allowed, true)) $status = 'pending';

        if ($status === 'all') {
            return $this->db->query(
                'SELECT * FROM owner_requests ORDER BY created_at DESC'
            )->fetchAll();
        }

        $stmt = $this->db->prepare(
            'SELECT * FROM owner_requests WHERE status = :status ORDER BY created_at DESC'
        );
        $stmt->execute([':status' => $status]);
        return $stmt->fetchAll();
    }

    public function rejectOwnerRequest(int $id): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE owner_requests SET status = 'rejected' WHERE id = :id AND status = 'pending'"
        );
        return $stmt->execute([':id' => $id]) && $stmt->rowCount() > 0;
    }

    /**
     * Approve a request: create owner + shop, send welcome email, mark approved.
     * Returns ['success'=>bool, 'message'=>string]
     */
    public function approveOwnerRequest(int $requestId, string $approvedBy): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM owner_requests WHERE id = :id AND status = 'pending'"
        );
        $stmt->execute([':id' => $requestId]);
        $req = $stmt->fetch();

        if (!$req) {
            return ['success' => false, 'message' => 'Request not found or already processed.'];
        }

        // Split owner_name into first/last
        $parts     = explode(' ', trim($req['owner_name']), 2);
        $firstName = $parts[0];
        $lastName  = $parts[1] ?? '';

        // Generate temporary password (exactly 8 characters with complex rules)
        $tempPassword = $this->generateSecureTempPassword();

        $this->db->beginTransaction();
        try {
            // 1. Create owner account
            $o = $this->db->prepare(
                'INSERT INTO owners (first_name, last_name, email, contact_number, password_hash, created_by)
                 VALUES (:fn, :ln, :email, :phone, :pwd, :cb) RETURNING id'
            );
            $o->execute([
                ':fn'    => $firstName,
                ':ln'    => $lastName,
                ':email' => strtolower($req['email']),
                ':phone' => $req['phone'],
                ':pwd'   => password_hash($tempPassword, PASSWORD_BCRYPT),
                ':cb'    => $approvedBy,
            ]);
            $ownerId = $o->fetchColumn();

            // 2. Create laundry shop
            $s = $this->db->prepare(
                'INSERT INTO laundry_shops (owner_id, shop_name, created_by)
                 VALUES (:oid, :name, :cb)'
            );
            $s->execute([
                ':oid'  => $ownerId,
                ':name' => $req['shop_name'],
                ':cb'   => $approvedBy,
            ]);

            // 3. Mark request approved
            $this->db->prepare(
                "UPDATE owner_requests SET status = 'approved' WHERE id = :id"
            )->execute([':id' => $requestId]);

            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'message' => 'Account creation failed: ' . $e->getMessage()];
        }

        // 4. Send welcome email (non-fatal if it fails)
        $this->sendWelcomeEmail($req['email'], $req['owner_name'], $req['shop_name'], $tempPassword);

        return [
            'success' => true,
            'message' => 'Owner approved and welcome email sent.',
            'temp_password' => $tempPassword,
            'email' => $req['email']
        ];
    }

    private function sendWelcomeEmail(
        string $to,
        string $ownerName,
        string $shopName,
        string $tempPassword
    ): void {
        require_once __DIR__ . '/../config/Env.php';
        Env::load();

        $portalUrl = Env::get('FRONTEND_URL', 'http://localhost:3000');
        $subject   = 'Welcome to WashWise! Your Owner Account is Approved';

        $body = "Dear {$ownerName},\r\n\r\n"
            . "Fantastic news! Your application to partner with WashWise has been officially reviewed "
            . "and approved by our network administration team. We are incredibly excited to welcome "
            . "{$shopName} to our platform.\r\n\r\n"
            . "Your centralized shop management dashboard is now ready. Log in using the temporary "
            . "credentials below to begin configuring your services, pricing, and staff roles:\r\n\r\n"
            . "  Portal Link:        {$portalUrl}/login\r\n"
            . "  Registered Email:   {$to}\r\n"
            . "  Temporary Password: {$tempPassword}\r\n\r\n"
            . "SECURITY NOTICE: Please update this temporary password immediately within your "
            . "Account Settings upon your very first login.\r\n\r\n"
            . "Welcome to the WashWise ecosystem.\r\n\r\n"
            . "Best regards,\r\nThe WashWise Administration Team";

        $headers = implode("\r\n", [
            'From: WashWise Admin <no-reply@washwise.laundry>',
            'Reply-To: no-reply@washwise.laundry',
            'Content-Type: text/plain; charset=UTF-8',
            'X-Mailer: PHP/' . PHP_VERSION,
        ]);

        @mail($to, $subject, $body, $headers);
    }

    // ─────────────────────────────────────────────────────────
    //  PLATFORM STATS
    // ─────────────────────────────────────────────────────────

    public function getPlatformStats(): array
    {
        $billing = Subscriptions::getSuperAdminBilling();
        return [
            'total_shops'     => (int) $this->db->query('SELECT COUNT(*) FROM laundry_shops')->fetchColumn(),
            'active_shops'    => (int) $this->db->query("SELECT COUNT(*) FROM laundry_shops WHERE status='active'")->fetchColumn(),
            'total_owners'    => (int) $this->db->query('SELECT COUNT(*) FROM owners')->fetchColumn(),
            'total_staff'     => (int) $this->db->query('SELECT COUNT(*) FROM staff')->fetchColumn(),
            'total_customers' => (int) $this->db->query('SELECT COUNT(*) FROM customers')->fetchColumn(),
            'pending_customers' => (int) $this->db->query("SELECT COUNT(*) FROM customers WHERE status='Pending'")->fetchColumn(),
            'total_orders'    => (int) $this->db->query('SELECT COUNT(*) FROM orders')->fetchColumn(),
            'total_revenue'   => (float) $this->db->query('SELECT COALESCE(SUM(amount_paid),0) FROM payments')->fetchColumn(),
            'subscription_revenue' => (float)($billing['summary']['approved_total'] ?? 0),
            'subscription_pending' => (float)($billing['summary']['pending_total'] ?? 0),
            'subscription_pending_count' => (int)($billing['summary']['pending_count'] ?? 0),
            'subscription_overdue_shops' => (int)($billing['summary']['overdue_shops'] ?? 0),
            'subscription_monthly' => $billing['monthly'] ?? [],
            'overdue_orders'  => (int) $this->db->query("SELECT COUNT(*) FROM orders WHERE order_status NOT IN ('Done','Cancelled') AND created_on < NOW() - INTERVAL '3 days'")->fetchColumn(),
        ];
    }

    // ─────────────────────────────────────────────────────────
    //  ENTITY OVERSIGHT — Services, Orders, Payments
    // ─────────────────────────────────────────────────────────

    public function getAllServicesGlobal(): array
    {
        return $this->db->query(
            "SELECT sv.id, sv.service_name, sv.unit, sv.price_per_unit, sv.status, s.shop_name
             FROM services sv
             JOIN laundry_shops s ON s.id = sv.shop_id
             ORDER BY s.shop_name, sv.service_name"
        )->fetchAll();
    }

    public function setServiceStatus(string $id, string $status): bool
    {
        $allowed = ['active', 'inactive'];
        if (!in_array($status, $allowed, true)) return false;
        $stmt = $this->db->prepare('UPDATE services SET status = :status WHERE id = :id');
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }

    public function getAllOrdersGlobal(int $limit = 100): array
    {
        return $this->db->query(
            "SELECT o.id, o.order_ref, o.order_status, o.payment_status, o.total_amount, o.created_on,
                    c.first_name, c.last_name, s.shop_name
             FROM orders o
             JOIN customers c ON c.id = o.customer_id
             JOIN laundry_shops s ON s.id = o.shop_id
             ORDER BY o.created_on DESC
             LIMIT {$limit}"
        )->fetchAll();
    }

    public function setOrderStatus(string $id, string $status): bool
    {
        $allowed = ['Requested', 'Ongoing', 'Done', 'Cancelled'];
        if (!in_array($status, $allowed, true)) return false;
        $stmt = $this->db->prepare("UPDATE orders SET order_status = :status, last_updated = NOW() WHERE id = :id");
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }

    public function getAllPaymentsGlobal(int $limit = 100): array
    {
        return $this->db->query(
            "SELECT p.id, p.amount_paid, p.payment_method, p.status, p.created_on,
                    o.order_ref, c.first_name, c.last_name, s.shop_name
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             JOIN customers c ON c.id = o.customer_id
             JOIN laundry_shops s ON s.id = o.shop_id
             ORDER BY p.created_on DESC
             LIMIT {$limit}"
        )->fetchAll();
    }

    public function setPaymentStatus(string $id, string $status): bool
    {
        $allowed = ['Verified', 'Pending'];
        if (!in_array($status, $allowed, true)) return false;
        $stmt = $this->db->prepare("UPDATE payments SET status = :status WHERE id = :id");
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }
}
