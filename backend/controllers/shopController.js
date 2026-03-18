const { User, Order, Review } = require("../models");

// ── GET /api/shops/nearby ────────────────────────────────
exports.getNearbyShops = async (req, res) => {
  try {
    const { lat, lng, radius = 20000, category } = req.query;
    if (!lat || !lng)
      return res.status(400).json({ success: false, message: "Location coordinates dein" });

    const filter = {
      role: "seller", isActive: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius),
        },
      },
    };
    if (category) filter.shopCategories = category;

    const shops = await User.find(filter)
      .select("name shopName shopDescription shopRating totalReviews address location isShopOpen shopImages shopCategories")
      .limit(20);

    res.json({ success: true, shops, count: shops.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/shops/:id ───────────────────────────────────
exports.getShop = async (req, res) => {
  try {
    const shop = await User.findOne({ _id: req.params.id, role: "seller" })
      .select("-__v");
    if (!shop) return res.status(404).json({ success: false, message: "Shop nahi mili" });
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/drivers/nearby ──────────────────────────────
exports.getNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radius = 15000 } = req.query;
    const drivers = await User.find({
      role: "driver", isAvailable: true, isActive: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius),
        },
      },
    }).select("name vehicleType vehicleNumber driverRating location totalDeliveries")
      .limit(10);

    res.json({ success: true, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/drivers/availability ────────────────────────
exports.toggleAvailability = async (req, res) => {
  try {
    const { isAvailable, location } = req.body;
    const updates = { isAvailable };
    if (location) updates.location = { type: "Point", coordinates: [location.lng, location.lat] };

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true })
      .select("name isAvailable location");
    res.json({ success: true, user, message: isAvailable ? "Aap ab available hain 🟢" : "Aap offline hain 🔴" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/drivers/active-orders ───────────────────────
exports.getDriverOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      driver: req.user.userId,
      status: { $in: ["picked_up","in_transit"] },
    }).populate("buyer","name phone address")
      .sort({ updatedAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/drivers/available-deliveries ─────────────────
exports.getAvailableDeliveries = async (req, res) => {
  try {
    // Orders that are "packed" and have no driver yet
    const orders = await Order.find({
      status: "packed", driver: null,
      deliveryType: "delivery",
    }).populate("buyer","name phone address")
      .populate("items.seller","name shopName address location")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/reviews ────────────────────────────────────
exports.createReview = async (req, res) => {
  try {
    const { targetId, targetType, rating, comment, orderId } = req.body;

    // Check if already reviewed
    const existing = await Review.findOne({
      reviewer: req.user.userId, target: targetId, order: orderId,
    });
    if (existing)
      return res.status(400).json({ success: false, message: "Aap pehle hi review de chuke hain" });

    const review = await Review.create({
      reviewer: req.user.userId,
      target: targetId, targetType,
      rating, comment, order: orderId,
    });

    // Update average rating
    const allReviews = await Review.find({ target: targetId, targetType });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

    if (targetType === "seller" || targetType === "driver") {
      const field = targetType === "seller" ? "shopRating" : "driverRating";
      await User.findByIdAndUpdate(targetId, { [field]: avg.toFixed(1), totalReviews: allReviews.length });
    } else if (targetType === "product") {
      const { Product } = require("../models");
      await Product.findByIdAndUpdate(targetId, { rating: avg.toFixed(1), totalRatings: allReviews.length });
    }

    res.status(201).json({ success: true, review, message: "Review dene ke liye dhanyavad! 🙏" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
