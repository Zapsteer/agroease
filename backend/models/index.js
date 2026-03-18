const mongoose = require("mongoose");

// ──────────────────────────────────────────────────
// USER MODEL
// ──────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  phone:       { type: String, required: true, unique: true, trim: true },
  role:        { type: String, enum: ["buyer","seller","driver","admin"], required: true },
  isActive:    { type: Boolean, default: true },
  profileImage:{ type: String, default: "" },
  address:     { type: String, default: "" },
  location: {
    type:        { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [76.9, 31.1] } // [lng, lat]
  },
  // Seller fields
  shopName:       { type: String },
  shopDescription:{ type: String },
  shopRating:     { type: Number, default: 0 },
  totalReviews:   { type: Number, default: 0 },
  isShopOpen:     { type: Boolean, default: true },
  shopImages:     [{ type: String }],
  shopCategories: [{ type: String }],
  // Driver fields
  vehicleType:    { type: String, enum: ["bike","tempo","truck","jeep"] },
  vehicleNumber:  { type: String },
  isAvailable:    { type: Boolean, default: false },
  driverRating:   { type: Number, default: 0 },
  totalDeliveries:{ type: Number, default: 0 },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  // Earnings
  totalEarnings:  { type: Number, default: 0 },
}, { timestamps: true });

userSchema.index({ location: "2dsphere" });

// ──────────────────────────────────────────────────
// OTP MODEL
// ──────────────────────────────────────────────────
const otpSchema = new mongoose.Schema({
  phone:     { type: String, required: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date,   required: true },
  isUsed:    { type: Boolean, default: false },
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ──────────────────────────────────────────────────
// PRODUCT MODEL
// ──────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  seller:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  category:    { type: String, enum: ["fertilizer","pesticide","seed","tool","organic","equipment","other"], required: true },
  subCategory: { type: String },
  cropTypes:   [{ type: String }], // apple, peach, wheat, maize...
  price:       { type: Number, required: true },
  mrp:         { type: Number },   // MRP to show discount
  unit:        { type: String, default: "kg" },
  stock:       { type: Number, default: 0 },
  images:      [{ type: String }],
  brand:       { type: String },
  isActive:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  rating:      { type: Number, default: 0 },
  totalRatings:{ type: Number, default: 0 },
  totalSold:   { type: Number, default: 0 },
  tags:        [{ type: String }],
}, { timestamps: true });

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ seller: 1 });

// ──────────────────────────────────────────────────
// CART MODEL
// ──────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, default: 1, min: 1 },
  price:    { type: Number }, // price snapshot at time of adding
});

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  items: [cartItemSchema],
}, { timestamps: true });

// ──────────────────────────────────────────────────
// ORDER MODEL
// ──────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  seller:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  productName: { type: String },
  productImage:{ type: String },
  price:       { type: Number },
  quantity:    { type: Number },
  subtotal:    { type: Number },
  unit:        { type: String },
});

const orderSchema = new mongoose.Schema({
  orderNumber:  { type: String, unique: true },
  buyer:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items:        [orderItemSchema],
  // Amounts
  subtotal:     { type: Number },
  platformFee:  { type: Number, default: 0 },
  deliveryFee:  { type: Number, default: 0 },
  discount:     { type: Number, default: 0 },
  totalAmount:  { type: Number, required: true },
  // Payment
  paymentMethod:{ type: String, enum: ["cod","online"], default: "cod" },
  paymentStatus:{ type: String, enum: ["pending","paid","failed","refunded"], default: "pending" },
  razorpayOrderId:  { type: String },
  razorpayPaymentId:{ type: String },
  // Delivery
  deliveryType:   { type: String, enum: ["pickup","delivery"], default: "delivery" },
  driver:         { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  deliveryAddress:{ type: String },
  deliveryLocation:{
    type:        { type: String, enum: ["Point"], default: "Point" },
    coordinates: [Number],
  },
  estimatedDelivery: { type: Date },
  deliveredAt:       { type: Date },
  // Status
  status: {
    type: String,
    enum: ["placed","confirmed","packed","picked_up","in_transit","delivered","cancelled","rejected"],
    default: "placed",
  },
  statusHistory: [{
    status:    { type: String },
    timestamp: { type: Date, default: Date.now },
    note:      { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }],
  cancelReason:{ type: String },
  notes:       { type: String },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre("save", async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `AE${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(3, "0")}`;
  }
  next();
});

// ──────────────────────────────────────────────────
// REVIEW MODEL
// ──────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  target:   { type: mongoose.Schema.Types.ObjectId, required: true }, // product or user
  targetType:{ type: String, enum: ["product","seller","driver"] },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String },
  order:    { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
}, { timestamps: true });

// ──────────────────────────────────────────────────
// DISEASE DETECTION MODEL
// ──────────────────────────────────────────────────
const diseaseSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  imageUrl:   { type: String, required: true },
  cropType:   { type: String },
  diseaseName:{ type: String },
  confidence: { type: Number },
  cause:      { type: String },
  treatment:  { type: String },
  prevention: { type: String },
  severity:   { type: String, enum: ["low","medium","high"] },
  recommendedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  aiResponse: { type: String }, // raw AI response
  status:     { type: String, enum: ["processing","completed","failed"], default: "processing" },
}, { timestamps: true });

// ──────────────────────────────────────────────────
// NOTIFICATION MODEL
// ──────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ["order","delivery","weather","promo","system"], default: "system" },
  isRead:  { type: Boolean, default: false },
  data:    { type: mongoose.Schema.Types.Mixed }, // extra data like orderId
}, { timestamps: true });

// ──────────────────────────────────────────────────
// VIDEO MODEL (Creator Section)
// ──────────────────────────────────────────────────
const videoSchema = new mongoose.Schema({
  creator:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:      { type: String, required: true },
  description:{ type: String },
  videoUrl:   { type: String, required: true },
  thumbnail:  { type: String },
  duration:   { type: Number }, // seconds
  views:      { type: Number, default: 0 },
  likes:      { type: Number, default: 0 },
  category:   { type: String },
  tags:       [{ type: String }],
  taggedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  isPublished:{ type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  User:             mongoose.model("User", userSchema),
  OTP:              mongoose.model("OTP", otpSchema),
  Product:          mongoose.model("Product", productSchema),
  Cart:             mongoose.model("Cart", cartSchema),
  Order:            mongoose.model("Order", orderSchema),
  Review:           mongoose.model("Review", reviewSchema),
  DiseaseDetection: mongoose.model("DiseaseDetection", diseaseSchema),
  Notification:     mongoose.model("Notification", notificationSchema),
  Video:            mongoose.model("Video", videoSchema),
};
