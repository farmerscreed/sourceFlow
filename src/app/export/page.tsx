'use client';

import { useState } from 'react';
import { ArrowLeft, FileText, FileSpreadsheet, Download, Loader2, CheckCircle2, Share2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { cn, formatCategory } from '@/lib/utils';
import { useToastStore } from '@/lib/store';
import type { LocalSupplier } from '@/lib/types';

type ExportFormat = 'pdf' | 'csv' | 'followup';

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [exportedFile, setExportedFile] = useState<{ url: string; name: string } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { addToast } = useToastStore();

  // Fetch all suppliers
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []) || [];

  // Filter suppliers based on selected status
  const filteredSuppliers = selectedStatus === 'all'
    ? suppliers
    : suppliers.filter(s => s.status === selectedStatus);

  // Generate CSV content
  const generateCSV = (suppliers: LocalSupplier[]): string => {
    const headers = [
      'Company Name',
      'Contact Person',
      'Phone',
      'Email',
      'WeChat',
      'WhatsApp',
      'Booth Number',
      'Hall Area',
      'Categories',
      'Status',
      'Verification',
      'Rating',
      'Payment Terms',
      'Lead Time (Days)',
      'Sample Policy',
      'FOB Port',
      'Notes',
      'Green Flags',
      'Red Flags',
      'Follow-up Required',
      'Follow-up Action',
      'Created At',
    ];

    const rows = suppliers.map(s => [
      s.companyName,
      s.contactPerson,
      s.phone,
      s.email,
      s.wechat,
      s.whatsapp,
      s.boothNumber,
      s.hallArea,
      s.categories.map(formatCategory).join('; '),
      s.status,
      s.verification,
      s.rating,
      s.pricing?.paymentTerms || '',
      s.pricing?.leadTimeDays || '',
      s.pricing?.samplePolicy || '',
      s.pricing?.fobPort || '',
      s.notes.replace(/[\n\r]/g, ' '),
      s.greenFlags.replace(/[\n\r]/g, ' '),
      s.redFlags.replace(/[\n\r]/g, ' '),
      s.followUpRequired ? 'Yes' : 'No',
      s.followUpAction.replace(/[\n\r]/g, ' '),
      new Date(s.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  };

  // Generate PDF content (HTML that can be printed)
  const generatePDFHTML = (suppliers: LocalSupplier[]): string => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SourceFlow - Supplier Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1a1a2e; }
            h1 { color: #1a365d; margin-bottom: 8px; }
            .subtitle { color: #64748b; margin-bottom: 32px; }
            .supplier { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
            .supplier-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
            .company-name { font-size: 18px; font-weight: 600; color: #1a365d; }
            .rating { color: #f59e0b; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; margin-right: 6px; }
            .badge-status { background: #dbeafe; color: #2563eb; }
            .badge-category { background: #f1f5f9; color: #475569; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
            .field { font-size: 13px; }
            .field-label { color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
            .notes { background: #f8fafc; padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 13px; }
            .green { color: #059669; }
            .red { color: #dc2626; }
            .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
            @media print { body { margin: 20px; } .supplier { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <h1>SourceFlow Supplier Report</h1>
          <p class="subtitle">Canton Fair 2026 - ${suppliers.length} Suppliers - Generated ${new Date().toLocaleDateString()}</p>

          ${suppliers.map(s => `
            <div class="supplier">
              <div class="supplier-header">
                <div>
                  <div class="company-name">${s.companyName || 'Unnamed Supplier'}</div>
                  <div style="margin-top: 4px;">
                    <span class="badge badge-status">${s.status}</span>
                    ${s.categories.slice(0, 2).map(c => `<span class="badge badge-category">${formatCategory(c)}</span>`).join('')}
                  </div>
                </div>
                <div class="rating">${'★'.repeat(s.rating)}${'☆'.repeat(5 - s.rating)}</div>
              </div>

              <div class="grid">
                <div class="field">
                  <div class="field-label">Contact</div>
                  ${s.contactPerson || '-'}
                </div>
                <div class="field">
                  <div class="field-label">Booth</div>
                  ${s.boothNumber || '-'} ${s.hallArea ? `(${s.hallArea})` : ''}
                </div>
                <div class="field">
                  <div class="field-label">Phone</div>
                  ${s.phone || '-'}
                </div>
                <div class="field">
                  <div class="field-label">Email</div>
                  ${s.email || '-'}
                </div>
                <div class="field">
                  <div class="field-label">WeChat</div>
                  ${s.wechat || '-'}
                </div>
                <div class="field">
                  <div class="field-label">WhatsApp</div>
                  ${s.whatsapp || '-'}
                </div>
                <div class="field">
                  <div class="field-label">Payment Terms</div>
                  ${s.pricing?.paymentTerms || '-'}
                </div>
                <div class="field">
                  <div class="field-label">Lead Time</div>
                  ${s.pricing?.leadTimeDays ? `${s.pricing.leadTimeDays} days` : '-'}
                </div>
              </div>

              ${s.notes ? `<div class="notes"><strong>Notes:</strong> ${s.notes}</div>` : ''}
              ${s.greenFlags ? `<div class="notes green"><strong>Green Flags:</strong> ${s.greenFlags}</div>` : ''}
              ${s.redFlags ? `<div class="notes red"><strong>Red Flags:</strong> ${s.redFlags}</div>` : ''}
            </div>
          `).join('')}

          <div class="footer">
            Generated by SourceFlow - Canton Fair Sourcing Companion
          </div>
        </body>
      </html>
    `;
    return html;
  };

  // Generate follow-up messages
  const generateFollowUpMessages = (suppliers: LocalSupplier[]): string => {
    const followUpSuppliers = suppliers.filter(s => s.followUpRequired || s.status === 'shortlisted');

    const messages = followUpSuppliers.map(s => {
      const template = `
--- ${s.companyName || 'Supplier'} ---
Contact: ${s.contactPerson || 'N/A'}
Email: ${s.email || 'N/A'}
WhatsApp: ${s.whatsapp || s.phone || 'N/A'}

Suggested Message:
Dear ${s.contactPerson || 'Sir/Madam'},

Thank you for meeting with us at Canton Fair 2026 (Booth ${s.boothNumber || 'N/A'}).

We are interested in ${s.categories.length > 0 ? s.categories.map(formatCategory).join(', ') : 'your products'} for our project in Nigeria.

${s.followUpAction ? `Specifically, we would like to discuss: ${s.followUpAction}` : 'Please send us your latest catalog and price list.'}

Best regards,
[Your Name]
Primerose Estate Project
      `.trim();
      return template;
    }).join('\n\n' + '='.repeat(50) + '\n\n');

    return `FOLLOW-UP MESSAGES FOR CANTON FAIR 2026
Generated: ${new Date().toLocaleString()}
Total Suppliers: ${followUpSuppliers.length}

${'='.repeat(50)}

${messages}`;
  };

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    if (filteredSuppliers.length === 0) {
      addToast({ type: 'warning', message: 'No suppliers to export' });
      return;
    }

    setIsExporting(format);
    setExportedFile(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

      let content: string;
      let mimeType: string;
      let fileName: string;

      switch (format) {
        case 'csv':
          content = generateCSV(filteredSuppliers);
          mimeType = 'text/csv';
          fileName = `sourceflow-suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
          break;
        case 'pdf':
          content = generatePDFHTML(filteredSuppliers);
          mimeType = 'text/html';
          fileName = `sourceflow-report-${new Date().toISOString().slice(0, 10)}.html`;
          break;
        case 'followup':
          content = generateFollowUpMessages(filteredSuppliers);
          mimeType = 'text/plain';
          fileName = `sourceflow-followup-${new Date().toISOString().slice(0, 10)}.txt`;
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      setExportedFile({ url, name: fileName });
      addToast({ type: 'success', message: `${format.toUpperCase()} generated successfully!` });
    } catch (error) {
      console.error('Export error:', error);
      addToast({ type: 'error', message: 'Failed to generate export' });
    } finally {
      setIsExporting(null);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!exportedFile) return;

    const a = document.createElement('a');
    a.href = exportedFile.url;
    a.download = exportedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle share (for PDF, opens in new tab for printing)
  const handleShare = async () => {
    if (!exportedFile) return;

    if (exportedFile.name.endsWith('.html')) {
      // Open in new tab for printing
      window.open(exportedFile.url, '_blank');
    } else if (navigator.share) {
      try {
        const response = await fetch(exportedFile.url);
        const blob = await response.blob();
        const file = new File([blob], exportedFile.name, { type: blob.type });
        await navigator.share({ files: [file], title: 'SourceFlow Export' });
      } catch (error) {
        // Fallback to download
        handleDownload();
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="min-h-screen pb-24 gradient-mesh">
      {/* Header with gradient */}
      <header className="relative overflow-hidden safe-top">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-500 to-purple-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative z-10 px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/more"
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-lg text-white">Export Reports</h1>
            <div className="w-10" />
          </div>

          {/* Summary */}
          <div className="glass-card rounded-2xl p-4 bg-white/10 border-white/20 slide-up">
            <p className="text-white/60 text-sm">Ready to Export</p>
            <p className="text-white font-bold text-2xl">{filteredSuppliers.length} Suppliers</p>
          </div>
        </div>

        {/* Curved bottom */}
        <div className="absolute -bottom-1 left-0 right-0 h-6 bg-[#f8fafc] rounded-t-[2rem]" />
      </header>

      {/* Content */}
      <div className="px-4 pt-2 space-y-4 -mt-1">
        {/* Filter */}
        <div className="bg-white rounded-2xl p-4 shadow-soft slide-up">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <span className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 text-xs">🔍</span>
            Filter Suppliers
          </label>
          <div className="flex flex-wrap gap-2">
            {['all', 'shortlisted', 'reviewing', 'quoted', 'new'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  selectedStatus === status
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-2xl p-4 shadow-soft slide-up stagger-1">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
            <span className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 text-xs">📤</span>
            Export Options
          </label>

          <div className="space-y-3">
            {/* PDF Report */}
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200",
                "bg-gradient-to-r from-red-50 to-orange-50 border border-red-100",
                "hover:shadow-md active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                {isExporting === 'pdf' ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <FileText className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">PDF Report</p>
                <p className="text-sm text-text-muted">Printable supplier summary</p>
              </div>
            </button>

            {/* CSV Spreadsheet */}
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={isExporting !== null}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200",
                "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100",
                "hover:shadow-md active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                {isExporting === 'csv' ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">CSV Spreadsheet</p>
                <p className="text-sm text-text-muted">Open in Excel or Google Sheets</p>
              </div>
            </button>

            {/* Follow-up Messages */}
            <button
              type="button"
              onClick={() => handleExport('followup')}
              disabled={isExporting !== null}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200",
                "bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100",
                "hover:shadow-md active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                {isExporting === 'followup' ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <MessageCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Follow-up Messages</p>
                <p className="text-sm text-text-muted">Pre-written templates for shortlisted</p>
              </div>
            </button>
          </div>
        </div>

        {/* Download Section */}
        {exportedFile && (
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100 shadow-soft slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">File Ready!</p>
                <p className="text-sm text-text-muted">{exportedFile.name}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl",
                  "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold",
                  "shadow-lg shadow-violet-500/30 transition-all active:scale-[0.98]"
                )}
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                type="button"
                onClick={handleShare}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl",
                  "bg-white border-2 border-violet-200 text-violet-600 font-semibold",
                  "transition-all active:scale-[0.98] hover:border-violet-300"
                )}
              >
                <Share2 className="w-5 h-5" />
                {exportedFile.name.endsWith('.html') ? 'Print' : 'Share'}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {suppliers.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-soft slide-up">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-foreground font-semibold mb-1">No suppliers yet</p>
            <p className="text-sm text-text-muted px-8">
              Start capturing suppliers at the fair to generate reports
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
