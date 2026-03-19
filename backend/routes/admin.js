/**
 * ╔══════════════════════════════════════╗
 * ║   AgroEase — Admin Routes            ║
 * ║   Orders, Users, Products, Analytics ║
 * ╚══════════════════════════════════════╝
 */

const router  = require("express").Router();
const jwt     = require("jsonwebtoken");
const { User, Order, Product, DiseaseDetection } = require("../models");

// ── Admin Auth Middleware ────────────────────────────────
const adminOnly = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Token nahi mila" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.userId);

    if (!user || user.role !== "admin")
      return res.status(403).json({ success: false, message: "Admin access required" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ── DASHBOARD ANALYTICS ─────────────────────────────────
// GET /api/admin/dashboard
router.get("/dashboard", adminOnly, async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(today); week.setDate(week.getDate() - 7);
    const month = new Date(today); month.setMonth(month.getMonth() - 1);

    const [
      totalUsers, totalOrders, totalProducts, totalSellers, totalDrivers,
      todayOrders, weekOrders, monthOrders,
      pendingOrders, deliveredOrders, cancelledOrders,
      revenueData, topProducts, recentOrders
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: "seller" }),
      User.countDocuments({ role: "driver" }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: week } }),
      Order.countDocuments({ createdAt: { $gte: month } }),
      Order.countDocuments({ status: "placed" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),

      // Revenue last 7 days
      Order.aggregate([
        { $match: { createdAt: { $gte: week }, paymentStatus: "paid" } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders:  { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),

      // Top selling products
      Order.aggregate([
        { $unwind: "$items" },
        { $group: { _id: "$items.product", totalSold: { $sum: "$items.quantity" }, revenue: { $sum: "$items.subtotal" } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
        { $project: { name: "$product.name", totalSold: 1, revenue: 1, image: { $arrayElemAt: ["$product.images", 0] } } }
      ]),

      // Recent 10 orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("buyer", "name phone")
        .select("orderNumber buyer totalAmount status createdAt paymentMethod")
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers, totalOrders, totalProducts,
          totalSellers, totalDrivers,
          todayOrders, weekOrders, monthOrders,
          pendingOrders, deliveredOrders, cancelledOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        revenueData,
        topProducts,
        recentOrders,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Dashboard error" });
  }
});

// ── ORDERS ───────────────────────────────────────────────
// GET /api/admin/orders
router.get("/orders", adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (status && status !== "all") query.status = status;
    if (search) query.orderNumber = { $regex: search, $options: "i" };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("buyer", "name phone address")
        .populate("driver", "name phone vehicleNumber")
        .populate("items.product", "name images"),
      Order.countDocuments(query)
    ]);

    res.json({ success: true, data: orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Orders fetch error" });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch("/orders/:id/status", adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order nahi mila" });

    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: req.user._id });
    if (status === "delivered") order.deliveredAt = new Date();
    await order.save();

    res.json({ success: true, message: "Order status update ho gaya", data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Status update error" });
  }
});

// ── USERS ────────────────────────────────────────────────
// GET /api/admin/users
router.get("/users", adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, status } = req.query;
    const query = {};

    if (role && role !== "all") query.role = role;
    if (status === "active")   query.isActive = true;
    if (status === "banned")   query.isActive = false;
    if (search) query.$or = [
      { name:  { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } }
    ];

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select("-__v"),
      User.countDocuments(query)
    ]);

    res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Users fetch error" });
  }
});

// PATCH /api/admin/users/:id/ban
router.patch("/users/:id/ban", adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User nahi mila" });
    if (user.role === "admin") return res.status(403).json({ success: false, message: "Admin ko ban nahi kar sakte" });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: user.isActive ? "User unban ho gaya" : "User ban ho gaya", data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Ban error" });
  }
});

