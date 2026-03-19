"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://agroease-backend.onrender.com/api";

// ── Helpers ─────────────────────────────────────────────
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;

const fetcher = async (path) => {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
};

const patcher = async (path, body) => {
  const res = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  });
  return res.json();
};

const deleter = async (path) => {
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
};

// ── Status Badge ─────────────────────────────────────────
const STATUS_COLORS = {
  placed: "#f59e0b", confirmed: "#3b82f6", packed: "#8b5cf6",
  picked_up: "#06b6d4", in_transit: "#f97316", delivered: "#22c55e",
  cancelled: "#ef4444", rejected: "#dc2626",
  active: "#22c55e", banned: "#ef4444",
  paid: "#22c55e", pending: "#f59e0b", failed: "#ef4444", refunded: "#8b5cf6"
};

const Badge = ({ label }) => (
  <span style={{
    background: (STATUS_COLORS[label] || "#6b7280") + "22",
    color: STATUS_COLORS[label] || "#6b7280",
    border: `1px solid ${STATUS_COLORS[label] || "#6b7280"}44`,
    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 1
  }}>{label}</span>
);

// ── Stat Card ────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, sub }) => (
  <div style={{
    background: "#111", border: "1px solid #1f1f1f",
    borderRadius: 16, padding: "20px 24px",
    borderLeft: `3px solid ${color}`
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ color: "#666", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>{label}</p>
        <p style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "6px 0 4px", fontFamily: "monospace" }}>{value}</p>
        {sub && <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{sub}</p>}
      </div>
      <span style={{ fontSize: 28 }}>{icon}</span>
    </div>
  </div>
);

// ── Table ────────────────────────────────────────────────
const Table = ({ cols, rows, emptyMsg = "Koi data nahi" }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #1f1f1f" }}>
          {cols.map(c => (
            <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "#555", fontWeight: 700,
              fontSize: 11, textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={cols.length} style={{ padding: 40, textAlign: "center", color: "#444" }}>{emptyMsg}</td></tr>
        ) : rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #161616", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#161616"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            {r.map((cell, j) => (
              <td key={j} style={{ padding: "12px 14px", color: "#ccc", whiteSpace: "nowrap" }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Pagination ───────────────────────────────────────────
const Pagination = ({ page, pages, setPage }) => (
  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 20 }}>
    {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
      <button key={p} onClick={() => setPage(p)} style={{
        width: 34, height: 34, borderRadius: 8, border: "1px solid",
        borderColor: p === page ? "#16a34a" : "#222",
        background: p === page ? "#16a34a" : "transparent",
        color: p === page ? "#fff" : "#666",
        fontWeight: 700, cursor: "pointer", fontSize: 13
      }}>{p}</button>
    ))}
  </div>
);

// ── Search Input ─────────────────────────────────────────
const SearchInput = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Search..."}
    style={{
      background: "#111", border: "1px solid #222", borderRadius: 10,
      padding: "8px 14px", color: "#fff", fontSize: 13, outline: "none", width: 220
    }} />
);

// ── Select ───────────────────────────────────────────────
const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    background: "#111", border: "1px solid #222", borderRadius: 10,
    padding: "8px 14px", color: "#ccc", fontSize: 13, outline: "none", cursor: "pointer"
  }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

// ── Action Button ────────────────────────────────────────
const Btn = ({ onClick, color = "#16a34a", children, small }) => (
  <button onClick={onClick} style={{
    background: color + "22", border: `1px solid ${color}44`,
    color, borderRadius: 8, padding: small ? "4px 10px" : "8px 16px",
    fontSize: small ? 11 : 13, fontWeight: 700, cursor: "pointer",
    transition: "all 0.15s", whiteSpace: "nowrap"
  }}
    onMouseEnter={e => { e.currentTarget.style.background = color + "44"; }}
    onMouseLeave={e => { e.currentTarget.style.background = color + "22"; }}>
    {children}
  </button>
);

// ══════════════════════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════════════════════

