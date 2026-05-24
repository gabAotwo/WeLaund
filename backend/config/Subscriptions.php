<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

class Subscriptions
{
    public const DEFAULT_MONTHLY_FEE = 999.00;

    public static function ensureSchema(): void
    {
        $db = Database::getConnection();

        $db->exec("ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'active'");
        $db->exec("ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_due_date DATE");
        $db->exec("ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_monthly_fee NUMERIC(10,2) NOT NULL DEFAULT " . self::DEFAULT_MONTHLY_FEE);
        $db->exec("ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_last_paid_at TIMESTAMP NULL");
        $db->exec("ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_note TEXT");
        $db->exec("UPDATE laundry_shops SET subscription_due_date = CURRENT_DATE + INTERVAL '30 days' WHERE subscription_due_date IS NULL");

        $db->exec("
            CREATE TABLE IF NOT EXISTS owner_subscription_payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES laundry_shops(id) ON DELETE CASCADE,
                owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
                amount NUMERIC(10,2) NOT NULL,
                billing_month DATE NOT NULL,
                payment_method VARCHAR(50) NOT NULL DEFAULT 'Manual',
                reference_number VARCHAR(120) NOT NULL,
                proof_url TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
                submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
                reviewed_at TIMESTAMP NULL,
                reviewed_by UUID NULL REFERENCES super_admins(id),
                admin_note TEXT
            )
        ");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES laundry_shops(id) ON DELETE CASCADE");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id) ON DELETE CASCADE");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) NOT NULL DEFAULT 0");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS billing_month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NOT NULL DEFAULT 'Manual'");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS reference_number VARCHAR(120) NOT NULL DEFAULT ''");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS proof_url TEXT");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Pending'");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP NOT NULL DEFAULT NOW()");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS reviewed_by UUID NULL REFERENCES super_admins(id)");
        $db->exec("ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS admin_note TEXT");
        $db->exec("CREATE INDEX IF NOT EXISTS idx_owner_subscription_payments_status ON owner_subscription_payments(status)");
        $db->exec("CREATE INDEX IF NOT EXISTS idx_owner_subscription_payments_shop_month ON owner_subscription_payments(shop_id, billing_month)");
    }

    public static function enforceOverdue(): int
    {
        self::ensureSchema();
        $db = Database::getConnection();
        $stmt = $db->prepare("
            UPDATE laundry_shops s
            SET status = 'inactive',
                subscription_status = 'overdue',
                subscription_note = 'Automatically deactivated for overdue subscription.'
            WHERE s.subscription_due_date < CURRENT_DATE
              AND s.subscription_status != 'overdue'
              AND NOT EXISTS (
                  SELECT 1 FROM owner_subscription_payments p
                  WHERE p.shop_id = s.id AND p.status = 'Pending'
              )
        ");
        $stmt->execute();

        $db->exec("
            UPDATE owners o
            SET status = 'inactive'
            WHERE EXISTS (
                SELECT 1 FROM laundry_shops s
                WHERE s.owner_id = o.id
                  AND s.subscription_status = 'overdue'
                  AND s.status = 'inactive'
            )
        ");

        return $stmt->rowCount();
    }

    public static function getOwnerSubscription(string $shopId): array
    {
        self::enforceOverdue();
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT s.id AS shop_id, s.shop_name, s.status AS shop_status, s.subscription_status,
                   s.subscription_due_date, s.subscription_monthly_fee, s.subscription_last_paid_at, s.subscription_note,
                   o.id AS owner_id, o.first_name, o.last_name, o.email
            FROM laundry_shops s
            JOIN owners o ON o.id = s.owner_id
            WHERE s.id = :shop_id
            LIMIT 1
        ");
        $stmt->execute([':shop_id' => $shopId]);
        $subscription = $stmt->fetch() ?: [];

        $stmt = $db->prepare("
            SELECT id, amount, billing_month, payment_method, reference_number, proof_url, status, submitted_at, reviewed_at, admin_note
            FROM owner_subscription_payments
            WHERE shop_id = :shop_id
            ORDER BY submitted_at DESC
            LIMIT 12
        ");
        $stmt->execute([':shop_id' => $shopId]);

        return [
            'subscription' => $subscription,
            'payments' => $stmt->fetchAll(),
        ];
    }

    public static function submitOwnerPayment(string $shopId, string $ownerId, string $method, string $reference, string $proofUrl = ''): bool
    {
        self::ensureSchema();
        $db = Database::getConnection();
        $amountStmt = $db->prepare("SELECT subscription_monthly_fee FROM laundry_shops WHERE id = :shop_id LIMIT 1");
        $amountStmt->execute([':shop_id' => $shopId]);
        $amount = (float)$amountStmt->fetchColumn();
        if ($amount <= 0) {
            $amount = self::DEFAULT_MONTHLY_FEE;
        }

        $stmt = $db->prepare("
            INSERT INTO owner_subscription_payments (shop_id, owner_id, amount, billing_month, payment_method, reference_number, proof_url)
            VALUES (:shop_id, :owner_id, :amount, DATE_TRUNC('month', CURRENT_DATE)::DATE, :method, :reference, :proof_url)
        ");
        $ok = $stmt->execute([
            ':shop_id' => $shopId,
            ':owner_id' => $ownerId,
            ':amount' => $amount,
            ':method' => $method,
            ':reference' => $reference,
            ':proof_url' => $proofUrl,
        ]);

        if ($ok) {
            $db->prepare("UPDATE laundry_shops SET subscription_status = 'pending_review', subscription_note = 'Subscription payment submitted for review.' WHERE id = :shop_id")
                ->execute([':shop_id' => $shopId]);
        }

        return $ok;
    }

    public static function updateShopBilling(string $shopId, float $monthlyFee, ?string $dueDate, string $subscriptionStatus, string $note = ''): bool
    {
        self::ensureSchema();
        if ($monthlyFee <= 0) return false;
        if (!in_array($subscriptionStatus, ['active', 'pending_review', 'overdue'], true)) return false;
        if ($dueDate !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dueDate)) return false;

        $db = Database::getConnection();
        $stmt = $db->prepare("
            UPDATE laundry_shops
            SET subscription_monthly_fee = :monthly_fee,
                subscription_due_date = COALESCE(CAST(:due_date AS DATE), subscription_due_date),
                subscription_status = :subscription_status,
                status = CASE WHEN :subscription_status = 'overdue' THEN 'inactive' ELSE 'active' END,
                subscription_note = NULLIF(:note, '')
            WHERE id = :shop_id
        ");
        $ok = $stmt->execute([
            ':monthly_fee' => $monthlyFee,
            ':due_date' => $dueDate,
            ':subscription_status' => $subscriptionStatus,
            ':note' => $note,
            ':shop_id' => $shopId,
        ]);

        if ($ok) {
            $ownerStmt = $db->prepare("
                UPDATE owners o
                SET status = CASE WHEN :subscription_status = 'overdue' THEN 'inactive' ELSE 'active' END
                WHERE EXISTS (SELECT 1 FROM laundry_shops s WHERE s.id = :shop_id AND s.owner_id = o.id)
            ");
            $ownerStmt->execute([':subscription_status' => $subscriptionStatus, ':shop_id' => $shopId]);
        }

        return $ok;
    }

    public static function reviewPayment(string $paymentId, string $status, string $reviewedBy, string $note = ''): bool
    {
        self::ensureSchema();
        if (!in_array($status, ['Approved', 'Rejected'], true)) return false;

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                SELECT p.*, s.subscription_due_date
                FROM owner_subscription_payments p
                JOIN laundry_shops s ON s.id = p.shop_id
                WHERE p.id = :id
                FOR UPDATE
            ");
            $stmt->execute([':id' => $paymentId]);
            $payment = $stmt->fetch();
            if (!$payment) {
                $db->rollBack();
                return false;
            }

            $db->prepare("
                UPDATE owner_subscription_payments
                SET status = :status, reviewed_at = NOW(), reviewed_by = :reviewed_by, admin_note = :note
                WHERE id = :id
            ")->execute([
                ':status' => $status,
                ':reviewed_by' => $reviewedBy,
                ':note' => $note,
                ':id' => $paymentId,
            ]);

            if ($status === 'Approved') {
                $db->prepare("
                    UPDATE laundry_shops
                    SET status = 'active',
                        subscription_status = 'active',
                        subscription_due_date = (GREATEST(COALESCE(subscription_due_date, CURRENT_DATE), CURRENT_DATE) + INTERVAL '1 month')::DATE,
                        subscription_last_paid_at = NOW(),
                        subscription_note = NULL
                    WHERE id = :shop_id
                ")->execute([':shop_id' => $payment['shop_id']]);

                $db->prepare("UPDATE owners SET status = 'active' WHERE id = :owner_id")
                    ->execute([':owner_id' => $payment['owner_id']]);
            } else {
                $db->prepare("
                    UPDATE laundry_shops
                    SET subscription_status = CASE WHEN subscription_due_date < CURRENT_DATE THEN 'overdue' ELSE 'active' END,
                        status = CASE WHEN subscription_due_date < CURRENT_DATE THEN 'inactive' ELSE status END,
                        subscription_note = :note
                    WHERE id = :shop_id
                ")->execute([':note' => $note ?: 'Subscription payment rejected.', ':shop_id' => $payment['shop_id']]);
            }

            $db->commit();
            self::enforceOverdue();
            return true;
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public static function getSuperAdminBilling(): array
    {
        self::enforceOverdue();
        $db = Database::getConnection();

        $summary = [
            'approved_total' => (float)$db->query("SELECT COALESCE(SUM(amount),0) FROM owner_subscription_payments WHERE status='Approved'")->fetchColumn(),
            'pending_total' => (float)$db->query("SELECT COALESCE(SUM(amount),0) FROM owner_subscription_payments WHERE status='Pending'")->fetchColumn(),
            'pending_count' => (int)$db->query("SELECT COUNT(*) FROM owner_subscription_payments WHERE status='Pending'")->fetchColumn(),
            'overdue_shops' => (int)$db->query("SELECT COUNT(*) FROM laundry_shops WHERE subscription_status='overdue'")->fetchColumn(),
        ];

        $monthly = $db->query("
            SELECT EXTRACT(YEAR FROM reviewed_at)::INT AS year,
                   EXTRACT(MONTH FROM reviewed_at)::INT AS month,
                   SUM(amount) AS total
            FROM owner_subscription_payments
            WHERE status = 'Approved' AND reviewed_at IS NOT NULL
            GROUP BY year, month
            ORDER BY year DESC, month DESC
            LIMIT 12
        ")->fetchAll();

        $payments = $db->query("
            SELECT p.id, p.amount, p.billing_month, p.payment_method, p.reference_number, p.proof_url,
                   p.status, p.submitted_at, p.reviewed_at, p.admin_note,
                   s.shop_name, s.subscription_due_date, s.subscription_status,
                   o.first_name, o.last_name, o.email
            FROM owner_subscription_payments p
            JOIN laundry_shops s ON s.id = p.shop_id
            JOIN owners o ON o.id = p.owner_id
            ORDER BY CASE p.status WHEN 'Pending' THEN 1 WHEN 'Rejected' THEN 2 ELSE 3 END, p.submitted_at DESC
            LIMIT 100
        ")->fetchAll();

        $shops = $db->query("
            SELECT s.id AS shop_id, s.shop_name, s.status AS shop_status, s.subscription_status,
                   s.subscription_due_date, s.subscription_monthly_fee, s.subscription_last_paid_at, s.subscription_note,
                   o.first_name, o.last_name, o.email, o.status AS owner_status
            FROM laundry_shops s
            JOIN owners o ON o.id = s.owner_id
            ORDER BY CASE s.subscription_status WHEN 'overdue' THEN 1 WHEN 'pending_review' THEN 2 ELSE 3 END,
                     s.subscription_due_date ASC NULLS LAST,
                     s.shop_name ASC
        ")->fetchAll();

        return ['summary' => $summary, 'monthly' => $monthly, 'payments' => $payments, 'shops' => $shops];
    }
}
