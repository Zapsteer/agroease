"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/layout/Navbar";
import BottomNav from "../../components/layout/BottomNav";
import { orderAPI } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import toast from "react-hot-toast";
import { Suspense } from "react";

const STATUS_LABELS = {
  placed:     { label: "Placed",     class: "status-placed",     emoji: "📋" },
  confirmed:  { label: "Confirmed",  class: "status-confirmed",  emoji: "✅" },
  packed:     { label: "Packed",     class: "status-confirmed",  emoji: "📦" },
  picked_up:  { label: "Picked Up",  class: "status-confirmed",  emoji: "🚛" },
  in_transit: { label: "In Transit", class: "status-in_transit", emoji: "🛣️" },
  delivered:  { label: "Delivered",  class: "status-delivered",  emoji: "✓"  },
  cancelled:  { label: "Cancelled",  class: "status-cancelled",  emoji: "✗"  },
};

const SELLER_NEXT = {
  placed:    "confirmed",
  confirmed: "packed",
  packed:    "picked_up",
};

const DRIVER_NEXT = {
  picked_up:  "in_transit",
  in_transit: "delivered",
};

function OrderCard({ order, userRole, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const s = STATUS_LABELS[order.status] || STATUS_LABELS.placed;

  const nextStatus =
    userRole === "seller" ? SELLER_NEXT[order.status] :
    userRole === "driver" ? DRIVER_NEXT[order.status] : null;

  const handleUpdate = async () => {
    if (!nextStatus) return;
    try {
      setUpdating(true);
      await orderAPI.updateStatus(order._id, nextStatus, "Status updated");
      toast.success(`Order status: ${nextStatus}`);
      onUpdate();
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

  return (
    <div className="card mb-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-sm">#{order.orderNumber}</p>
          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("hi-IN")}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.class}`}>
          {s.emoji} {s.label}
        </span>
      </div>

      {/* Items preview */}
      <div className="space-y-1 mb-3">
        {order.items?.slice(0,2).map((item, i) => (
          <p key={i} className="text-sm text-gray-600">
            {item.productName} × {item.quantity}
            {userRole !== "buyer" && ` — ₹${item.subtotal}`}
          </p>
        ))}
        {(order.items?.length || 0) > 2 && (
          <p className="text-xs text-gray-400">+{order.items.length - 2} aur items</p>
        )}
      </div>

      {/* Buyer info (for seller/driver) */}
      {userRole !== "buyer" && order.buyer && (
        <div className="bg-gray-50 rounded-xl p-2 mb-3">
          <p className="text-xs font-medium text-gray-700">👤 {order.buyer.name}</p>
          <p className="text-xs text-gray-500">📱 {order.buyer.phone}</p>
          {order.deliveryAddress && (
            <p className="text-xs text-gray-500">📍 {order.deliveryAddress}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-green-primary">₹{order.totalAmount}</p>
          <p className="text-xs text-gray-400">{order.paymentMethod === "cod" ? "💵 COD" : "📱 Online"}</p>
        </div>
        {nextStatus && (
          <button onClick={handleUpdate} disabled={updating}
            className="bg-green-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-medium transition disabled:opacity-60"
          >
            {updating ? "..." : `Mark: ${STATUS_LABELS[nextStatus]?.label}`}
          </button>
        )}
      </div>
    </div>
  );
}

function OrdersContent() {
  const { user }   = useAuth();
  const router     = useRouter();
  const sp         = useSearchParams();
  const newOrderId = sp.get("new");

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  const fetchOrders = async () => {
    try {
      const d = await orderAPI.getAll();
      setOrders(d.orders || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetchOrders();
    if (newOrderId) toast.success("Order place ho gaya! 🎉");
  }, [user]);

  const filtered = filter === "all" ? orders
    : orders.filter(o => o.status === filter);

  const FILTER_OPTIONS = [
    { id: "all",       label: "Sab"      },
    { id: "placed",    label: "New"      },
    { id: "confirmed", label: "Confirmed"},
    { id: "in_transit",label: "Transit"  },
    { id: "delivered", label: "Delivered"},
    { id: "cancelled", label: "Cancelled"},
  ];

  return (
    <div className="pb-24">
      <Navbar />

      <div className="bg-green-primary px-4 py-4">
        <h1 className="font-display text-xl font-bold text-white">
          {user?.role === "buyer"  ? "Mere Orders 📦" :
           user?.role === "seller" ? "Incoming Orders 🏪" :
           "Deliveries 🚛"}
        </h1>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-gray-100">
        {FILTER_OPTIONS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition
              ${filter === f.id ? "bg-green-primary text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_,i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500 font-medium">Koi order nahi hai</p>
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard key={order._id} order={order} userRole={user?.role} onUpdate={fetchOrders} />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function OrdersPage() {
  return <Suspense fallback={null}><OrdersContent /></Suspense>;
}
