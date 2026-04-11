'use client';

import { useMemo } from 'react';
import { Check, AlertCircle, ChevronRight, Package, DollarSign } from 'lucide-react';
import { cn, formatCategory, formatPrice } from '@/lib/utils';
import { BOQ_PRIORITIES } from '@/lib/constants';
import type { LocalBOQItem, LocalSupplier, BOQPriority } from '@/lib/types';

interface BOQCoverageProps {
  boqItems: LocalBOQItem[];
  onItemClick?: (item: LocalBOQItem) => void;
  className?: string;
}

export function BOQCoverage({ boqItems, onItemClick, className }: BOQCoverageProps) {
  // Calculate coverage stats
  const stats = useMemo(() => {
    const total = boqItems.length;
    const covered = boqItems.filter(item => item.suppliersMatched > 0).length;
    const orderNow = boqItems.filter(item => item.priority === 'order_now');
    const orderNowCovered = orderNow.filter(item => item.suppliersMatched > 0).length;

    return {
      total,
      covered,
      coveragePercent: total > 0 ? Math.round((covered / total) * 100) : 0,
      orderNow: orderNow.length,
      orderNowCovered,
    };
  }, [boqItems]);

  // Group items by priority
  const groupedItems = useMemo(() => {
    const groups: Record<BOQPriority, LocalBOQItem[]> = {
      order_now: [],
      decide_now: [],
      scout_only: [],
      sample_only: [],
    };

    boqItems.forEach(item => {
      groups[item.priority].push(item);
    });

    return groups;
  }, [boqItems]);

  const getPriorityInfo = (priority: BOQPriority) => {
    return BOQ_PRIORITIES.find(p => p.value === priority) || BOQ_PRIORITIES[0];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Coverage Summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-foreground mb-3">Coverage Summary</h3>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">Overall Coverage</span>
            <span className="font-medium">{stats.covered}/{stats.total} items</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-success transition-all duration-500"
              style={{ width: `${stats.coveragePercent}%` }}
            />
          </div>
        </div>

        {/* Order Now alert */}
        {stats.orderNow > 0 && stats.orderNowCovered < stats.orderNow && (
          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/30">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {stats.orderNow - stats.orderNowCovered} &quot;Order Now&quot; items need suppliers
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                These are your highest priority items for this fair
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Items by Priority */}
      {(Object.entries(groupedItems) as [BOQPriority, LocalBOQItem[]][]).map(([priority, items]) => {
        if (items.length === 0) return null;
        const priorityInfo = getPriorityInfo(priority);

        return (
          <div key={priority} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {/* Priority Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: priorityInfo.bgColor }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ color: priorityInfo.color, backgroundColor: 'white' }}
                >
                  {priorityInfo.label}
                </span>
                <span className="text-sm text-text-muted">
                  {items.filter(i => i.suppliersMatched > 0).length}/{items.length} covered
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-border">
              {items.map(item => (
                <BOQItemRow key={item.id} item={item} onClick={() => onItemClick?.(item)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Individual BOQ Item Row
interface BOQItemRowProps {
  item: LocalBOQItem;
  onClick?: () => void;
}

function BOQItemRow({ item, onClick }: BOQItemRowProps) {
  const hasCoverage = item.suppliersMatched > 0;
  const withinBudget = item.bestPrice !== null &&
    item.targetPriceHigh !== null &&
    item.bestPrice <= item.targetPriceHigh;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      {/* Coverage indicator */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          hasCoverage ? "bg-success/10" : "bg-gray-100"
        )}
      >
        {hasCoverage ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <Package className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{item.name}</p>
        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
          <span>{formatCategory(item.category)}</span>
          <span>•</span>
          <span>{item.quantity} {item.unit}</span>
        </div>
      </div>

      {/* Price/Coverage info */}
      <div className="text-right flex-shrink-0">
        {hasCoverage ? (
          <>
            <p className={cn(
              "text-sm font-medium",
              withinBudget ? "text-success" : "text-warning"
            )}>
              {item.bestPrice !== null ? formatPrice(item.bestPrice) : '—'}
            </p>
            <p className="text-xs text-text-muted">
              {item.suppliersMatched} supplier{item.suppliersMatched > 1 ? 's' : ''}
            </p>
          </>
        ) : (
          <p className="text-sm text-text-muted">
            {item.targetPriceLow && item.targetPriceHigh
              ? `$${item.targetPriceLow}-${item.targetPriceHigh}`
              : 'No target'}
          </p>
        )}
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </button>
  );
}

// BOQ Item Detail Modal/View
interface BOQItemDetailProps {
  item: LocalBOQItem;
  suppliers: LocalSupplier[];
  onClose: () => void;
  onMatchSupplier?: (supplierId: string) => void;
}

export function BOQItemDetail({ item, suppliers, onClose, onMatchSupplier }: BOQItemDetailProps) {
  // Find suppliers matched to this item
  const matchedSuppliers = suppliers.filter(s =>
    s.boqMatches.some(m => m.boqItemId === item.id)
  );

  // Find potential suppliers by category
  const potentialSuppliers = suppliers.filter(s =>
    s.categories.includes(item.category) &&
    !matchedSuppliers.includes(s)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-lg max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-lg">{item.name}</h2>
              <p className="text-sm text-text-muted">{formatCategory(item.category)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-text-muted hover:text-foreground"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Item Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-bg-subtle rounded-lg">
              <p className="text-xs text-text-muted mb-1">Quantity</p>
              <p className="font-medium">{item.quantity} {item.unit}</p>
            </div>
            <div className="p-3 bg-bg-subtle rounded-lg">
              <p className="text-xs text-text-muted mb-1">Target Price</p>
              <p className="font-medium">
                {item.targetPriceLow && item.targetPriceHigh
                  ? `$${item.targetPriceLow} - $${item.targetPriceHigh}`
                  : 'Not set'}
              </p>
            </div>
            <div className="p-3 bg-bg-subtle rounded-lg col-span-2">
              <p className="text-xs text-text-muted mb-1">Description</p>
              <p className="text-sm">{item.description || 'No description'}</p>
            </div>
            {item.notes && (
              <div className="p-3 bg-bg-subtle rounded-lg col-span-2">
                <p className="text-xs text-text-muted mb-1">Notes</p>
                <p className="text-sm">{item.notes}</p>
              </div>
            )}
          </div>

          {/* Best Price */}
          {item.bestPrice !== null && (
            <div className="p-4 bg-success/10 rounded-xl border border-success/30">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-success" />
                <span className="font-medium text-success">Best Price Found</span>
              </div>
              <p className="text-2xl font-bold text-success">{formatPrice(item.bestPrice)}</p>
              <p className="text-sm text-text-muted mt-1">from {item.bestSupplierName}</p>
            </div>
          )}

          {/* Matched Suppliers */}
          {matchedSuppliers.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Matched Suppliers ({matchedSuppliers.length})</h3>
              <div className="space-y-2">
                {matchedSuppliers.map(supplier => {
                  const match = supplier.boqMatches.find(m => m.boqItemId === item.id);
                  return (
                    <div
                      key={supplier.localId}
                      className="p-3 bg-white border border-border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{supplier.companyName || 'Unnamed'}</p>
                        <p className="text-xs text-text-muted">{supplier.boothNumber}</p>
                      </div>
                      {match?.quotedPrice && (
                        <p className="font-medium text-primary">{formatPrice(match.quotedPrice)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Potential Suppliers */}
          {potentialSuppliers.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Potential Suppliers ({potentialSuppliers.length})</h3>
              <p className="text-xs text-text-muted mb-2">
                Suppliers in the same category but not yet matched
              </p>
              <div className="space-y-2">
                {potentialSuppliers.slice(0, 5).map(supplier => (
                  <button
                    key={supplier.localId}
                    type="button"
                    onClick={() => onMatchSupplier?.(supplier.localId)}
                    className="w-full p-3 bg-white border border-border rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-medium">{supplier.companyName || 'Unnamed'}</p>
                      <p className="text-xs text-text-muted">{supplier.boothNumber}</p>
                    </div>
                    <span className="text-xs text-primary">+ Match</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedSuppliers.length === 0 && potentialSuppliers.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No suppliers found for this category</p>
              <p className="text-sm mt-1">Add suppliers in &quot;{formatCategory(item.category)}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
