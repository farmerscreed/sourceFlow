'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2, ImagePlus, Mic } from 'lucide-react';
import Link from 'next/link';
import { db, getSupplierByLocalId, getPhotosBySupplier, getVoiceNotesBySupplier } from '@/lib/db';
import { CategorySelector } from '@/components/CategoryBadge';
import { RatingStars } from '@/components/RatingStars';
import { StatusSelector, VerificationSelector } from '@/components/StatusBadge';
import { PhotoViewer } from '@/components/PhotoViewer';
import { VoiceNoteList } from '@/components/AudioPlayer';
import { OCRResultDisplay } from '@/components/OCRResultDisplay';
import { cn, vibrate, formatDuration } from '@/lib/utils';
import { useToastStore } from '@/lib/store';
import type { LocalSupplier, LocalPhoto, LocalVoiceNote, SupplierCategory, SupplierStatus, VerificationStatus } from '@/lib/types';

type Tab = 'info' | 'media' | 'pricing' | 'notes';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToastStore();

  const [supplier, setSupplier] = useState<LocalSupplier | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<LocalVoiceNote[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load supplier data
  useEffect(() => {
    const loadData = async () => {
      const id = params.id as string;
      const data = await getSupplierByLocalId(id);
      if (data) {
        setSupplier(data);
        const photoData = await getPhotosBySupplier(id);
        const noteData = await getVoiceNotesBySupplier(id);
        setPhotos(photoData);
        setVoiceNotes(noteData);
      }
      setIsLoading(false);
    };
    loadData();
  }, [params.id]);

  // Update field handler
  const updateField = async <K extends keyof LocalSupplier>(
    field: K,
    value: LocalSupplier[K]
  ) => {
    if (!supplier) return;

    const updated = {
      ...supplier,
      [field]: value,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
    };

    setSupplier(updated);

    // Debounced save to IndexedDB
    await db.suppliers.put(updated);
  };

  // Delete supplier
  const handleDelete = async () => {
    if (!supplier) return;
    if (!confirm('Delete this supplier? This cannot be undone.')) return;

    try {
      await db.transaction('rw', [db.suppliers, db.photos, db.voiceNotes], async () => {
        await db.photos.where('supplierLocalId').equals(supplier.localId).delete();
        await db.voiceNotes.where('supplierLocalId').equals(supplier.localId).delete();
        await db.suppliers.delete(supplier.localId);
      });

      addToast({ type: 'success', message: 'Supplier deleted' });
      router.push('/suppliers');
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to delete supplier' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-muted">Loading supplier...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen gradient-mesh flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Trash2 className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-foreground font-semibold mb-2">Supplier not found</p>
        <p className="text-text-muted text-sm mb-6">This supplier may have been deleted</p>
        <Link
          href="/suppliers"
          className="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/30"
        >
          Back to suppliers
        </Link>
      </div>
    );
  }

  const tabIcons = {
    info: '📋',
    media: '📷',
    pricing: '💰',
    notes: '📝',
  };

  return (
    <div className="min-h-screen pb-24 gradient-mesh">
      {/* Header */}
      <header className="sticky top-0 z-40 header-blur safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <Link
            href="/suppliers"
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-center flex-1 px-4">
            <h1 className="font-bold text-foreground truncate">
              {supplier.companyName || 'Supplier Details'}
            </h1>
            {supplier.boothNumber && (
              <p className="text-xs text-text-muted">Booth {supplier.boothNumber}</p>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 transition-all active:scale-95"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Modern Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {(['info', 'media', 'pricing', 'notes'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold capitalize rounded-xl transition-all duration-200",
                activeTab === tab
                  ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/30"
                  : "text-text-muted bg-gray-100 hover:bg-gray-200"
              )}
            >
              <span className="mr-1">{tabIcons[tab]}</span>
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Tab content */}
      <div className="px-4 pt-2 slide-up">
        {activeTab === 'info' && (
          <InfoTab supplier={supplier} onUpdate={updateField} />
        )}
        {activeTab === 'media' && (
          <MediaTab photos={photos} voiceNotes={voiceNotes} />
        )}
        {activeTab === 'pricing' && (
          <PricingTab supplier={supplier} onUpdate={updateField} />
        )}
        {activeTab === 'notes' && (
          <NotesTab supplier={supplier} onUpdate={updateField} />
        )}
      </div>
    </div>
  );
}

