'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoViewerProps {
  photos: Array<{
    localId: string;
    url: string;
    tag?: string;
  }>;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoViewer({ photos, initialIndex = 0, isOpen, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastTouchDistance = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Reset state when opening or changing photos
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [isOpen, initialIndex, resetZoom]);

  // Navigate to previous photo
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetZoom();
    }
  }, [currentIndex, resetZoom]);

  // Navigate to next photo
  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetZoom();
    }
  }, [currentIndex, photos.length, resetZoom]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get center point between two touches
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  // Handle touch start for pinch-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture starting
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan gesture starting (only when zoomed in)
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  // Handle touch move for pinch-zoom and pan
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const newDistance = getTouchDistance(e.touches);
      const newCenter = getTouchCenter(e.touches);

      if (lastTouchDistance.current > 0) {
        const scaleFactor = newDistance / lastTouchDistance.current;
        const newScale = Math.min(Math.max(scale * scaleFactor, 1), 4);

        // If zooming out and scale is 1, reset position
        if (newScale <= 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(newScale);

          // Adjust position to zoom towards pinch center
          const deltaX = (newCenter.x - lastTouchCenter.current.x);
          const deltaY = (newCenter.y - lastTouchCenter.current.y);
          setPosition(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
        }
      }

      lastTouchDistance.current = newDistance;
      lastTouchCenter.current = newCenter;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Pan gesture
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastTouchDistance.current = 0;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);

      // Snap back if scale is less than 1
      if (scale < 1) {
        resetZoom();
      }
    }
  };

  // Zoom in/out buttons
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.5, 4));
  };

  const handleZoomOut = () => {
    const newScale = scale / 1.5;
    if (newScale <= 1) {
      resetZoom();
    } else {
      setScale(newScale);
    }
  };

  // Double tap to zoom
  const lastTapTime = useRef<number>(0);
  const handleTap = (e: React.TouchEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      if (scale > 1) {
        resetZoom();
      } else {
        setScale(2.5);
        // Center zoom on tap position
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const tapX = e.changedTouches[0].clientX - rect.left;
          const tapY = e.changedTouches[0].clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          setPosition({
            x: (centerX - tapX) * 1.5,
            y: (centerY - tapY) * 1.5,
          });
        }
      }
    }

    lastTapTime.current = now;
  };

  // Handle swipe to navigate (only when not zoomed)
  const swipeStartX = useRef<number>(0);
  const handleSwipeStart = (e: React.TouchEvent) => {
    if (scale === 1 && e.touches.length === 1) {
      swipeStartX.current = e.touches[0].clientX;
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (scale === 1 && e.changedTouches.length === 1) {
      const swipeEndX = e.changedTouches[0].clientX;
      const diff = swipeEndX - swipeStartX.current;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }
    }
  };

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white safe-top">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 active:bg-white/20"
        >
          <X className="w-6 h-6" />
        </button>

        <span className="text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </span>

        <div className="flex gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className={cn(
              "p-2 rounded-full bg-white/10",
              scale <= 1 ? "opacity-50" : "active:bg-white/20"
            )}
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className={cn(
              "p-2 rounded-full bg-white/10",
              scale >= 4 ? "opacity-50" : "active:bg-white/20"
            )}
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onTouchStart={(e) => {
          handleTouchStart(e);
          handleSwipeStart(e);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handleTouchEnd(e);
          handleTap(e);
          handleSwipeEnd(e);
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <img
            ref={imageRef}
            src={currentPhoto.url}
            alt={currentPhoto.tag || 'Photo'}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </div>

        {/* Navigation arrows (visible on larger screens) */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2",
                "p-3 rounded-full bg-white/10 text-white",
                "hidden sm:flex items-center justify-center",
                currentIndex === 0 ? "opacity-30" : "active:bg-white/20"
              )}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === photos.length - 1}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2",
                "p-3 rounded-full bg-white/10 text-white",
                "hidden sm:flex items-center justify-center",
                currentIndex === photos.length - 1 ? "opacity-30" : "active:bg-white/20"
              )}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Photo tag indicator */}
      {currentPhoto.tag && (
        <div className="p-4 text-center text-white/60 text-sm capitalize safe-bottom">
          {currentPhoto.tag.replace('_', ' ')}
        </div>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="p-4 safe-bottom">
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
            {photos.map((photo, index) => (
              <button
                key={photo.localId}
                onClick={() => {
                  setCurrentIndex(index);
                  resetZoom();
                }}
                className={cn(
                  "w-12 h-12 rounded-lg overflow-hidden flex-shrink-0",
                  "border-2 transition-colors",
                  index === currentIndex
                    ? "border-white"
                    : "border-transparent opacity-50"
                )}
              >
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
