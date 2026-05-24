<?php
// ============================================================
//  controllers/OwnerController.php
//  All queries enforce WHERE shop_id = :shop_id
// ============================================================
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class OwnerController
{
    private PDO $db;
    private string $shopId;

    public function __construct(string $shopId)
    {
        $this->db     = Database::getConnection();
        $this->shopId = $shopId;
    }

    // ─────────────────────────────────────────────────────────
    //  STAFF MANAGEMENT
    // ─────────────────────────────────────────────────────────

    public function getAllStaff(): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email, status, created_on, profile_photo
             FROM staff
             WHERE shop_id = :shop_id
             ORDER BY created_on DESC'
        );
        $stmt->execute([':shop_id' => $this->shopId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['photo_url'] = $row['profile_photo']
                ? '/api/avatar.php?file=' . urlencode($row['profile_photo'])
                : null;
        }
        return $rows;
    }

    public function createStaff(string $fname, string $lname, string $email, string $password): bool
    {
        $stmt = $this->db->prepare(
            'INSERT INTO staff (shop_id, first_name, last_name, email, password_hash)
             VALUES (:shop_id, :fname, :lname, :email, :password)'
        );
        return $stmt->execute([
            ':shop_id'  => $this->shopId,
            ':fname'    => $fname,
            ':lname'    => $lname,
            ':email'    => strtolower(trim($email)),
            ':password' => password_hash($password, PASSWORD_BCRYPT),
        ]);
    }

    public function updateStaffStatus(string $staffId, string $status): bool
    {
        $allowed = ['active', 'inactive'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare(
            'UPDATE staff SET status = :status
             WHERE id = :id AND shop_id = :shop_id'
        );
        return $stmt->execute([
            ':status'  => $status,
            ':id'      => $staffId,
            ':shop_id' => $this->shopId,
        ]);
    }

    public function updateStaff(string $staffId, string $name, string $email): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE staff SET name = :name, email = :email
             WHERE id = :id AND shop_id = :shop_id'
        );
        return $stmt->execute([
            ':name'    => $name,
            ':email'   => strtolower(trim($email)),
            ':id'      => $staffId,
            ':shop_id' => $this->shopId,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  CUSTOMER STATS
    // ─────────────────────────────────────────────────────────

    public function getTotalCustomers(): array
    {
        $stmt = $this->db->prepare(
            'SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = \'Approved\' THEN 1 ELSE 0 END) AS approved,
                SUM(CASE WHEN status = \'Pending\'  THEN 1 ELSE 0 END) AS pending
             FROM customers WHERE shop_id = :shop_id'
        );
        $stmt->execute([':shop_id' => $this->shopId]);
        return $stmt->fetch();
    }

    public function getCustomers(string $status = 'all'): array
    {
        $allowed = ['Pending', 'Approved', 'Disapproved', 'Inactive'];
        $where = 'WHERE shop_id = :shop_id';
        $params = [':shop_id' => $this->shopId];

        if ($status !== 'all' && in_array($status, $allowed, true)) {
            $where .= ' AND status = :status';
            $params[':status'] = $status;
        }

        $stmt = $this->db->prepare(
            "SELECT id, first_name, middle_name, last_name, email, contact_number, address, status, created_on, last_updated, profile_photo
             FROM customers
             {$where}
             ORDER BY
               CASE status
                 WHEN 'Pending' THEN 1
                 WHEN 'Approved' THEN 2
                 WHEN 'Inactive' THEN 3
                 ELSE 4
               END,
               last_updated DESC NULLS LAST,
               created_on DESC"
        );
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['photo_url'] = $row['profile_photo']
                ? '/api/avatar.php?file=' . urlencode($row['profile_photo'])
                : null;
        }
        return $rows;
    }

    public function updateCustomerStatus(string $customerId, string $status): bool
    {
        $allowed = ['Pending', 'Approved', 'Disapproved', 'Inactive'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare(
            'UPDATE customers SET status = :status, last_updated = NOW()
             WHERE id = :id AND shop_id = :shop_id'
        );
        return $stmt->execute([
            ':status' => $status,
            ':id' => $customerId,
            ':shop_id' => $this->shopId,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  SERVICES MANAGEMENT
    // ─────────────────────────────────────────────────────────

    public function getServices(): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, service_name, unit, price_per_unit, category, status
             FROM services
             WHERE shop_id = :shop_id
             ORDER BY service_name ASC'
        );
        $stmt->execute([':shop_id' => $this->shopId]);
        return $stmt->fetchAll();
    }

    public function createService(string $name, string $unit, float $pricePerUnit, string $category = ''): bool
    {
        $stmt = $this->db->prepare(
            'INSERT INTO services (shop_id, service_name, unit, price_per_unit, category)
             VALUES (:shop_id, :name, :unit, :price, :category)'
        );
        return $stmt->execute([
            ':shop_id'  => $this->shopId,
            ':name'     => $name,
            ':unit'     => $unit,
            ':price'    => $pricePerUnit,
            ':category' => $category,
        ]);
    }

    public function updateService(string $serviceId, string $name, string $unit, float $price, string $category = ''): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE services SET service_name = :name, unit = :unit, price_per_unit = :price, category = :category
             WHERE id = :id AND shop_id = :shop_id'
        );
        return $stmt->execute([
            ':name'     => $name,
            ':unit'     => $unit,
            ':price'    => $price,
            ':category' => $category,
            ':id'       => $serviceId,
            ':shop_id'  => $this->shopId,
        ]);
    }

    public function deleteService(string $serviceId): bool
    {
        $stmt = $this->db->prepare(
            'DELETE FROM services WHERE id = :id AND shop_id = :shop_id'
        );
        return $stmt->execute([
            ':id'      => $serviceId,
            ':shop_id' => $this->shopId,
        ]);
    }

    public function updateServiceStatus(string $serviceId, string $status): bool
    {
        $allowed = ['active', 'inactive'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare(
            'UPDATE services SET status = :status
             WHERE id = :id AND shop_id = :shop_id'
        );
        return $stmt->execute([
            ':status'  => $status,
            ':id'      => $serviceId,
            ':shop_id' => $this->shopId,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  SHOP SETTINGS
    // ─────────────────────────────────────────────────────────

    public function getProfile(string $ownerId): ?array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT id, first_name, last_name, email, profile_photo FROM owners WHERE id = :id'
            );
            $stmt->execute([':id' => $ownerId]);
        } catch (\PDOException $e) {
            if ($e->getCode() !== '42703') {
                throw $e;
            }

            $stmt = $this->db->prepare(
                'SELECT id, first_name, last_name, email, NULL AS profile_photo FROM owners WHERE id = :id'
            );
            $stmt->execute([':id' => $ownerId]);
        }

        $row = $stmt->fetch();
        if ($row && $row['profile_photo']) {
            $row['photo_url'] = '/api/avatar.php?file=' . urlencode($row['profile_photo']);
        } else {
            $row['photo_url'] = null;
        }
        return $row ?: null;
    }

    public function updateEmail(string $ownerId, string $newEmail, string $currentPassword): array
    {
        $stmt = $this->db->prepare("SELECT password_hash FROM owners WHERE id = :id");
        $stmt->execute([':id' => $ownerId]);
        $hash = $stmt->fetchColumn();
        if (!$hash || !password_verify($currentPassword, $hash))
            return ['success' => false, 'message' => 'Incorrect password.'];
        $stmt = $this->db->prepare("SELECT id FROM owners WHERE email = :email AND id != :id");
        $stmt->execute([':email' => strtolower(trim($newEmail)), ':id' => $ownerId]);
        if ($stmt->fetch()) return ['success' => false, 'message' => 'Email already in use.'];
        $stmt = $this->db->prepare("UPDATE owners SET email = :email WHERE id = :id");
        $ok = $stmt->execute([':email' => strtolower(trim($newEmail)), ':id' => $ownerId]);
        return ['success' => $ok, 'message' => $ok ? 'Email updated.' : 'Failed to update email.'];
    }

    public function updatePassword(string $ownerId, string $current, string $new): bool
    {
        $stmt = $this->db->prepare("SELECT password_hash FROM owners WHERE id = :id");
        $stmt->execute([':id' => $ownerId]);
        $hash = $stmt->fetchColumn();
        if (!$hash || !password_verify($current, $hash)) return false;
        $stmt = $this->db->prepare("UPDATE owners SET password_hash = :h WHERE id = :id");
        return $stmt->execute([':h' => password_hash($new, PASSWORD_BCRYPT), ':id' => $ownerId]);
    }

    public function getShop(): ?array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT id, shop_name, address, contact_number, gcash_number, gcash_name, status, delivery_available, delivery_fee
                 FROM laundry_shops WHERE id = :shop_id LIMIT 1'
            );
            $stmt->execute([':shop_id' => $this->shopId]);
            return $stmt->fetch() ?: null;
        } catch (\Exception $e) {
            $stmt = $this->db->prepare(
                'SELECT id, shop_name, address, contact_number, gcash_number, gcash_name, status
                 FROM laundry_shops WHERE id = :shop_id LIMIT 1'
            );
            $stmt->execute([':shop_id' => $this->shopId]);
            $row = $stmt->fetch();
            if ($row) {
                $row['delivery_available'] = 1;
                $row['delivery_fee'] = 0.0;
            }
            return $row ?: null;
        }
    }

    public function updateShopSettings(
        string $name,
        string $address,
        string $contactNumber,
        string $gcashNumber,
        string $gcashName,
        bool $deliveryAvailable = true,
        float $deliveryFee = 0.0
    ): bool {
        try {
            $stmt = $this->db->prepare(
                'UPDATE laundry_shops
                 SET shop_name = :name, address = :address, contact_number = :contact_number,
                     gcash_number = :gcash_number, gcash_name = :gcash_name,
                     delivery_available = :da, delivery_fee = :df
                 WHERE id = :shop_id'
            );
            return $stmt->execute([
                ':name'            => $name,
                ':address'         => $address,
                ':contact_number'  => $contactNumber,
                ':gcash_number'    => $gcashNumber,
                ':gcash_name'      => $gcashName,
                ':da'              => $deliveryAvailable ? 1 : 0,
                ':df'              => $deliveryFee,
                ':shop_id'         => $this->shopId,
            ]);
        } catch (\Exception $e) {
            // Fallback for missing columns
            $stmt = $this->db->prepare(
                'UPDATE laundry_shops
                 SET shop_name = :name, address = :address, contact_number = :contact_number,
                     gcash_number = :gcash_number, gcash_name = :gcash_name
                 WHERE id = :shop_id'
            );
            return $stmt->execute([
                ':name'            => $name,
                ':address'         => $address,
                ':contact_number'  => $contactNumber,
                ':gcash_number'    => $gcashNumber,
                ':gcash_name'      => $gcashName,
                ':shop_id'         => $this->shopId,
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  INCOME REPORTS (Monthly & Yearly)
    // ─────────────────────────────────────────────────────────

    /** Monthly income grouped by year+month for this shop */
    public function getMonthlyIncome(): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                 EXTRACT(YEAR  FROM o.created_on)::INT AS year,
                 EXTRACT(MONTH FROM o.created_on)::INT AS month,
                 SUM(p.amount_paid) AS total
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             WHERE o.shop_id = :shop_id
             GROUP BY year, month
             ORDER BY year DESC, month DESC'
        );
        $stmt->execute([':shop_id' => $this->shopId]);
        return $stmt->fetchAll();
    }

    /** Today's income for this shop */
    public function getDailyIncome(): float
    {
        $stmt = $this->db->prepare(
            'SELECT COALESCE(SUM(p.amount_paid), 0)
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             WHERE o.shop_id = :shop_id
               AND DATE(o.created_on) = CURRENT_DATE'
        );
        $stmt->execute([':shop_id' => $this->shopId]);
        return (float) $stmt->fetchColumn();
    }

    /** Daily income for a specific year+month */
    public function getDailyIncomeByMonth(int $year, int $month): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                 EXTRACT(DAY FROM o.created_on)::INT AS day,
                 SUM(p.amount_paid) AS total
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             WHERE o.shop_id = :shop_id
               AND EXTRACT(YEAR  FROM o.created_on)::INT = :year
               AND EXTRACT(MONTH FROM o.created_on)::INT = :month
             GROUP BY day
             ORDER BY day ASC'
        );
        $stmt->execute([':shop_id' => $this->shopId, ':year' => $year, ':month' => $month]);
        return $stmt->fetchAll();
    }

    /** Yearly income totals for this shop */
    public function getYearlyIncome(): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                 EXTRACT(YEAR FROM o.created_on)::INT AS year,
                 SUM(p.amount_paid) AS total
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             WHERE o.shop_id = :shop_id
             GROUP BY year
             ORDER BY year DESC'
        );
        $stmt->execute([':shop_id' => $this->shopId]);
        return $stmt->fetchAll();
    }
}
