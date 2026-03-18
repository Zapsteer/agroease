"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/layout/Navbar";
import BottomNav from "../../components/layout/BottomNav";
import { driverAPI, orderAPI } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import toast from "react-hot-toast";

export default function DriverPage() {
  const { user, refreshUser } = useAuth();
  const router   = useRouter();
  const [active,     setActive]     = useState([]);
  const [available,  setAvailable]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [toggling,   setToggling]   = useState(false);
  const [isOnline,   setIsOnline]   = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "driver") { router.push("/"); return; }
    setIsOnline(user.isAvailable || false);
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [a, av] = await Promise.all([
        driverAPI.getOrders(),
        driverAPI.getDeliveries(),
      ]);
      setActive(a.orders || []);
      setAvailable(av.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleOnline = async () => {
    try {
      setToggling(true);
      let location = null;
      if (!isOnline && navigator.geolocation) {
        await new Promise(resolve => {
          navigator.geolocation.getCurrentPosition(pos => {
            location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            resolve();
          }, resolve);
        });
      }
      await driverAPI.toggle(!isOnline, location);
      setIsOnline(!isOnline);
      await refreshUser();
      toast.success(!isOnline ? "Aap online hain! Deliveries aa sakti hain 🟢" : "Aap offline hain 🔴");
    } catch (err) { toast.error(err.message); }
    finally { setToggling(false); }
  };

  const handleAccept = async (orderId) => {
    try {
      await orderAPI.updateStatus(orderId, "picked_up", "Driver ne pickup kiya", user._id);
      toast.success("Delivery accept kar li! 🚛");
      fetchAll();
    } catch (err) { toast.error(err.message); }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status, "Driver status update");
      toast.success(`Status updated: ${status}`);
      fetchAll();
    } catch (err) { toast.error(err.message); }
  };

  if (!user) return null;

  return (
    <div className="pb-24">
      <Navbar />

      <div className="bg-green-primary px-4 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Driver Dashboard 🚛</h1>
            <p className="text-white/70 text-sm">{user.name} · {user.vehicleType || "Vehicle"}</p>
          </div>
          <button
            onClick={toggleOnline}
            disabled={toggling}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition
              ${isOnline ? "bg-white text-green-primary" : "bg-white/20 text-white border border-white/30"}`}
          >
            {toggling ? "..." : isOnline ? "🟢 Online" : "🔴 Offline"}
          </button>
        </div>
        <p className="text-white/60 text-xs mt-2">
          {isOnline ? "✓ Aap delivery requests receive kar rahe hain" : "Go online to receive delivery requests"}
        </p>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* Active deliveries */}
        {active.length > 0 && (
          <div>
            <h3 className="section-title mb-3">Active Deliveries 🔴</h3>
            {active.map(order => (
              <div key={order._id} className="card border-blue-400 border-2 mb-3">
                <div className="flex justify-between mb-2">
                  <p className="font-bold text-sm">#{order.orderNumber}</p>
                  <span className="badge-blue text-xs">{order.status.replace("_"," ")}</span>
                </div>
                {order.buyer && (
                  <div className="bg-gray-50 rounded-xl p-2 mb-3">
                    <p className="text-xs font-semibold">👤 {order.buyer.name}</p>
                    <p className="text-xs text-gray-500">📱 {order.buyer.phone}</p>
                    <p className="text-xs text-gray-500">📍 {order.deliveryAddress || order.buyer.address}</p>
                  </div>
                )}
                <p className="font-bold text-green-primary mb-3">₹{order.totalAmount}</p>
                {order.status === "picked_up" && (
                  <button onClick={() => handleUpdateStatus(order._id, "in_transit")}
                    className="w-full bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold">
                    🛣️ Mark In Transit
                  </button>
                )}
                {order.status === "in_transit" && (
                  <button onClick={() => handleUpdateStatus(order._id, "delivered")}
                    className="w-full bg-green-primary text-white py-2.5 rounded-xl text-sm font-bold">
                    ✅ Mark Delivered
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Available deliveries */}
        <div>
          <h3 className="section-title mb-3">
            Available Deliveries {available.length > 0 && `(${available.length})`}
          </h3>
          {loading ? (
            <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ) : !isOnline ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">📴</p>
              <p className="text-gray-500 font-medium">Aap offline hain</p>
              <p className="text-gray-400 text-sm mt-1">Deliveries dekhne ke liye online ho jao</p>
            </div>
          ) : available.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-gray-500 font-medium">Abhi koi delivery nahi</p>
              <p className="text-gray-400 text-sm mt-1">Naya order aane par notification milegi</p>
            </div>
          ) : (
            available.map(order => (
              <div key={order._id} className="card border-green-primary border-2 mb-3">
                <div className="flex justify-between mb-2">
                  <p className="font-bold text-sm">#{order.orderNumber}</p>
                  <span className="text-xs text-green-primary font-semibold">New!</span>
                </div>
                {order.buyer && (
                  <div className="text-xs text-gray-600 mb-2">
                    <p>From: {order.items?.[0]?.seller?.shopName || "Seller"}</p>
                    <p>To: {order.buyer.name} · {order.deliveryAddress || order.buyer.address}</p>
                  </div>
                )}
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-green-primary">₹{order.totalAmount}</p>
                  <p className="text-xs text-gray-400">Earn: ₹{Math.round(order.deliveryFee || 50)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(order._id)}
                    className="flex-1 bg-green-primary text-white py-2.5 rounded-xl text-sm font-bold">
                    ✓ Accept
                  </button>
                  <button className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm">
                    Skip
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