// ── Dashboard Tab ────────────────────────────────────────
function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetcher("/admin/dashboard").then(r => { if (r.success) setData(r.data); setLoading(false); });
  }, []);

  if (loading) return <p style={{ color: "#555", padding: 40, textAlign: "center" }}>Loading...</p>;
  if (!data)   return <p style={{ color: "#ef4444", padding: 40, textAlign: "center" }}>Data nahi mila</p>;

  const { stats, recentOrders, topProducts } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        <StatCard icon="👥" label="Total Users"    value={stats.totalUsers}    color="#3b82f6" />
        <StatCard icon="📦" label="Total Orders"   value={stats.totalOrders}   color="#f59e0b" sub={`Today: ${stats.todayOrders}`} />
        <StatCard icon="🌱" label="Products"       value={stats.totalProducts} color="#22c55e" />
        <StatCard icon="🏪" label="Sellers"        value={stats.totalSellers}  color="#8b5cf6" />
        <StatCard icon="🚚" label="Drivers"        value={stats.totalDrivers}  color="#06b6d4" />
        <StatCard icon="💰" label="Total Revenue"  value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} color="#16a34a" />
        <StatCard icon="⏳" label="Pending Orders" value={stats.pendingOrders}  color="#f97316" />
        <StatCard icon="✅" label="Delivered"      value={stats.deliveredOrders} color="#22c55e" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Orders */}
        <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>🕐 Recent Orders</h3>
          <Table
            cols={["Order", "Buyer", "Amount", "Status"]}
            rows={recentOrders.map(o => [
              <span style={{ color: "#16a34a", fontWeight: 700 }}>{o.orderNumber}</span>,
              o.buyer?.name || "—",
              `₹${o.totalAmount}`,
              <Badge label={o.status} />
            ])}
          />
        </div>

        {/* Top Products */}
        <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>🔥 Top Products</h3>
          <Table
            cols={["Product", "Sold", "Revenue"]}
            rows={topProducts.map(p => [
              p.name,
              p.totalSold,
              `₹${p.revenue?.toLocaleString() || 0}`
            ])}
          />
        </div>
      </div>
    </div>
  );
}

