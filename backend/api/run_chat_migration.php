<?php
// CLI-only migration runner
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Forbidden');
}

require_once __DIR__ . '/../config/Database.php';

try {
    $db = Database::getConnection();
    echo "Running chat schema migration...\n";
    
    $sql = file_get_contents(__DIR__ . '/../database/chat_schema.sql');
    if ($sql === false) {
        throw new Exception("Could not read chat_schema.sql");
    }
    
    $db->exec($sql);
    echo "Chat schema migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
