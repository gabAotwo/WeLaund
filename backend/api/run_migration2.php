<?php
// CLI-only: php run_migration2.php
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Forbidden');
}
// Run once — adds profile_photo to owners table, then delete this file
require_once __DIR__ . '/../config/Database.php';
$db = Database::getConnection();
$db->exec("ALTER TABLE owners ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(255) DEFAULT NULL");
echo json_encode(['success' => true, 'message' => 'profile_photo added to owners']);
