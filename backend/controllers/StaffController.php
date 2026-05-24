<?php
// ============================================================
//  backend/controllers/StaffController.php
//  UPDATED to align with detailed schema
// ============================================================
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class StaffController
{
    private PDO $db;
    private string $shopId;
    private string $staffId;

    public function __construct(string $shopId, string $staffId)
    {
        $this->db      = Database::getConnection();
        $this->shopId  = $shopId;
        $this->staffId = $staffId;
    }

    public function getPendingCustomers(): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email, contact_number, status, last_updated, profile_photo
             FROM customers
             WHERE shop_id = :shop_id AND status = \'Pending\'
             ORDER BY last_updated DESC'
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

    public function updateCustomerStatus(string $customerId, string $newStatus): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE customers SET status = :status, last_updated = NOW() 
             WHERE id = :id AND shop_id = :shop_id'
        );
        return $stmt->execute([
            ':status'  => $newStatus,
            ':id'      => $customerId,
            ':shop_id' => $this->shopId,
        ]);
    }

    public function getActiveOrders(): array
    {
        $sql = "SELECT o.id, o.order_ref, o.order_status, o.payment_status, o.total_amount, o.created_on,
                       c.first_name, c.last_name, c.contact_number
                FROM orders o
                JOIN customers c ON c.id = o.customer_id
                WHERE o.shop_id = :shop_id 
                  AND (LOWER(o.order_status) = 'ongoing' OR LOWER(o.order_status) = 'requested')
                ORDER BY o.created_on DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':shop_id' => trim($this->shopId)]);
        return $stmt->fetchAll();
    }

    public function getAllTodayOrders(): array
    {
        $stmt = $this->db->prepare(
            "SELECT o.id, o.order_ref, o.order_status, o.payment_status, o.total_amount, o.created_on,
                    c.first_name, c.last_name, c.contact_number
             FROM orders o
             JOIN customers c ON c.id = o.customer_id
             WHERE o.shop_id = :shop_id
               AND (o.order_status IN ('Requested', 'Ongoing')
                    OR (o.order_status = 'Done' AND DATE(o.last_updated) = CURRENT_DATE))
             ORDER BY o.order_status ASC, o.created_on DESC"
        );
        $stmt->execute([':shop_id' => $this->shopId]);
        return $stmt->fetchAll();
    }

    public function getOrder(string $orderId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT o.*, c.first_name, c.last_name, c.contact_number, c.address,
                    p.transaction_reference as customer_reference, p.payment_method as customer_payment_method
             FROM orders o
             JOIN customers c ON c.id = o.customer_id
             LEFT JOIN payments p ON p.order_id = o.id
             WHERE o.id = :id AND o.shop_id = :shop_id
             ORDER BY p.payment_date DESC LIMIT 1"
        );
        $stmt->execute([':id' => $orderId, ':shop_id' => $this->shopId]);
        $order = $stmt->fetch();
        if (!$order) return null;

        $stmt = $this->db->prepare(
            "SELECT oi.id, oi.quantity_or_weight, oi.subtotal, s.service_name, s.unit
             FROM order_items oi
             JOIN services s ON s.id = oi.service_id
             WHERE oi.order_id = :oid"
        );
        $stmt->execute([':oid' => $orderId]);
        $order['items'] = $stmt->fetchAll();
        return $order;
    }

    public function createOrder(string $customerId, array $items, string $type = 'Pickup'): string
    {
        $this->db->beginTransaction();
        try {
            $totalWeight = 0;
            $totalAmount = 0;
            foreach ($items as $item) {
                $totalWeight += (float)$item['weight'];
                $totalAmount += (float)$item['subtotal'];
            }

            $orderRef = 'WL-' . strtoupper(substr(uniqid('', true), -6));

            $stmt = $this->db->prepare(
                "INSERT INTO orders (order_ref, customer_id, shop_id, staff_id, total_weight, total_amount, pickup_delivery_type)
                 VALUES (:ref, :cid, :sid, :staff, :weight, :amount, :type) RETURNING id"
            );
            $stmt->execute([
                ':ref'    => $orderRef,
                ':cid'    => $customerId,
                ':sid'    => $this->shopId,
                ':staff'  => $this->staffId,
                ':weight' => $totalWeight,
                ':amount' => $totalAmount,
                ':type'   => $type
            ]);
            $orderId = $stmt->fetchColumn();

            foreach ($items as $item) {
                $istmt = $this->db->prepare(
                    "INSERT INTO order_items (order_id, service_id, quantity_or_weight, subtotal)
                     VALUES (:oid, :sid, :qty, :sub)"
                );
                $istmt->execute([
                    ':oid' => $orderId,
                    ':sid' => $item['service_id'],
                    ':qty' => $item['weight'],
                    ':sub' => $item['subtotal']
                ]);
            }

            $this->db->commit();
            return $orderRef;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function updateOrderStatus(string $orderId, string $status): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE orders SET order_status = :status, last_updated = NOW() 
             WHERE id = :id AND shop_id = :shop_id"
        );
        return $stmt->execute([':status' => $status, ':id' => $orderId, ':shop_id' => $this->shopId]);
    }

    public function deleteOrder(string $orderId): bool
    {
        // First delete items to avoid FK issues if cascade is not set
        $stmt = $this->db->prepare("DELETE FROM order_items WHERE order_id = :oid");
        $stmt->execute([':oid' => $orderId]);
        
        $stmt = $this->db->prepare(
            "DELETE FROM orders WHERE id = :id AND shop_id = :shop_id"
        );
        return $stmt->execute([':id' => $orderId, ':shop_id' => $this->shopId]);
    }

    public function getShopGcashDetails(): array
    {
        $stmt = $this->db->prepare("SELECT gcash_number, gcash_name FROM laundry_shops WHERE id = :sid");
        $stmt->execute([':sid' => $this->shopId]);
        return $stmt->fetch() ?: ['gcash_number'=>'', 'gcash_name'=>''];
    }

    public function verifyGcashPayment(string $orderId, string $ref, float $amount): bool
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO payments (order_id, amount_paid, payment_method, transaction_reference, verified_by, status)
                 VALUES (:oid, :amt, 'GCash', :ref, :staff, 'Verified')"
            );
            $stmt->execute([
                ':oid'   => $orderId,
                ':amt'   => $amount,
                ':ref'   => $ref,
                ':staff' => $this->staffId
            ]);

            $this->db->prepare("UPDATE orders SET payment_status = 'Paid' WHERE id = :oid")
                 ->execute([':oid' => $orderId]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function getServices(): array
    {
        $stmt = $this->db->prepare("SELECT id, service_name, unit, price_per_unit FROM services WHERE shop_id = :sid");
        $stmt->execute([':sid' => $this->shopId]);
        return $stmt->fetchAll();
    }

    public function getApprovedCustomers(): array
    {
        $stmt = $this->db->prepare(
            "SELECT id, first_name, last_name, email, contact_number, status, profile_photo
             FROM customers WHERE shop_id = :sid AND status = 'Approved'"
        );
        $stmt->execute([':sid' => $this->shopId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['photo_url'] = $row['profile_photo']
                ? '/api/avatar.php?file=' . urlencode($row['profile_photo'])
                : null;
        }
        return $rows;
    }

    public function getDailyTotal(): float
    {
        $stmt = $this->db->prepare(
            "SELECT SUM(p.amount_paid) 
             FROM payments p 
             JOIN orders o ON o.id = p.order_id 
             WHERE o.shop_id = :sid AND DATE(p.payment_date) = CURRENT_DATE"
        );
        $stmt->execute([':sid' => $this->shopId]);
        return (float)$stmt->fetchColumn();
    }

    public function addOrderItem(string $orderId, string $serviceId, float $qty): bool
    {
        $this->db->beginTransaction();
        try {
            // Get service price
            $stmt = $this->db->prepare("SELECT price_per_unit FROM services WHERE id = :sid");
            $stmt->execute([':sid' => $serviceId]);
            $price = (float)$stmt->fetchColumn();
            $subtotal = $price * $qty;

            // Insert item
            $stmt = $this->db->prepare(
                "INSERT INTO order_items (order_id, service_id, quantity_or_weight, subtotal)
                 VALUES (:oid, :sid, :qty, :sub)"
            );
            $stmt->execute([':oid' => $orderId, ':sid' => $serviceId, ':qty' => $qty, ':sub' => $subtotal]);

            // Recalculate order
            $this->recalculateOrder($orderId);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function removeOrderItem(string $itemId, string $orderId): bool
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("DELETE FROM order_items WHERE id = :id AND order_id = :oid");
            $stmt->execute([':id' => $itemId, ':oid' => $orderId]);

            $this->recalculateOrder($orderId);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    private function recalculateOrder(string $orderId): void
    {
        $stmt = $this->db->prepare(
            "SELECT SUM(quantity_or_weight) as weight, SUM(subtotal) as total
             FROM order_items WHERE order_id = :oid"
        );
        $stmt->execute([':oid' => $orderId]);
        $res = $stmt->fetch();
        
        $weight = (float)($res['weight'] ?? 0);
        $total  = (float)($res['total']  ?? 0);

        $stmt = $this->db->prepare(
            "UPDATE orders SET total_weight = :w, total_amount = :a WHERE id = :id"
        );
        $stmt->execute([':w' => $weight, ':a' => $total, ':id' => $orderId]);
    }

    public function updateProfile(string $fname, string $lname): bool
    {
        $stmt = $this->db->prepare("UPDATE staff SET first_name = :fn, last_name = :ln WHERE id = :id");
        return $stmt->execute([':fn' => $fname, ':ln' => $lname, ':id' => $this->staffId]);
    }

    public function updateEmail(string $newEmail, string $currentPassword): array
    {
        $stmt = $this->db->prepare("SELECT password_hash FROM staff WHERE id = :id");
        $stmt->execute([':id' => $this->staffId]);
        $hash = $stmt->fetchColumn();
        if (!$hash || !password_verify($currentPassword, $hash))
            return ['success' => false, 'message' => 'Incorrect password.'];
        $stmt = $this->db->prepare("SELECT id FROM staff WHERE email = :email AND id != :id");
        $stmt->execute([':email' => strtolower(trim($newEmail)), ':id' => $this->staffId]);
        if ($stmt->fetch()) return ['success' => false, 'message' => 'Email already in use.'];
        $stmt = $this->db->prepare("UPDATE staff SET email = :email WHERE id = :id");
        $ok = $stmt->execute([':email' => strtolower(trim($newEmail)), ':id' => $this->staffId]);
        return ['success' => $ok, 'message' => $ok ? 'Email updated.' : 'Failed to update email.'];
    }

    public function getProfile(): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, first_name, last_name, email, profile_photo FROM staff WHERE id = :id"
        );
        $stmt->execute([':id' => $this->staffId]);
        $row = $stmt->fetch();
        if ($row && $row['profile_photo']) {
            $row['photo_url'] = '/api/avatar.php?file=' . urlencode($row['profile_photo']);
        } else {
            $row['photo_url'] = null;
        }
        return $row ?: null;
    }

    public function updatePassword(string $current, string $new): bool
    {
        $stmt = $this->db->prepare("SELECT password_hash FROM staff WHERE id = :id");
        $stmt->execute([':id' => $this->staffId]);
        $hash = $stmt->fetchColumn();

        if ($hash && !password_verify($current, $hash)) return false;

        $newHash = password_hash($new, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare("UPDATE staff SET password_hash = :hash WHERE id = :id");
        return $stmt->execute([':hash' => $newHash, ':id' => $this->staffId]);
    }
}
