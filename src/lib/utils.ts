import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LocalSupplier, SupplierCategory, PriceQuote } from './types';
import { getCategoryInfo } from './constants';

// ============================================================
// CLASSNAME UTILITY (for shadcn/ui)
// ============================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// UUID GENERATION
// ============================================================

export function generateId(): string {
  return crypto.randomUUID();
}

// ============================================================
// DATE FORMATTING
// ============================================================

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateShort(dateString);
}

// ============================================================
// DURATION FORMATTING
// ============================================================

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================
// PRICE FORMATTING
// ============================================================

export function formatPrice(price: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(price);
}

export function formatPriceWithUnit(quote: PriceQuote): string {
  const price = formatPrice(quote.unitPrice, quote.currency);
  return `${price}/${quote.unit}`;
}

export function getFirstPrice(supplier: LocalSupplier): string | null {
  const quote = supplier.pricing?.quotes?.[0];
  if (!quote) return null;
  return formatPriceWithUnit(quote);
}

// ============================================================
// IMAGE COMPRESSION
// ============================================================

export async function compressImage(
  blob: Blob,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export async function createThumbnail(
  blob: Blob,
  maxWidth: number = 200,
  quality: number = 0.6
): Promise<Blob> {
  return compressImage(blob, maxWidth, quality);
}

// ============================================================
// SEARCH / FILTERING
// ============================================================

export function filterSuppliers(
  suppliers: LocalSupplier[],
  filters: {
    category?: string;
    status?: string;
    verification?: string;
    search?: string;
  }
): LocalSupplier[] {
  return suppliers.filter((supplier) => {
    // Category filter
    if (filters.category && filters.category !== 'all') {
      if (!supplier.categories.includes(filters.category as SupplierCategory)) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (supplier.status !== filters.status) {
        return false;
      }
    }

    // Verification filter
    if (filters.verification && filters.verification !== 'all') {
      if (supplier.verification !== filters.verification) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesCompany = supplier.companyName.toLowerCase().includes(searchLower);
      const matchesBooth = supplier.boothNumber.toLowerCase().includes(searchLower);
      const matchesNotes = supplier.notes.toLowerCase().includes(searchLower);
      if (!matchesCompany && !matchesBooth && !matchesNotes) {
        return false;
      }
    }

    return true;
  });
}

export function sortSuppliers(
  suppliers: LocalSupplier[],
  sortBy: 'rating' | 'date' | 'price' | 'name',
  direction: 'asc' | 'desc'
): LocalSupplier[] {
  const sorted = [...suppliers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'rating':
        comparison = a.rating - b.rating;
        break;
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'price':
        const priceA = a.pricing?.quotes?.[0]?.unitPrice ?? Infinity;
        const priceB = b.pricing?.quotes?.[0]?.unitPrice ?? Infinity;
        comparison = priceA - priceB;
        break;
      case 'name':
        comparison = a.companyName.localeCompare(b.companyName);
        break;
    }

    return direction === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

// ============================================================
// CATEGORY HELPERS
// ============================================================

export function getCategoryColor(category: SupplierCategory): string {
  return getCategoryInfo(category).color;
}

export function getCategoryBgColor(category: SupplierCategory): string {
  return getCategoryInfo(category).bgColor;
}

export function getCategoryLabel(category: SupplierCategory): string {
  return getCategoryInfo(category).label;
}

export function formatCategory(category: SupplierCategory): string {
  return getCategoryInfo(category).label;
}

// ============================================================
// VIBRATION (haptic feedback)
// ============================================================

export function vibrate(pattern: number | number[] = 50): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// ============================================================
// CLIPBOARD
// ============================================================

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

// ============================================================
// BLOB UTILITIES
// ============================================================

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
