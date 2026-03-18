"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import BottomNav from "../../components/layout/BottomNav";
import { cartAPI, orderAPI } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import toast from "react-hot-toast";

export default function CartPage() {
  const { user }   = useAuth();
  const router     = useRouter();
  const [cart,     setCart]     = useState(null);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [placing,  setPlacing]  = useState(false);
  const [payment,  setPayment]  = useState("cod");
  const [delivery, setDelivery] = useState("delivery");
  const [address,  setAddress]  = useState(user?.address || "");

  const fetchCart = async () => {
    try {
      const d = await cartAPI.get();
      setCart(d.cart);
      setSummary(d.summary);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetchCart();
  }, [user]);

  const handleQty = async (productId, newQty) => {
    try {
      await cartAPI.update(productId, newQty);
      fetchCart();
    } catch (err) { toast.error(err.message); }
  };

  const handlePlaceOrder = async () => {
    if (!address.trim() && delivery === "delivery")
      return toast.error("Delivery address dein");
    try {
      setPlacing(true);
      const res = await orderAPI.place({
        deliveryAddress: address,
        deliveryType:    delivery,
        paymentMethod:   payment,
      });
      toast.success(res.message);
      router.push(`/orders?new=${res.order._id}`);
    } catch (err) { toast.error(err.message); }
    finally { setPlacing(false); }
  };

  if (!user) return null;

  if (loading) return (
    <div className="pb-24">
      <Navbar />
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_,i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
      <BottomNav />
    </div>
  );

  const items = cart?.items || [];

  return (
    <div className="pb-36">
      <Navbar />

      {/* Header */}
      <div className="bg-green-primary px-4 py-4">
        <h1 className="font-display text-xl font-bold text-white">
          Aapka Cart 🛒 {items.length > 0 && `(${items.length})`}
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center pt-20 px-4">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="font-display text-xl font-bold text-gray-800 mb-2">Cart Khaali Hai</h2>
          <p className="text-gray-400 text-sm mb-6">Apni kheti ke liye kuch add karo</p>
          <Link href="/marketplace" className="bg-green-primary text-white font-bold px-6 py-3 rounded-xl inline-block">
            Products Dekho →
          </Link>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {items.map(item => (
            <div key={item._id} className="card flex items-center gap-3">
              {/* Emoji / Image */}
              <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                {item.product?.images?.[0]
                  ? <img src={item.product.images[0]} className="w-full h-full object-cover rounded-xl" alt="" />
                  : "🌾"}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{item.product?.name || "Product"}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.product?.seller?.shopName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => handleQty(item.product._id, item.quantity - 1)}
                    className="w-7 h-7 border border-gray-200 rounded-lg text-gray-600 flex items-center justify-center hover:bg-gray-50">−</button>
                  <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={() => handleQty(item.product._id, item.quantity + 1)}
                    className="w-7 h-7 border border-gray-200 rounded-lg text-gray-600 flex items-center justify-center hover:bg-gray-50">+</button>
                </div>
              </div>
              {/* Price + Remove */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-green-primary">₹{item.price * item.quantity}</p>
                <p className="text-xs text-gray-300">₹{item.price} each</p>
                <button onClick={() => handleQty(item.product._id, 0)}
                  className="text-xs text-red-400 mt-1 hover:text-red-600">Remove</button>
              </div>
            </div>
          ))}

          {/* Delivery Type */}
          <div className="card">
            <p className="font-semibold text-sm mb-3">Delivery Type</p>
            <div className="flex gap-2">
              {[
                { id: "delivery", label: "🚛 Home Delivery", sub: "₹50 ya free ₹500+" },
                { id: "pickup",   label: "🏪 Pickup",        sub: "Shop se khud lo" },
              ].map(d => (
                <button key={d.id} onClick={() => setDelivery(d.id)}
                  className={`flex-1 p-3 rounded-xl border-2 text-left transition
                    ${delivery === d.id ? "border-green-primary bg-green-pale" : "border-gray-100"}`}
                >
                  <p className={`text-sm font-semibold ${delivery === d.id ? "text-green-primary" : "text-gray-700"}`}>{d.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{d.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          {delivery === "delivery" && (
            <div className="card">
              <p className="font-semibold text-sm mb-2">Delivery Address</p>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Ghar ka poora address likhein — village, tehsil, district, pin..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-primary resize-none"
              />
            </div>
          )}

          {/* Payment */}
          <div className="card">
            <p className="font-semibold text-sm mb-3">Payment Method</p>
            <div className="flex gap-2">
              {[
                { id: "cod",    label: "💵 Cash on Delivery", sub: "Delivery par cash dein" },
                { id: "online", label: "📱 Online Pay",        sub: "UPI / Card / Net Banking" },
              ].map(p => (
                <button key={p.id} onClick={() => setPayment(p.id)}
                  className={`flex-1 p-3 rounded-xl border-2 text-left transition
                    ${payment === p.id ? "border-green-primary bg-green-pale" : "border-gray-100"}`}
                >
                  <p className={`text-sm font-semibold ${payment === p.id ? "text-green-primary" : "text-gray-700"}`}>{p.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="bg-beige-warm rounded-2xl p-4">
              <p className="font-semibold text-sm mb-3">Order Summary</p>
              {[
                { label: "Subtotal",     val: `₹${summary.subtotal}` },
                { label: "Delivery",     val: delivery === "pickup" ? "Free" : summary.deliveryFee === 0 ? "Free 🎉" : `₹${summary.deliveryFee}` },
                { label: "Platform Fee", val: `₹${summary.platformFee}`, sub: "(5%)" },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm py-1.5">
                  <span className="text-gray-500">{r.label} <span className="text-xs text-gray-300">{r.sub}</span></span>
                  <span className={r.val.includes("Free") ? "text-green-soft font-medium" : ""}>{r.val}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-3 mt-2">
                <span>Total</span>
                <span className="text-green-primary">
                  ₹{summary.subtotal + (delivery === "pickup" ? 0 : summary.deliveryFee) + summary.platformFee}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkout CTA */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3 z-40">
          <button onClick={handlePlaceOrder} disabled={placing}
            className="w-full bg-green-primary text-white font-bold py-4 rounded-xl hover:bg-green-medium transition disabled:opacity-60 text-base"
          >
            {placing ? "Order place ho raha hai..." : `Order Place Karein — ₹${summary?.subtotal || 0} 🌾`}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
