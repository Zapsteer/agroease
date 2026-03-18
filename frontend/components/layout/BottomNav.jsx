"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

const buyerNav = [
  { href: "/",            icon: "🏠", label: "Home"    },
  { href: "/marketplace", icon: "🛍️", label: "Market"  },
  { href: "/shops",       icon: "🗺️", label: "Shops"   },
  { href: "/cart",        icon: "🛒", label: "Cart"    },
  { href: "/orders",      icon: "📦", label: "Orders"  },
  { href: "/dashboard",   icon: "👤", label: "Profile" },
];

const sellerNav = [
  { href: "/",          icon: "🏠", label: "Home"     },
  { href: "/seller",    icon: "🏪", label: "My Shop"  },
  { href: "/orders",    icon: "📦", label: "Orders"   },
  { href: "/dashboard", icon: "👤", label: "Profile"  },
];

const driverNav = [
  { href: "/",          icon: "🏠", label: "Home"      },
  { href: "/driver",    icon: "🚛", label: "Deliveries"},
  { href: "/orders",    icon: "📋", label: "History"   },
  { href: "/dashboard", icon: "👤", label: "Profile"   },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname === "/login") return null;

  const navItems = user?.role === "seller" ? sellerNav
                 : user?.role === "driver" ? driverNav
                 : buyerNav;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 z-50 bottom-safe">
      <div className="flex">
        {navItems.map(item => {
          const isActive = pathname === item.href ||
                           (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors
                ${isActive ? "text-green-primary" : "text-gray-400 hover:text-gray-600"}`}
            >
              <span className={`text-xl leading-none rounded-xl p-1.5 transition-colors
                ${isActive ? "bg-green-pale" : ""}`}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? "text-green-primary font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
