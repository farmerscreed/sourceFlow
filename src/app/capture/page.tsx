'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Package, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PhotoCapture } from '@/components/PhotoCapture';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { CategorySelector } from '@/components/CategoryBadge';
import { RatingStars } from '@/components/RatingStars';
import { cn, generateId, vibrate } from '@/lib/utils';
import { db } from '@/lib/db';
import { createDefaultSupplier } from '@/lib/constants';
import { useToastStore } from '@/lib/store';
import type { SupplierCategory, PhotoTag, LocalPhoto, LocalVoiceNote } from '@/lib/types';

interface CapturedPhoto {
  localId: string;
  blob: Blob;
  thumbnailBlob?: Blob;
  previewUrl: string;
  tag: PhotoTag;
}

interface RecordedVoiceNote {
  localId: string;
  blob: Blob;
  durationSeconds: number;
  transcription: string;
}

export default function CapturePage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [boothNumber, setBoothNumber] = useState('');
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [rating, setRating] = useState(0);
  const [businessCardPhotos, setBusinessCardPhotos] = useState<CapturedPhoto[]>([]);
  const [productPhotos, setProductPhotos] = useState<CapturedPhoto[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<RecordedVoiceNote[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Photo handlers
  const handleBusinessCardCapture = (photo: CapturedPhoto) => {
    setBusinessCardPhotos([photo]); // Only one business card
  };

  const handleBusinessCardRemove = (localId: string) => {
    setBusinessCardPhotos(photos => photos.filter(p => p.localId !== localId));
  };

  const handleProductCapture = (photo: CapturedPhoto) => {
    setProductPhotos(photos => [...photos, photo]);
  };

  const handleProductRemove = (localId: string) => {
    setProductPhotos(photos => photos.filter(p => p.localId !== localId));
  };

  // Voice note handlers
  const handleVoiceNoteComplete = (note: RecordedVoiceNote) => {
    setVoiceNotes(notes => [...notes, note]);
  };

  const handleVoiceNoteRemove = (localId: string) => {
    setVoiceNotes(notes => notes.filter(n => n.localId !== localId));
  };

  // Save handler
  const handleSave = async () => {
    if (!companyName.trim() && !boothNumber.trim() && categories.length === 0) {
      addToast({
        type: 'warning',
        message: 'Please add some information',
      });
      return;
    }

    setIsSaving(true);
    vibrate(50);

    try {
      // Generate supplier ID
      const supplierLocalId = generateId();

      // Create supplier record
      const supplier = createDefaultSupplier(supplierLocalId);
      supplier.companyName = companyName.trim();
      supplier.boothNumber = boothNumber.trim();
      supplier.categories = categories;
      supplier.primaryCategory = categories[0] || null;
      supplier.rating = rating;

      // Save supplier to IndexedDB
      await db.suppliers.add(supplier);

      // Save photos
      const allPhotos = [...businessCardPhotos, ...productPhotos];
      for (const photo of allPhotos) {
        const localPhoto: LocalPhoto = {
          localId: photo.localId,
          supplierLocalId,
          tag: photo.tag,
          blob: photo.blob,
          thumbnailBlob: photo.thumbnailBlob,
          ocrResult: {},
          ocrProcessed: false,
          syncStatus: 'pending',
          createdAt: new Date().toISOString(),
        };
        await db.photos.add(localPhoto);
      }

      // Save voice notes
      for (const note of voiceNotes) {
        const localNote: LocalVoiceNote = {
          localId: note.localId,
          supplierLocalId,
          blob: note.blob,
          durationSeconds: note.durationSeconds,
          transcription: note.transcription,
          structuredData: {},
          aiProcessed: false,
          syncStatus: 'pending',
          createdAt: new Date().toISOString(),
        };
        await db.voiceNotes.add(localNote);
      }

      // Clean up preview URLs
      allPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));

      // Show success toast
      addToast({
        type: 'success',
        message: `Supplier saved${boothNumber ? ` (${boothNumber})` : ''} ✓`,
      });

      vibrate([50, 50, 50]);

      // Navigate back to dashboard
      router.push('/');
    } catch (error) {
      console.error('Error saving supplier:', error);
      addToast({
        type: 'error',
        message: 'Failed to save supplier',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save and add another
  const handleSaveAndNew = async () => {
    await handleSave();
    // Reset form
    setCompanyName('');
    setBoothNumber('');
    setCategories([]);
    setRating(0);
    setBusinessCardPhotos([]);
    setProductPhotos([]);
    setVoiceNotes([]);
  };

  return (
    <div className="min-h-screen pb-24 gradient-mesh">
      {/* Header with gradient */}
      <header className="relative overflow-hidden safe-top">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-amber-500 to-orange-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative z-10 px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-lg text-white">New Supplier</h1>
            <div className="w-10" />
          </div>

          {/* Photo capture section with glass effect */}
          <div className="grid grid-cols-2 gap-3 slide-up">
            <PhotoCapture
              tag="business_card"
              label="Scan Card"
              icon={<CreditCard className="w-8 h-8 mb-1" />}
              multiple={false}
              photos={businessCardPhotos}
              onCapture={handleBusinessCardCapture}
              onRemove={handleBusinessCardRemove}
            />
            <PhotoCapture
              tag="product"
              label="Products"
              icon={<Package className="w-8 h-8 mb-1" />}
              multiple={true}
              photos={productPhotos}
              onCapture={handleProductCapture}
              onRemove={handleProductRemove}
            />
          </div>
        </div>

        {/* Curved bottom */}
        <div className="absolute -bottom-1 left-0 right-0 h-6 bg-[#f8fafc] rounded-t-[2rem]" />
      </header>

      {/* Form */}
      <div className="px-4 pt-2 space-y-5 -mt-1">
        {/* Company name */}
        <div className="slide-up stagger-1">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs">1</span>
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Foshan Aluminium Co."
            className="input-modern"
          />
        </div>

        {/* Booth number */}
        <div className="slide-up stagger-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs">2</span>
            Booth Number
          </label>
          <input
            type="text"
            value={boothNumber}
            onChange={(e) => setBoothNumber(e.target.value)}
            placeholder="e.g. Hall 12.2 F35"
            className="input-modern"
          />
        </div>

        {/* Category selection */}
        <div className="slide-up stagger-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs">3</span>
            Category
            <span className="text-text-muted font-normal text-xs">(first = primary)</span>
          </label>
          <CategorySelector
            selected={categories}
            onChange={setCategories}
          />
        </div>

        {/* Voice recorder */}
        <div className="slide-up stagger-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs">4</span>
            Voice Note
            <span className="text-text-muted font-normal text-xs">(pricing, specs)</span>
          </label>
          <VoiceRecorder
            voiceNotes={voiceNotes}
            onRecordingComplete={handleVoiceNoteComplete}
            onRemove={handleVoiceNoteRemove}
          />
        </div>

        {/* Rating */}
        <div className="slide-up stagger-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs">5</span>
            First Impression
          </label>
          <div className="bg-white rounded-2xl p-4 shadow-soft">
            <RatingStars
              value={rating}
              onChange={setRating}
              size="lg"
            />
          </div>
        </div>

        {/* Save buttons */}
        <div className="space-y-3 pt-2 pb-4 slide-up">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "relative flex items-center justify-center gap-2 w-full py-4 rounded-2xl overflow-hidden",
              "bg-gradient-to-r from-primary via-primary to-blue-700 text-white font-semibold",
              "shadow-lg shadow-primary/30 transition-all active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin relative z-10" />
            ) : (
              <Save className="w-5 h-5 relative z-10" />
            )}
            <span className="relative z-10">Save Supplier</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndNew}
            disabled={isSaving}
            className={cn(
              "w-full py-3.5 rounded-2xl",
              "bg-white border-2 border-primary/20 text-primary font-semibold",
              "shadow-soft transition-all active:scale-[0.98] hover:border-primary/40",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Save & Add Another
          </button>
        </div>
      </div>
    </div>
  );
}
