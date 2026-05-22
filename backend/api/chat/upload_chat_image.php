<?php
declare(strict_types=1);
ini_set('display_errors', '0');
error_reporting(0);
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/Cors.php';
Cors::handle(['POST', 'OPTIONS']);

require_once __DIR__ . '/../../config/Session.php';
start_session();

require_once __DIR__ . '/../../config/Env.php';
require_once __DIR__ . '/../../config/Database.php';

if (empty($_SESSION['logged_in'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$role   = $_SESSION['role']   ?? '';
$userId = $_SESSION['user_id'] ?? '';

if (!$userId || !$role) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No image uploaded or upload error']);
    exit;
}

$file = $_FILES['image'];

// Max size: 5MB
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'message' => 'File too large. Maximum size is 5MB.']);
    exit;
}

$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$finfo   = new finfo(FILEINFO_MIME_TYPE);
$mime    = $finfo->file($file['tmp_name']);

if (!in_array($mime, $allowed, true)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, WEBP, GIF allowed.']);
    exit;
}

// ── Cloudinary credentials ──
Env::load();
$cloudName = Env::get('CLOUDINARY_CLOUD_NAME');
$apiKey    = Env::get('CLOUDINARY_API_KEY');
$apiSecret = Env::get('CLOUDINARY_API_SECRET');

// ── Build signed upload params ──
$timestamp  = time();
$publicId   = 'chats/chat_' . uniqid() . '_' . bin2hex(random_bytes(4));
$paramsToSign = [
    'public_id'   => $publicId,
    'timestamp'   => $timestamp,
];
ksort($paramsToSign);
$signStr = '';
foreach ($paramsToSign as $k => $v) {
    $signStr .= $k . '=' . $v . '&';
}
$signStr  = rtrim($signStr, '&') . $apiSecret;
$signature = sha1($signStr);

// ── POST to Cloudinary ──
$postFields = [
    'file'           => new CURLFile($file['tmp_name'], $mime, 'image'),
    'api_key'        => $apiKey,
    'timestamp'      => $timestamp,
    'public_id'      => $publicId,
    'signature'      => $signature,
];

$ch = curl_init("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);

if ($httpCode !== 200 || empty($result['secure_url'])) {
    error_log('[upload_chat_image] Cloudinary error: ' . $response);
    echo json_encode(['success' => false, 'message' => 'Cloudinary upload failed.']);
    exit;
}

$imageUrl = $result['secure_url'];

echo json_encode([
    'success'   => true,
    'image_url' => $imageUrl,
]);
