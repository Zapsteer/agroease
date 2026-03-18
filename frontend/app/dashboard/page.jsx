"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import BottomNav from "../../components/layout/BottomNav";
import { authAPI, sellerAPI, driverAPI } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const router  = useRouter();
  const [stats, setStats]   = useState(null);
  const [notifs,setNotifs]  = useState([]);
  const [editing,setEditing]= useState(false);
  const [form,   setForm]   = useState({});

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    setForm({ name: user.name, address: user.address || "",
               shopName: user.shopName || "", vehicleType: user.vehicleType || "" });

    // Load role-specific stats
    if (user.role === "seller") {
      sellerAPI.getStats().then(d => setStats(d.stats)).catch(() => {});
    }
    authAPI.getNotifs().then(d => {
      setNotifs(d.notifications || []);
      authAPI.readNotifs().catch(() => {});
    }).catch(() => {});
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await authAPI.update(form);
      await refreshUser();
      setEditing(false);
      toast.success("Profile update ho gaya!");
    } catch (err) { toast.error(err.message); }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
    toast.success("Logged out successfully");
  };

  if (!user) return null;

  return (
    <div className="pb-24">
      <Navbar />

      {/* Header */}
      <div className="bg-green-primary px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
            {user.role === "buyer" ? "👨‍🌾" : user.role === "seller" ? "🏪" : "🚛"}
          </div>
          <div>
            <p className="text-white/70 text-xs uppercase tracking-wide">{user.role}</p>
            <h2 className="font-display text-xl font-bold text-white">{user.name}</h2>
            <p className="text-white/60 text-sm mt-0.5">📱 {user.phone}</p>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="ml-auto bg-white/15 text-white text-sm px-3 py-1.5 rounded-xl hover:bg-white/25 transition"
          >
            ✏️ Edit
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* Seller Stats */}
        {user.role === "seller" && stats && (
          <div>
            <h3 className="section-title mb-3">Shop Stats 📊</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Orders",     val: stats.totalOrders,    emoji: "📦" },
                { label: "Today Orders",     val: stats.todayOrders,    emoji: "🗓️" },
                { label: "Monthly Revenue",  val: `₹${stats.monthlyRevenue}`, emoji: "💰" },
                { label: "Products",         val: stats.totalProducts,  emoji: "🌾" },
                { label: "Rating",           val: stats.avgRating || "N/A", emoji: "⭐" },
                { label: "Reviews",          val: stats.totalReviews,   emoji: "💬" },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xl">{s.emoji}</p>
                  <p className="font-bold text-xl text-gray-900 mt-1">{s.val}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="section-title mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            {user.role === "buyer" && [
              { href:"/orders",    emoji:"📦", label:"My Orders"        },
              { href:"/marketplace",emoji:"🛍️", label:"Marketplace"    },
              { href:"/ai",        emoji:"🤖", label:"AI Detection"     },
              { href:"/shops",     emoji:"🗺️", label:"Nearby Shops"    },
            ].map(a => (
              <Link key={a.href} href={a.href} className="card flex items-center gap-3 hover:border-green-muted transition">
                <span className="text-2xl">{a.emoji}</span>
                <span className="font-medium text-sm">{a.label}</span>
              </Link>
            ))}
            {user.role === "seller" && [
              { href:"/seller",    emoji:"🏪", label:"My Shop"          },
              { href:"/orders",    emoji:"📦", label:"Orders"           },
              { href:"/seller#add",emoji:"➕",  label:"Add Product"     },
              { href:"/marketplace",emoji:"🛍️", label:"Marketplace"   },
            ].map(a => (
              <Link key={a.href} href={a.href} className="card flex items-center gap-3 hover:border-green-muted transition">
                <span className="text-2xl">{a.emoji}</span>
                <span className="font-medium text-sm">{a.label}</span>
              </Link>
            ))}
            {user.role === "driver" && [
              { href:"/driver",    emoji:"🚛", label:"Deliveries"       },
              { href:"/orders",    emoji:"📋", label:"History"          },
            ].map(a => (
              <Link key={a.href} href={a.href} className="card flex items-center gap-3 hover:border-green-muted transition">
                <span className="text-2xl">{a.emoji}</span>
                <span className="font-medium text-sm">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Edit Profile */}
        {editing && (
          <div className="card">
            <h3 className="font-semibold mb-4">Profile Edit Karein</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Naam</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="Ghar ka address"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary mt-1" />
              </div>
              {user.role === "seller" && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Shop ka Naam</label>
                  <input value={form.shopName} onChange={e => setForm({...form, shopName: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary mt-1" />
                </div>
              )}
              {user.role === "driver" && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">Vehicle Type</label>
                  <select value={form.vehicleType} onChange={e => setForm({...form, vehicleType: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary mt-1"
                  >
                    {["bike","tempo","truck","jeep"].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditing(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-green-primary text-white py-2.5 rounded-xl text-sm font-bold">
                  Save Karo
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recent Notifications */}
        {notifs.length > 0 && (
          <div>
            <h3 className="section-title mb-3">Notifications 🔔</h3>
            <div className="space-y-2">
              {notifs.slice(0,5).map(n => (
                <div key={n._id} className={`p-3 rounded-xl border ${n.isRead ? "border-gray-100" : "border-green-muted bg-green-pale"}`}>
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-300 mt-1">{new Date(n.createdAt).toLocaleDateString("hi-IN")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full border border-red-200 text-red-500 py-3.5 rounded-xl font-semibold hover:bg-red-50 transition mt-2"
        >
          Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
