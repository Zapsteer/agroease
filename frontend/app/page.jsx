"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/layout/Navbar";
import BottomNav from "../components/layout/BottomNav";
import ProductCard from "../components/ui/ProductCard";
import { productAPI } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

const CATEGORIES = [
  { id: "fertilizer", label: "Fertilizers", emoji: "🌾", bg: "bg-green-50" },
  { id: "pesticide",  label: "Pesticides",  emoji: "🧪", bg: "bg-blue-50"  },
  { id: "seed",       label: "Seeds",       emoji: "🌱", bg: "bg-yellow-50"},
  { id: "organic",    label: "Organic",     emoji: "🍃", bg: "bg-emerald-50"},
  { id: "tool",       label: "Tools",       emoji: "🛠️", bg: "bg-gray-50"  },
  { id: "equipment",  label: "Equipment",   emoji: "⚙️", bg: "bg-slate-50" },
];

const CROPS = [
  { id: "apple",  label: "Apple",  emoji: "🍎" },
  { id: "peach",  label: "Peach",  emoji: "🍑" },
  { id: "plum",   label: "Plum",   emoji: "🟣" },
  { id: "wheat",  label: "Wheat",  emoji: "🌾" },
  { id: "maize",  label: "Maize",  emoji: "🌽" },
];

export default function HomePage() {
  const { user }       = useAuth();
  const [featured, setFeatured]   = useState([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    productAPI.getAll({ featured: true, limit: 6 })
      .then(d => setFeatured(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-24">
      <Navbar />

      {/* HERO */}
      <div className="bg-green-primary px-4 pt-5 pb-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute right-8 bottom-0 w-24 h-24 rounded-full bg-white/5" />

        <p className="text-white/70 text-sm mb-1">Jai Kisan! 🌾</p>
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          {user ? `Namaste, ${user.name.split(" ")[0]} Ji` : "AgroEase Himachal"}
        </h1>
        <p className="text-white/60 text-sm mb-4">Kheti ki har zaroorat — ek jagah</p>

        {/* Search bar */}
        <Link href="/marketplace" className="flex items-center gap-3 bg-white/15 border border-white/20 rounded-xl px-4 py-3">
          <span className="text-white/60 text-sm">🔍</span>
          <span className="text-white/50 text-sm">Beej, khad, dawai khojein...</span>
        </Link>

        {/* Stats */}
        <div className="flex gap-3 mt-4">
          {[
            { n: "1,200+", l: "Products" },
            { n: "50+",    l: "Shops" },
            { n: "5km",    l: "Avg Delivery" },
          ].map(s => (
            <div key={s.l} className="flex-1 bg-white/10 border border-white/15 rounded-xl py-2 px-3">
              <p className="text-white font-bold text-lg leading-none">{s.n}</p>
              <p className="text-white/60 text-[11px] mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Banner */}
      <div className="mx-4 -mt-4 bg-gradient-to-r from-green-medium to-green-light rounded-2xl p-4 shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">🤖 AI Feature</span>
            <h3 className="font-display text-white text-lg font-bold mt-1">Crop Disease<br/>Detector</h3>
            <p className="text-white/80 text-xs mt-1">Photo lo, disease pata karo</p>
          </div>
          <Link
            href="/ai"
            className="bg-white text-green-primary text-sm font-bold px-4 py-2 rounded-xl hover:bg-beige transition"
          >
            Try Now →
          </Link>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="px-4 mb-2">
        <h2 className="section-title mb-3">Categories</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.id}
            href={`/marketplace?category=${cat.id}`}
            className="flex-shrink-0 flex flex-col items-center gap-1.5"
          >
            <div className={`w-14 h-14 ${cat.bg} rounded-2xl flex items-center justify-center text-2xl`}>
              {cat.emoji}
            </div>
            <span className="text-xs text-gray-600 font-medium">{cat.label}</span>
          </Link>
        ))}
      </div>

      {/* CROPS */}
      <div className="px-4 mt-5 mb-2">
        <h2 className="section-title mb-3">Crop-wise Products</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        {CROPS.map(c => (
          <Link
            key={c.id}
            href={`/marketplace?cropType=${c.id}`}
            className="flex-shrink-0 flex items-center gap-2 bg-green-pale border border-green-muted rounded-xl px-3 py-2"
          >
            <span className="text-lg">{c.emoji}</span>
            <span className="text-sm font-medium text-green-medium">{c.label}</span>
          </Link>
        ))}
      </div>

      {/* FEATURED PRODUCTS */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Featured Products</h2>
          <Link href="/marketplace" className="text-green-primary text-sm font-medium">Sab dekho →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>

      {/* WEATHER CARD */}
      <div className="mx-4 mt-6 bg-green-primary rounded-2xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-xs mb-1">📍 Shimla, HP</p>
            <p className="text-white text-4xl font-bold">18°C</p>
            <p className="text-white/80 text-sm mt-1">Partly Cloudy</p>
            <div className="bg-white/15 rounded-lg p-2 mt-3">
              <p className="text-white/90 text-xs">💧 Aaj irrigation ke liye accha din hai</p>
            </div>
          </div>
          <span className="text-6xl">⛅</span>
        </div>
      </div>

      {/* QUICK LINKS */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        <Link href="/shops" className="card flex items-center gap-3 hover:border-green-muted transition">
          <span className="text-2xl">🗺️</span>
          <div>
            <p className="font-semibold text-sm">Nearby Shops</p>
            <p className="text-xs text-gray-400">Map par dekho</p>
          </div>
        </Link>
        <Link href="/ai" className="card flex items-center gap-3 hover:border-green-muted transition">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="font-semibold text-sm">AI Detection</p>
            <p className="text-xs text-gray-400">Disease pata karo</p>
          </div>
        </Link>
        <Link href="/orders" className="card flex items-center gap-3 hover:border-green-muted transition">
          <span className="text-2xl">📦</span>
          <div>
            <p className="font-semibold text-sm">My Orders</p>
            <p className="text-xs text-gray-400">Track karo</p>
          </div>
        </Link>
        <Link href="/dashboard" className="card flex items-center gap-3 hover:border-green-muted transition">
          <span className="text-2xl">👤</span>
          <div>
            <p className="font-semibold text-sm">Profile</p>
            <p className="text-xs text-gray-400">Account settings</p>
          </div>
        </Link>
      </div>

      <div className="h-6" />
      <BottomNav />
    </div>
  );
}
