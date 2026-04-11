'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { SupplierCard, SupplierCardSkeleton } from '@/components/SupplierCard';
import { cn, filterSuppliers, sortSuppliers } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { CATEGORIES, STATUSES } from '@/lib/constants';
import type { SupplierCategory } from '@/lib/types';

function SuppliersContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') as SupplierCategory | null;

  const { filters, setFilters, sort, setSort } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize category from URL if present
  useEffect(() => {
    if (initialCategory && filters.category === 'all') {
      setFilters({ category: initialCategory });
    }
  }, [initialCategory, filters.category, setFilters]);

  // Live query for all suppliers
  const allSuppliers = useLiveQuery(
    () => db.suppliers.toArray(),
    []
  );

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    if (!allSuppliers) return [];

    const filtered = filterSuppliers(allSuppliers, {
      category: filters.category === 'all' ? undefined : filters.category,
      status: filters.status === 'all' ? undefined : filters.status,
      verification: filters.verification === 'all' ? undefined : filters.verification,
      search: searchQuery,
    });

    return sortSuppliers(filtered, sort.by, sort.direction);
  }, [allSuppliers, filters, searchQuery, sort]);

  const isLoading = allSuppliers === undefined;

  return (
    <div className="min-h-screen pb-24 gradient-mesh">
      {/* Header with modern glass effect */}
      <header className="sticky top-0 z-40 header-blur safe-top">
        <div className="px-4 py-3">
          {/* Title and count */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">Suppliers</h1>
              <p className="text-sm text-text-muted">
                {isLoading ? 'Loading...' : `${filteredSuppliers.length} supplier${filteredSuppliers.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "relative p-2.5 rounded-xl transition-all duration-200",
                showFilters
                  ? "bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/30"
                  : "bg-white text-gray-500 shadow-soft hover:shadow-md"
              )}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {(filters.category !== 'all' || filters.status !== 'all') && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white" />
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative slide-up">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, booth, category..."
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-2xl",
                "bg-white text-foreground placeholder:text-gray-400 text-sm",
                "shadow-soft transition-all duration-200",
                "focus:outline-none focus:ring-4 focus:ring-primary/10 focus:shadow-md"
              )}
            />
          </div>

          {/* Filter pills with animation */}
          {showFilters && (
            <div className="space-y-4 pt-4 pb-2 slide-up">
              {/* Category filter */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px]">C</span>
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters({ category: 'all' })}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                      filters.category === 'all'
                        ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-md"
                        : "bg-white text-gray-500 shadow-soft hover:shadow-md"
                    )}
                  >
                    All
                  </button>
                  {CATEGORIES.slice(0, 8).map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setFilters({ category: cat.value })}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                        filters.category === cat.value
                          ? "text-white shadow-md"
                          : "bg-white text-gray-500 shadow-soft hover:shadow-md"
                      )}
                      style={filters.category === cat.value ? { background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` } : undefined}
                    >
                      <span className="mr-1">{cat.icon}</span>
                      {cat.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status filter */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px]">S</span>
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters({ status: 'all' })}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                      filters.status === 'all'
                        ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-md"
                        : "bg-white text-gray-500 shadow-soft hover:shadow-md"
                    )}
                  >
                    All
                  </button>
                  {STATUSES.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setFilters({ status: status.value })}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                        filters.status === status.value
                          ? "text-white shadow-md"
                          : "bg-white text-gray-500 shadow-soft hover:shadow-md"
                      )}
                      style={filters.status === status.value ? { background: `linear-gradient(135deg, ${status.color}, ${status.color}dd)` } : undefined}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px]">↑</span>
                  Sort by
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { by: 'date', label: 'Newest First', icon: '🕐' },
                    { by: 'rating', label: 'Top Rated', icon: '⭐' },
                    { by: 'name', label: 'A-Z', icon: '🔤' },
                  ].map((option) => (
                    <button
                      key={option.by}
                      onClick={() => setSort({ by: option.by as typeof sort.by, direction: 'desc' })}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                        sort.by === option.by
                          ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-md"
                          : "bg-white text-gray-500 shadow-soft hover:shadow-md"
                      )}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* Supplier list */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              <SupplierCardSkeleton />
              <SupplierCardSkeleton />
              <SupplierCardSkeleton />
              <SupplierCardSkeleton />
            </>
          ) : filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((supplier, index) => (
              <div key={supplier.localId} className={`slide-up stagger-${Math.min(index + 1, 5)}`}>
                <SupplierCard supplier={supplier} />
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl shadow-soft slide-up">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-foreground font-semibold mb-1">No suppliers found</p>
              <p className="text-sm text-text-muted px-8">
                {searchQuery || filters.category !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Capture your first supplier to get started'}
              </p>
              {(!searchQuery && filters.category === 'all' && filters.status === 'all') && (
                <Link
                  href="/capture"
                  className={cn(
                    "inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl",
                    "bg-gradient-to-r from-accent to-amber-500 text-white font-semibold",
                    "shadow-lg shadow-accent/30 transition-all active:scale-95"
                  )}
                >
                  <Plus className="w-5 h-5" />
                  Capture Supplier
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link
        href="/capture"
        className={cn(
          "fixed right-4 bottom-20 z-50",
          "w-14 h-14 rounded-2xl",
          "bg-gradient-to-br from-accent to-amber-500 text-white",
          "shadow-lg shadow-accent/40",
          "flex items-center justify-center",
          "active:scale-95 transition-all duration-200 float"
        )}
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </Link>
    </div>
  );
}

function SuppliersLoading() {
  return (
    <div className="min-h-screen bg-bg-subtle pb-24">
      <header className="sticky top-0 z-40 bg-white border-b border-border safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <div className="w-full h-11 rounded-xl bg-bg-subtle animate-pulse" />
            </div>
            <div className="w-11 h-11 rounded-xl bg-bg-subtle animate-pulse" />
          </div>
        </div>
      </header>
      <div className="p-4 space-y-3">
        <SupplierCardSkeleton />
        <SupplierCardSkeleton />
        <SupplierCardSkeleton />
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<SuppliersLoading />}>
      <SuppliersContent />
    </Suspense>
  );
}
