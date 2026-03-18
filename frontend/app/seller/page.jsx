"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/layout/Navbar";
import BottomNav from "../../components/layout/BottomNav";
import { productAPI, orderAPI, sellerAPI } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import toast from "react-hot-toast";

const CATEGORIES = ["fertilizer","pesticide","seed","tool","organic","equipment","other"];

const DEFAULT_FORM = {
  name:"", description:"", category:"fertilizer", price:"", mrp:"",
  unit:"kg", stock:"", brand:"", cropTypes:[], isFeatured:false,
};

export default function SellerPage() {
  const { user }   = useAuth();
  const router     = useRouter();
  const [tab,      setTab]      = useState("products");
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(DEFAULT_FORM);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "seller") { router.push("/"); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [p, o, s] = await Promise.all([
        productAPI.getMine(),
        orderAPI.getAll({ limit: 20 }),
        sellerAPI.getStats(),
      ]);
      setProducts(p.products || []);
      setOrders(o.orders || []);
      setStats(s.stats);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = { ...form, price: Number(form.price), mrp: Number(form.mrp) || undefined,
                      stock: Number(form.stock) };
      if (editId) await productAPI.update(editId, data);
      else        await productAPI.create(data);
      toast.success(editId ? "Product update ho gaya!" : "Product add ho gaya! 🎉");
      setShowForm(false); setForm(DEFAULT_FORM); setEditId(null);
      fetchAll();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Product hata dein?")) return;
    try {
      await productAPI.remove(id);
      toast.success("Product hata diya");
      fetchAll();
    } catch (err) { toast.error(err.message); }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status, "Seller ne update kiya");
      toast.success("Order status update ho gaya");
      fetchAll();
    } catch (err) { toast.error(err.message); }
  };

  const startEdit = (product) => {
    setForm({
      name: product.name, description: product.description || "",
      category: product.category, price: product.price, mrp: product.mrp || "",
      unit: product.unit, stock: product.stock, brand: product.brand || "",
      cropTypes: product.cropTypes || [], isFeatured: product.isFeatured || false,
    });
    setEditId(product._id);
    setShowForm(true);
  };

  if (!user || user.role !== "seller") return null;

  const newOrders = orders.filter(o => o.status === "placed");
  const CROP_LIST = ["apple","peach","plum","wheat","maize","vegetable","herb"];

  return (
    <div className="pb-24">
      <Navbar />

      {/* Header */}
      <div className="bg-green-primary px-4 py-4">
        <h1 className="font-display text-xl font-bold text-white">{user.shopName || "Meri Shop"} 🏪</h1>
        {stats && (
          <div className="flex gap-4 mt-2 text-sm text-white/80">
            <span>📦 Today: {stats.todayOrders}</span>
            <span>💰 Month: ₹{stats.monthlyRevenue}</span>
            <span>⭐ {stats.avgRating || "N/A"}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {[
          { id:"products", label:`Products (${products.length})` },
          { id:"orders",   label:`Orders${newOrders.length > 0 ? ` 🔴${newOrders.length}` : ""}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium transition border-b-2
              ${tab === t.id ? "border-green-primary text-green-primary" : "border-transparent text-gray-500"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">

        {/* PRODUCTS TAB */}
        {tab === "products" && (
          <>
            <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(DEFAULT_FORM); }}
              className="w-full bg-green-primary text-white font-bold py-3 rounded-xl mb-4 hover:bg-green-medium transition"
            >
              {showForm ? "✕ Form Band Karo" : "➕ Naya Product Add Karo"}
            </button>

            {/* Add/Edit Form */}
            {showForm && (
              <form onSubmit={handleSaveProduct} className="card mb-4 space-y-3">
                <h3 className="font-semibold">{editId ? "Product Edit Karo" : "Naya Product"}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500">Product Ka Naam *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name:e.target.value})}
                      placeholder="DAP Fertilizer 50kg"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Category *</label>
                    <select value={form.category} onChange={e => setForm({...form, category:e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mt-1">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Unit</label>
                    <select value={form.unit} onChange={e => setForm({...form, unit:e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mt-1">
                      {["kg","L","bag","piece","packet","bundle"].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Price (₹) *</label>
                    <input required type="number" value={form.price} onChange={e => setForm({...form, price:e.target.value})}
                      placeholder="1350"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">MRP (₹)</label>
                    <input type="number" value={form.mrp} onChange={e => setForm({...form, mrp:e.target.value})}
                      placeholder="1500 (optional)"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Stock *</label>
                    <input required type="number" value={form.stock} onChange={e => setForm({...form, stock:e.target.value})}
                      placeholder="100"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Brand</label>
                    <input value={form.brand} onChange={e => setForm({...form, brand:e.target.value})}
                      placeholder="IFFCO"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary mt-1" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500">Description</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})}
                      placeholder="Product ki jaankari likhein..." rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-primary mt-1 resize-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 mb-2 block">Best for crops:</label>
                    <div className="flex gap-2 flex-wrap">
                      {CROP_LIST.map(c => (
                        <button key={c} type="button"
                          onClick={() => {
                            const list = form.cropTypes.includes(c)
                              ? form.cropTypes.filter(x => x !== c)
                              : [...form.cropTypes, c];
                            setForm({...form, cropTypes: list});
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full border transition capitalize
                            ${form.cropTypes.includes(c) ? "bg-green-primary text-white border-green-primary" : "border-gray-200 text-gray-600"}`}
                        >{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-green-primary text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
                    {saving ? "Save ho raha hai..." : editId ? "Update Karo" : "Add Karo"}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Koi product nahi — upar se add karo</p>
            ) : (
              <div className="space-y-2">
                {products.map(p => (
                  <div key={p._id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                    <div className="w-10 h-10 bg-green-pale rounded-xl flex items-center justify-center text-xl flex-shrink-0">🌾</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      <div className="flex gap-2 text-xs text-gray-400">
                        <span>₹{p.price}</span>
                        <span>Stock: {p.stock}</span>
                        <span className={p.isActive ? "text-green-soft" : "text-red-400"}>{p.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg text-sm">✏️</button>
                      <button onClick={() => handleDelete(p._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg text-sm">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_,i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Koi orders nahi abhi</p>
            ) : orders.map(order => (
              <div key={order._id} className={`card ${order.status === "placed" ? "border-green-primary border-2" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm">#{order.orderNumber}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold
                    ${order.status === "placed" ? "bg-yellow-50 text-yellow-700" :
                      order.status === "delivered" ? "bg-green-pale text-green-medium" : "bg-blue-50 text-blue-600"}`}>
                    {order.status}
                  </span>
                </div>
                {order.buyer && (
                  <p className="text-xs text-gray-500 mb-1">👤 {order.buyer.name} · {order.buyer.phone}</p>
                )}
                {order.items?.map((item,i) => (
                  <p key={i} className="text-sm text-gray-700">{item.productName} × {item.quantity} = ₹{item.subtotal}</p>
                ))}
                <p className="font-bold text-green-primary mt-2">Total: ₹{order.totalAmount}</p>
                {order.status === "placed" && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleOrderStatus(order._id, "confirmed")}
                      className="flex-1 bg-green-primary text-white text-sm py-2 rounded-xl font-semibold">✓ Accept</button>
                    <button onClick={() => handleOrderStatus(order._id, "cancelled")}
                      className="flex-1 border border-red-300 text-red-500 text-sm py-2 rounded-xl font-semibold">✗ Reject</button>
                  </div>
                )}
                {order.status === "confirmed" && (
                  <button onClick={() => handleOrderStatus(order._id, "packed")}
                    className="w-full mt-3 bg-blue-500 text-white text-sm py-2 rounded-xl font-semibold">
                    📦 Mark as Packed
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
