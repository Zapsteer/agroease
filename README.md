# 🌾 AgroEase — Complete Setup & Deployment Guide

## 📦 Project Structure

```
agroease/
├── backend/               ← Node.js + Express API
│   ├── controllers/       ← Auth, Products, Cart, Orders, AI, Shops
│   ├── middleware/        ← JWT auth, role-based access
│   ├── models/            ← MongoDB schemas (User, Product, Order, Cart...)
│   ├── routes/            ← All API routes
│   ├── config/seed.js     ← Sample data seeder
│   ├── server.js          ← Entry point with Socket.io
│   └── .env.example
│
└── frontend/              ← Next.js 14 App
    ├── app/               ← All pages
    │   ├── page.jsx            ← Home
    │   ├── (auth)/login/       ← OTP Login
    │   ├── marketplace/        ← Product listing + filters
    │   ├── product/[id]/       ← Product detail + price compare
    │   ├── cart/               ← Cart + checkout (COD + Online)
    │   ├── orders/             ← Orders (buyer/seller/driver)
    │   ├── shops/              ← Nearby shops + map
    │   ├── ai/                 ← AI disease detection
    │   ├── seller/             ← Seller dashboard + product CRUD
    │   ├── driver/             ← Driver dashboard + deliveries
    │   └── dashboard/          ← Profile + notifications
    ├── components/        ← Navbar, BottomNav, ProductCard
    └── lib/               ← API client, AuthContext
```

---

## 🚀 Step 1: MongoDB Atlas Setup (FREE)

1. Go to **https://cloud.mongodb.com** → Create free account
2. Build a Database → **M0 Free** → Region: **Mumbai (ap-south-1)**
3. Username: `agroease_user` → Password: `your_password`
4. Network Access → Add IP → **Allow from anywhere** (0.0.0.0/0)
5. Connect → "Connect your application" → Copy URI

URI will look like:
```
mongodb+srv://agroease_user:your_password@cluster0.xxxxx.mongodb.net/agroease
```

---

## 🚀 Step 2: Local Development

### Backend Setup
```bash
cd agroease/backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env
# Now edit .env — minimum required:
# MONGODB_URI=your_atlas_uri
# JWT_SECRET=any_long_random_string_here

# Seed sample data (shops, products, test users)
node config/seed.js

# Start development server
npm run dev
# ✅ Server runs at http://localhost:5000
```

### Frontend Setup
```bash
cd agroease/frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start development server
npm run dev
# ✅ App runs at http://localhost:3000
```

### Test Credentials (after seed)
| Role   | Phone      | OTP          |
|--------|-----------|--------------|
| Seller | 9816001001 | shown in console |
| Buyer  | 9816002001 | shown in console |
| Driver | 9816003001 | shown in console |

---

## ☁️ Step 3: Deploy Backend on Render.com (FREE)

1. Push your code to **GitHub**
2. Go to **https://render.com** → Sign up
3. New → **Web Service**
4. Connect GitHub → Select your repo
5. Settings:
   - **Name**: `agroease-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Environment Variables** — Add all from `.env.example`:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_atlas_uri
   JWT_SECRET=your_secret_here
   FRONTEND_URL=https://agroease.vercel.app
   ```
7. Click **Deploy**!

Your backend URL: `https://agroease-backend.onrender.com`

**⚠️ Note:** Free tier sleeps after 15 min of inactivity. Upgrade to Starter ($7/mo) for always-on.

---

## ☁️ Step 4: Deploy Frontend on Vercel (FREE)

1. Go to **https://vercel.com** → Sign up with GitHub
2. **Add New Project** → Import from GitHub
3. Settings:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://agroease-backend.onrender.com/api
   ```
5. Click **Deploy**!

Your app URL: `https://agroease.vercel.app`

---

## 📱 Step 5: SMS Setup (Fast2SMS — Free for India)

1. Go to **https://fast2sms.com** → Register
2. Complete KYC
3. Go to Dev API → Get API Key
4. Add to backend `.env`:
   ```
   FAST2SMS_API_KEY=your_key_here
   ```

**In development**: OTP is printed in server console — no SMS needed.

---

## 💳 Step 6: Razorpay Payment (Optional)

1. Go to **https://dashboard.razorpay.com** → Sign up
2. Get Test Keys from Settings → API Keys
3. Add to backend `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret
   ```
4. Add to frontend `.env.local`:
   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   ```

---

## 🤖 Step 7: AI Disease Detection (OpenAI)

1. Go to **https://platform.openai.com** → Sign up
2. API Keys → Create new secret key
3. Add to backend `.env`:
   ```
   OPENAI_API_KEY=sk-your_key_here
   ```

**Without OpenAI key**: Mock disease data is used automatically — works for demo!

---

## 🌐 Custom Domain (Optional)

### On Vercel:
1. Project Settings → Domains
2. Add domain: `agroease.com` or `agroeaseHP.com`
3. Add DNS records as shown

### On Render:
1. Service Settings → Custom Domains
2. Add: `api.agroease.com`

---

## 🔑 Complete API Reference

### Authentication
```
POST /api/auth/send-otp     { phone, role }
POST /api/auth/verify-otp   { phone, otp, role, name? }
GET  /api/auth/me
PUT  /api/auth/profile
GET  /api/auth/notifications
PUT  /api/auth/notifications/read
```

### Products
```
GET    /api/products                    ?category&search&sort&page
GET    /api/products/:id
GET    /api/products/compare/:name
GET    /api/products/mine               [Seller]
POST   /api/products                    [Seller]
PUT    /api/products/:id                [Seller]
DELETE /api/products/:id                [Seller]
```

### Cart & Orders
```
GET    /api/cart                        [Buyer]
POST   /api/cart/add     {productId,qty}
PUT    /api/cart/update  {productId,qty}
DELETE /api/cart

POST   /api/orders       {deliveryAddress,paymentMethod}
GET    /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id/status  {status}
PUT    /api/orders/:id/cancel  {reason}
```

### Shops & Drivers
```
GET /api/shops/nearby     ?lat&lng&radius
GET /api/shops/:id
GET /api/drivers/nearby   ?lat&lng
PUT /api/drivers/availability {isAvailable}
GET /api/drivers/deliveries
```

### AI
```
POST /api/ai/detect   {imageBase64, cropType}
GET  /api/ai/history
```

---

## 📊 Revenue Model

| Source            | Amount          |
|-------------------|-----------------|
| Platform fee      | 5% per order    |
| Delivery charges  | ₹50 (free >₹500)|
| Seller listing    | Future paid plan|

---

## 🛣️ Roadmap

- ✅ Phase 1 — Auth + Marketplace + Cart + Orders
- ✅ Phase 2 — Delivery system + Driver dashboard
- ✅ Phase 3 — AI Disease Detection
- 🔲 Google Maps live integration
- 🔲 Razorpay online payment
- 🔲 Push notifications (FCM)
- 🔲 Flutter mobile app
- 🔲 Creator/video section
- 🔲 Pahari language support
