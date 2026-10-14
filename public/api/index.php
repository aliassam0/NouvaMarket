<?php
/**
 * Nouva Market - Hostinger Backend API Bridge
 * Enables full server-side persistence for Sellers, Suppliers, Registrations and Approvals
 * when deployed on Hostinger Shared/Cloud/cPanel Apache hosting.
 */

// Enable error reporting to logs but prevent HTML leaks into JSON responses
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'ok']);
    exit;
}

// Data Storage Directory setup
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
    // Protect data folder from direct browser HTTP file downloads
    @file_put_contents($dataDir . '/.htaccess', "Order Deny,Allow\nDeny from all\n");
}

$sellersFile = $dataDir . '/server_sellers.json';
$suppliersFile = $dataDir . '/server_suppliers.json';
$productsFile = $dataDir . '/server_products.json';
$ordersFile = $dataDir . '/server_orders.json';
$withdrawalsFile = $dataDir . '/server_withdrawals.json';
$settlementsFile = $dataDir . '/server_settlements.json';

$deletedSellersFile = $dataDir . '/deleted_sellers.json';
$deletedSuppliersFile = $dataDir . '/deleted_suppliers.json';
$deletedProductsFile = $dataDir . '/deleted_products.json';
$deletedOrdersFile = $dataDir . '/deleted_orders.json';
$deletedWithdrawalsFile = $dataDir . '/deleted_withdrawals.json';
$deletedSettlementsFile = $dataDir . '/deleted_settlements.json';

