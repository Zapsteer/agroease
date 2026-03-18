const express  = require("express");
const router   = express.Router();
const { protect, authorizeRoles } = require("../middleware/auth");

const auth    = require("../controllers/authController");
const product = require("../controllers/productController");
const shop    = require("../controllers/shopController");
const ai      = require("../controllers/aiController");

// ── AUTH ─────────────────────────────────────────────────
router.post("/auth/send-otp",              auth.sendOTP);
router.post("/auth/verify-otp",            auth.verifyOTP);
router.get ("/auth/me",            protect, auth.getMe);
router.put ("/auth/profile",       protect, auth.updateProfile);
router.get ("/auth/notifications", protect, auth.getNotifications);
router.put ("/auth/notifications/read", protect, auth.markNotificationsRead);

// ── PRODUCTS ─────────────────────────────────────────────
router.get ("/products",           product.getProducts);
router.get ("/products/mine",      protect, authorizeRoles("seller"), product.getSellerProducts);
router.get ("/products/compare/:name", product.compareProduct);
router.get ("/products/:id",       product.getProduct);
router.post("/products",           protect, authorizeRoles("seller"), product.createProduct);
router.put ("/products/:id",       protect, authorizeRoles("seller"), product.updateProduct);
router.delete("/products/:id",     protect, authorizeRoles("seller"), product.deleteProduct);

// ── CART ─────────────────────────────────────────────────
router.get ("/cart",            protect, authorizeRoles("buyer"), product.getCart);
router.post("/cart/add",        protect, authorizeRoles("buyer"), product.addToCart);
router.put ("/cart/update",     protect, authorizeRoles("buyer"), product.updateCartItem);
router.delete("/cart",          protect, authorizeRoles("buyer"), product.clearCart);

// ── ORDERS ───────────────────────────────────────────────
router.post("/orders",          protect, authorizeRoles("buyer"),  product.placeOrder);
router.get ("/orders",          protect,                           product.getOrders);
router.get ("/orders/:id",      protect,                           product.getOrder);
router.put ("/orders/:id/status", protect, authorizeRoles("seller","driver","admin"), product.updateOrderStatus);
router.put ("/orders/:id/cancel", protect,                         product.cancelOrder);

// ── SELLER ───────────────────────────────────────────────
router.get ("/seller/stats", protect, authorizeRoles("seller","admin"), product.getSellerStats);

// ── SHOPS & MAP ──────────────────────────────────────────
router.get ("/shops/nearby",    shop.getNearbyShops);
router.get ("/shops/:id",       shop.getShop);

// ── DRIVERS ──────────────────────────────────────────────
router.get ("/drivers/nearby",         shop.getNearbyDrivers);
router.put ("/drivers/availability",   protect, authorizeRoles("driver"), shop.toggleAvailability);
router.get ("/drivers/orders",         protect, authorizeRoles("driver"), shop.getDriverOrders);
router.get ("/drivers/deliveries",     protect, authorizeRoles("driver"), shop.getAvailableDeliveries);

// ── AI ───────────────────────────────────────────────────
router.post("/ai/detect",   protect, ai.detectDisease);
router.get ("/ai/history",  protect, ai.getHistory);

// ── REVIEWS ──────────────────────────────────────────────
router.post("/reviews", protect, shop.createReview);

// ── HEALTH CHECK ─────────────────────────────────────────
router.get("/health", (req, res) =>
  res.json({ success: true, app: "AgroEase", version: "1.0.0", time: new Date() })
);

module.exports = router;