// PATCH /api/admin/users/:id/verify-seller
router.patch("/users/:id/verify-seller", adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isShopVerified: true },
      { new: true }
    );
    res.json({ success: true, message: "Seller verify ho gaya", data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Verify error" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User nahi mila" });
    if (user.role === "admin") return res.status(403).json({ success: false, message: "Admin ko delete nahi kar sakte" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User delete ho gaya" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete error" });
  }
});

// ── PRODUCTS ─────────────────────────────────────────────
// GET /api/admin/products
router.get("/products", adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, status } = req.query;
    const query = {};

    if (category && category !== "all") query.category = category;
    if (status === "active")   query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (search) query.$or = [
      { name:  { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } }
    ];

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("seller", "name phone shopName"),
      Product.countDocuments(query)
    ]);

    res.json({ success: true, data: products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Products fetch error" });
  }
});

// PATCH /api/admin/products/:id/toggle
router.patch("/products/:id/toggle", adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product nahi mila" });

    product.isActive = !product.isActive;
    await product.save();

    res.json({ success: true, message: product.isActive ? "Product active ho gaya" : "Product inactive ho gaya", data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Toggle error" });
  }
});

// PATCH /api/admin/products/:id/featured
router.patch("/products/:id/featured", adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product nahi mila" });

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.json({ success: true, message: product.isFeatured ? "Featured set ho gaya" : "Featured remove ho gaya" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Featured error" });
  }
});

// DELETE /api/admin/products/:id
router.delete("/products/:id", adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product delete ho gaya" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete error" });
  }
});

// ── SELLERS ──────────────────────────────────────────────
// GET /api/admin/sellers
router.get("/sellers", adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, verified } = req.query;
    const query = { role: "seller" };

    if (verified === "true")  query.isShopVerified = true;
    if (verified === "false") query.isShopVerified = { $ne: true };
    if (search) query.$or = [
      { name:     { $regex: search, $options: "i" } },
      { shopName: { $regex: search, $options: "i" } },
      { phone:    { $regex: search, $options: "i" } }
    ];

    const [sellers, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    // Get product count per seller
    const sellerIds = sellers.map(s => s._id);
    const productCounts = await Product.aggregate([
      { $match: { seller: { $in: sellerIds } } },
      { $group: { _id: "$seller", count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(productCounts.map(p => [p._id.toString(), p.count]));

    const data = sellers.map(s => ({
      ...s.toObject(),
      productCount: countMap[s._id.toString()] || 0
    }));

    res.json({ success: true, data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Sellers fetch error" });
  }
});

// ── DRIVERS ──────────────────────────────────────────────
// GET /api/admin/drivers
router.get("/drivers", adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, available } = req.query;
    const query = { role: "driver" };

    if (available === "true")  query.isAvailable = true;
    if (available === "false") query.isAvailable = false;
    if (search) query.$or = [
      { name:          { $regex: search, $options: "i" } },
      { phone:         { $regex: search, $options: "i" } },
      { vehicleNumber: { $regex: search, $options: "i" } }
    ];

    const [drivers, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({ success: true, data: drivers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Drivers fetch error" });
  }
});

// PATCH /api/admin/drivers/:id/assign
router.patch("/drivers/:id/assign", adminOnly, async (req, res) => {
  try {
    const { orderId } = req.body;
    const [driver, order] = await Promise.all([
      User.findById(req.params.id),
      Order.findById(orderId)
    ]);

    if (!driver || driver.role !== "driver")
      return res.status(404).json({ success: false, message: "Driver nahi mila" });
    if (!order)
      return res.status(404).json({ success: false, message: "Order nahi mila" });

    order.driver = driver._id;
    order.status = "picked_up";
    order.statusHistory.push({ status: "picked_up", note: `Driver assigned: ${driver.name}`, updatedBy: req.user._id });

    driver.currentOrderId = order._id;
    driver.isAvailable    = false;

    await Promise.all([order.save(), driver.save()]);
    res.json({ success: true, message: "Driver assign ho gaya" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Assign error" });
  }
});

module.exports = router;