function readJsonFile($filePath, $fallback = []) {
    if (!file_exists($filePath)) {
        return $fallback;
    }
    $raw = @file_get_contents($filePath);
    if ($raw === false || trim($raw) === '') {
        return $fallback;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function writeJsonFile($filePath, $data) {
    @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Initial seed accounts (only used if file is empty AND not previously deleted)
$initialSeedSellers = [
    [
        'id' => 'seller-ali-assam',
        'fullName' => 'Ali Assam',
        'storeName' => 'متجر عصام للتجارة والتسويق',
        'phone' => '0550123456',
        'email' => 'alipinterest004@gmail.com',
        'password' => '123456',
        'wilaya' => '16 - الجزائر',
        'role' => 'reseller',
        'rank' => 'BRONZE',
        'rankAr' => 'المستوى البرونزي',
        'rankFr' => 'Niveau Bronze',
        'kycStatus' => 'PENDING',
        'approvalStatus' => 'PENDING',
        'totalOrdersCount' => 0,
        'deliveredOrdersCount' => 0,
        'totalEarnedDzd' => 0,
        'joinDate' => '2026-03-22',
    ],
    [
        'id' => 'seller-101',
        'fullName' => 'محمد رضوان الجزائري',
        'storeName' => 'متجر الأناقة للموضة',
        'phone' => '0661234567',
        'email' => 'redouane.dz@example.com',
        'password' => '123456',
        'wilaya' => '16 - الجزائر',
        'role' => 'reseller',
        'rank' => 'GOLD',
        'rankAr' => 'المستوى الذهبي',
        'rankFr' => 'Niveau Or',
        'kycStatus' => 'APPROVED',
        'approvalStatus' => 'APPROVED',
        'totalOrdersCount' => 28,
        'deliveredOrdersCount' => 24,
        'totalEarnedDzd' => 38400,
        'joinDate' => '2025-11-10',
    ]
];

$initialSeedSuppliers = [
    [
        'id' => 'sup-ali-store',
        'fullName' => 'Ali Assam',
        'companyName' => 'Ali store',
        'activityType' => 'ألبسة ونسيج',
        'phone' => '0550123456',
        'email' => 'alipinterest004@gmail.com',
        'password' => '123456',
        'wilaya' => '16 - الجزائر',
        'status' => 'PENDING',
        'totalProductsCount' => 0,
        'rating' => 5.0,
        'joinedDate' => '2026-03-22',
        'ccpOrRip' => '0012345678 90',
        'commissionRate' => 5.0,
        'totalSalesDzd' => 0,
        'availableBalanceDzd' => 0,
        'paidAmountDzd' => 0,
    ]
];

// Initialize with seed if files don't exist
$deletedSellers = readJsonFile($deletedSellersFile, []);
$deletedSuppliers = readJsonFile($deletedSuppliersFile, []);

if (!file_exists($sellersFile)) {
    $filteredSeedSellers = array_values(array_filter($initialSeedSellers, function($s) use ($deletedSellers) {
        return !in_array($s['id'], $deletedSellers);
    }));
    writeJsonFile($sellersFile, $filteredSeedSellers);
}

if (!file_exists($suppliersFile)) {
    $filteredSeedSuppliers = array_values(array_filter($initialSeedSuppliers, function($s) use ($deletedSuppliers) {
        return !in_array($s['id'], $deletedSuppliers);
    }));
    writeJsonFile($suppliersFile, $filteredSeedSuppliers);
}

// Parse Route and Method
$method = $_SERVER['REQUEST_METHOD'];

// Get Request Body
$rawInput = file_get_contents('php://input');
$body = [];
if (!empty($rawInput)) {
    $json = json_decode($rawInput, true);
    if (is_array($json)) {
        $body = $json;
    }
}
if (empty($body) && !empty($_POST)) {
    $body = $_POST;
}

// Extract path
$requestUri = $_SERVER['REQUEST_URI'];
$cleanUri = parse_url($requestUri, PHP_URL_PATH);

// Remove query parameters and base path
$route = '';
if (isset($_GET['route'])) {
    $route = trim($_GET['route'], '/');
} else {
    // Look for /api/
    $pos = strpos($cleanUri, '/api/');
    if ($pos !== false) {
        $route = substr($cleanUri, $pos + 5);
    } else {
        $route = trim($cleanUri, '/');
        if (substr($route, 0, 4) === 'api/') {
            $route = substr($route, 4);
        }
    }
}
$route = trim($route, '/');
$segments = explode('/', $route);

// Helper to filter out deleted IDs
$currentSellers = readJsonFile($sellersFile, []);
$currentSuppliers = readJsonFile($suppliersFile, []);
$currentProducts = readJsonFile($productsFile, []);
$currentOrders = readJsonFile($ordersFile, []);
$currentWithdrawals = readJsonFile($withdrawalsFile, []);
$currentSettlements = readJsonFile($settlementsFile, []);

$deletedSellers = readJsonFile($deletedSellersFile, []);
$deletedSuppliers = readJsonFile($deletedSuppliersFile, []);
$deletedProducts = readJsonFile($deletedProductsFile, []);
$deletedOrders = readJsonFile($deletedOrdersFile, []);
$deletedWithdrawals = readJsonFile($deletedWithdrawalsFile, []);
$deletedSettlements = readJsonFile($deletedSettlementsFile, []);

// ---------------- ROUTES ----------------

// Health check
if ($route === 'health' || $route === '') {
    echo json_encode([
        'status' => 'ok',
        'service' => 'NouvaMarket Hostinger API Bridge',
        'time' => date('c'),
        'totalSellers' => count($currentSellers),
        'totalSuppliers' => count($currentSuppliers),
    ]);
    exit;
}

// 1. SELLERS ENDPOINTS: /api/reseller/sellers
if ($segments[0] === 'reseller' && isset($segments[1]) && $segments[1] === 'sellers') {
    $targetId = isset($segments[2]) ? $segments[2] : null;

    // GET /api/reseller/sellers
    if ($method === 'GET') {
        // Filter out any seller that was deleted
        $validSellers = array_values(array_filter($currentSellers, function($s) use ($deletedSellers) {
            return !in_array($s['id'], $deletedSellers);
        }));
        echo json_encode(['success' => true, 'sellers' => $validSellers]);
        exit;
    }

    // POST /api/reseller/sellers
    if ($method === 'POST') {
        $seller = $body;
        if (empty($seller) || empty($seller['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'بيانات البائع غير صالحة']);
            exit;
        }

        // If this ID was previously marked deleted, un-delete it because user is registering anew
        if (($key = array_search($seller['id'], $deletedSellers)) !== false) {
            unset($deletedSellers[$key]);
            $deletedSellers = array_values($deletedSellers);
            writeJsonFile($deletedSellersFile, $deletedSellers);
        }

        $foundIndex = -1;
        foreach ($currentSellers as $i => $s) {
            if ($s['id'] === $seller['id'] || (!empty($s['email']) && strtolower($s['email']) === strtolower($seller['email'] ?? ''))) {
                $foundIndex = $i;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentSellers[$foundIndex] = array_merge($currentSellers[$foundIndex], $seller);
        } else {
            array_unshift($currentSellers, $seller);
        }

        writeJsonFile($sellersFile, $currentSellers);
        echo json_encode([
            'success' => true,
            'seller' => $foundIndex !== -1 ? $currentSellers[$foundIndex] : $seller,
            'sellers' => $currentSellers
        ]);
        exit;
    }

    // PUT /api/reseller/sellers/{id}
    if ($method === 'PUT' && $targetId) {
        $updates = $body;
        $foundIndex = -1;
        foreach ($currentSellers as $i => $s) {
            if ($s['id'] === $targetId || (!empty($s['email']) && strtolower($s['email']) === strtolower($updates['email'] ?? ''))) {
                $foundIndex = $i;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentSellers[$foundIndex] = array_merge($currentSellers[$foundIndex], $updates);
            writeJsonFile($sellersFile, $currentSellers);
            echo json_encode(['success' => true, 'seller' => $currentSellers[$foundIndex]]);
            exit;
        } else {
            $newSeller = array_merge(['id' => $targetId], $updates);
            array_unshift($currentSellers, $newSeller);
            writeJsonFile($sellersFile, $currentSellers);
            echo json_encode(['success' => true, 'seller' => $newSeller]);
            exit;
        }
    }

    // DELETE /api/reseller/sellers/{id}
    if ($method === 'DELETE' && $targetId) {
        // Remove from sellers list
        $newSellers = array_values(array_filter($currentSellers, function($s) use ($targetId) {
            return $s['id'] !== $targetId;
        }));
        writeJsonFile($sellersFile, $newSellers);

        // Record in deleted sellers blacklist so it is never re-seeded or resurrected
        if (!in_array($targetId, $deletedSellers)) {
            $deletedSellers[] = $targetId;
            writeJsonFile($deletedSellersFile, $deletedSellers);
        }

        echo json_encode(['success' => true, 'message' => 'تم حذف البائع نهائياً بنجاح']);
        exit;
    }
}

// 2. SUPPLIERS ENDPOINTS: /api/reseller/suppliers
if ($segments[0] === 'reseller' && isset($segments[1]) && $segments[1] === 'suppliers') {
    $targetId = isset($segments[2]) ? $segments[2] : null;

    // GET /api/reseller/suppliers
    if ($method === 'GET') {
        $validSuppliers = array_values(array_filter($currentSuppliers, function($s) use ($deletedSuppliers) {
            return !in_array($s['id'], $deletedSuppliers);
        }));
        echo json_encode(['success' => true, 'suppliers' => $validSuppliers]);
        exit;
    }

    // POST /api/reseller/suppliers
    if ($method === 'POST') {
        $supplier = $body;
        if (empty($supplier) || empty($supplier['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'بيانات المورد غير صالحة']);
            exit;
        }

        // Un-delete if re-registering
        if (($key = array_search($supplier['id'], $deletedSuppliers)) !== false) {
            unset($deletedSuppliers[$key]);
            $deletedSuppliers = array_values($deletedSuppliers);
            writeJsonFile($deletedSuppliersFile, $deletedSuppliers);
        }

        $foundIndex = -1;
        foreach ($currentSuppliers as $i => $s) {
            if ($s['id'] === $supplier['id'] || (!empty($s['email']) && strtolower($s['email']) === strtolower($supplier['email'] ?? ''))) {
                $foundIndex = $i;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentSuppliers[$foundIndex] = array_merge($currentSuppliers[$foundIndex], $supplier);
        } else {
            array_unshift($currentSuppliers, $supplier);
        }

        writeJsonFile($suppliersFile, $currentSuppliers);
        echo json_encode([
            'success' => true,
            'supplier' => $foundIndex !== -1 ? $currentSuppliers[$foundIndex] : $supplier,
            'suppliers' => $currentSuppliers
        ]);
        exit;
    }

    // PUT /api/reseller/suppliers/{id}
    if ($method === 'PUT' && $targetId) {
        $updates = $body;
        $foundIndex = -1;
        foreach ($currentSuppliers as $i => $s) {
            if ($s['id'] === $targetId || (!empty($s['email']) && strtolower($s['email']) === strtolower($updates['email'] ?? ''))) {
                $foundIndex = $i;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentSuppliers[$foundIndex] = array_merge($currentSuppliers[$foundIndex], $updates);
            writeJsonFile($suppliersFile, $currentSuppliers);
            echo json_encode(['success' => true, 'supplier' => $currentSuppliers[$foundIndex]]);
            exit;
        } else {
            $newSupplier = array_merge(['id' => $targetId], $updates);
            array_unshift($currentSuppliers, $newSupplier);
            writeJsonFile($suppliersFile, $currentSuppliers);
            echo json_encode(['success' => true, 'supplier' => $newSupplier]);
            exit;
        }
    }

    // DELETE /api/reseller/suppliers/{id}
    if ($method === 'DELETE' && $targetId) {
        $newSuppliers = array_values(array_filter($currentSuppliers, function($s) use ($targetId) {
            return $s['id'] !== $targetId;
        }));
        writeJsonFile($suppliersFile, $newSuppliers);

        // Record in deleted blacklist
        if (!in_array($targetId, $deletedSuppliers)) {
            $deletedSuppliers[] = $targetId;
            writeJsonFile($deletedSuppliersFile, $deletedSuppliers);
        }

        echo json_encode(['success' => true, 'message' => 'تم حذف المورد نهائياً بنجاح']);
        exit;
    }
}

// 2. PRODUCTS ENDPOINTS: /api/products
if ($segments[0] === 'products') {
    $targetId = isset($segments[1]) ? $segments[1] : null;

    // POST /api/products/sync
    if ($method === 'POST' && $targetId === 'sync') {
        $incoming = $body['products'] ?? [];
        if (!is_array($incoming)) {
            http_response_code(400);
            echo json_encode(['error' => 'قائمة المنتجات غير صالحة']);
            exit;
        }

        $map = [];
        foreach ($currentProducts as $p) {
            if (!empty($p['id']) && !in_array($p['id'], $deletedProducts)) {
                $map[$p['id']] = $p;
            }
        }

        foreach ($incoming as $p) {
            if (empty($p['id']) || in_array($p['id'], $deletedProducts)) continue;
            $pid = $p['id'];
            if (isset($map[$pid])) {
                $map[$pid] = array_merge($map[$pid], $p);
            } else {
                $map[$pid] = $p;
            }
        }

        $currentProducts = array_values($map);
        writeJsonFile($productsFile, $currentProducts);
        echo json_encode(['success' => true, 'products' => $currentProducts, 'count' => count($currentProducts)]);
        exit;
    }

    // GET /api/products
    if ($method === 'GET' && !$targetId) {
        $validProducts = array_values(array_filter($currentProducts, function($p) use ($deletedProducts) {
            return !empty($p['id']) && !in_array($p['id'], $deletedProducts);
        }));
        echo json_encode(['success' => true, 'products' => $validProducts, 'count' => count($validProducts)]);
        exit;
    }

    // POST /api/products
    if ($method === 'POST') {
        $product = $body;
        if (empty($product) || empty($product['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'بيانات المنتج غير صالحة']);
            exit;
        }

        // Un-delete if previously deleted
        if (($key = array_search($product['id'], $deletedProducts)) !== false) {
            unset($deletedProducts[$key]);
            $deletedProducts = array_values($deletedProducts);
            writeJsonFile($deletedProductsFile, $deletedProducts);
        }

        $foundIndex = -1;
        foreach ($currentProducts as $idx => $p) {
            if ($p['id'] === $product['id']) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentProducts[$foundIndex] = array_merge($currentProducts[$foundIndex], $product);
        } else {
            array_unshift($currentProducts, $product);
        }

        writeJsonFile($productsFile, $currentProducts);
        echo json_encode(['success' => true, 'product' => $product]);
        exit;
    }

    // PUT /api/products/{id}
    if ($method === 'PUT' && $targetId) {
        $updates = $body;
        $foundIndex = -1;
        foreach ($currentProducts as $idx => $p) {
            if ($p['id'] === $targetId) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentProducts[$foundIndex] = array_merge($currentProducts[$foundIndex], $updates);
        } else {
            $newProduct = array_merge(['id' => $targetId], $updates);
            array_unshift($currentProducts, $newProduct);
        }

        writeJsonFile($productsFile, $currentProducts);
        echo json_encode(['success' => true, 'product' => $currentProducts[$foundIndex !== -1 ? $foundIndex : 0]]);
        exit;
    }

    // DELETE /api/products/{id}
    if ($method === 'DELETE' && $targetId) {
        $newProducts = array_values(array_filter($currentProducts, function($p) use ($targetId) {
            return $p['id'] !== $targetId;
        }));
        writeJsonFile($productsFile, $newProducts);

        if (!in_array($targetId, $deletedProducts)) {
            $deletedProducts[] = $targetId;
            writeJsonFile($deletedProductsFile, $deletedProducts);
        }

        echo json_encode(['success' => true, 'message' => 'تم حذف المنتج نهائياً بنجاح']);
        exit;
    }
}

// 3. ORDERS ENDPOINTS: /api/reseller/orders
if ($segments[0] === 'reseller' && isset($segments[1]) && $segments[1] === 'orders') {
    $targetId = isset($segments[2]) ? $segments[2] : null;

    // POST /api/reseller/orders/sync
    if ($method === 'POST' && $targetId === 'sync') {
        $incoming = $body['orders'] ?? [];
        if (!is_array($incoming)) {
            http_response_code(400);
            echo json_encode(['error' => 'بيانات الطلبيات غير صالحة']);
            exit;
        }

        $map = [];
        foreach ($currentOrders as $o) {
            if (!empty($o['id']) && !in_array($o['id'], $deletedOrders)) {
                $map[$o['id']] = $o;
            }
        }

        foreach ($incoming as $o) {
            if (empty($o['id']) || in_array($o['id'], $deletedOrders)) continue;
            $oid = $o['id'];
            if (isset($map[$oid])) {
                $map[$oid] = array_merge($map[$oid], $o);
            } else {
                $map[$oid] = $o;
            }
        }

        $currentOrders = array_values($map);
        writeJsonFile($ordersFile, $currentOrders);
        echo json_encode(['success' => true, 'orders' => $currentOrders, 'count' => count($currentOrders)]);
        exit;
    }

    // GET /api/reseller/orders
    if ($method === 'GET' && !$targetId) {
        $validOrders = array_values(array_filter($currentOrders, function($o) use ($deletedOrders) {
            return !empty($o['id']) && !in_array($o['id'], $deletedOrders);
        }));
        echo json_encode(['success' => true, 'orders' => $validOrders, 'count' => count($validOrders)]);
        exit;
    }

    // POST /api/reseller/orders
    if ($method === 'POST') {
        $order = $body;
        if (empty($order) || empty($order['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'بيانات الطلبية غير صالحة']);
            exit;
        }

        if (($key = array_search($order['id'], $deletedOrders)) !== false) {
            unset($deletedOrders[$key]);
            $deletedOrders = array_values($deletedOrders);
            writeJsonFile($deletedOrdersFile, $deletedOrders);
        }

        $foundIndex = -1;
        foreach ($currentOrders as $idx => $o) {
            if ($o['id'] === $order['id']) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentOrders[$foundIndex] = array_merge($currentOrders[$foundIndex], $order);
        } else {
            array_unshift($currentOrders, $order);
        }

        writeJsonFile($ordersFile, $currentOrders);
        echo json_encode(['success' => true, 'order' => $order]);
        exit;
    }

    // PUT /api/reseller/orders/{id}
    if ($method === 'PUT' && $targetId) {
        $updates = $body;
        $foundIndex = -1;
        foreach ($currentOrders as $idx => $o) {
            if ($o['id'] === $targetId) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentOrders[$foundIndex] = array_merge($currentOrders[$foundIndex], $updates);
        } else {
            $newOrder = array_merge(['id' => $targetId], $updates);
            array_unshift($currentOrders, $newOrder);
        }

        writeJsonFile($ordersFile, $currentOrders);
        echo json_encode(['success' => true, 'order' => $currentOrders[$foundIndex !== -1 ? $foundIndex : 0]]);
        exit;
    }

    // DELETE /api/reseller/orders/{id}
    if ($method === 'DELETE' && $targetId) {
        $newOrders = array_values(array_filter($currentOrders, function($o) use ($targetId) {
            return $o['id'] !== $targetId;
        }));
        writeJsonFile($ordersFile, $newOrders);

        if (!in_array($targetId, $deletedOrders)) {
            $deletedOrders[] = $targetId;
            writeJsonFile($deletedOrdersFile, $deletedOrders);
        }

        echo json_encode(['success' => true, 'message' => 'تم حذف الطلبية نهائياً بنجاح']);
        exit;
    }
}

// 4. WITHDRAWALS ENDPOINTS: /api/reseller/withdrawals
if ($segments[0] === 'reseller' && isset($segments[1]) && $segments[1] === 'withdrawals') {
    $targetId = isset($segments[2]) ? $segments[2] : null;

    // POST /api/reseller/withdrawals/sync
    if ($method === 'POST' && $targetId === 'sync') {
        $incoming = $body['withdrawals'] ?? [];
        if (!is_array($incoming)) {
            http_response_code(400);
            echo json_encode(['error' => 'بيانات غير صالحة']);
            exit;
        }

        $map = [];
        foreach ($currentWithdrawals as $w) {
            if (!empty($w['id']) && !in_array($w['id'], $deletedWithdrawals)) {
                $map[$w['id']] = $w;
            }
        }

        foreach ($incoming as $w) {
            if (empty($w['id']) || in_array($w['id'], $deletedWithdrawals)) continue;
            $wid = $w['id'];
            if (isset($map[$wid])) {
                $map[$wid] = array_merge($map[$wid], $w);
            } else {
                $map[$wid] = $w;
            }
        }

        $currentWithdrawals = array_values($map);
        writeJsonFile($withdrawalsFile, $currentWithdrawals);
        echo json_encode(['success' => true, 'withdrawals' => $currentWithdrawals]);
        exit;
    }

    // GET /api/reseller/withdrawals
    if ($method === 'GET' && !$targetId) {
        $validW = array_values(array_filter($currentWithdrawals, function($w) use ($deletedWithdrawals) {
            return !empty($w['id']) && !in_array($w['id'], $deletedWithdrawals);
        }));
        echo json_encode(['success' => true, 'withdrawals' => $validW, 'count' => count($validW)]);
        exit;
    }

    // POST /api/reseller/withdrawals
    if ($method === 'POST') {
        $w = $body;
        if (empty($w) || empty($w['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'بيانات غير صالحة']);
            exit;
        }

        if (($key = array_search($w['id'], $deletedWithdrawals)) !== false) {
            unset($deletedWithdrawals[$key]);
            $deletedWithdrawals = array_values($deletedWithdrawals);
            writeJsonFile($deletedWithdrawalsFile, $deletedWithdrawals);
        }

        $foundIndex = -1;
        foreach ($currentWithdrawals as $idx => $item) {
            if ($item['id'] === $w['id']) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentWithdrawals[$foundIndex] = array_merge($currentWithdrawals[$foundIndex], $w);
        } else {
            array_unshift($currentWithdrawals, $w);
        }

        writeJsonFile($withdrawalsFile, $currentWithdrawals);
        echo json_encode(['success' => true, 'withdrawal' => $w]);
        exit;
    }

    // PUT /api/reseller/withdrawals/{id}
    if ($method === 'PUT' && $targetId) {
        $updates = $body;
        $foundIndex = -1;
        foreach ($currentWithdrawals as $idx => $w) {
            if ($w['id'] === $targetId) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentWithdrawals[$foundIndex] = array_merge($currentWithdrawals[$foundIndex], $updates);
        } else {
            $newW = array_merge(['id' => $targetId], $updates);
            array_unshift($currentWithdrawals, $newW);
        }

        writeJsonFile($withdrawalsFile, $currentWithdrawals);
        echo json_encode(['success' => true, 'withdrawal' => $currentWithdrawals[$foundIndex !== -1 ? $foundIndex : 0]]);
        exit;
    }

    // DELETE /api/reseller/withdrawals/{id}
    if ($method === 'DELETE' && $targetId) {
        $newW = array_values(array_filter($currentWithdrawals, function($w) use ($targetId) {
            return $w['id'] !== $targetId;
        }));
        writeJsonFile($withdrawalsFile, $newW);

        if (!in_array($targetId, $deletedWithdrawals)) {
            $deletedWithdrawals[] = $targetId;
            writeJsonFile($deletedWithdrawalsFile, $deletedWithdrawals);
        }

        echo json_encode(['success' => true, 'message' => 'تم حذف طلب السحب بنجاح']);
        exit;
    }
}

// 5. SETTLEMENTS ENDPOINTS: /api/reseller/settlements
if ($segments[0] === 'reseller' && isset($segments[1]) && $segments[1] === 'settlements') {
    $targetId = isset($segments[2]) ? $segments[2] : null;

    // POST /api/reseller/settlements/sync
    if ($method === 'POST' && $targetId === 'sync') {
        $incoming = $body['settlements'] ?? [];
        if (!is_array($incoming)) {
            http_response_code(400);
            echo json_encode(['error' => 'بيانات غير صالحة']);
            exit;
        }

        $map = [];
        foreach ($currentSettlements as $s) {
            if (!empty($s['id']) && !in_array($s['id'], $deletedSettlements)) {
                $map[$s['id']] = $s;
            }
        }

        foreach ($incoming as $s) {
            if (empty($s['id']) || in_array($s['id'], $deletedSettlements)) continue;
            $sid = $s['id'];
            if (isset($map[$sid])) {
                $map[$sid] = array_merge($map[$sid], $s);
            } else {
                $map[$sid] = $s;
            }
        }

        $currentSettlements = array_values($map);
        writeJsonFile($settlementsFile, $currentSettlements);
        echo json_encode(['success' => true, 'settlements' => $currentSettlements]);
        exit;
    }

    // GET /api/reseller/settlements
    if ($method === 'GET' && !$targetId) {
        $validS = array_values(array_filter($currentSettlements, function($s) use ($deletedSettlements) {
            return !empty($s['id']) && !in_array($s['id'], $deletedSettlements);
        }));
        echo json_encode(['success' => true, 'settlements' => $validS, 'count' => count($validS)]);
        exit;
    }

    // POST /api/reseller/settlements
    if ($method === 'POST') {
        $s = $body;
        if (empty($s) || empty($s['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'بيانات غير صالحة']);
            exit;
        }

        if (($key = array_search($s['id'], $deletedSettlements)) !== false) {
            unset($deletedSettlements[$key]);
            $deletedSettlements = array_values($deletedSettlements);
            writeJsonFile($deletedSettlementsFile, $deletedSettlements);
        }

        $foundIndex = -1;
        foreach ($currentSettlements as $idx => $item) {
            if ($item['id'] === $s['id']) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentSettlements[$foundIndex] = array_merge($currentSettlements[$foundIndex], $s);
        } else {
            array_unshift($currentSettlements, $s);
        }

        writeJsonFile($settlementsFile, $currentSettlements);
        echo json_encode(['success' => true, 'settlement' => $s]);
        exit;
    }

    // PUT /api/reseller/settlements/{id}
    if ($method === 'PUT' && $targetId) {
        $updates = $body;
        $foundIndex = -1;
        foreach ($currentSettlements as $idx => $s) {
            if ($s['id'] === $targetId) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            $currentSettlements[$foundIndex] = array_merge($currentSettlements[$foundIndex], $updates);
        } else {
            $newS = array_merge(['id' => $targetId], $updates);
            array_unshift($currentSettlements, $newS);
        }

        writeJsonFile($settlementsFile, $currentSettlements);
        echo json_encode(['success' => true, 'settlement' => $currentSettlements[$foundIndex !== -1 ? $foundIndex : 0]]);
        exit;
    }

    // DELETE /api/reseller/settlements/{id}
    if ($method === 'DELETE' && $targetId) {
        $newS = array_values(array_filter($currentSettlements, function($s) use ($targetId) {
            return $s['id'] !== $targetId;
        }));
        writeJsonFile($settlementsFile, $newS);

        if (!in_array($targetId, $deletedSettlements)) {
            $deletedSettlements[] = $targetId;
            writeJsonFile($deletedSettlementsFile, $deletedSettlements);
        }

        echo json_encode(['success' => true, 'message' => 'تم حذف التسوية بنجاح']);
        exit;
    }
}

// 3. ADMIN PENDING APPROVALS: /api/admin/pending-approvals or /api/admin/pending-registrations
if ($segments[0] === 'admin' && isset($segments[1]) && ($segments[1] === 'pending-approvals' || $segments[1] === 'pending-registrations')) {
    $pendingSellers = array_values(array_filter($currentSellers, function($s) use ($deletedSellers) {
        return !in_array($s['id'], $deletedSellers) && isset($s['approvalStatus']) && $s['approvalStatus'] === 'PENDING';
    }));
    $pendingSuppliers = array_values(array_filter($currentSuppliers, function($s) use ($deletedSuppliers) {
        return !in_array($s['id'], $deletedSuppliers) && isset($s['status']) && $s['status'] === 'PENDING';
    }));

    echo json_encode([
        'success' => true,
        'pendingSellers' => $pendingSellers,
        'pendingSuppliers' => $pendingSuppliers,
        'totalPending' => count($pendingSellers) + count($pendingSuppliers),
    ]);
    exit;
}

// 4. ADMIN APPROVE / REJECT / SUSPEND: /api/admin/approve-registration
if ($segments[0] === 'admin' && isset($segments[1]) && $segments[1] === 'approve-registration') {
    $type = $body['type'] ?? '';
    $id = $body['id'] ?? '';
    $action = $body['action'] ?? 'APPROVED';

    if ($type === 'supplier') {
        foreach ($currentSuppliers as &$s) {
            if ($s['id'] === $id) {
                $s['status'] = $action;
                writeJsonFile($suppliersFile, $currentSuppliers);
                echo json_encode(['success' => true, 'updated' => $s]);
                exit;
            }
        }
    } else {
        foreach ($currentSellers as &$s) {
            if ($s['id'] === $id) {
                $s['approvalStatus'] = $action;
                if ($action === 'APPROVED') {
                    $s['kycStatus'] = 'APPROVED';
                }
                writeJsonFile($sellersFile, $currentSellers);
                echo json_encode(['success' => true, 'updated' => $s]);
                exit;
            }
        }
    }

    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'العنصر غير موجود']);
    exit;
}

// Fallback: 404 Not Found
http_response_code(404);
echo json_encode(['success' => false, 'error' => 'API endpoint not found', 'route' => $route]);
