"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useEffect, useState } from "react";
import { cartAPI, authAPI } from "../../lib/api";

export default function Navbar() {
  const { user } = useAuth();
  const pathname  = usePathname();
  const router    = useRouter();
  const [cartCount,  setCartCount]  = useState(0);
  const [unread,     setUnread]     = useState(0);

  useEffect(() => {
    if (!user) return;
    if (user.role === "buyer") {
      cartAPI.get().then(d => setCartCount(d.cart?.items?.length || 0)).catch(() => {});
    }
    authAPI.getNotifs().then(d => setUnread(d.unread || 0)).catch(() => {});
  }, [user, pathname]);

  const isHidden = ["/login"].includes(pathname);
  if (isHidden) return null;

  return (
    <nav className="sticky top-0 z-50 bg-green-primary px-4 py-3 flex items-center justify-between shadow-md">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">🌾</span>
        <span className="font-display text-xl font-bold text-beige">
          Agro<span className="text-green-300">Ease</span>
        </span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Link href="/marketplace" className="p-2 rounded-xl bg-white/10 text-beige hover:bg-white/20 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Link>

        {/* Cart (buyer only) */}
        {user?.role === "buyer" && (
          <Link href="/cart" className="relative p-2 rounded-xl bg-white/10 text-beige hover:bg-white/20 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-green-primary text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        )}

        {/* Notifications */}
        {user && (
          <Link href="/dashboard" className="relative p-2 rounded-xl bg-white/10 text-beige hover:bg-white/20 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        )}

        {/* Login button */}
        {!user && (
          <Link href="/login" className="bg-white text-green-primary text-sm font-semibold px-3 py-1.5 rounded-xl hover:bg-beige transition">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
