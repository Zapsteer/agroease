"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/layout/Navbar";
import BottomNav from "../../components/layout/BottomNav";
import ProductCard from "../../components/ui/ProductCard";
import { productAPI } from "../../lib/api";

const CATEGORIES = [
  { id: "",           label: "Sab"        },
  { id: "fertilizer", label: "🌾 Fertilizer" },
  { id: "pesticide",  label: "🧪 Pesticide"  },
  { id: "seed",       label: "🌱 Seeds"      },
  { id: "organic",    label: "🍃 Organic"    },
  { id: "tool",       label: "🛠️ Tools"     },
  { id: "equipment",  label: "⚙️ Equipment"  },
];

const SORTS = [
  { id: "newest",     label: "Naya Pehle" },
  { id: "price_asc",  label: "Sasta Pehle"},
  { id: "price_desc", label: "Mahnga Pehle"},
  { id: "rating",     label: "Best Rated" },
];

function MarketContent() {
  const searchParams   = useSearchParams();
  const initCategory   = searchParams.get("category") || "";
  const initCropType   = searchParams.get("cropType")  || "";

  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [category,  setCategory]  = useState(initCategory);
  const [sort,      setSort]      = useState("newest");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);

  const fetchProducts = async (reset = false) => {
    try {
      setLoading(true);
      const p = reset ? 1 : page;
      const d = await productAPI.getAll({
        ...(category && { category }),
        ...(search    && { search }),
        ...(initCropType && { cropType: initCropType }),
        sort, page: p, limit: 12,
      });
      if (reset) { setProducts(d.products); setPage(1); }
      else       { setProducts(prev => p === 1 ? d.products : [...prev, ...d.products]); }
      setTotal(d.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(true); }, [category, sort, search]);

  return (
    <div className="pb-24">
      <Navbar />

      {/* Header */}
      <div className="bg-green-primary px-4 py-4">
        <h1 className="font-display text-xl font-bold text-white mb-3">Marketplace</h1>
        <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-3 py-2.5">
          <span className="text-white/60">🔍</span>
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); }}
            placeholder="Product ya brand khojein..."
            className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/60 hover:text-white">✕</button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-gray-100">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition
              ${category === c.id
                ? "bg-green-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Sort + Count */}
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-xs text-gray-500">{total} products mile</p>
        <select
          value={sort} onChange={e => setSort(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none text-gray-600"
        >
          {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Products Grid */}
      <div className="px-4">
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_,i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 font-medium">Koi product nahi mila</p>
            <p className="text-gray-400 text-sm mt-1">Filter badlo ya search clear karo</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {products.map(p => <ProductCard key={p._id} product={p} onCartUpdate={() => {}} />)}
            </div>
            {/* Load more */}
            {products.length < total && (
              <button
                onClick={() => { const np = page + 1; setPage(np); fetchProducts(false); }}
                disabled={loading}
                className="w-full mt-4 py-3 border border-green-primary text-green-primary text-sm font-medium rounded-xl hover:bg-green-pale transition"
              >
                {loading ? "Load ho raha hai..." : "Aur Dikho"}
              </button>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function MarketplacePage() {
  return <Suspense fallback={<div className="min-h-screen bg-white" />}><MarketContent /></Suspense>;
}