// Info Tab Component
function InfoTab({
  supplier,
  onUpdate
}: {
  supplier: LocalSupplier;
  onUpdate: <K extends keyof LocalSupplier>(field: K, value: LocalSupplier[K]) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Company Name */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs">🏢</span>
          Company Name
        </label>
        <input
          type="text"
          value={supplier.companyName}
          onChange={(e) => onUpdate('companyName', e.target.value)}
          className="input-modern"
          placeholder="Enter company name"
        />
      </div>

      {/* Contact Person */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 text-xs">👤</span>
          Contact Person
        </label>
        <input
          type="text"
          value={supplier.contactPerson}
          onChange={(e) => onUpdate('contactPerson', e.target.value)}
          className="input-modern"
          placeholder="Contact name"
        />
      </div>

      {/* Contact details grid */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 text-xs">📞</span>
          Contact Details
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="tel"
            value={supplier.phone}
            onChange={(e) => onUpdate('phone', e.target.value)}
            className="input-modern"
            placeholder="Phone"
          />
          <input
            type="email"
            value={supplier.email}
            onChange={(e) => onUpdate('email', e.target.value)}
            className="input-modern"
            placeholder="Email"
          />
          <input
            type="text"
            value={supplier.wechat}
            onChange={(e) => onUpdate('wechat', e.target.value)}
            className="input-modern"
            placeholder="WeChat"
          />
          <input
            type="text"
            value={supplier.whatsapp}
            onChange={(e) => onUpdate('whatsapp', e.target.value)}
            className="input-modern"
            placeholder="WhatsApp"
          />
        </div>
      </div>

      {/* Booth info */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 text-xs">📍</span>
          Booth Location
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={supplier.boothNumber}
            onChange={(e) => onUpdate('boothNumber', e.target.value)}
            className="input-modern"
            placeholder="Booth #"
          />
          <input
            type="text"
            value={supplier.hallArea}
            onChange={(e) => onUpdate('hallArea', e.target.value)}
            className="input-modern"
            placeholder="Hall Area"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 text-xs">🏷️</span>
          Categories
        </label>
        <CategorySelector
          selected={supplier.categories}
          onChange={(cats) => {
            onUpdate('categories', cats);
            onUpdate('primaryCategory', cats[0] || null);
          }}
        />
      </div>

      {/* Status & Verification */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 text-xs">📊</span>
          Status & Verification
        </label>
        <div className="space-y-3">
          <StatusSelector
            value={supplier.status}
            onChange={(status) => onUpdate('status', status)}
          />
          <VerificationSelector
            value={supplier.verification}
            onChange={(v) => onUpdate('verification', v)}
          />
        </div>
      </div>

      {/* Rating */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-600 text-xs">⭐</span>
          Rating
        </label>
        <RatingStars
          value={supplier.rating}
          onChange={(r) => onUpdate('rating', r)}
          size="lg"
        />
      </div>
    </div>
  );
}

// Media Tab Component
function MediaTab({
  photos,
  voiceNotes
}: {
  photos: LocalPhoto[];
  voiceNotes: LocalVoiceNote[];
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Create photo URLs for the viewer (memoized to prevent recreating on every render)
  const photoUrls = useMemo(() => {
    return photos
      .filter(p => p.blob)
      .map(photo => ({
        localId: photo.localId,
        url: URL.createObjectURL(photo.blob!),
        tag: photo.tag,
      }));
  }, [photos]);

  // Get business card photos with OCR results
  const businessCardOCRResults = useMemo(() => {
    return photos.filter(p => p.tag === 'business_card' && p.ocrProcessed && p.ocrResult);
  }, [photos]);

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      photoUrls.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [photoUrls]);

  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Photos */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 text-xs">📷</span>
            Photos ({photos.length})
          </h3>
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((photo, index) => (
              <button
                key={photo.localId}
                onClick={() => openPhotoViewer(index)}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 active:scale-95 transition-all duration-200 relative shadow-soft"
              >
                <img
                  src={photo.url}
                  alt={photo.tag || 'Photo'}
                  className="w-full h-full object-cover"
                />
                {photo.tag === 'business_card' && (
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-gradient-to-r from-primary to-blue-600 text-white text-[10px] font-semibold rounded-md shadow-md">
                    Card
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-text-muted">
            <ImagePlus className="w-10 h-10 mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">No photos captured</p>
          </div>
        )}
      </div>

      {/* OCR Results from Business Cards */}
      {businessCardOCRResults.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 text-xs">🔍</span>
            Business Card OCR ({businessCardOCRResults.length})
          </h3>
          <div className="space-y-3">
            {businessCardOCRResults.map((photo) => (
              <OCRResultDisplay
                key={photo.localId}
                ocrResult={photo.ocrResult}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Voice Notes */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 text-xs">🎙️</span>
            Voice Notes ({voiceNotes.length})
          </h3>
        </div>
        {voiceNotes.length > 0 ? (
          <VoiceNoteList voiceNotes={voiceNotes} />
        ) : (
          <div className="flex flex-col items-center justify-center h-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-text-muted">
            <Mic className="w-10 h-10 mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">No voice notes recorded</p>
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      <PhotoViewer
        photos={photoUrls}
        initialIndex={selectedPhotoIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}

// Pricing Tab Component
function PricingTab({
  supplier,
  onUpdate
}: {
  supplier: LocalSupplier;
  onUpdate: <K extends keyof LocalSupplier>(field: K, value: LocalSupplier[K]) => void;
}) {
  const pricing = supplier.pricing || { quotes: [] };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 text-xs">💳</span>
          Payment Terms
        </label>
        <input
          type="text"
          value={pricing.paymentTerms || ''}
          onChange={(e) => onUpdate('pricing', { ...pricing, paymentTerms: e.target.value })}
          placeholder="e.g. 30/70 T/T"
          className="input-modern"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 text-xs">⏱️</span>
          Lead Time (days)
        </label>
        <input
          type="number"
          value={pricing.leadTimeDays || ''}
          onChange={(e) => onUpdate('pricing', { ...pricing, leadTimeDays: parseInt(e.target.value) || undefined })}
          placeholder="e.g. 45"
          className="input-modern"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 text-xs">🎁</span>
          Sample Policy
        </label>
        <input
          type="text"
          value={pricing.samplePolicy || ''}
          onChange={(e) => onUpdate('pricing', { ...pricing, samplePolicy: e.target.value })}
          placeholder="e.g. Paid, $5/unit"
          className="input-modern"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 text-xs">🚢</span>
          FOB Port
        </label>
        <input
          type="text"
          value={pricing.fobPort || ''}
          onChange={(e) => onUpdate('pricing', { ...pricing, fobPort: e.target.value })}
          placeholder="e.g. Guangzhou"
          className="input-modern"
        />
      </div>

      <div className="p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl border border-primary/10">
        <p className="text-xs text-text-muted">
          💡 Price quotes can be added from voice note transcriptions or manually in a future update.
        </p>
      </div>
    </div>
  );
}

// Notes Tab Component
function NotesTab({
  supplier,
  onUpdate
}: {
  supplier: LocalSupplier;
  onUpdate: <K extends keyof LocalSupplier>(field: K, value: LocalSupplier[K]) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Notes */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <span className="w-6 h-6 rounded-lg bg-gray-500/10 flex items-center justify-center text-gray-600 text-xs">📝</span>
          Notes
        </label>
        <textarea
          value={supplier.notes}
          onChange={(e) => onUpdate('notes', e.target.value)}
          rows={4}
          placeholder="General notes about this supplier..."
          className="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-gray-50/80 transition-all duration-200 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10 resize-none"
        />
      </div>

      {/* AI Summary */}
      {supplier.aiSummary && (
        <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-2xl p-4 border border-primary/10 shadow-soft">
          <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs">✨</span>
            AI Summary
          </label>
          <p className="text-sm text-foreground leading-relaxed">{supplier.aiSummary}</p>
        </div>
      )}

      {/* Green Flags */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border-l-4 border-green-500">
        <label className="flex items-center gap-2 text-sm font-semibold text-green-600 mb-3">
          <span className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-xs">✅</span>
          Green Flags
        </label>
        <textarea
          value={supplier.greenFlags}
          onChange={(e) => onUpdate('greenFlags', e.target.value)}
          rows={2}
          placeholder="Positive signals, trustworthy signs..."
          className="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-green-50/50 transition-all duration-200 focus:border-green-300 focus:bg-white focus:ring-4 focus:ring-green-500/10 resize-none placeholder:text-green-400"
        />
      </div>

      {/* Red Flags */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border-l-4 border-red-500">
        <label className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-3">
          <span className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-xs">⚠️</span>
          Red Flags
        </label>
        <textarea
          value={supplier.redFlags}
          onChange={(e) => onUpdate('redFlags', e.target.value)}
          rows={2}
          placeholder="Warning signs, concerns..."
          className="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-red-50/50 transition-all duration-200 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10 resize-none placeholder:text-red-400"
        />
      </div>

      {/* Follow-up */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="flex items-center gap-3 mb-3">
          <div className={cn(
            "relative w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200",
            supplier.followUpRequired
              ? "bg-gradient-to-br from-accent to-amber-500"
              : "bg-gray-100"
          )}>
            <input
              type="checkbox"
              checked={supplier.followUpRequired}
              onChange={(e) => onUpdate('followUpRequired', e.target.checked)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {supplier.followUpRequired && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className={cn(
            "font-semibold transition-colors",
            supplier.followUpRequired ? "text-accent" : "text-gray-500"
          )}>Follow-up Required</span>
        </label>
        {supplier.followUpRequired && (
          <input
            type="text"
            value={supplier.followUpAction}
            onChange={(e) => onUpdate('followUpAction', e.target.value)}
            placeholder="What needs to be done..."
            className="input-modern mt-2"
          />
        )}
      </div>
    </div>
  );
}
