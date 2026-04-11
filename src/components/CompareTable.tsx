'use client';

import { useMemo } from 'react';
import { Star, Check, X, Minus, ExternalLink } from 'lucide-react';
import { cn, formatCategory } from '@/lib/utils';
import { StatusBadge, VerificationBadge } from '@/components/StatusBadge';
import type { LocalSupplier } from '@/lib/types';

interface CompareTableProps {
  suppliers: LocalSupplier[];
  onRemove?: (localId: string) => void;
  className?: string;
}

export function CompareTable({ suppliers, onRemove, className }: CompareTableProps) {
  // Define comparison rows
  const rows = useMemo(() => [
    {
      label: 'Rating',
      render: (s: LocalSupplier) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4",
                i < s.rating ? "text-warning fill-warning" : "text-gray-200"
              )}
            />
          ))}
        </div>
      ),
    },
    {
      label: 'Status',
      render: (s: LocalSupplier) => <StatusBadge status={s.status} size="sm" />,
    },
    {
      label: 'Verification',
      render: (s: LocalSupplier) => <VerificationBadge verification={s.verification} size="sm" />,
    },
    {
      label: 'Categories',
      render: (s: LocalSupplier) => (
        <div className="flex flex-wrap gap-1">
          {s.categories.slice(0, 2).map(cat => (
            <span key={cat} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded">
              {formatCategory(cat)}
            </span>
          ))}
          {s.categories.length > 2 && (
            <span className="text-[10px] text-text-muted">+{s.categories.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      label: 'Booth #',
      render: (s: LocalSupplier) => s.boothNumber || <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Contact',
      render: (s: LocalSupplier) => s.contactPerson || <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Phone',
      render: (s: LocalSupplier) => s.phone ? (
        <a href={`tel:${s.phone}`} className="text-primary text-xs">{s.phone}</a>
      ) : <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Email',
      render: (s: LocalSupplier) => s.email ? (
        <a href={`mailto:${s.email}`} className="text-primary text-xs truncate block max-w-[100px]">{s.email}</a>
      ) : <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'WeChat',
      render: (s: LocalSupplier) => s.wechat || <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Website',
      render: (s: LocalSupplier) => s.website ? (
        <a
          href={s.website.startsWith('http') ? s.website : `https://${s.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-xs flex items-center gap-1"
        >
          Visit <ExternalLink className="w-3 h-3" />
        </a>
      ) : <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Payment Terms',
      render: (s: LocalSupplier) => s.pricing?.paymentTerms || <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Lead Time',
      render: (s: LocalSupplier) => s.pricing?.leadTimeDays ? `${s.pricing.leadTimeDays} days` : <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Sample Policy',
      render: (s: LocalSupplier) => s.pricing?.samplePolicy || <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'FOB Port',
      render: (s: LocalSupplier) => s.pricing?.fobPort || <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Ships to Africa',
      render: (s: LocalSupplier) => {
        if (s.capabilities?.shipsToAfrica === true) return <Check className="w-4 h-4 text-success" />;
        if (s.capabilities?.shipsToAfrica === false) return <X className="w-4 h-4 text-danger" />;
        return <Minus className="w-4 h-4 text-gray-300" />;
      },
    },
    {
      label: 'Africa Experience',
      render: (s: LocalSupplier) => {
        if (s.capabilities?.africaExperience === true) return <Check className="w-4 h-4 text-success" />;
        if (s.capabilities?.africaExperience === false) return <X className="w-4 h-4 text-danger" />;
        return <Minus className="w-4 h-4 text-gray-300" />;
      },
    },
    {
      label: 'Factory Location',
      render: (s: LocalSupplier) => s.capabilities?.factoryLocation || <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Years in Business',
      render: (s: LocalSupplier) => s.capabilities?.yearsInBusiness || <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Green Flags',
      render: (s: LocalSupplier) => s.greenFlags ? (
        <span className="text-success text-xs line-clamp-2">{s.greenFlags}</span>
      ) : <Minus className="w-4 h-4 text-gray-300" />,
    },
    {
      label: 'Red Flags',
      render: (s: LocalSupplier) => s.redFlags ? (
        <span className="text-danger text-xs line-clamp-2">{s.redFlags}</span>
      ) : <Minus className="w-4 h-4 text-gray-300" />,
    },
  ], []);

  if (suppliers.length === 0) {
    return (
      <div className={cn("text-center py-12 bg-white rounded-xl", className)}>
        <p className="text-text-muted">Select suppliers to compare</p>
      </div>
    );
  }

  // Calculate column width based on number of suppliers
  const colWidth = `${100 / (suppliers.length + 1)}%`;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[500px] border-collapse">
        <thead>
          <tr className="bg-bg-subtle">
            <th className="sticky left-0 z-10 bg-bg-subtle p-3 text-left text-xs font-medium text-text-muted border-b border-border" style={{ width: '120px' }}>
              Attribute
            </th>
            {suppliers.map((supplier) => (
              <th
                key={supplier.localId}
                className="p-3 text-left text-sm font-semibold text-foreground border-b border-border"
                style={{ width: colWidth }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate">{supplier.companyName || 'Unnamed'}</span>
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(supplier.localId)}
                      className="p-1 text-text-muted hover:text-danger flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.label} className={cn(index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
              <td className="sticky left-0 z-10 p-3 text-xs font-medium text-text-muted border-b border-border bg-inherit">
                {row.label}
              </td>
              {suppliers.map((supplier) => (
                <td key={supplier.localId} className="p-3 text-sm text-foreground border-b border-border">
                  {row.render(supplier)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
