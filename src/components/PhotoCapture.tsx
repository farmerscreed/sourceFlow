'use client';

import { useRef, useState } from 'react';
import { Camera, X, ImagePlus } from 'lucide-react';
import { cn, generateId, compressImage, createThumbnail } from '@/lib/utils';
import { IMAGE_CONFIG } from '@/lib/constants';
import type { PhotoTag } from '@/lib/types';

interface CapturedPhoto {
  localId: string;
  blob: Blob;
  thumbnailBlob?: Blob;
  previewUrl: string;
  tag: PhotoTag;
}

interface PhotoCaptureProps {
  tag: PhotoTag;
  label: string;
  icon?: React.ReactNode;
  multiple?: boolean;
  photos: CapturedPhoto[];
  onCapture: (photo: CapturedPhoto) => void;
  onRemove: (localId: string) => void;
  className?: string;
}

export function PhotoCapture({
  tag,
  label,
  icon,
  multiple = false,
  photos,
  onCapture,
  onRemove,
  className,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    try {
      for (const file of Array.from(files)) {
        // Skip if not an image
        if (!file.type.startsWith('image/')) continue;

        // Compress the image
        const blob = await compressImage(
          file,
          IMAGE_CONFIG.maxWidth,
          IMAGE_CONFIG.quality
        );

        // Create thumbnail
        const thumbnailBlob = await createThumbnail(
          blob,
          IMAGE_CONFIG.thumbnailMaxWidth,
          IMAGE_CONFIG.thumbnailQuality
        );

        // Create preview URL
        const previewUrl = URL.createObjectURL(blob);

        const photo: CapturedPhoto = {
          localId: generateId(),
          blob,
          thumbnailBlob,
          previewUrl,
          tag,
        };

        onCapture(photo);

        // If not multiple, stop after first photo
        if (!multiple) break;
      }
    } catch (error) {
      console.error('Error processing photo:', error);
    } finally {
      setIsProcessing(false);
      // Clear the input so the same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const triggerCapture = () => {
    inputRef.current?.click();
  };

  const hasPhotos = photos.length > 0;

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={multiple}
        onChange={handleCapture}
        className="hidden"
      />

      {/* Capture button or photo preview */}
      {!hasPhotos ? (
        <button
          type="button"
          onClick={triggerCapture}
          disabled={isProcessing}
          className={cn(
            "flex flex-col items-center justify-center w-full h-28 rounded-xl",
            "border-2 border-dashed border-gray-300",
            "bg-bg-subtle text-text-muted",
            "transition-all active:scale-[0.98]",
            "touch-manipulation",
            isProcessing && "opacity-50"
          )}
        >
          {icon || <Camera className="w-8 h-8 mb-1" />}
          <span className="text-sm font-medium">
            {isProcessing ? 'Processing...' : label}
          </span>
        </button>
      ) : (
        <div className="space-y-2">
          {/* Photo thumbnails */}
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo) => (
              <div
                key={photo.localId}
                className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={photo.previewUrl}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(photo.previewUrl);
                    onRemove(photo.localId);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add more button (for multiple) */}
            {multiple && (
              <button
                type="button"
                onClick={triggerCapture}
                disabled={isProcessing}
                className={cn(
                  "w-20 h-20 rounded-lg border-2 border-dashed border-gray-300",
                  "bg-bg-subtle text-text-muted",
                  "flex flex-col items-center justify-center",
                  "transition-all active:scale-95",
                  "touch-manipulation"
                )}
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Add</span>
              </button>
            )}
          </div>

          {/* Replace button (for single) */}
          {!multiple && (
            <button
              type="button"
              onClick={triggerCapture}
              disabled={isProcessing}
              className="text-xs text-primary font-medium"
            >
              Replace photo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface PhotoGridProps {
  photos: CapturedPhoto[];
  onRemove?: (localId: string) => void;
  readonly?: boolean;
  className?: string;
}

export function PhotoGrid({ photos, onRemove, readonly = false, className }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-32 rounded-xl bg-bg-subtle text-text-muted",
        className
      )}>
        <p className="text-sm">No photos</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {photos.map((photo) => (
        <div
          key={photo.localId}
          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          <img
            src={photo.previewUrl}
            alt="Photo"
            className="w-full h-full object-cover"
          />
          {!readonly && onRemove && (
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(photo.previewUrl);
                onRemove(photo.localId);
              }}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
