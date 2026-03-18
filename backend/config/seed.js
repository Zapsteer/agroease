/**
 * AgroEase — Database Seeder
 * Run: node config/seed.js
 * Seeds sample shops, products, and test users
 */

require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { User, Product } = require("../models");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/agroease";

const sellers = [
  {
    name: "Ramesh Sharma", phone: "9816001001", role: "seller",
    shopName: "Sharma Agro Store", shopDescription: "Shimla ki sabse purani agri shop — 25 saal ka anubhav",
    address: "The Mall, Shimla, HP", shopRating: 4.8, totalReviews: 126, isShopOpen: true,
    shopCategories: ["fertilizer","pesticide","seed"],
    location: { type: "Point", coordinates: [77.1734, 31.1048] },
  },
  {
    name: "Suresh Verma", phone: "9816001002", role: "seller",
    shopName: "Kullu Beej Ghar", shopDescription: "Certified organic seeds aur natural fertilizers",
    address: "Dhalpur, Kullu, HP", shopRating: 4.5, totalReviews: 89, isShopOpen: true,
    shopCategories: ["seed","organic"],
    location: { type: "Point", coordinates: [77.1059, 31.9579] },
  },
  {
    name: "Vikram Thakur", phone: "9816001003", role: "seller",
    shopName: "Mandi Agri Hub", shopDescription: "Pesticides, tools, aur chemical fertilizers",
    address: "Indira Market, Mandi, HP", shopRating: 4.3, totalReviews: 54, isShopOpen: false,
    shopCategories: ["pesticide","tool","equipment"],
    location: { type: "Point", coordinates: [76.9182, 31.7083] },
  },
];

const buyers = [
  {
    name: "Mohan Lal", phone: "9816002001", role: "buyer",
    address: "Jubbarhatti, Shimla, HP",
    location: { type: "Point", coordinates: [77.15, 31.09] },
  },
  {
    name: "Kamal Devi", phone: "9816002002", role: "buyer",
    address: "Rampur Bushahr, Shimla, HP",
    location: { type: "Point", coordinates: [77.63, 31.45] },
  },
];

const drivers = [
  {
    name: "Rajesh Kumar", phone: "9816003001", role: "driver",
    vehicleType: "tempo", vehicleNumber: "HP01A1234", isAvailable: true,
    driverRating: 4.7, totalDeliveries: 203,
    address: "Sanjauli, Shimla, HP",
    location: { type: "Point", coordinates: [77.18, 31.10] },
  },
];

