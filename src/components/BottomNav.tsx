'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, List, Scale, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const navItems = [
  { href: '/', icon: Home, label: 'Home', tab: 'home' as const },
  { href: '/capture', icon: Plus, label: 'Capture', tab: 'capture' as const, isMain: true },
  { href: '/suppliers', icon: List, label: 'Suppliers', tab: 'suppliers' as const },
  { href: '/compare', icon: Scale, label: 'Compare', tab: 'compare' as const },
  { href: '/more', icon: MoreHorizontal, label: 'More', tab: 'more' as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 nav-glass safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isMain) {
            // Capture button - elevated modern design
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActiveTab(item.tab)}
                className="flex items-center justify-center -mt-6"
              >
                <div className={cn(
                  "relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
                  "bg-gradient-to-br from-accent to-amber-600 text-white",
                  "shadow-lg shadow-accent/30",
                  "active:scale-95 active:shadow-md",
                  isActive && "ring-4 ring-accent/20 scale-105"
                )}>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                  <Icon className="w-7 h-7 relative z-10" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setActiveTab(item.tab)}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-full transition-all duration-200",
                "touch-manipulation select-none-touch",
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-1 w-1 h-1 bg-primary rounded-full" />
              )}
              <Icon className={cn(
                "w-6 h-6 mb-0.5 transition-transform duration-200",
                isActive && "scale-110"
              )} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive ? "opacity-100" : "opacity-0 scale-90"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