// ── Orders Tab ───────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("all");
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15, status, search });
    const r = await fetcher(`/admin/orders?${params}`);
    if (r.success) { setOrders(r.data); setTotal(r.total); setPages(r.pages); }
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, newStatus) => {
    const r = await patcher(`/admin/orders/${id}/status`, { status: newStatus });
    if (r.success) load();
    else alert(r.message);
  };

  const STATUS_OPTIONS = [
    { value: "all", label: "Sab Orders" },
    { value: "placed", label: "Placed" },
    { value: "confirmed", label: "Confirmed" },
    { value: "packed", label: "Packed" },
    { value: "in_transit", label: "In Transit" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const NEXT_STATUS = {
    placed: "confirmed", confirmed: "packed", packed: "picked_up",
    picked_up: "in_transit", in_transit: "delivered"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Order number search..." />
        <Select value={status} onChange={v => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} />
        <span style={{ color: "#555", fontSize: 13, marginLeft: "auto" }}>{total} orders</span>
      </div>

      <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 20 }}>
        {loading ? <p style={{ color: "#555", textAlign: "center", padding: 40 }}>Loading...</p> : (
          <Table
            cols={["Order #", "Buyer", "Amount", "Payment", "Status", "Date", "Action"]}
            rows={orders.map(o => [
              <span style={{ color: "#16a34a", fontWeight: 700 }}>{o.orderNumber}</span>,
              <div>
                <div style={{ color: "#fff", fontWeight: 600 }}>{o.buyer?.name || "—"}</div>
                <div style={{ color: "#555", fontSize: 11 }}>{o.buyer?.phone}</div>
              </div>,
              <span style={{ fontWeight: 700, color: "#fff" }}>₹{o.totalAmount}</span>,
              <Badge label={o.paymentStatus} />,
              <Badge label={o.status} />,
              new Date(o.createdAt).toLocaleDateString("en-IN"),
              NEXT_STATUS[o.status] ? (
                <Btn small onClick={() => updateStatus(o._id, NEXT_STATUS[o.status])} color="#16a34a">
                  → {NEXT_STATUS[o.status]}
                </Btn>
              ) : o.status === "placed" ? (
                <Btn small onClick={() => updateStatus(o._id, "cancelled")} color="#ef4444">Cancel</Btn>
              ) : "—"
            ])}
          />
        )}
        {pages > 1 && <Pagination page={page} pages={pages} setPage={setPage} />}
      </div>
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [role, setRole]       = useState("all");
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15, role, search });
    const r = await fetcher(`/admin/users?${params}`);
    if (r.success) { setUsers(r.data); setTotal(r.total); setPages(r.pages); }
    setLoading(false);
  }, [page, role, search]);

  useEffect(() => { load(); }, [load]);

  const toggleBan = async (id) => {
    const r = await patcher(`/admin/users/${id}/ban`, {});
    if (r.success) load();
    else alert(r.message);
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`"${name}" ko delete karna chahte ho?`)) return;
    const r = await deleter(`/admin/users/${id}`);
    if (r.success) load();
    else alert(r.message);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Name ya phone..." />
        <Select value={role} onChange={v => { setRole(v); setPage(1); }} options={[
          { value: "all", label: "Sab Roles" },
          { value: "buyer", label: "Buyers" },
          { value: "seller", label: "Sellers" },
          { value: "driver", label: "Drivers" },
          { value: "admin", label: "Admins" },
        ]} />
        <span style={{ color: "#555", fontSize: 13, marginLeft: "auto" }}>{total} users</span>
      </div>

      <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 20 }}>
        {loading ? <p style={{ color: "#555", textAlign: "center", padding: 40 }}>Loading...</p> : (
          <Table
            cols={["Name", "Phone", "Role", "Status", "Joined", "Actions"]}
            rows={users.map(u => [
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#16a34a22", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 14, color: "#16a34a", fontWeight: 700
                }}>{u.name?.[0]?.toUpperCase()}</div>
                <span style={{ color: "#fff", fontWeight: 600 }}>{u.name}</span>
              </div>,
              u.phone,
              <Badge label={u.role} />,
              <Badge label={u.isActive ? "active" : "banned"} />,
              new Date(u.createdAt).toLocaleDateString("en-IN"),
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small onClick={() => toggleBan(u._id)} color={u.isActive ? "#ef4444" : "#22c55e"}>
                  {u.isActive ? "Ban" : "Unban"}
                </Btn>
                {u.role !== "admin" && (
                  <Btn small onClick={() => deleteUser(u._id, u.name)} color="#ef4444">Delete</Btn>
                )}
              </div>
            ])}
          />
        )}
        {pages > 1 && <Pagination page={page} pages={pages} setPage={setPage} />}
      </div>
    </div>
  );
}

