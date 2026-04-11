'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Sparkles, Send, Loader2, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CompareTable } from '@/components/CompareTable';
import { useAI } from '@/hooks/useAI';
import { useAppStore } from '@/lib/store';
import { cn, formatCategory } from '@/lib/utils';
import type { LocalSupplier } from '@/lib/types';

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const { askQuestion, isProcessing, error } = useAI();
  const isOnline = useAppStore(state => state.isOnline);

  // Fetch all suppliers
  const allSuppliers = useLiveQuery(() => db.suppliers.toArray(), []) || [];

  // Get selected suppliers
  const selectedSuppliers = allSuppliers.filter(s => selectedIds.includes(s.localId));

  // Add supplier to comparison
  const addSupplier = (localId: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(localId)) {
      setSelectedIds(prev => [...prev, localId]);
    }
    setShowPicker(false);
  };

  // Remove supplier from comparison
  const removeSupplier = (localId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== localId));
  };

  // Ask AI about the comparison
  const handleAskAI = async () => {
    if (!aiQuestion.trim() || selectedSuppliers.length < 2) return;

    // Prepare supplier data for AI
    const supplierData = selectedSuppliers.map(s => ({
      name: s.companyName,
      rating: s.rating,
      status: s.status,
      verification: s.verification,
      categories: s.categories,
      boothNumber: s.boothNumber,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      paymentTerms: s.pricing?.paymentTerms,
      leadTimeDays: s.pricing?.leadTimeDays,
      samplePolicy: s.pricing?.samplePolicy,
      fobPort: s.pricing?.fobPort,
      shipsToAfrica: s.capabilities?.shipsToAfrica,
      africaExperience: s.capabilities?.africaExperience,
      factoryLocation: s.capabilities?.factoryLocation,
      yearsInBusiness: s.capabilities?.yearsInBusiness,
      greenFlags: s.greenFlags,
      redFlags: s.redFlags,
      notes: s.notes,
      aiSummary: s.aiSummary,
    }));

    const context = `The user is comparing ${selectedSuppliers.length} suppliers for a construction project in Nigeria (Primerose Estate). Help them decide which supplier is best based on the data provided.`;

    const answer = await askQuestion(aiQuestion, supplierData, context);
    if (answer) {
      setAiAnswer(answer);
    }
  };

  // Suggested questions
  const suggestedQuestions = [
    'Which supplier has the best overall value?',
    'Which one is most likely a real manufacturer?',
    'Who should I prioritize for follow-up?',
    'Compare their Africa shipping experience',
  ];

  return (
    <div className="min-h-screen pb-24 gradient-mesh">
      {/* Header with gradient */}
      <header className="relative overflow-hidden safe-top">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative z-10 px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-bold text-lg text-white">AI Compare</h1>
            </div>
            <div className="w-10" />
          </div>

          {/* Selected suppliers chips */}
          <div className="flex flex-wrap gap-2 items-center slide-up">
            {selectedSuppliers.map(supplier => (
              <div
                key={supplier.localId}
                className="flex items-center gap-2 pl-3 pr-2 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm"
              >
                <span className="truncate max-w-[100px] font-medium">{supplier.companyName || 'Unnamed'}</span>
                <button
                  type="button"
                  onClick={() => removeSupplier(supplier.localId)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {selectedIds.length < 4 && (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-white/30 rounded-xl text-sm text-white/80 hover:border-white/50 hover:text-white transition-all"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
        </div>

        {/* Curved bottom */}
        <div className="absolute -bottom-1 left-0 right-0 h-6 bg-[#f8fafc] rounded-t-[2rem]" />
      </header>

      {/* Supplier Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[70vh] bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl scale-in">
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Select Supplier</h3>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[50vh] p-3">
              {allSuppliers.length === 0 ? (
                <p className="text-center py-12 text-text-muted">No suppliers found</p>
              ) : (
                <div className="space-y-2">
                  {allSuppliers.map(supplier => {
                    const isSelected = selectedIds.includes(supplier.localId);
                    return (
                      <button
                        key={supplier.localId}
                        type="button"
                        onClick={() => !isSelected && addSupplier(supplier.localId)}
                        disabled={isSelected}
                        className={cn(
                          "w-full p-4 rounded-2xl text-left flex items-center justify-between transition-all",
                          isSelected
                            ? "bg-gradient-to-r from-primary/10 to-blue-500/10 border-2 border-primary"
                            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        )}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{supplier.companyName || 'Unnamed Supplier'}</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {supplier.boothNumber && `Booth ${supplier.boothNumber}`}
                            {supplier.categories.length > 0 && ` • ${formatCategory(supplier.categories[0])}`}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-2 space-y-4 -mt-1">
        {/* Comparison Table */}
        {selectedSuppliers.length >= 2 ? (
          <div className="bg-white rounded-2xl overflow-hidden shadow-soft slide-up">
            <CompareTable
              suppliers={selectedSuppliers}
              onRemove={removeSupplier}
            />
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-soft slide-up">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <p className="text-foreground font-semibold mb-1">
              {selectedSuppliers.length === 0
                ? 'Select suppliers to compare'
                : 'Add one more supplier'}
            </p>
            <p className="text-sm text-text-muted px-8">
              Compare up to 4 suppliers side by side with AI insights
            </p>
          </div>
        )}

        {/* AI Query Section */}
        {selectedSuppliers.length >= 2 && (
          <div className="bg-white rounded-2xl p-5 shadow-soft slide-up stagger-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Ask AI</h3>
                {!isOnline && (
                  <span className="text-xs text-amber-600">(Requires internet)</span>
                )}
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedQuestions.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAiQuestion(q)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                    aiQuestion === q
                      ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask anything about these suppliers..."
                className="input-modern flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              />
              <button
                type="button"
                onClick={handleAskAI}
                disabled={!aiQuestion.trim() || isProcessing || !isOnline}
                className={cn(
                  "px-5 py-3 rounded-xl transition-all duration-200",
                  "bg-gradient-to-r from-primary to-blue-600 text-white",
                  "shadow-lg shadow-primary/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                  "active:scale-95"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* AI Answer */}
            {aiAnswer && (
              <div className="mt-4 p-4 bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">AI Analysis</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiAnswer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
