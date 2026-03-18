const { Product, Cart, Order, User, Review, Notification } = require("../models");

// ═══════════════════════════════════════════════════════
// PRODUCT CONTROLLER
// ═══════════════════════════════════════════════════════

exports.getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, seller, featured,
            cropType, page = 1, limit = 20, sort = "newest" } = req.query;

    const filter = { isActive: true };
    if (category)  filter.category  = category;
    if (seller)    filter.seller    = seller;
    if (featured)  filter.isFeatured = true;
    if (cropType)  filter.cropTypes  = cropType;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.$text = { $search: search };

    const sortMap = { newest: { createdAt: -1 }, price_asc: { price: 1 },
                      price_desc: { price: -1 }, rating: { rating: -1 } };
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("seller", "name shopName shopRating location address isShopOpen")
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, products, total,
               page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "name shopName shopRating totalReviews location address isShopOpen phone shopImages");
    if (!product) return res.status(404).json({ success: false, message: "Product nahi mila" });

    // Similar products
    const similar = await Product.find({
      category: product.category, _id: { $ne: product._id }, isActive: true,
    }).populate("seller", "name shopName").limit(4);

    res.json({ success: true, product, similar });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.compareProduct = async (req, res) => {
  try {
    const { name } = req.params;
    const products = await Product.find({
      name: { $regex: name, $options: "i" }, isActive: true,
    }).populate("seller", "name shopName shopRating totalReviews location address isShopOpen")
      .sort({ price: 1 });
    res.json({ success: true, products, count: products.length, searchTerm: name });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    if (req.user.role !== "seller")
      return res.status(403).json({ success: false, message: "Sirf seller product add kar sakta hai" });
    const product = await Product.create({ ...req.body, seller: req.user.userId });
    res.status(201).json({ success: true, product, message: "Product add ho gaya!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.userId }, req.body, { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Product nahi mila" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.userId }, { isActive: false }
    );
    res.json({ success: true, message: "Product hata diya" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// CART CONTROLLER
// ═══════════════════════════════════════════════════════

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId })
      .populate({ path: "items.product",
                  populate: { path: "seller", select: "name shopName isShopOpen" } });
    const items      = cart?.items || [];
    const subtotal   = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const deliveryFee= subtotal > 500 ? 0 : 50;
    const platformFee= Math.round(subtotal * 0.05);
    const total      = subtotal + deliveryFee + platformFee;

    res.json({ success: true, cart: cart || { items: [] },
               summary: { subtotal, deliveryFee, platformFee, total, itemCount: items.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product nahi mila" });
    if (product.stock < quantity)
      return res.status(400).json({ success: false, message: `Sirf ${product.stock} ${product.unit} available hai` });

    let cart = await Cart.findOne({ user: req.user.userId });
    if (!cart) cart = await Cart.create({ user: req.user.userId, items: [] });

    const existing = cart.items.find(i => i.product.toString() === productId);
    if (existing) existing.quantity += quantity;
    else cart.items.push({ product: productId, quantity, price: product.price });

    await cart.save();
    res.json({ success: true, message: "Cart mein add ho gaya! 🛒",
               itemCount: cart.items.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart nahi mila" });

    if (quantity <= 0)
      cart.items = cart.items.filter(i => i.product.toString() !== productId);
    else {
      const item = cart.items.find(i => i.product.toString() === productId);
      if (item) item.quantity = quantity;
    }
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user.userId }, { items: [] });
    res.json({ success: true, message: "Cart saaf ho gaya" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// ORDER CONTROLLER
// ═══════════════════════════════════════════════════════

exports.placeOrder = async (req, res) => {
  try {
    const { deliveryAddress, deliveryType = "delivery",
            paymentMethod = "cod", notes } = req.body;

    const cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ success: false, message: "Cart khaali hai" });

    // Build items with seller info
    const items = cart.items.map(i => ({
      product:      i.product._id,
      seller:       i.product.seller,
      productName:  i.product.name,
      productImage: i.product.images?.[0] || "",
      price:        i.price,
      quantity:     i.quantity,
      subtotal:     i.price * i.quantity,
      unit:         i.product.unit,
    }));

    const subtotal    = items.reduce((s, i) => s + i.subtotal, 0);
    const platformFee = Math.round(subtotal * 0.05);
    const deliveryFee = (deliveryType === "pickup" || subtotal > 500) ? 0 : 50;
    const totalAmount = subtotal + platformFee + deliveryFee;

    const order = await Order.create({
      buyer: req.user.userId, items, subtotal,
      platformFee, deliveryFee, totalAmount,
      paymentMethod, deliveryType, deliveryAddress, notes,
      status: "placed",
      statusHistory: [{ status: "placed", note: "Order place kiya gaya" }],
    });

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user.userId }, { items: [] });

    // Update product stock
    await Promise.all(items.map(i =>
      Product.findByIdAndUpdate(i.product, {
        $inc: { stock: -i.quantity, totalSold: i.quantity }
      })
    ));

    // Notify sellers
    const sellerIds = [...new Set(items.map(i => i.seller.toString()))];
    await Promise.all(sellerIds.map(sellerId =>
      Notification.create({
        user: sellerId,
        title: "Naya Order Aaya! 📦",
        message: `Order #${order.orderNumber} — ₹${totalAmount}`,
        type: "order", data: { orderId: order._id },
      })
    ));

    res.status(201).json({
      success: true, order,
      message: `Order #${order.orderNumber} place ho gaya! 🎉`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;
    let filter = {};

    if (role === "buyer")  filter.buyer  = userId;
    else if (role === "driver") filter.driver = userId;
    else if (role === "seller") filter["items.seller"] = userId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("buyer",  "name phone address")
        .populate("driver", "name phone vehicleType")
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, orders, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyer",  "name phone address")
      .populate("driver", "name phone vehicleType vehicleNumber")
      .populate("items.product", "name images");
    if (!order) return res.status(404).json({ success: false, message: "Order nahi mila" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note, driverId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order nahi mila" });

    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: req.user.userId });
    if (driverId) order.driver = driverId;
    if (status === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = order.paymentMethod === "cod" ? "paid" : order.paymentStatus;
    }
    await order.save();

    // Notify buyer
    const statusMessages = {
      confirmed:  "Aapka order confirm ho gaya! ✅",
      packed:     "Aapka order pack ho gaya 📦",
      picked_up:  "Driver ne order pick up kar liya 🚛",
      in_transit: "Aapka order raste mein hai 🛣️",
      delivered:  "Order deliver ho gaya! Kheti mein kaam aaye 🌾",
      cancelled:  "Order cancel ho gaya",
    };
    if (statusMessages[status]) {
      await Notification.create({
        user: order.buyer, title: `Order Update — #${order.orderNumber}`,
        message: statusMessages[status], type: "order",
        data: { orderId: order._id },
      });
    }

    res.json({ success: true, order, message: `Status update: ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order nahi mila" });
    if (["delivered","cancelled"].includes(order.status))
      return res.status(400).json({ success: false, message: "Yeh order cancel nahi ho sakta" });

    order.status = "cancelled";
    order.cancelReason = reason;
    order.statusHistory.push({ status: "cancelled", note: reason, updatedBy: req.user.userId });
    await order.save();

    // Restore stock
    await Promise.all(order.items.map(i =>
      Product.findByIdAndUpdate(i.product, { $inc: { stock: i.quantity } })
    ));

    res.json({ success: true, message: "Order cancel ho gaya" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const today    = new Date(); today.setHours(0,0,0,0);
    const month    = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalOrders, todayOrders, monthlyOrders, totalProducts, reviews] = await Promise.all([
      Order.countDocuments({ "items.seller": sellerId }),
      Order.countDocuments({ "items.seller": sellerId, createdAt: { $gte: today } }),
      Order.find({ "items.seller": sellerId, createdAt: { $gte: month } }),
      Product.countDocuments({ seller: sellerId, isActive: true }),
      Review.find({ target: sellerId, targetType: "seller" }),
    ]);

    const monthlyRevenue = monthlyOrders.reduce((s, o) => {
      const myItems = o.items.filter(i => i.seller.toString() === sellerId);
      return s + myItems.reduce((ss, i) => ss + i.subtotal, 0);
    }, 0);

    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ success: true, stats: {
      totalOrders, todayOrders, monthlyRevenue, totalProducts,
      avgRating, totalReviews: reviews.length,
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