// ── Products Tab ─────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15, category, search });
    const r = await fetcher(`/admin/products?${params}`);
    if (r.success) { setProducts(r.data); setTotal(r.total); setPages(r.pages); }
    setLoading(false);
  }, [page, category, search]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (id) => {
    await patcher(`/admin/products/${id}/toggle`, {});
    load();
  };

  const toggleFeatured = async (id) => {
    await patcher(`/admin/products/${id}/featured`, {});
    load();
  };

  const deleteProduct = async (id, name) => {
    if (!confirm(`"${name}" delete karna chahte ho?`)) return;
    await deleter(`/admin/products/${id}`);
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Product name..." />
        <Select value={category} onChange={v => { setCategory(v); setPage(1); }} options={[
          { value: "all", label: "Sab Categories" },
          { value: "fertilizer", label: "Fertilizer" },
          { value: "pesticide", label: "Pesticide" },
          { value: "seed", label: "Seeds" },
          { value: "tool", label: "Tools" },
          { value: "organic", label: "Organic" },
          { value: "equipment", label: "Equipment" },
        ]} />
        <span style={{ color: "#555", fontSize: 13, marginLeft: "auto" }}>{total} products</span>
      </div>

      <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 20 }}>
        {loading ? <p style={{ color: "#555", textAlign: "center", padding: 40 }}>Loading...</p> : (
          <Table
            cols={["Product", "Seller", "Category", "Price", "Stock", "Status", "Actions"]}
            rows={products.map(p => [
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>🌱</div>
                )}
                <div>
                  <div style={{ color: "#fff", fontWeight: 600, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  {p.isFeatured && <span style={{ color: "#f59e0b", fontSize: 10 }}>⭐ Featured</span>}
                </div>
              </div>,
              p.seller?.shopName || p.seller?.name || "—",
              <Badge label={p.category} />,
              <span style={{ fontWeight: 700 }}>₹{p.price}</span>,
              <span style={{ color: p.stock < 10 ? "#ef4444" : "#22c55e" }}>{p.stock}</span>,
              <Badge label={p.isActive ? "active" : "inactive"} />,
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small onClick={() => toggleActive(p._id)} color={p.isActive ? "#ef4444" : "#22c55e"}>
                  {p.isActive ? "Hide" : "Show"}
                </Btn>
                <Btn small onClick={() => toggleFeatured(p._id)} color="#f59e0b">
                  {p.isFeatured ? "Unfeature" : "Feature"}
                </Btn>
                <Btn small onClick={() => deleteProduct(p._id, p.name)} color="#ef4444">Del</Btn>
              </div>
            ])}
          />
        )}
        {pages > 1 && <Pagination page={page} pages={pages} setPage={setPage} />}
      </div>
    </div>
  );
}

// ── Sellers Tab ──────────────────────────────────────────
function SellersTab() {
  const [sellers, setSellers] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [verified, setVerified] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15, search, ...(verified !== "all" && { verified }) });
    const r = await fetcher(`/admin/sellers?${params}`);
    if (r.success) { setSellers(r.data); setTotal(r.total); setPages(r.pages); }
    setLoading(false);
  }, [page, search, verified]);

  useEffect(() => { load(); }, [load]);

  const verifySeller = async (id) => {
    const r = await patcher(`/admin/users/${id}/verify-seller`, {});
    if (r.success) load();
    else alert(r.message);
  };

  const toggleBan = async (id) => {
    const r = await patcher(`/admin/users/${id}/ban`, {});
    if (r.success) load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Shop ya seller name..." />
        <Select value={verified} onChange={v => { setVerified(v); setPage(1); }} options={[
          { value: "all", label: "Sab Sellers" },
          { value: "true", label: "Verified" },
          { value: "false", label: "Unverified" },
        ]} />
        <span style={{ color: "#555", fontSize: 13, marginLeft: "auto" }}>{total} sellers</span>
      </div>

      <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 20 }}>
        {loading ? <p style={{ color: "#555", textAlign: "center", padding: 40 }}>Loading...</p> : (
          <Table
            cols={["Seller", "Shop", "Phone", "Products", "Rating", "Status", "Actions"]}
            rows={sellers.map(s => [
              <div style={{ color: "#fff", fontWeight: 600 }}>{s.name}</div>,
              <div>
                <div style={{ color: "#ccc" }}>{s.shopName || "—"}</div>
                {s.isShopVerified && <span style={{ color: "#22c55e", fontSize: 10 }}>✓ Verified</span>}
              </div>,
              s.phone,
              s.productCount || 0,
              s.shopRating ? `⭐ ${s.shopRating.toFixed(1)}` : "—",
              <Badge label={s.isActive ? "active" : "banned"} />,
              <div style={{ display: "flex", gap: 6 }}>
                {!s.isShopVerified && (
                  <Btn small onClick={() => verifySeller(s._id)} color="#22c55e">Verify</Btn>
                )}
                <Btn small onClick={() => toggleBan(s._id)} color={s.isActive ? "#ef4444" : "#22c55e"}>
                  {s.isActive ? "Ban" : "Unban"}
                </Btn>
              </div>
            ])}
          />
        )}
        {pages > 1 && <Pagination page={page} pages={pages} setPage={setPage} />}
      </div>
    </div>
  );
}

