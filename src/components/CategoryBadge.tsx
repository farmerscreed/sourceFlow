'use client';

import { cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/constants';
import type { SupplierCategory } from '@/lib/types';

interface CategoryBadgeProps {
  category: SupplierCategory;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function CategoryBadge({
  category,
  size = 'md',
  showLabel = true,
  className
}: CategoryBadgeProps) {
  const info = getCategoryInfo(category);

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
      style={{
        backgroundColor: info.bgColor,
        color: info.color,
      }}
    >
      {showLabel ? (size === 'sm' ? info.shortLabel : info.label) : info.shortLabel}
    </span>
  );
}

interface CategoryBadgeGroupProps {
  categories: SupplierCategory[];
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function CategoryBadgeGroup({
  categories,
  max = 2,
  size = 'sm',
  className
}: CategoryBadgeGroupProps) {
  const displayed = categories.slice(0, max);
  const remaining = categories.length - max;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayed.map((category) => (
        <CategoryBadge
          key={category}
          category={category}
          size={size}
          showLabel={displayed.length <= 1}
        />
      ))}
      {remaining > 0 && (
        <span className={cn(
          "inline-flex items-center font-medium rounded-full bg-bg-subtle text-text-muted",
          size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        )}>
          +{remaining}
        </span>
      )}
    </div>
  );
}

interface CategorySelectorProps {
  selected: SupplierCategory[];
  onChange: (categories: SupplierCategory[]) => void;
  className?: string;
}

export function CategorySelector({ selected, onChange, className }: CategorySelectorProps) {
  const categories: SupplierCategory[] = [
    'windows_doors',
    'cladding',
    'railings_metalwork',
    'roofing',
    'solar_panels',
    'solar_inverters',
    'solar_batteries',
    'smart_home',
    'cctv_security',
    'lighting',
    'electrical',
    'plumbing',
    'building_materials',
    'water_treatment',
    'fire_safety',
    'other',
  ];

  const handleToggle = (category: SupplierCategory) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((category) => {
        const info = getCategoryInfo(category);
        const isSelected = selected.includes(category);
        const isPrimary = selected[0] === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => handleToggle(category)}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-xl transition-all",
              "border-2 touch-manipulation select-none-touch",
              "active:scale-95",
              isSelected
                ? "border-transparent"
                : "border-border bg-white text-text-muted hover:border-gray-300"
            )}
            style={isSelected ? {
              backgroundColor: info.bgColor,
              color: info.color,
              borderColor: info.color,
            } : undefined}
          >
            {info.shortLabel}
            {isPrimary && isSelected && (
              <span className="ml-1 text-[10px] opacity-70">★</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