const getProducts = (sellerIds) => [
  // Fertilizers
  { seller: sellerIds[0], name: "DAP Fertilizer 50kg", description: "Di-Ammonium Phosphate — P:46% N:18%. Apple, peach, wheat ke liye best.", category: "fertilizer", cropTypes: ["apple","peach","wheat","maize"], price: 1350, mrp: 1500, unit: "bag", stock: 150, brand: "IFFCO", isFeatured: true, tags: ["dap","phosphorus","nitrogen"] },
  { seller: sellerIds[0], name: "Urea 50kg", description: "Nitrogen 46% — sabse zyada use hone wala nitrogen fertilizer.", category: "fertilizer", cropTypes: ["apple","wheat","maize","vegetable"], price: 267, mrp: 300, unit: "bag", stock: 200, brand: "IFFCO", isFeatured: true, tags: ["urea","nitrogen"] },
  { seller: sellerIds[0], name: "NPK 19:19:19", description: "Balanced water-soluble fertilizer. Drip ya foliar spray ke liye ideal.", category: "fertilizer", cropTypes: ["apple","peach","plum","vegetable"], price: 850, mrp: 950, unit: "kg", stock: 80, brand: "Coromandel", tags: ["npk","water soluble","foliar"] },
  { seller: sellerIds[1], name: "Vermicompost Organic", description: "100% organic vermicompost — mitti ki quality badhata hai.", category: "organic", cropTypes: ["apple","vegetable","wheat"], price: 120, mrp: 150, unit: "kg", stock: 500, brand: "HP Organic", isFeatured: true, tags: ["organic","vermicompost","natural"] },
  { seller: sellerIds[2], name: "MOP (Potash) 50kg", description: "Muriate of Potash — 60% K2O. Fruit quality badhata hai.", category: "fertilizer", cropTypes: ["apple","peach","plum"], price: 980, mrp: 1100, unit: "bag", stock: 90, brand: "IPL", tags: ["potash","potassium","mop"] },
  // Pesticides
  { seller: sellerIds[0], name: "Mancozeb 75% WP", description: "Broad spectrum fungicide — apple scab, blight ke liye.", category: "pesticide", cropTypes: ["apple","peach","wheat"], price: 280, mrp: 320, unit: "kg", stock: 120, brand: "Dhanuka", isFeatured: true, tags: ["fungicide","mancozeb","scab"] },
  { seller: sellerIds[0], name: "Chlorpyrifos 20% EC", description: "Insecticide — soil pests aur leaf-eating insects ke liye.", category: "pesticide", cropTypes: ["apple","wheat","maize"], price: 450, mrp: 520, unit: "L", stock: 60, brand: "Tata Rallis", tags: ["insecticide","chlorpyrifos"] },
  { seller: sellerIds[2], name: "Profex Super (Profenofos)", description: "Sucking pests ke liye — aphids, mites, thrips.", category: "pesticide", cropTypes: ["apple","peach","vegetable"], price: 420, mrp: 480, unit: "L", stock: 45, brand: "FMC", tags: ["profenofos","aphids","mites"] },
  { seller: sellerIds[2], name: "Bordeaux Mixture", description: "Copper-based fungicide — peach leaf curl aur canker ke liye.", category: "pesticide", cropTypes: ["peach","plum","apple"], price: 180, mrp: 220, unit: "kg", stock: 200, brand: "Local", tags: ["copper","bordeaux","fungicide"] },
  { seller: sellerIds[1], name: "Neem Oil 1L", description: "Organic pesticide — eco-friendly, sab pests ke liye.", category: "pesticide", cropTypes: ["apple","vegetable","herbs"], price: 350, mrp: 400, unit: "L", stock: 85, brand: "Krishi Organic", tags: ["neem","organic","bio-pesticide"] },
  // Seeds
  { seller: sellerIds[1], name: "Royal Delicious Apple Scion", description: "Certified HP scion — high yield, 800g+ apple. HPMC approved.", category: "seed", cropTypes: ["apple"], price: 850, mrp: 1000, unit: "piece", stock: 300, brand: "HPMC", isFeatured: true, tags: ["apple","scion","royal delicious"] },
  { seller: sellerIds[1], name: "Red Gold Peach Seeds", description: "Early bearing peach variety — Shimla hills ke liye best.", category: "seed", cropTypes: ["peach"], price: 650, mrp: 750, unit: "kg", stock: 150, brand: "HP Seeds", tags: ["peach","red gold","seed"] },
  { seller: sellerIds[1], name: "Shimla Tomato Hybrid", description: "High yield tomato — cold tolerant, 2-3 kg per plant.", category: "seed", cropTypes: ["vegetable","tomato"], price: 180, mrp: 220, unit: "packet", stock: 400, brand: "Syngenta", tags: ["tomato","hybrid","vegetable"] },
  // Tools
  { seller: sellerIds[2], name: "Pruning Shear (Felco Type)", description: "Professional apple tree pruning shear — Swiss design.", category: "tool", cropTypes: ["apple","peach","plum"], price: 650, mrp: 800, unit: "piece", stock: 35, brand: "JK Tools", tags: ["pruning","shear","tool"] },
  { seller: sellerIds[2], name: "Knapsack Sprayer 16L", description: "Manual knapsack sprayer — light weight, durable pump.", category: "equipment", cropTypes: ["apple","peach","wheat"], price: 1200, mrp: 1500, unit: "piece", stock: 25, brand: "Neptune", tags: ["sprayer","knapsack","equipment"] },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({ role: { $in: ["seller","buyer","driver"] } });
    await Product.deleteMany({});
    console.log("🗑️  Old data cleared");

    // Create users
    const createdSellers = await User.insertMany(sellers);
    await User.insertMany(buyers);
    await User.insertMany(drivers);
    console.log(`👤 Created ${sellers.length + buyers.length + drivers.length} users`);

    // Create products
    const sellerIds = createdSellers.map(s => s._id);
    const products  = getProducts(sellerIds);
    await Product.insertMany(products);
    console.log(`📦 Created ${products.length} products`);

    console.log("\n✅ Seed complete!");
    console.log("\n🔑 Test Credentials:");
    console.log("   Seller: 9816001001 | OTP: any 6 digits (dev mode)");
    console.log("   Buyer:  9816002001 | OTP: any 6 digits (dev mode)");
    console.log("   Driver: 9816003001 | OTP: any 6 digits (dev mode)\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
