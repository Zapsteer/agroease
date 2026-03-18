const jwt    = require("jsonwebtoken");
const axios  = require("axios");
const { User, OTP, Notification } = require("../models");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ── Send OTP via Fast2SMS ────────────────────────────────
async function sendSMS(phone, otp) {
  if (process.env.NODE_ENV === "development") {
    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);
    return true;
  }
  try {
    await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        variables_values: otp,
        route: "otp",
        numbers: phone,
      },
    });
    return true;
  } catch (err) {
    console.error("SMS error:", err.message);
    return false;
  }
}

// ── POST /api/auth/send-otp ──────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { phone, role } = req.body;
    if (!phone || !/^\d{10}$/.test(phone))
      return res.status(400).json({ success: false, message: "Valid 10-digit phone number dein" });
    if (!["buyer","seller","driver"].includes(role))
      return res.status(400).json({ success: false, message: "Valid role chunein" });

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await OTP.deleteMany({ phone });
    await OTP.create({ phone, otp, expiresAt });
    await sendSMS(phone, otp);

    res.json({
      success: true,
      message: `OTP ${phone} par bheja gaya`,
      ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /api/auth/verify-otp ────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp, role, name } = req.body;

    const record = await OTP.findOne({
      phone, isUsed: false, expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record || record.otp !== otp)
      return res.status(400).json({ success: false, message: "OTP galat hai ya expire ho gaya" });

    record.isUsed = true;
    await record.save();

    let user      = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      if (!name) return res.status(400).json({ success: false, message: "Apna naam dein", needsName: true });
      user = await User.create({ phone, name, role });
      isNewUser = true;
      // Welcome notification
      await Notification.create({
        user: user._id, title: "AgroEase mein Swagat! 🌾",
        message: `Namaste ${name}! AgroEase par aapka swagat hai.`, type: "system",
      });
    }

    const token = signToken(user);
    res.json({
      success: true, token, isNewUser,
      user: { _id: user._id, name: user.name, phone: user.phone, role: user.role,
               shopName: user.shopName, profileImage: user.profileImage },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/auth/me ────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-__v");
    if (!user) return res.status(404).json({ success: false, message: "User nahi mila" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PUT /api/auth/profile ───────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ["name","address","shopName","shopDescription","vehicleType","vehicleNumber",
                     "shopCategories","isShopOpen","isAvailable","location","profileImage"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true }).select("-__v");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/auth/notifications ─────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const { Notification } = require("../models");
    const notifs = await Notification.find({ user: req.user.userId })
      .sort({ createdAt: -1 }).limit(30);
    const unread = notifs.filter(n => !n.isRead).length;
    res.json({ success: true, notifications: notifs, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PUT /api/auth/notifications/read ────────────────────
exports.markNotificationsRead = async (req, res) => {
  try {
    const { Notification } = require("../models");
    await Notification.updateMany({ user: req.user.userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: "Sab notifications read mark ho gayi" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