// ── Drivers Tab ──────────────────────────────────────────
function DriversTab() {
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15, search });
    const r = await fetcher(`/admin/drivers?${params}`);
    if (r.success) { setDrivers(r.data); setTotal(r.total); setPages(r.pages); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const toggleBan = async (id) => {
    await patcher(`/admin/users/${id}/ban`, {});
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Name ya vehicle number..." />
        <span style={{ color: "#555", fontSize: 13, marginLeft: "auto" }}>{total} drivers</span>
      </div>

      <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 20 }}>
        {loading ? <p style={{ color: "#555", textAlign: "center", padding: 40 }}>Loading...</p> : (
          <Table
            cols={["Driver", "Phone", "Vehicle", "Available", "Deliveries", "Rating", "Earnings", "Actions"]}
            rows={drivers.map(d => [
              <div style={{ color: "#fff", fontWeight: 600 }}>{d.name}</div>,
              d.phone,
              <div>
                <div style={{ color: "#ccc", textTransform: "capitalize" }}>{d.vehicleType || "—"}</div>
                <div style={{ color: "#555", fontSize: 11 }}>{d.vehicleNumber || ""}</div>
              </div>,
              <Badge label={d.isAvailable ? "active" : "banned"} />,
              d.totalDeliveries || 0,
              d.driverRating ? `⭐ ${d.driverRating.toFixed(1)}` : "—",
              `₹${d.totalEarnings?.toLocaleString() || 0}`,
              <Btn small onClick={() => toggleBan(d._id)} color={d.isActive ? "#ef4444" : "#22c55e"}>
                {d.isActive ? "Ban" : "Unban"}
              </Btn>
            ])}
          />
        )}
        {pages > 1 && <Pagination page={page} pages={pages} setPage={setPage} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MAIN ADMIN PAGE
// ══════════════════════════════════════════════════════════
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const TABS = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "orders",    label: "📦 Orders" },
    { id: "users",     label: "👥 Users" },
    { id: "products",  label: "🌱 Products" },
    { id: "sellers",   label: "🏪 Sellers" },
    { id: "drivers",   label: "🚚 Drivers" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", color: "#fff",
      fontFamily: "'DM Mono', 'Fira Code', monospace"
    }}>
      {/* Header */}
      <div style={{
        background: "#0f0f0f", borderBottom: "1px solid #1a1a1a",
        padding: "0 24px", display: "flex", alignItems: "center",
        gap: 16, height: 56, position: "sticky", top: 0, zIndex: 100
      }}>
        <span style={{ fontSize: 20 }}>🌾</span>
        <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 16, letterSpacing: 2 }}>AGROEASE</span>
        <span style={{ color: "#333", fontSize: 12, fontWeight: 600, letterSpacing: 3 }}>ADMIN</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
          <span style={{ color: "#555", fontSize: 12 }}>Live</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        background: "#0f0f0f", borderBottom: "1px solid #1a1a1a",
        padding: "0 24px", display: "flex", gap: 4, overflowX: "auto"
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "14px 18px", border: "none", background: "transparent",
            color: activeTab === t.id ? "#16a34a" : "#555",
            fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13,
            borderBottom: activeTab === t.id ? "2px solid #16a34a" : "2px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
            fontFamily: "inherit"
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "orders"    && <OrdersTab />}
        {activeTab === "users"     && <UsersTab />}
        {activeTab === "products"  && <ProductsTab />}
        {activeTab === "sellers"   && <SellersTab />}
        {activeTab === "drivers"   && <DriversTab />}
      </div>
    </div>
  );
}
