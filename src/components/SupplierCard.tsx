'use client';

import Link from 'next/link';
import { MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFirstPrice } from '@/lib/utils';
import { CategoryBadgeGroup } from './CategoryBadge';
import { RatingDisplay } from './RatingStars';
import { VerificationBadge } from './StatusBadge';
import type { LocalSupplier } from '@/lib/types';

interface SupplierCardProps {
  supplier: LocalSupplier;
  className?: string;
}

export function SupplierCard({ supplier, className }: SupplierCardProps) {
  const price = getFirstPrice(supplier);
  const isShortlisted = supplier.status === 'shortlisted';

  return (
    <Link
      href={`/suppliers/${supplier.localId}`}
      className={cn(
        "group relative block bg-white rounded-2xl p-4",
        "shadow-soft transition-all duration-300",
        "active:scale-[0.98] card-hover",
        "touch-manipulation overflow-hidden",
        isShortlisted && "ring-2 ring-accent/30",
        className
      )}
    >
      {/* Subtle gradient overlay for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] rounded-2xl" />

      {/* Shortlisted indicator */}
      {isShortlisted && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center shadow-lg shadow-accent/30">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Company name and rating */}
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-semibold text-foreground truncate text-[15px]">
              {supplier.companyName || 'Unnamed Supplier'}
            </h3>
            <RatingDisplay value={supplier.rating} />
          </div>

          {/* Categories */}
          {supplier.categories.length > 0 && (
            <CategoryBadgeGroup
              categories={supplier.categories}
              max={2}
              className="mb-2"
            />
          )}

          {/* Booth and location */}
          {supplier.boothNumber && (
            <div className="flex items-center gap-1.5 text-sm text-text-muted mb-2">
              <div className="w-5 h-5 rounded-lg bg-gray-100 flex items-center justify-center">
                <MapPin className="w-3 h-3" />
              </div>
              <span className="font-medium">{supplier.boothNumber}</span>
              {supplier.hallArea && (
                <>
                  <span className="mx-1 text-gray-300">•</span>
                  <span>{supplier.hallArea}</span>
                </>
              )}
            </div>
          )}

          {/* Price and verification */}
          <div className="flex items-center gap-2 flex-wrap">
            {price && (
              <span className="text-sm font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                {price}
              </span>
            )}
            <VerificationBadge
              verification={supplier.verification}
              size="sm"
              showLabel
            />
          </div>
        </div>

        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

interface SupplierCardCompactProps {
  supplier: LocalSupplier;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function SupplierCardCompact({
  supplier,
  selected,
  onSelect,
  className
}: SupplierCardCompactProps) {
  const price = getFirstPrice(supplier);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl p-3.5 transition-all duration-200",
        "active:scale-[0.98] touch-manipulation",
        selected
          ? "bg-gradient-to-br from-primary/10 to-blue-500/10 border-2 border-primary shadow-lg shadow-primary/10"
          : "bg-white border border-gray-100 shadow-soft hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate text-foreground">
            {supplier.companyName || 'Unnamed'}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {price && (
              <span className="text-xs font-bold text-primary">
                {price}
              </span>
            )}
            <RatingDisplay value={supplier.rating} size="sm" />
          </div>
        </div>
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
          selected
            ? "bg-gradient-to-br from-primary to-blue-600 shadow-md"
            : "bg-gray-100"
        )}>
          {selected ? (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          )}
        </div>
      </div>
    </button>
  );
}

interface SupplierCardSkeletonProps {
  className?: string;
}

export function SupplierCardSkeleton({ className }: SupplierCardSkeletonProps) {
  return (
    <div className={cn(
      "bg-white rounded-2xl p-4 shadow-soft overflow-hidden",
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-5 shimmer rounded-lg w-3/4" />
          <div className="flex gap-2">
            <div className="h-6 shimmer rounded-full w-20" />
            <div className="h-6 shimmer rounded-full w-16" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 shimmer rounded-lg" />
            <div className="h-4 shimmer rounded-lg w-24" />
          </div>
          <div className="h-4 shimmer rounded-lg w-20" />
        </div>
        <div className="w-8 h-8 shimmer rounded-xl" />
      </div>
    </div>
  );
}
