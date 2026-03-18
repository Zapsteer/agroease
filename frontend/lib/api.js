// ──────────────────────────────────────────────────
// AgroEase API Client
// ──────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("ae_token") : null;

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("ae_user") || "null"); }
  catch { return null; }
};

export const setAuth = (token, user) => {
  localStorage.setItem("ae_token", token);
  localStorage.setItem("ae_user", JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem("ae_token");
  localStorage.removeItem("ae_user");
};

// Core fetch wrapper
async function api(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Kuch galat ho gaya");
  return data;
}

// ── AUTH ─────────────────────────────────────────────────
export const authAPI = {
  sendOTP:   (phone, role) => api("/auth/send-otp",   { method:"POST", body: JSON.stringify({phone,role}) }),
  verifyOTP: (phone, otp, role, name) => api("/auth/verify-otp", { method:"POST", body: JSON.stringify({phone,otp,role,name}) }),
  getMe:     ()       => api("/auth/me"),
  update:    (data)   => api("/auth/profile", { method:"PUT", body: JSON.stringify(data) }),
  getNotifs: ()       => api("/auth/notifications"),
  readNotifs:()       => api("/auth/notifications/read", { method:"PUT" }),
};

// ── PRODUCTS ─────────────────────────────────────────────
export const productAPI = {
  getAll:   (params={}) => api(`/products?${new URLSearchParams(params)}`),
  getOne:   (id)        => api(`/products/${id}`),
  compare:  (name)      => api(`/products/compare/${encodeURIComponent(name)}`),
  getMine:  ()          => api("/products/mine"),
  create:   (d)         => api("/products",     { method:"POST", body: JSON.stringify(d) }),
  update:   (id,d)      => api(`/products/${id}`,{ method:"PUT",  body: JSON.stringify(d) }),
  remove:   (id)        => api(`/products/${id}`,{ method:"DELETE" }),
};

// ── CART ─────────────────────────────────────────────────
export const cartAPI = {
  get:    ()           => api("/cart"),
  add:    (productId, quantity=1) => api("/cart/add",    { method:"POST", body: JSON.stringify({productId,quantity}) }),
  update: (productId, quantity)   => api("/cart/update", { method:"PUT",  body: JSON.stringify({productId,quantity}) }),
  clear:  ()           => api("/cart", { method:"DELETE" }),
};

// ── ORDERS ───────────────────────────────────────────────
export const orderAPI = {
  place:   (d)      => api("/orders",             { method:"POST", body: JSON.stringify(d) }),
  getAll:  (p={})   => api(`/orders?${new URLSearchParams(p)}`),
  getOne:  (id)     => api(`/orders/${id}`),
  updateStatus: (id,status,note,driverId) =>
    api(`/orders/${id}/status`, { method:"PUT", body: JSON.stringify({status,note,driverId}) }),
  cancel:  (id,reason) => api(`/orders/${id}/cancel`, { method:"PUT", body: JSON.stringify({reason}) }),
};

// ── SHOPS ────────────────────────────────────────────────
export const shopAPI = {
  getNearby: (lat,lng,radius=20000) => api(`/shops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getOne:    (id)   => api(`/shops/${id}`),
};

// ── DRIVERS ──────────────────────────────────────────────
export const driverAPI = {
  getNearby:    (lat,lng) => api(`/drivers/nearby?lat=${lat}&lng=${lng}`),
  toggle:       (isAvailable,location) => api("/drivers/availability", { method:"PUT", body: JSON.stringify({isAvailable,location}) }),
  getOrders:    ()  => api("/drivers/orders"),
  getDeliveries:()  => api("/drivers/deliveries"),
};

// ── SELLER ───────────────────────────────────────────────
export const sellerAPI = {
  getStats: () => api("/seller/stats"),
};

// ── AI ───────────────────────────────────────────────────
export const aiAPI = {
  detect:  (d) => api("/ai/detect",  { method:"POST", body: JSON.stringify(d) }),
  history: ()  => api("/ai/history"),
};

// ── REVIEWS ──────────────────────────────────────────────
export const reviewAPI = {
  create: (d) => api("/reviews", { method:"POST", body: JSON.stringify(d) }),
};
