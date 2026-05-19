<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class CustomerController
{
    private PDO $db;
    private string $customerId;

    public function __construct(string $customerId)
    {
        $this->db         = Database::getConnection();
        $this->customerId = $customerId;
    }

    /** Get all orders for this specific customer */
    public function getOrders(): array
    {
        $stmt = $this->db->prepare(
            "SELECT o.id, o.order_ref, o.order_status, o.total_amount, o.created_on, o.last_updated, o.payment_status,
                    s.shop_name, s.address as shop_address, s.contact_number as shop_contact
             FROM orders o
             JOIN laundry_shops s ON s.id = o.shop_id
             WHERE o.customer_id = :cid
             ORDER BY o.created_on DESC"
        );
        $stmt->execute([':cid' => $this->customerId]);
        return $stmt->fetchAll();
    }

    /** Get customer profile info */
    public function getProfile(): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, first_name, middle_name, last_name, email, contact_number, address, status, profile_photo 
             FROM customers WHERE id = :cid"
        );
        $stmt->execute([':cid' => $this->customerId]);
        $row = $stmt->fetch();
        if ($row && $row['profile_photo']) {
            $row['photo_url'] = '/api/avatar.php?file=' . urlencode($row['profile_photo']);
        } else {
            $row['photo_url'] = null;
        }
        return $row ?: null;
    }

    /** Get the shop this customer belongs to */
    public function getShop(): ?array
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT s.shop_name, s.address, s.contact_number, s.gcash_name, s.gcash_number,
                        s.delivery_available, s.delivery_fee
                 FROM laundry_shops s
                 JOIN customers c ON c.shop_id = s.id
                 WHERE c.id = :cid LIMIT 1"
            );
            $stmt->execute([':cid' => $this->customerId]);
            return $stmt->fetch() ?: null;
        } catch (\PDOException $e) {
            if ($e->getCode() !== '42703') {
                throw $e;
            }

            $stmt = $this->db->prepare(
                "SELECT s.shop_name, s.address, s.contact_number, s.gcash_name, s.gcash_number
                 FROM laundry_shops s
                 JOIN customers c ON c.shop_id = s.id
                 WHERE c.id = :cid LIMIT 1"
            );
            $stmt->execute([':cid' => $this->customerId]);
            $row = $stmt->fetch();
            if ($row) {
                $row['delivery_available'] = true;
                $row['delivery_fee'] = 0.0;
            }
            return $row ?: null;
        }
    }

    /** Get services for the customer's shop */
    public function getShopServices(string $shopId): array
    {
        $stmt = $this->db->prepare(
            "SELECT id, service_name, unit, price_per_unit, category
             FROM services WHERE shop_id = :sid AND status = 'active'
             ORDER BY category, service_name"
        );
        $stmt->execute([':sid' => $shopId]);
        return $stmt->fetchAll();
    }

    public function updateProfile(array $data): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE customers SET 
                first_name = :fn, middle_name = :mn, last_name = :ln, 
                contact_number = :cn, address = :addr, last_updated = NOW()
             WHERE id = :cid"
        );
        return $stmt->execute([
            ':fn'   => $data['first_name'],
            ':mn'   => $data['middle_name'] ?? '',
            ':ln'   => $data['last_name'],
            ':cn'   => $data['contact_number'] ?? '',
            ':addr' => $data['address'] ?? '',
            ':cid'  => $this->customerId
        ]);
    }

    public function updateEmail(string $newEmail, string $currentPassword): array
    {
        // Verify password first
        $stmt = $this->db->prepare("SELECT password_hash FROM customers WHERE id = :id");
        $stmt->execute([':id' => $this->customerId]);
        $hash = $stmt->fetchColumn();
        if (!$hash || !password_verify($currentPassword, $hash))
            return ['success' => false, 'message' => 'Incorrect password.'];

        // Check email not already taken
        $stmt = $this->db->prepare("SELECT id FROM customers WHERE email = :email AND id != :id");
        $stmt->execute([':email' => strtolower(trim($newEmail)), ':id' => $this->customerId]);
        if ($stmt->fetch())
            return ['success' => false, 'message' => 'Email is already in use.'];

        $stmt = $this->db->prepare("UPDATE customers SET email = :email, last_updated = NOW() WHERE id = :id");
        $ok = $stmt->execute([':email' => strtolower(trim($newEmail)), ':id' => $this->customerId]);
        return ['success' => $ok, 'message' => $ok ? 'Email updated.' : 'Failed to update email.'];
    }

    public function updatePassword(string $current, string $new): bool
    {
        $stmt = $this->db->prepare("SELECT password_hash FROM customers WHERE id = :id");
        $stmt->execute([':id' => $this->customerId]);
        $hash = $stmt->fetchColumn();

        if ($hash && !password_verify($current, $hash)) return false;

        $newHash = password_hash($new, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare("UPDATE customers SET password_hash = :hash, last_updated = NOW() WHERE id = :id");
        return $stmt->execute([':hash' => $newHash, ':id' => $this->customerId]);
    }

    public function createRequest(
        string $shopId,
        string $type,
        string $paymentMethod = 'GCash',
        string $notes = '',
        string $refNum = '',
        string $deliveryAddress = '',
        float $deliveryFee = 0.0,
        float $totalAmount = 0.0
    ): string
    {
        $orderRef = 'REQ-' . strtoupper(substr(uniqid('', true), -6));

        try {
            $stmt = $this->db->prepare(
                "INSERT INTO orders (
                    order_ref, customer_id, shop_id, pickup_delivery_type, order_status,
                    payment_method, notes, delivery_address, delivery_fee, total_amount_estimated
                 )
                 VALUES (
                    :ref, :cid, :sid, :type, 'Requested',
                    :payment_method, :notes, :delivery_address, :delivery_fee, :total
                 ) RETURNING id"
            );
            $stmt->execute([
                ':ref'              => $orderRef,
                ':cid'              => $this->customerId,
                ':sid'              => $shopId,
                ':type'             => $type,
                ':payment_method'   => $paymentMethod,
                ':notes'            => $notes,
                ':delivery_address' => $deliveryAddress,
                ':delivery_fee'     => $deliveryFee,
                ':total'            => $totalAmount,
            ]);
        } catch (\PDOException $e) {
            if ($e->getCode() !== '42703') {
                throw $e;
            }

            $stmt = $this->db->prepare(
                "INSERT INTO orders (order_ref, customer_id, shop_id, pickup_delivery_type, order_status)
                 VALUES (:ref, :cid, :sid, :type, 'Requested') RETURNING id"
            );
            $stmt->execute([
                ':ref'  => $orderRef,
                ':cid'  => $this->customerId,
                ':sid'  => $shopId,
                ':type' => $type,
            ]);
        }
        $orderId = $stmt->fetchColumn();

        if ($paymentMethod === 'GCash' && !empty($refNum)) {
            $stmt = $this->db->prepare(
                "INSERT INTO payments (order_id, amount_paid, payment_method, transaction_reference, status)
                 VALUES (:oid, 0, 'GCash', :rnum, 'Pending')"
            );
            $stmt->execute([':oid' => $orderId, ':rnum' => $refNum]);
        }

        return $orderRef;
    }
}
