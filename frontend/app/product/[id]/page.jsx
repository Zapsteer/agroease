"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/layout/Navbar";
import BottomNav from "../../../components/layout/BottomNav";
import ProductCard from "../../../components/ui/ProductCard";
import { productAPI, cartAPI } from "../../../lib/api";
import { useAuth } from "../../../lib/AuthContext";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const { user }  = useAuth();
  const [product, setProduct]   = useState(null);
  const [compare, setCompare]   = useState([]);
  const [similar, setSimilar]   = useState([]);
  const [qty,     setQty]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [adding,  setAdding]    = useState(false);
  const [tab,     setTab]       = useState("details"); // details | compare | reviews

  useEffect(() => {
    productAPI.getOne(id)
      .then(d => {
        setProduct(d.product);
        setSimilar(d.similar || []);
        // Fetch compare data
        if (d.product?.name) {
          productAPI.compare(d.product.name)
            .then(c => setCompare(c.products || []))
            .catch(() => {});
        }
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) { router.push("/login"); return; }
    try {
      setAdding(true);
      await cartAPI.add(product._id, qty);
      toast.success("Cart mein add ho gaya! 🛒");
    } catch (err) { toast.error(err.message); }
    finally { setAdding(false); }
  };

  const handleBuyNow = async () => {
    if (!user) { router.push("/login"); return; }
    try {
      setAdding(true);
      await cartAPI.add(product._id, qty);
      router.push("/cart");
    } catch (err) { toast.error(err.message); }
    finally { setAdding(false); }
  };

  if (loading) return (
    <div className="pb-24">
      <Navbar />
      <div className="h-64 bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_,i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}
      </div>
      <BottomNav />
    </div>
  );

  if (!product) return (
    <div className="pb-24 text-center pt-20">
      <p className="text-4xl mb-3">😕</p>
      <p className="text-gray-500">Product nahi mila</p>
      <Link href="/marketplace" className="text-green-primary mt-3 inline-block">← Wapis Jao</Link>
      <BottomNav />
    </div>
  );

  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const EMOJI_MAP = { fertilizer:"🌾", pesticide:"🧪", seed:"🌱", tool:"🛠️", organic:"🍃", equipment:"⚙️" };

  return (
    <div className="pb-32">
      <Navbar />

      {/* Image */}
      <div className="relative h-64 bg-green-50 flex items-center justify-center">
        <button onClick={() => router.back()} className="absolute top-3 left-3 bg-white rounded-xl p-2 shadow-sm">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          : <span className="text-8xl">{EMOJI_MAP[product.category] || "📦"}</span>
        }
        {discount > 0 && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{discount}% OFF
          </span>
        )}
      </div>

      {/* Details */}
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span className="badge-green mb-2 inline-block">{product.category}</span>
            <h1 className="font-display text-xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{product.seller?.shopName || "AgroEase Seller"}</p>
          </div>
          {product.rating > 0 && (
            <div className="flex items-center gap-1 bg-green-pale rounded-xl px-2 py-1">
              <span className="text-yellow-400">⭐</span>
              <span className="text-green-medium font-bold text-sm">{product.rating}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-green-primary font-bold text-3xl">₹{product.price}</span>
          <span className="text-gray-400 text-sm">/{product.unit}</span>
          {product.mrp && <span className="text-gray-300 line-through text-base">₹{product.mrp}</span>}
        </div>

        {/* Stock */}
        <p className={`text-sm font-medium mt-1 ${product.stock > 0 ? "text-green-soft" : "text-red-500"}`}>
          {product.stock > 0 ? `✓ ${product.stock} ${product.unit} available` : "✗ Out of Stock"}
        </p>

        {/* Qty */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-sm text-gray-600 font-medium">Quantity:</span>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
            <button onClick={() => setQty(q => Math.max(1,q-1))} className="text-gray-600 font-bold text-lg w-6 h-6 flex items-center justify-center">−</button>
            <span className="font-bold text-base min-w-[24px] text-center">{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.stock, q+1))} className="text-gray-600 font-bold text-lg w-6 h-6 flex items-center justify-center">+</button>
          </div>
          <span className="text-green-primary font-bold">= ₹{product.price * qty}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 bg-gray-100 rounded-xl p-1">
          {["details","compare","shop"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition capitalize
                ${tab === t ? "bg-white text-green-primary shadow-sm" : "text-gray-500"}`}
            >
              {t === "details" ? "Details" : t === "compare" ? `Compare (${compare.length})` : "Shop Info"}
            </button>
          ))}
        </div>

        {/* Tab: Details */}
        {tab === "details" && (
          <div className="mt-4 space-y-3">
            <p className="text-gray-600 text-sm leading-relaxed">{product.description || "Koi description nahi."}</p>
            {product.brand && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">Brand: {product.brand}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">Unit: {product.unit}</span>
              </div>
            )}
            {product.cropTypes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Best for crops:</p>
                <div className="flex gap-2 flex-wrap">
                  {product.cropTypes.map(c => (
                    <span key={c} className="text-xs bg-green-pale text-green-medium px-2 py-1 rounded-lg capitalize">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Price Compare */}
        {tab === "compare" && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-3">Alag-alag sellers par daam:</p>
            {compare.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Sirf 1 seller hai is product ka</p>
            ) : (
              <div className="space-y-2">
                {compare.map((p, i) => (
                  <div key={p._id} className={`flex items-center justify-between p-3 rounded-xl border
                    ${i === 0 ? "border-green-primary bg-green-pale" : "border-gray-100"}`}
                  >
                    <div>
                      <p className="font-semibold text-sm">{p.seller?.shopName}</p>
                      <p className="text-xs text-gray-400">⭐ {p.seller?.shopRating || "N/A"} · {p.seller?.address?.split(",")[0]}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${i === 0 ? "text-green-primary" : "text-gray-700"}`}>₹{p.price}</p>
                      {i === 0 && <p className="text-xs text-green-soft">Best Price!</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Shop */}
        {tab === "shop" && product.seller && (
          <div className="mt-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-pale rounded-xl flex items-center justify-center text-2xl">🏪</div>
                <div>
                  <p className="font-bold">{product.seller.shopName}</p>
                  <p className="text-sm text-gray-400">{product.seller.address}</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <span>⭐ {product.seller.shopRating || "N/A"}</span>
                <span>{product.seller.isShopOpen ? "🟢 Open" : "🔴 Closed"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-6">
            <h3 className="section-title mb-3">Similar Products</h3>
            <div className="grid grid-cols-2 gap-3">
              {similar.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3 flex gap-3 z-40">
        <button
          onClick={handleAddToCart} disabled={adding || product.stock === 0}
          className="flex-1 border-2 border-green-primary text-green-primary font-bold py-3.5 rounded-xl hover:bg-green-pale transition disabled:opacity-50"
        >
          🛒 Cart
        </button>
        <button
          onClick={handleBuyNow} disabled={adding || product.stock === 0}
          className="flex-1 bg-green-primary text-white font-bold py-3.5 rounded-xl hover:bg-green-medium transition disabled:opacity-50"
        >
          {adding ? "..." : "Abhi Khareedo"}
        </button>
      </div>
    </div>
  );
}
