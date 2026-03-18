"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { cartAPI } from "../../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "../../lib/AuthContext";

const CATEGORY_EMOJI = {
  fertilizer: "🌾", pesticide: "🧪", seed: "🌱",
  tool: "🛠️", organic: "🍃", equipment: "⚙️", other: "📦",
};

const BG_COLORS = {
  fertilizer: "bg-green-50",  pesticide: "bg-blue-50",
  seed:        "bg-yellow-50", tool:      "bg-gray-50",
  organic:     "bg-emerald-50", equipment: "bg-slate-50",
};

export default function ProductCard({ product, onCartUpdate }) {
  const { user }    = useAuth();
  const [loading, setLoading] = useState(false);
  const [added,   setAdded]   = useState(false);

  const discount = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { toast.error("Pehle login karein"); return; }
    if (user.role !== "buyer") { toast.error("Sirf buyers cart use kar sakte hain"); return; }
    try {
      setLoading(true);
      await cartAPI.add(product._id, 1);
      setAdded(true);
      toast.success("Cart mein add ho gaya! 🛒");
      onCartUpdate?.();
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/product/${product._id}`} className="block">
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
        {/* Image / emoji */}
        <div className={`h-28 flex items-center justify-center text-5xl relative ${BG_COLORS[product.category] || "bg-gray-50"}`}>
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span>{CATEGORY_EMOJI[product.category] || "📦"}</span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              -{discount}%
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="bg-white text-gray-600 text-xs font-semibold px-2 py-1 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="text-xs text-gray-400 mb-0.5 truncate">{product.seller?.shopName || "AgroEase Seller"}</p>
          <h3 className="font-semibold text-sm text-gray-900 leading-tight mb-1 line-clamp-2">{product.name}</h3>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-yellow-400 text-xs">⭐</span>
              <span className="text-xs text-gray-500">{product.rating} ({product.totalRatings})</span>
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-green-primary font-bold text-base">₹{product.price}</span>
              <span className="text-gray-400 text-xs ml-1">/{product.unit}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-gray-300 text-xs line-through ml-1">₹{product.mrp}</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={loading || product.stock === 0}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all
                ${added ? "bg-green-soft scale-95" : "bg-green-primary hover:bg-green-medium active:scale-95"}
                ${loading ? "opacity-60" : ""}
                ${product.stock === 0 ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              {loading ? "…" : added ? "✓" : "+"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
