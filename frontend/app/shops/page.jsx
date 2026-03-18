"use client";
import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import BottomNav from "../../components/layout/BottomNav";
import { shopAPI } from "../../lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

const CATEGORY_FILTERS = ["Sab","Fertilizer","Pesticide","Seed","Tool","Organic"];

export default function ShopsPage() {
  const [shops,    setShops]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("Sab");
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          fetchShops(loc);
        },
        () => {
          // Default to Shimla if denied
          const def = { lat: 31.1048, lng: 77.1734 };
          setLocation(def);
          fetchShops(def);
        }
      );
    } else {
      const def = { lat: 31.1048, lng: 77.1734 };
      setLocation(def);
      fetchShops(def);
    }
  }, []);

  const fetchShops = async (loc) => {
    try {
      const d = await shopAPI.getNearby(loc.lat, loc.lng, 25000);
      setShops(d.shops || []);
    } catch (err) {
      toast.error("Shops load nahi hui — server check karein");
      // Mock data for demo
      setShops([
        { _id:"1", shopName:"Sharma Agro Store", address:"The Mall, Shimla", shopRating:4.8, totalReviews:126, isShopOpen:true, shopCategories:["fertilizer","seed"] },
        { _id:"2", shopName:"Kullu Beej Ghar",   address:"Dhalpur, Kullu",    shopRating:4.5, totalReviews:89,  isShopOpen:true, shopCategories:["seed","organic"] },
        { _id:"3", shopName:"Mandi Agri Hub",    address:"Indira Market, Mandi", shopRating:4.3, totalReviews:54, isShopOpen:false, shopCategories:["pesticide","tool"] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "Sab" ? shops
    : shops.filter(s => s.shopCategories?.includes(filter.toLowerCase()));

  return (
    <div className="pb-24">
      <Navbar />

      <div className="bg-green-primary px-4 py-4">
        <h1 className="font-display text-xl font-bold text-white">Nearby Shops 🗺️</h1>
        <p className="text-white/70 text-sm mt-1">Aapke aas-paas ki agri shops</p>
      </div>

      {/* Map Placeholder (Google Maps in production) */}
      <div className="mx-4 mt-4 h-44 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl relative overflow-hidden border border-green-muted flex items-center justify-center">
        <div className="text-center z-10">
          <p className="text-3xl mb-1">🗺️</p>
          <p className="text-green-medium font-semibold text-sm">Map View</p>
          <p className="text-xs text-gray-500 mt-1">Google Maps integration</p>
          <p className="text-xs text-gray-400">(NEXT_PUBLIC_GOOGLE_MAPS_KEY set karein)</p>
        </div>
        {/* Fake map pins */}
        {[
          { top:"25%", left:"30%", color:"bg-green-primary" },
          { top:"50%", left:"60%", color:"bg-green-medium" },
          { top:"70%", left:"40%", color:"bg-blue-500" },
        ].map((pin, i) => (
          <div key={i} className={`absolute w-7 h-7 ${pin.color} rounded-full flex items-center justify-center text-white text-sm shadow-md`}
            style={{ top: pin.top, left: pin.left }}
          >🏪</div>
        ))}
        <div className="absolute bottom-4 left-4 bg-white rounded-xl px-3 py-1.5 text-xs font-medium text-green-primary shadow">
          📍 You
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {CATEGORY_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition
              ${filter === f ? "bg-green-primary text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Shop list */}
      <div className="px-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_,i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🏪</p>
            <p className="text-gray-500">Is category mein koi shop nahi</p>
          </div>
        ) : filtered.map(shop => (
          <div key={shop._id} className="card">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-green-pale rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                🏪
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm truncate">{shop.shopName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                    ${shop.isShopOpen ? "bg-green-pale text-green-medium" : "bg-gray-100 text-gray-500"}`}
                  >
                    {shop.isShopOpen ? "🟢 Open" : "🔴 Closed"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{shop.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span>⭐ {shop.shopRating || "N/A"} ({shop.totalReviews || 0} reviews)</span>
              {shop.shopDescription && <span className="truncate">{shop.shopDescription}</span>}
            </div>

            {/* Category tags */}
            {shop.shopCategories?.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {shop.shopCategories.map(c => (
                  <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg capitalize">{c}</span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Link href={`/marketplace?seller=${shop._id}`}
                className="flex-1 text-center bg-green-pale text-green-primary text-xs font-semibold py-2 rounded-xl hover:bg-green-muted transition"
              >
                Products Dekho →
              </Link>
              <button className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs hover:bg-gray-50">
                📍 Directions
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
