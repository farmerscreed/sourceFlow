'use client';

import Link from 'next/link';
import { FileText, Database, HelpCircle, Smartphone, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    href: '/boq',
    icon: Database,
    label: 'BOQ Matcher',
    description: 'Match suppliers to project requirements',
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
  },
  {
    href: '/export',
    icon: FileText,
    label: 'Export Reports',
    description: 'PDF summary and spreadsheet export',
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
  },
];

export default function MorePage() {
  return (
    <div className="min-h-screen pb-24 gradient-mesh">
      {/* Header */}
      <header className="sticky top-0 z-40 header-blur safe-top">
        <div className="flex items-center justify-center h-14 px-4">
          <h1 className="font-bold text-foreground">More</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        {/* Menu items */}
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-4 p-4 bg-white rounded-2xl shadow-soft overflow-hidden",
                "transition-all duration-300 active:scale-[0.98] card-hover",
                `slide-up stagger-${index + 1}`
              )}
            >
              {/* Gradient accent line */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
                item.gradient
              )} />

              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                item.iconBg
              )}>
                <Icon className={cn("w-6 h-6", item.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{item.label}</h3>
                <p className="text-sm text-text-muted truncate">{item.description}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          );
        })}

        {/* App branding card */}
        <div className="mt-8 slide-up stagger-3">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-blue-700 rounded-2xl p-6 text-center shadow-lg">
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">SOURCEFLOW</h2>
              <p className="text-white/60 text-sm mb-3">Canton Fair 2026</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                <Smartphone className="w-4 h-4 text-white/60" />
                <span className="text-white/80 text-sm font-medium">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Help link */}
        <Link
          href="#"
          className="flex items-center gap-3 p-4 text-text-muted hover:text-foreground transition-colors slide-up stagger-4"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm">Help & Support</span>
        </Link>
      </div>
    </div>
  );
}
