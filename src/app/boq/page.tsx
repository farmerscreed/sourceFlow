'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedBOQItems, updateBOQCoverage } from '@/lib/db';
import { BOQCoverage, BOQItemDetail } from '@/components/BOQCoverage';
import { useToastStore } from '@/lib/store';
import type { LocalBOQItem, LocalSupplier } from '@/lib/types';

export default function BOQPage() {
  const [selectedItem, setSelectedItem] = useState<LocalBOQItem | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const { addToast } = useToastStore();

  // Seed BOQ items on mount
  useEffect(() => {
    seedBOQItems();
  }, []);

  // Fetch BOQ items and suppliers
  const boqItems = useLiveQuery(() => db.boqItems.toArray(), []) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []) || [];

  // Recalculate coverage
  const recalculateCoverage = async () => {
    setIsSeeding(true);

    try {
      for (const item of boqItems) {
        // Find suppliers matched to this item
        const matchedSuppliers = suppliers.filter(s =>
          s.boqMatches.some(m => m.boqItemId === item.id && m.canSupply)
        );

        // Calculate best price
        let bestPrice: number | null = null;
        let bestSupplierName = '';

        matchedSuppliers.forEach(supplier => {
          const match = supplier.boqMatches.find(m => m.boqItemId === item.id);
          if (match?.quotedPrice) {
            if (bestPrice === null || match.quotedPrice < bestPrice) {
              bestPrice = match.quotedPrice;
              bestSupplierName = supplier.companyName;
            }
          }
        });

        // Update BOQ item
        await updateBOQCoverage(item.id, matchedSuppliers.length, bestPrice, bestSupplierName);
      }

      addToast({ type: 'success', message: 'Coverage recalculated' });
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to recalculate' });
    } finally {
      setIsSeeding(false);
    }
  };

  // Handle matching a supplier to a BOQ item
  const handleMatchSupplier = async (supplierId: string) => {
    if (!selectedItem) return;

    const supplier = suppliers.find(s => s.localId === supplierId);
    if (!supplier) return;

    // Add BOQ match to supplier
    const newMatch = {
      boqItemId: selectedItem.id,
      boqItemName: selectedItem.name,
      canSupply: true,
      quotedPrice: undefined,
      quantityAvailable: undefined,
    };

    const updatedMatches = [...supplier.boqMatches, newMatch];
    await db.suppliers.update(supplierId, {
      boqMatches: updatedMatches,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    // Recalculate coverage for this item
    const matchedCount = suppliers.filter(s =>
      s.boqMatches.some(m => m.boqItemId === selectedItem.id)
    ).length + 1;

    await updateBOQCoverage(
      selectedItem.id,
      matchedCount,
      selectedItem.bestPrice,
      selectedItem.bestSupplierName || supplier.companyName
    );

    addToast({ type: 'success', message: `Matched ${supplier.companyName}` });
  };

  return (
    <div className="min-h-screen pb-24 gradient-mesh">
      {/* Header with gradient */}
      <header className="relative overflow-hidden safe-top">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative z-10 px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/more"
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-lg text-white">BOQ Matcher</h1>
            <button
              type="button"
              onClick={recalculateCoverage}
              disabled={isSeeding}
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-50"
              title="Recalculate coverage"
            >
              {isSeeding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Project summary */}
          <div className="glass-card rounded-2xl p-4 bg-white/10 border-white/20 slide-up">
            <p className="text-white/60 text-sm">Project</p>
            <p className="text-white font-bold text-lg">Primerose Estate</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span className="text-white/80 text-sm">{boqItems.filter(i => i.suppliersMatched > 0).length} Covered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                <span className="text-white/80 text-sm">{boqItems.filter(i => i.suppliersMatched === 0).length} Uncovered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Curved bottom */}
        <div className="absolute -bottom-1 left-0 right-0 h-6 bg-[#f8fafc] rounded-t-[2rem]" />
      </header>

      {/* Content */}
      <div className="px-4 pt-2 -mt-1">
        {boqItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-soft slide-up">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-emerald-500" />
            <p className="text-foreground font-medium">Loading BOQ items...</p>
            <p className="text-sm text-text-muted mt-1">Setting up project requirements</p>
          </div>
        ) : (
          <div className="slide-up">
            <BOQCoverage
              boqItems={boqItems}
              onItemClick={setSelectedItem}
            />
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <BOQItemDetail
          item={selectedItem}
          suppliers={suppliers}
          onClose={() => setSelectedItem(null)}
          onMatchSupplier={handleMatchSupplier}
        />
      )}
    </div>
  );
}
