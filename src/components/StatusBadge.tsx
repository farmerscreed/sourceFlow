'use client';

import { Check, X, HelpCircle, Factory, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusInfo, getVerificationInfo } from '@/lib/constants';
import type { SupplierStatus, VerificationStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: SupplierStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const info = getStatusInfo(status);

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
      style={{
        backgroundColor: info.bgColor,
        color: info.color,
      }}
    >
      {info.label}
    </span>
  );
}

interface VerificationBadgeProps {
  verification: VerificationStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function VerificationBadge({
  verification,
  size = 'md',
  showLabel = true,
  className
}: VerificationBadgeProps) {
  const info = getVerificationInfo(verification);

  const Icon = info.icon === 'check'
    ? Check
    : info.icon === 'x'
      ? X
      : HelpCircle;

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  // For manufacturer/trader, use factory/store icons
  const isManufacturer = verification.includes('manufacturer');
  const isTrader = verification.includes('trader');
  const TypeIcon = isManufacturer ? Factory : isTrader ? Store : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full",
        size === 'sm' ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}
      style={{ color: info.color }}
    >
      {TypeIcon && <TypeIcon className={iconSize} />}
      <Icon className={iconSize} />
      {showLabel && info.shortLabel}
    </span>
  );
}

interface StatusSelectorProps {
  value: SupplierStatus;
  onChange: (status: SupplierStatus) => void;
  className?: string;
}

export function StatusSelector({ value, onChange, className }: StatusSelectorProps) {
  const statuses: SupplierStatus[] = [
    'new',
    'reviewing',
    'shortlisted',
    'rejected',
    'ordered',
  ];

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {statuses.map((status) => {
        const info = getStatusInfo(status);
        const isSelected = value === status;

        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
              "border touch-manipulation select-none-touch",
              "active:scale-95",
              isSelected
                ? "border-transparent"
                : "border-border bg-white text-text-muted"
            )}
            style={isSelected ? {
              backgroundColor: info.bgColor,
              color: info.color,
              borderColor: info.color,
            } : undefined}
          >
            {info.label}
          </button>
        );
      })}
    </div>
  );
}

interface VerificationSelectorProps {
  value: VerificationStatus;
  onChange: (verification: VerificationStatus) => void;
  className?: string;
}

export function VerificationSelector({ value, onChange, className }: VerificationSelectorProps) {
  const verifications: VerificationStatus[] = [
    'unverified',
    'likely_manufacturer',
    'confirmed_manufacturer',
    'likely_trader',
    'confirmed_trader',
  ];

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {verifications.map((verification) => {
        const info = getVerificationInfo(verification);
        const isSelected = value === verification;
        const isManufacturer = verification.includes('manufacturer');
        const isTrader = verification.includes('trader');

        return (
          <button
            key={verification}
            type="button"
            onClick={() => onChange(verification)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
              "border touch-manipulation select-none-touch",
              "active:scale-95",
              isSelected
                ? "border-2"
                : "border-border bg-white text-text-muted"
            )}
            style={isSelected ? {
              color: info.color,
              borderColor: info.color,
              backgroundColor: isManufacturer ? '#DCFCE7' : isTrader ? '#FEE2E2' : '#F1F5F9',
            } : undefined}
          >
            {isManufacturer && <Factory className="w-4 h-4" />}
            {isTrader && <Store className="w-4 h-4" />}
            {info.label}
          </button>
        );
      })}
    </div>
  );
}
