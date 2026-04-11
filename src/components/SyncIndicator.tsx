'use client';

import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncStatus } from '@/hooks/useSync';

interface SyncIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function SyncIndicator({ className, showLabel = false }: SyncIndicatorProps) {
  const { isOnline, isSyncing, pendingSyncCount } = useSyncStatus();

  // Determine state
  const state = !isOnline
    ? 'offline'
    : isSyncing
      ? 'syncing'
      : pendingSyncCount > 0
        ? 'pending'
        : 'synced';

  const config = {
    offline: {
      icon: CloudOff,
      color: 'text-danger',
      bgColor: 'bg-danger/10',
      label: `Offline (${pendingSyncCount})`,
      dot: 'bg-danger',
    },
    syncing: {
      icon: RefreshCw,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      label: `Syncing ${pendingSyncCount}...`,
      dot: 'bg-warning',
    },
    pending: {
      icon: Cloud,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      label: `${pendingSyncCount} pending`,
      dot: 'bg-warning',
    },
    synced: {
      icon: Cloud,
      color: 'text-success',
      bgColor: 'bg-success/10',
      label: 'Synced',
      dot: 'bg-success',
    },
  };

  const { icon: Icon, color, bgColor, label, dot } = config[state];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full",
        bgColor
      )}>
        <span className={cn("w-2 h-2 rounded-full", dot)} />
        <Icon className={cn(
          "w-4 h-4",
          color,
          state === 'syncing' && "animate-spin"
        )} />
        {showLabel && (
          <span className={cn("text-xs font-medium", color)}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for tight spaces
 */
export function SyncDot({ className }: { className?: string }) {
  const { isOnline, isSyncing, pendingSyncCount } = useSyncStatus();

  const color = !isOnline
    ? 'bg-danger'
    : isSyncing || pendingSyncCount > 0
      ? 'bg-warning'
      : 'bg-success';

  return (
    <span className={cn(
      "w-2.5 h-2.5 rounded-full",
      color,
      isSyncing && "animate-pulse",
      className
    )} />
  );
}
