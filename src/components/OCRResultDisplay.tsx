'use client';

import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OCRResult } from '@/lib/types';

interface OCRResultDisplayProps {
  ocrResult: OCRResult;
  className?: string;
  compact?: boolean;
}

export function OCRResultDisplay({ ocrResult, className, compact = false }: OCRResultDisplayProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const hasData = ocrResult.companyName || ocrResult.contactPerson || ocrResult.phone ||
                  ocrResult.email || ocrResult.wechat || ocrResult.whatsapp ||
                  ocrResult.website || ocrResult.address;

  if (!hasData) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const fields = [
    { key: 'companyName', icon: Building2, label: 'Company', value: ocrResult.companyName },
    { key: 'contactPerson', icon: User, label: 'Contact', value: ocrResult.contactPerson },
    { key: 'title', icon: User, label: 'Title', value: ocrResult.title },
    { key: 'phone', icon: Phone, label: 'Phone', value: ocrResult.phone },
    { key: 'email', icon: Mail, label: 'Email', value: ocrResult.email },
    { key: 'wechat', icon: MessageCircle, label: 'WeChat', value: ocrResult.wechat },
    { key: 'whatsapp', icon: Phone, label: 'WhatsApp', value: ocrResult.whatsapp },
    { key: 'website', icon: Globe, label: 'Website', value: ocrResult.website },
    { key: 'address', icon: MapPin, label: 'Address', value: ocrResult.address },
  ].filter(f => f.value);

  if (compact) {
    return (
      <div className={cn("bg-primary/5 rounded-lg border border-primary/20", className)}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">OCR Results</span>
            <span className="text-xs text-text-muted">({fields.length} fields)</span>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-primary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-primary" />
          )}
        </button>

        {expanded && (
          <div className="px-3 pb-3 space-y-2">
            {fields.map(({ key, icon: Icon, label, value }) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <Icon className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-text-muted">{label}: </span>
                  <span className="text-foreground">{value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(value!, key)}
                  className="p-1 text-text-muted hover:text-primary flex-shrink-0"
                >
                  {copiedField === key ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-xl border border-border overflow-hidden", className)}>
      <div className="flex items-center gap-2 p-3 bg-primary/5 border-b border-border">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Business Card OCR Results</span>
      </div>

      <div className="p-3 space-y-3">
        {fields.map(({ key, icon: Icon, label, value }) => (
          <div
            key={key}
            className="flex items-start gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-bg-subtle flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">{label}</p>
              <p className="text-sm text-foreground break-words">{value}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(value!, key)}
              className="p-2 text-text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="Copy to clipboard"
            >
              {copiedField === key ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
