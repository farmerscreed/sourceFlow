'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, Users, Clock, CloudOff, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSupplierStats } from '@/lib/db';
import { SyncIndicator } from '@/components/SyncIndicator';
import { SupplierCard, SupplierCardSkeleton } from '@/components/SupplierCard';
import { cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/constants';
import type { SupplierCategory } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    total: number;
    today: number;
    shortlisted: number;
    pendingSync: number;
    byCategory: Record<string, number>;
  } | null>(null);

  // Live query for recent suppliers
  const recentSuppliers = useLiveQuery(
    () => db.suppliers.orderBy('createdAt').reverse().limit(5).toArray(),
    []
  );

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      const data = await getSupplierStats();
      setStats(data);
    };
    loadStats();

    // Refresh stats periodically
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get top categories with counts
  const topCategories = stats
    ? Object.entries(stats.byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];

  const isLoading = !stats || recentSuppliers === undefined;

  return (
    <div className="min-h-screen pb-24 gradient-mesh">
      {/* Header with gradient */}
      <header className="relative overflow-hidden safe-top">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative z-10 px-4 pt-4 pb-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-bold text-xl text-white tracking-tight">SOURCEFLOW</h1>
              <p className="text-white/60 text-sm">Canton Fair 2026</p>
            </div>
            <SyncIndicator showLabel className="text-white [&_*]:text-white [&_.bg-success\\/10]:bg-white/20 [&_.bg-warning\\/10]:bg-white/20 [&_.bg-danger\\/10]:bg-white/20" />
          </div>

          {/* Stats grid with glassmorphism */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-4 bg-white/10 border-white/20 slide-up">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/70 text-sm">Total</span>
              </div>
              <p className="text-3xl font-bold text-white">{isLoading ? '—' : stats.total}</p>
            </div>

            <div className="glass-card rounded-2xl p-4 bg-white/10 border-white/20 slide-up stagger-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-accent/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <span className="text-white/70 text-sm">Today</span>
              </div>
              <p className="text-3xl font-bold text-white">{isLoading ? '—' : stats.today}</p>
            </div>

            <div className="glass-card rounded-2xl p-4 bg-white/10 border-white/20 slide-up stagger-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-green-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-white/70 text-sm">Shortlisted</span>
              </div>
              <p className="text-2xl font-bold text-white">{isLoading ? '—' : stats.shortlisted}</p>
            </div>

            <div className="glass-card rounded-2xl p-4 bg-white/10 border-white/20 slide-up stagger-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-white/70 text-sm">Pending</span>
              </div>
              <p className="text-2xl font-bold text-white">{isLoading ? '—' : stats.pendingSync}</p>
            </div>
          </div>
        </div>

        {/* Curved bottom */}
        <div className="absolute -bottom-1 left-0 right-0 h-6 bg-[#f8fafc] rounded-t-[2rem]" />
      </header>

      {/* Content */}
      <div className="px-4 space-y-6 -mt-1">
        {/* Quick Capture CTA */}
        <Link
          href="/capture"
          className={cn(
            "relative flex items-center justify-between w-full p-5 rounded-2xl overflow-hidden",
            "bg-gradient-to-r from-accent to-amber-500",
            "shadow-lg shadow-accent/20",
            "transition-all duration-300 active:scale-[0.98] card-hover"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-semibold text-white text-lg">Capture Supplier</p>
              <p className="text-white/70 text-sm">Quick 60-second capture</p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-white/80 relative z-10" />
        </Link>

        {/* Categories */}
        {topCategories.length > 0 && (
          <div className="slide-up">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Categories</h2>
              <Link href="/suppliers" className="text-sm text-primary font-medium flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {topCategories.map(([category, count], index) => {
                const info = getCategoryInfo(category as SupplierCategory);
                return (
                  <Link
                    key={category}
                    href={`/suppliers?category=${category}`}
                    className={cn(
                      "flex items-center justify-between p-4 bg-white rounded-2xl",
                      "shadow-soft transition-all duration-200 card-hover",
                      `slide-up stagger-${index + 1}`
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${info.color}15` }}
                      >
                        <span className="text-lg">{info.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
                        {info.shortLabel}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${info.color}15`, color: info.color }}
                    >
                      {count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Insights teaser */}
        <Link
          href="/compare"
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl border border-primary/10 slide-up"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">AI Compare</p>
            <p className="text-sm text-text-muted">Get smart supplier insights</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary" />
        </Link>

        {/* Recent suppliers */}
        <div className="slide-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Recent Suppliers</h2>
            {(recentSuppliers?.length || 0) > 0 && (
              <Link
                href="/suppliers"
                className="text-sm text-primary font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <>
                <SupplierCardSkeleton />
                <SupplierCardSkeleton />
                <SupplierCardSkeleton />
              </>
            ) : recentSuppliers && recentSuppliers.length > 0 ? (
              recentSuppliers.map((supplier, index) => (
                <div key={supplier.localId} className={`slide-up stagger-${index + 1}`}>
                  <SupplierCard supplier={supplier} />
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-soft">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-foreground font-medium mb-1">No suppliers yet</p>
                <p className="text-sm text-text-muted mb-4">
                  Start capturing suppliers at the fair
                </p>
                <Link
                  href="/capture"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Capture First Supplier
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
