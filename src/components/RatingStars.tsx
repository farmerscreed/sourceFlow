'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { vibrate } from '@/lib/utils';

interface RatingStarsProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RatingStars({
  value,
  onChange,
  readonly = false,
  size = 'md',
  className,
}: RatingStarsProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const gaps = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      // Allow toggling off if clicking same star
      const newRating = rating === value ? 0 : rating;
      vibrate(30);
      onChange(newRating);
    }
  };

  return (
    <div className={cn("flex items-center", gaps[size], className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={cn(
            "transition-transform",
            !readonly && "active:scale-110 touch-manipulation",
            readonly && "cursor-default"
          )}
        >
          <Star
            className={cn(
              sizes[size],
              star <= value
                ? "fill-warning text-warning"
                : "fill-none text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Compact display version (no interaction)
 */
export function RatingDisplay({
  value,
  size = 'sm',
  className
}: {
  value: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  if (value === 0) {
    return (
      <span className={cn("text-text-muted text-xs", className)}>
        No rating
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizes[size],
            star <= value
              ? "fill-warning text-warning"
              : "fill-none text-gray-300"
          )}
        />
      ))}
    </div>
  );
}
