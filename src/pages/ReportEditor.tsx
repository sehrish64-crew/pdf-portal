import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createDefaultReportData } from '../lib/defaultReportData';
import {
  Save, Download, ArrowLeft, CheckCircle, Plus, Trash2, FileText,
  AlertTriangle, RotateCcw, Tag, TrendingDown, AlertCircle, Car,
  ShieldCheck, Lock, Gauge, Cog, ClipboardList, Scale,
  Calendar, Info, CheckSquare, Fuel,
} from 'lucide-react';
import type { Report, ReportData, MOTRecord } from '../types';

// ─── Inline Editable Text ────────────────────────────────────────────────────
function E({
  value, onChange, className = '', multiline = false, style,
}: {
  value: string | number | boolean; onChange: (v: string) => void;
  className?: string; multiline?: boolean; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);
  const textValue = String(value ?? '');
  useEffect(() => { if (ref.current && !focused) ref.current.textContent = textValue; }, [textValue, focused]);
  return (
    <span ref={ref} contentEditable
      onFocus={() => setFocused(true)}
      onBlur={(e) => { setFocused(false); onChange(e.currentTarget.textContent || ''); }}
      onKeyDown={(e) => { if (!multiline && e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); } }}
      className={`outline-none ${className}`}
      style={{ minWidth: 20, display: 'inline-block', cursor: 'text', borderRadius: 3, ...style }}
    />
  );
}


// ─── FIXED: Equipped Toggle ─────────────────────────────────────────────────
// ─── FIXED: Equipped Toggle ─────────────────────────────────────────────────
function EToggle({ value, onChange, color }: { value: 'Equipped' | 'Not Equipped'; onChange: (v: 'Equipped' | 'Not Equipped') => void; color: string }) {
  const eq = value === 'Equipped';
  return (
    <button className="report-editor-print-toggle" onClick={() => onChange(eq ? 'Not Equipped' : 'Equipped')}
      style={{ 
        backgroundColor: eq ? color + '18' : '#f8fafc', 
        color: eq ? color : '#94a3b8', 
        border: `1.5px solid ${eq ? color + '50' : '#e2e8f0'}`, 
        padding: '4px 4px', 
        borderRadius: 99, 
        fontSize: 10, 
        fontWeight: 600, 
        letterSpacing: '0.02em', 
        cursor: 'pointer',
        // CRITICAL: Text centering for PDF
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        verticalAlign: 'middle',
        lineHeight: 'normal',
        minWidth: '70px',
        height: '15px',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        // Prevent text wrapping
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      }}>
      {value}
    </button>
  );
}
// ─── Yes/No Toggle ───────────────────────────────────────────────────────────
function EBool({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', gap: 8, userSelect: 'none' }}>
      <span style={{ fontSize: 11, color: '#7a7a7a', lineHeight: 1.3 }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: value ? '#ef4444' : '#16a34a', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
        {value
          ? <><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg> Yes</>
          : <><svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5L8.5 2" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> No</>
        }
      </span>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, onChange }: { status: string; onChange: (v: string) => void }) {
  const ok = status.toLowerCase().includes('no records') || status.toLowerCase() === 'clear';
  return (
    <span onClick={() => onChange(ok ? 'Records Found' : 'No Records Found')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer', backgroundColor: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#15803d' : '#dc2626', border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`, whiteSpace: 'nowrap' }}>
      {ok
        ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5L8.5 2" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>}
      {status}
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="report-editor-section-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(145deg, ${mixHex(color, '#ffffff', 0.18)} 0%, ${color} 58%, ${mixHex(color, '#0f172a', 0.16)} 100%)`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color="#ffffff" strokeWidth={2.2} />
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
    </div>
  );
}

// ─── SubSection Header ────────────────────────────────────────────────────────
function SubHeader({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.03em', textTransform: 'uppercase' as const }}>{title}</span>
    </div>
  );
}

// ─── Data Row ─────────────────────────────────────────────────────────────────
function DataRow({ label, value, last = false }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: last ? 'none' : '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 13, color: '#7a7a7a', fontWeight: 400 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

// ─── Two Column Row ───────────────────────────────────────────────────────────
function TwoCol({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`report-editor-two-col ${className}`.trim()} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>{children}</div>;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function mixHex(baseHex: string, mixHexColor: string, amount: number) {
  const base = hexToRgb(baseHex);
  const mix = hexToRgb(mixHexColor);
  if (!base || !mix) return baseHex;

  const mixAmount = Math.min(1, Math.max(0, amount));
  const channel = (start: number, end: number) => Math.round(start + (end - start) * mixAmount);
  return `#${[channel(base.r, mix.r), channel(base.g, mix.g), channel(base.b, mix.b)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

function buildBrandTheme(color: string) {
  const base = hexToRgb(color) ? color : '#3B82F6';
  const light = mixHex(base, '#ffffff', 0.2);
  const dark = mixHex(base, '#0f172a', 0.16);
  return {
    base,
    light,
    dark,
    cover: `linear-gradient(135deg, ${light} 0%, ${base} 52%, ${dark} 100%)`,
    icon: `linear-gradient(145deg, ${light} 0%, ${base} 58%, ${dark} 100%)`,
    chip: `linear-gradient(135deg, ${light}22 0%, ${base}18 100%)`,
    soft: `linear-gradient(180deg, ${light}14 0%, ${dark}10 100%)`,
    footer: `linear-gradient(135deg, ${light}12, ${dark}0a)`,
  };
}

// ─── Main ReportEditor ────────────────────────────────────────────────────────
export function ReportEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => { if (id) fetchReport(); }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data: row, error } = await supabase.from('reports').select('*, brand:brands(*)').eq('id', id).single();
      if (error) throw error;
      if (row) {
        setReport(row);
        const def = createDefaultReportData(row.make ?? undefined, row.model ?? undefined, row.year ?? undefined, row.mileage ?? undefined, row.plate_number ?? undefined, row.vin_number ?? undefined);
        setData({ ...def, ...row.report_data });
      }
    } catch { navigate('/dashboard'); } finally { setLoading(false); }
  };

  const set = useCallback(<K extends keyof ReportData>(key: K, value: ReportData[K]) => {
    setData((prev) => prev ? { ...prev, [key]: value } : prev);
  }, []);

  const handleSave = async (status?: 'draft' | 'completed') => {
    if (!report || !data) return;
    setSaving(true);
    try {
      await supabase.from('reports').update({ report_data: data, status: status || report.status, vehicle_name: report.make && report.model ? `${report.make} ${report.model}` : null }).eq('id', report.id);
      if (status) setReport({ ...report, status });
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleExportPDF = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
    window.requestAnimationFrame(() => {
      window.print();
    });
  }, []);

  const editableText = (value: ReportData[keyof ReportData]) => {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
  };

  const updateNumericField = (key: 'accidentsCount' | 'recallsCount' | 'titleRecordsCount' | 'junkSalvageCount' | 'totalLossCount' | 'problemChecksCount', value: string) => {
    if (!data) return;
    set(key, (Number(value) || 0) as never);
  };

  const updateMOT = (idx: number, key: keyof MOTRecord, value: string) => {
    if (!data) return;
    setData({ ...data, motHistory: data.motHistory.map((m, i) => i === idx ? { ...m, [key]: value } : m) });
  };

  if (loading || !report || !data) {
    return <div className="report-editor-page" style={{ minHeight: 400 }} />;
  }

  const C = report.brand_color;
  const brandTheme = buildBrandTheme(C);
  const reportId = `CR-${report.id.slice(0, 6).toUpperCase()}`;
  const searchDate = data.searchDate || new Date(report.created_at).toLocaleDateString('en-GB');

  // Inline styles for document font
  const docStyle: React.CSSProperties = {
    fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif",
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 1.5,
  };

  const sectionBox: React.CSSProperties = {
    padding: '28px 36px',
    borderBottom: '1px solid #f0f4f8',
    background: 'white',
  };

  return (
    <div className="report-editor-page" style={{ paddingBottom: 40 }}>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10px;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          aside,
          header,
          nav,
          .report-editor-toolbar,
          .report-editor-toolbar-actions,
          .no-print,
          button,
          .print-hidden {
            display: none !important;
          }

          .report-editor-page {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          main {
            padding: 0 !important;
          }

          .report-editor-page > p {
            display: none !important;
          }

          .report-editor-page .report-editor-document {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            min-height: auto !important;
            display: block !important;
          }

          .report-editor-page .report-editor-document > .flex-1 {
            display: block !important;
            flex: none !important;
            min-height: auto !important;
            padding: 0 !important;
          }

          .report-editor-page .report-editor-document > .flex-1.space-y-8 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 12px !important;
          }

          .report-editor-page .report-editor-document,
          .report-editor-page .report-editor-document * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .report-editor-page .report-editor-document [contenteditable='true'] {
            outline: none !important;
          }

        
          
          .report-editor-page .report-editor-document button {
            display: none !important;
          }

          .report-editor-page .report-editor-document button.report-editor-print-toggle {
            display: inline-flex !important;
          }

          .report-editor-page .report-editor-footer {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            margin-top: 0 !important;
            break-inside: avoid;
            page-break-inside: avoid;
            z-index: 10;
          }

          .report-editor-page .report-editor-section {
            padding: 14px 16px !important;
          }

          .report-editor-page .report-editor-section-header {
            margin-bottom: 12px !important;
          }

          .report-editor-page .report-editor-cover {
            padding: 18px 18px 20px !important;
          }

          .report-editor-page .report-editor-stat-grid > div {
            padding: 10px 6px !important;
          }

          .report-editor-page .report-editor-page-break-before {
            break-before: page;
            page-break-before: always;
          }

          .report-editor-page .report-editor-section > div[style*='margin-bottom: 22px'] {
            margin-bottom: 10px !important;
          }

          .report-editor-page .report-editor-safety-grid > div {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
            align-items: center !important;
          }

          .report-editor-page .report-editor-safety-grid > div > span:first-child {
            line-height: 1.2 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            min-width: 0 !important;
          }

          .report-editor-page button.report-editor-print-toggle {
            min-width: 66px !important;
            height: auto !important;
            min-height: 18px !important;
            padding: 2px 8px !important;
            font-size: 9px !important;
            line-height: 1.2 !important;
          }

          .report-editor-page .report-editor-two-col,
          .report-editor-page .report-editor-legal-grid,
          .report-editor-page .report-editor-engine-grid,
          .report-editor-page .report-editor-fuel-grid,
          .report-editor-page .report-editor-general-grid,
          .report-editor-page .report-editor-core-grid,
          .report-editor-page .report-editor-problem-grid,
          .report-editor-page .report-editor-safety-grid,
          .report-editor-page .report-editor-security-grid,
          .report-editor-page .report-editor-mot-grid {
            gap: 8px !important;
          }

          .report-editor-page .report-editor-problem-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .report-editor-page .report-editor-security-grid,
          .report-editor-page .report-editor-mot-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .report-editor-page .report-editor-safety-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          .report-editor-page .report-editor-core-grid,
          .report-editor-page .report-editor-engine-grid,
          .report-editor-page .report-editor-fuel-grid,
          .report-editor-page .report-editor-general-grid,
          .report-editor-page .report-editor-legal-grid,
          .report-editor-page .report-editor-two-col {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 640px) {
          .report-editor-page {
            padding-bottom: 24px;
          }

          .report-editor-page .report-editor-toolbar {
            padding: 14px;
          }

          .report-editor-page .report-editor-toolbar-actions {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .report-editor-page .report-editor-toolbar-actions button {
            width: 100%;
            justify-content: center;
          }

          .report-editor-page .report-editor-document {
            border-radius: 14px;
          }

          .report-editor-page .report-editor-section {
            padding: 18px 16px !important;
          }

          .report-editor-page .report-editor-cover {
            padding: 22px 16px 18px !important;
          }

          .report-editor-page .report-editor-cover-top {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .report-editor-page .report-editor-cover-title {
            font-size: 22px !important;
            line-height: 1.15 !important;
          }

          .report-editor-page .report-editor-cover h1,
          .report-editor-page .report-editor-section h2 {
            letter-spacing: -0.01em;
          }

          .report-editor-page .report-editor-section h2 {
            font-size: 17px !important;
            line-height: 1.2 !important;
            margin-bottom: 18px !important;
          }

          .report-editor-page .report-editor-section-header {
            align-items: flex-start !important;
            gap: 10px !important;
            margin-bottom: 18px !important;
          }

          .report-editor-page .report-editor-section-header > div {
            width: 32px !important;
            height: 32px !important;
            border-radius: 9px !important;
          }

          .report-editor-page .report-editor-section-header h2 {
            font-size: 16px !important;
            line-height: 1.25 !important;
            max-width: 100% !important;
            overflow-wrap: anywhere;
          }

          .report-editor-page .report-editor-cover-stats > div > div:last-child {
            font-size: 14px !important;
            line-height: 1.25 !important;
          }

          .report-editor-page .report-editor-cover-stats > div > div:first-child span {
            font-size: 9px !important;
          }

          .report-editor-page .report-editor-two-col {
            grid-template-columns: 1fr !important;
          }

          .report-editor-page .report-editor-two-col > div {
            padding-left: 0 !important;
            padding-right: 0 !important;
            border-right: none !important;
          }

          .report-editor-page .report-editor-cover-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }

          .report-editor-page .report-editor-cover-stats > div {
            padding: 0 !important;
            border-right: none !important;
          }

          .report-editor-page .report-editor-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .report-editor-page .report-editor-badge-grid,
          .report-editor-page .report-editor-legal-grid,
          .report-editor-page .report-editor-core-grid,
          .report-editor-page .report-editor-general-grid,
          .report-editor-page .report-editor-engine-grid,
          .report-editor-page .report-editor-fuel-grid,
          .report-editor-page .report-editor-safety-grid,
          .report-editor-page .report-editor-security-grid,
          .report-editor-page .report-editor-problem-grid,
          .report-editor-page .report-editor-mot-grid {
            grid-template-columns: 1fr !important;
          }

          .report-editor-page .report-editor-badge-grid > div,
          .report-editor-page .report-editor-legal-grid > div,
          .report-editor-page .report-editor-core-grid > div,
          .report-editor-page .report-editor-general-grid > div,
          .report-editor-page .report-editor-engine-grid > div,
          .report-editor-page .report-editor-fuel-grid > div,
          .report-editor-page .report-editor-safety-grid > div,
          .report-editor-page .report-editor-security-grid > div,
          .report-editor-page .report-editor-problem-grid > div,
          .report-editor-page .report-editor-mot-grid > div {
            border-right: none !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          .report-editor-page .report-editor-mot-card {
            padding: 14px !important;
          }

          .report-editor-page .report-editor-mot-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }

          .report-editor-page .report-editor-mot-grid > div {
            width: 100% !important;
          }

          .report-editor-page .report-editor-mot-meta {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }

          .report-editor-page .report-editor-mot-meta > div,
          .report-editor-page .report-editor-mot-meta > button {
            width: 100% !important;
          }

          .report-editor-page .report-editor-mot-fields {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }

          .report-editor-page .report-editor-mot-fields > div {
            padding: 8px 10px !important;
          }

          .report-editor-page .report-editor-stat-grid > div {
            padding: 14px 6px !important;
          }

          .report-editor-page .report-editor-stat-grid > div > span:first-of-type {
            font-size: 24px !important;
          }

          .report-editor-page .report-editor-stat-grid > div > span:last-of-type {
            font-size: 9px !important;
            line-height: 1.2 !important;
          }

          .report-editor-page .report-editor-row-stack,
          .report-editor-page .report-editor-footer {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }

          .report-editor-page .report-editor-footer {
            text-align: center;
          }
        }
      `}</style>
      {/* ── Toolbar ── */}
      <div className="report-editor-toolbar print-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/reports')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Report Editor</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{report.make} {report.model} — Click any value to edit inline</p>
          </div>
        </div>
        <div className="report-editor-toolbar-actions flex items-center gap-2">
          <button onClick={() => handleSave()} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave('completed')} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg"
            style={{ background: brandTheme.soft, boxShadow: `0 4px 14px ${brandTheme.base}40` }}>
            <CheckCircle className="w-4 h-4" />Complete
          </button>
          <button onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold rounded-xl hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50">
            <Download className="w-4 h-4" />Export PDF
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mb-4">
        Click any value in the report below to edit. All changes appear exactly in the downloaded PDF.
      </p>

      {/* ══════ REPORT DOCUMENT ══════ */}
      <div ref={reportRef} style={{paddingBottom: 40 }}>
        <div className="report-editor-document" style={{ width: '100%', maxWidth: 794, margin: '0 auto', background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 0 1px #e2e8f0, 0 20px 60px rgba(0,0,0,0.08)', boxSizing: 'border-box', ...docStyle }}>

          {/* ══ COVER HEADER ══ */}
          <div className="report-editor-cover" style={{ background: brandTheme.cover, padding: '32px 36px 36px', position: 'relative', overflow: 'hidden', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
            <div style={{ position: 'absolute', top: 20, right: 60, width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.08)' }} />
            <div style={{ position: 'absolute', bottom: -30, left: 200, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

            {/* Top bar: Logo + Report ID */}
            <div className="report-editor-cover-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, position: 'relative' }}>
              {/* Logo */}
              <div style={{ background: 'white', borderRadius: 14, padding: '8px 14px', minWidth: 80, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                {report.logo_url
                  ? <img src={report.logo_url} alt="Logo" style={{ maxHeight: 44, maxWidth: 110, objectFit: 'contain' }} />
                  : <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Car size={22} color={C} />
                      <span style={{ fontWeight: 800, fontSize: 14, color: C }}>{report.brand?.name?.slice(0, 3).toUpperCase()}</span>
                    </div>}
              </div>
              {/* Report ID */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 3, height: 20, background: 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Report ID</div>
                  <div style={{ fontSize: 13, color: 'white', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    <E value={reportId} onChange={() => {}} className="text-white" style={{ color: 'white', fontFamily: 'monospace' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Official badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: brandTheme.chip, border: `1px solid ${brandTheme.light}40`, borderRadius: 99, marginBottom: 20 }}>
              <CheckSquare size={12} color="rgba(255,255,255,0.8)" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.92)', fontWeight: 500, letterSpacing: '0.02em' }}>Official Vehicle History Audit Report | Comprehensive &amp; Detailed</span>
            </div>

            {/* Vehicle Name */}
            <h1 className="report-editor-cover-title" style={{ fontSize: 36, fontWeight: 800, color: 'white', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.1, position: 'relative', zIndex: 1 }}>
              <E value={data.vehicleDisplay} onChange={(v) => set('vehicleDisplay', v)} style={{ color: 'white' }} />
            </h1>

            {/* Plate Number */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, background: 'rgba(255,255,255,0.12)', padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)' }}>
              <Car size={14} color="rgba(255,255,255,0.75)" />
              <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.18em', color: 'white', fontSize: 15 }}>
                <E value={data.plateNumber} onChange={(v) => set('plateNumber', v)} style={{ color: 'white', fontFamily: 'monospace', letterSpacing: '0.18em' }} />
              </span>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 22 }} />

            {/* 4-stat Row */}
            <div className="report-editor-cover-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {[
                { label: 'Year / Model', icon: Calendar, val: report.year ? String(report.year) : '---', key: null as null },
                { label: 'Current Mileage', icon: Gauge, val: data.currentMileage, key: 'currentMileage' as const },
                { label: 'Market Value', icon: Tag, val: data.marketValue, key: 'marketValue' as const },
                { label: 'Search Date', icon: Calendar, val: searchDate, key: 'searchDate' as const },
              ].map(({ label, icon: Icon, val, key }, i) => (
                <div key={i} style={{ paddingRight: i < 3 ? 20 : 0, borderRight: i < 3 ? '1px solid rgba(255,255,255,0.15)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <Icon size={11} color="#ffffff" strokeWidth={2.2} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.82)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>
                    {key === 'searchDate'
                      ? <E value={searchDate} onChange={(v) => set('searchDate', v)} style={{ color: 'white' }} />
                      : key ? <E value={editableText(data[key as keyof ReportData])} onChange={(v) => set(key as keyof ReportData, v as never)} style={{ color: 'white' }} /> : val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ STAT BADGES ROW ══ */}
          <div className="report-editor-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: '1px solid #f0f4f8' }}>
            {[
              { key: 'accidentsCount' as const, val: data.accidentsCount, label: 'Accidents', icon: AlertTriangle },
              { key: 'recallsCount' as const, val: data.recallsCount, label: 'Recalls', icon: RotateCcw },
              { key: 'titleRecordsCount' as const, val: data.titleRecordsCount, label: 'Title Records', icon: FileText },
              { key: 'junkSalvageCount' as const, val: data.junkSalvageCount, label: 'Junk/Salvage', icon: Trash2 },
              { key: 'totalLossCount' as const, val: data.totalLossCount, label: 'Total Loss', icon: TrendingDown },
              { key: 'problemChecksCount' as const, val: data.problemChecksCount, label: 'Problem Checks', icon: AlertCircle },
            ].map(({ key, val, label, icon: Icon }, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '20px 8px', borderRight: i < 5 ? '1px solid #f0f4f8' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: brandTheme.icon, border: `1.5px solid ${C}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon size={16} color="#ffffff" strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 4 }}>
                  <E value={String(val)} onChange={(v) => updateNumericField(key, v)} style={{ color: '#0f172a' }} />
                </span>
                <span style={{ fontSize: 10, color: '#7a7a7a', textAlign: 'center', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* ══ EXECUTIVE SUMMARY ══ */}
          <div className="report-editor-section" style={{ ...sectionBox }}>
            <SectionHeader icon={ClipboardList} title="Executive Summary & Vehicle Identity" color={C} />
            <TwoCol>
              <div style={{ paddingRight: 24, borderRight: '1px solid #f0f4f8' }}>
                <DataRow label="Vehicle" value={<E value={data.vehicleDisplay} onChange={(v) => set('vehicleDisplay', v)} />} />
                <DataRow label="Current Mileage" value={<E value={data.currentMileage} onChange={(v) => set('currentMileage', v)} />} />
                <DataRow label="Accidents" value={<StatusBadge status={data.accidentsStatus} onChange={(v) => set('accidentsStatus', v)} />} />
                <DataRow label="Total Loss" value={<StatusBadge status={data.totalLossStatus} onChange={(v) => set('totalLossStatus', v)} />} />
                <DataRow label="Recalls" value={<StatusBadge status={data.recallsStatus} onChange={(v) => set('recallsStatus', v)} />} last />
              </div>
              <div style={{ paddingLeft: 24 }}>
                <DataRow label="Plate Number" value={<E value={data.plateNumber} onChange={(v) => set('plateNumber', v)} style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} />} />
                <DataRow label="Title Records" value={<StatusBadge status={data.titleRecordsStatus} onChange={(v) => set('titleRecordsStatus', v)} />} />
                <DataRow label="Junk/Salvage" value={<StatusBadge status={data.junkSalvageStatus} onChange={(v) => set('junkSalvageStatus', v)} />} />
                <DataRow label="Problem Checks" value={<StatusBadge status={data.problemChecksStatus} onChange={(v) => set('problemChecksStatus', v)} />} last />
              </div>
            </TwoCol>

            {/* Great News Banner */}
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac', borderRadius: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'white', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7l3.5 3.5L12 3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
              <p style={{ fontSize: 13, color: '#166534', margin: 0, lineHeight: 1.6 }}>
                <strong>Great News!</strong>{' '}
                <E value={data.greatNewsMessage} onChange={(v) => set('greatNewsMessage', v)} multiline style={{ color: '#166534' }} />
              </p>
            </div>
          </div>

          {/* ══ LEGAL CHECKS ══ */}
          <div className="report-editor-section report-editor-page-break-before" style={{ ...sectionBox }}>
            <SectionHeader icon={Scale} title="Legal Checks" color={C} />
            <div className="report-editor-legal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {[
                { label: 'Financial & Legal Status', key: 'financialLegalStatus' as const, icon: Scale },
                { label: 'Insurance Write-off', key: 'insuranceWriteoffStatus' as const, icon: ShieldCheck },
                { label: 'Accident Records', key: 'accidentRecordsStatus' as const, icon: AlertTriangle },
                { label: 'Theft / Stolen Markers', key: 'theftStolenStatus' as const, icon: Lock },
              ].map(({ label, key, icon: Icon }, i) => {
                const val = data[key];
                const ok = val.toLowerCase() === 'clear';
                return (
                  <div key={key} onClick={() => set(key, ok ? 'Issue Found' : 'Clear')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < 2 ? '1px solid #f0f4f8' : 'none', borderRight: i % 2 === 0 ? '1px solid #f0f4f8' : 'none', cursor: 'pointer', transition: 'background 0.15s', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 4, height: 20, background: C, borderRadius: 2 }} />
                      <div>
                        <div style={{ fontSize: 11, color: '#7a7a7a', fontWeight: 500, marginBottom: 1 }}>{label}</div>
                        <Icon size={11} color="#cbd5e1" />
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: ok ? '#0f172a' : '#ef4444', letterSpacing: '-0.01em' }}>{val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══ MOT HISTORY ══ */}
          <div className="report-editor-section" style={{ ...sectionBox }}>
            <SectionHeader icon={Calendar} title="MOT History" color={C} />
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
              {data.motHistory.map((m, idx) => (
                <div key={idx} className="report-editor-mot-card" style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #e2e8f0' }}>
                  <div className="report-editor-mot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 10 }}>
                    {([['Year', 'year'], ['Result', 'result'], ['Date of Test', 'dateOfTest'], ['Expiry Date', 'expiryDate'], ['Mileage', 'mileage']] as [string, keyof MOTRecord][]).map(([lbl, k]) => (
                      <div key={k} style={{ background: 'white', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: 9, color: '#7a7a7a', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>{lbl}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: k === 'result' ? (m[k] === 'PASSED' ? '#16a34a' : '#dc2626') : '#1e293b' }}>
                          <E value={m[k]} onChange={(v) => updateMOT(idx, k, v)} style={{ color: k === 'result' ? (m[k] === 'PASSED' ? '#16a34a' : '#dc2626') : '#1e293b' }} />
                        </div>
                      </div>
                    ))}
                  </div>
              
                  <div className="report-editor-mot-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#7a7a7a', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Test Number</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>
                        <E value={m.testNumber} onChange={(v) => updateMOT(idx, 'testNumber', v)} style={{ fontFamily: 'monospace', color: '#475569' }} />
                      </span>
                    </div>
                  </div>
                  <div style={{ background: 'white', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginTop: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: '#7a7a7a', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Advisories:</div>
                    <textarea
                      value={m.advisorNote || ''}
                      onChange={(e) => updateMOT(idx, 'advisorNote', e.target.value)}
                      placeholder="Type advisories here"
                      rows={3}
                      style={{
                        width: '100%',
                        display: 'block',
                        resize: 'vertical',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        color: '#1e293b',
                        outline: 'none',
                        background: '#fff',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                      }}
                    />
                  </div>
                  <div className="report-editor-mot-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div />
                    <button className="no-print" onClick={() => setData({ ...data, motHistory: data.motHistory.filter((_, i) => i !== idx) })}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', color: '#ef4444', background: '#fff5f5', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
              <button className="no-print" onClick={() => setData({ ...data, motHistory: [...data.motHistory, { year: '', result: 'PASSED', dateOfTest: '', expiryDate: '', mileage: '', testNumber: '', advisorNote: '' }] })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: '2px dashed #e2e8f0', color: '#64748b', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, width: '100%', transition: 'all 0.2s' }}>
                <Plus size={14} /> Add MOT Record
              </button>
            </div>
          </div>

          {/* ══ CORE VEHICLE SPECS ══ */}
          <div className="report-editor-section report-editor-page-break-before" style={{ ...sectionBox }}>
            <SectionHeader icon={Car} title="Core Vehicle Specifications" color={C} />
            <div className="report-editor-core-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {([
                ['Colour', 'colour', 'Engine', 'engine'],
                ['Max Torque', 'maxTorque', 'Top Speed', 'topSpeed'],
                ['Gear Box', 'gearbox', 'Market Value', 'marketValue'],
                ['MOT Status', 'motStatus', 'Last Reported Mileage', 'lastReportedMileage'],
                ['Estimated Mileage', 'estimatedMileage', null, null],
              ] as [string, keyof ReportData, string | null, (keyof ReportData) | null][]).map(([l1, k1, l2, k2], ri) => (
                <React.Fragment key={ri}>
                  <div style={{ padding: '11px 0', paddingRight: 24, borderBottom: '1px solid #f8fafc', borderRight: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#7a7a7a', fontWeight: 400 }}>{l1}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                      {k1 === 'motStatus'
                        ? <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: '1px solid #bbf7d0' }}><E value={editableText(data[k1])} onChange={(v) => set(k1, v as never)} style={{ color: '#15803d' }} /></span>
                        : <E value={editableText(data[k1])} onChange={(v) => set(k1, v as never)} />}
                    </span>
                  </div>
                  <div style={{ padding: '11px 0', paddingLeft: 24, borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {k2 && <><span style={{ fontSize: 13, color: '#7a7a7a', fontWeight: 400 }}>{l2}</span><span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}><E value={editableText(data[k2])} onChange={(v) => set(k2!, v as never)} /></span></>}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ══ GENERAL STATUS ══ */}
          <div className="report-editor-section" style={{ ...sectionBox }}>
            <SectionHeader icon={Info} title="General Status & Basic History" color={C} />
            <div className="report-editor-general-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <div style={{ paddingRight: 24, borderRight: '1px solid #f0f4f8' }}>
                <DataRow label="Vehicle Class" value={<E value={editableText(data.vehicleClass)} onChange={(v) => set('vehicleClass', v)} />} />
                <DataRow label="MOT Status" value={<span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: '1px solid #bbf7d0', display: 'inline-block' }}><E value={editableText(data.motStatusGeneral)} onChange={(v) => set('motStatusGeneral', v)} style={{ color: '#15803d' }} /></span>} last />
              </div>
              <div style={{ paddingLeft: 24 }}>
                <DataRow label="Consumption (City)" value={<E value={editableText(data.consumptionCity)} onChange={(v) => set('consumptionCity', v)} />} />
                <DataRow label="Wheel Plan" value={<E value={editableText(data.wheelPlan)} onChange={(v) => set('wheelPlan', v)} />} last />
              </div>
            </div>
          </div>
          {/* ══ ENGINE & TRANSMISSION ══ */}
          <div className="report-editor-section report-editor-page-break-before" style={{ ...sectionBox }}>
            <SectionHeader icon={Cog} title="Engine & Transmission Technical Details" color={C} />
            <div className="report-editor-engine-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {([
                ['Cylinders', 'cylinders', 'Cam Type', 'camType'],
                ['Fuel Induction', 'fuelInduction', 'Fuel Type', 'fuelType'],
                ['Valves', 'valves', 'Max Horsepower', 'maxHorsepower'],
                ['Total Max Torque', 'totalMaxTorque', 'Transmission', 'transmissionEngine'],
              ] as [string, keyof ReportData, string, keyof ReportData][]).map(([l1, k1, l2, k2], ri) => (
                <React.Fragment key={ri}>
                  <div style={{ padding: '11px 0', paddingRight: 24, borderBottom: '1px solid #f8fafc', borderRight: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#7a7a7a' }}>{l1}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}><E value={editableText(data[k1])} onChange={(v) => set(k1, v as never)} /></span>
                  </div>
                  <div style={{ padding: '11px 0', paddingLeft: 24, borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#7a7a7a' }}>{l2}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}><E value={editableText(data[k2])} onChange={(v) => set(k2, v as never)} /></span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ══ FUEL EFFICIENCY ══ */}
          <div className="report-editor-section" style={{ ...sectionBox }}>
            <SectionHeader icon={Fuel} title="Fuel Efficiency (EPA MPG Estimates)" color={C} />
            <div className="report-editor-fuel-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {([
                ['Fuel Grade', 'fuelGrade', 'City Economy', 'cityEconomy'],
                ['Highway Economy', 'highwayEconomy', 'Combined Economy', 'combinedEconomy'],
              ] as [string, keyof ReportData, string, keyof ReportData][]).map(([l1, k1, l2, k2], ri) => (
                <React.Fragment key={ri}>
                  <div style={{ padding: '11px 0', paddingRight: 24, borderBottom: ri === 0 ? '1px solid #f8fafc' : 'none', borderRight: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#7a7a7a' }}>{l1}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}><E value={editableText(data[k1])} onChange={(v) => set(k1, v as never)} /></span>
                  </div>
                  <div style={{ padding: '11px 0', paddingLeft: 24, borderBottom: ri === 0 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#7a7a7a' }}>{l2}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}><E value={editableText(data[k2])} onChange={(v) => set(k2, v as never)} /></span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ══ TITLE BRAND & PROBLEM CHECKS ══ */}
          <div className="report-editor-section" style={{ ...sectionBox }}>
            <SectionHeader icon={Tag} title="Title Brand & Problem Checks (Comprehensive)" color={C} />

            {[
              { title: 'Damage & Salvage Checks', items: [['Flood Damage','floodDamage'],['Fire Damage','fireDamage'],['Hail Damage','hailDamage'],['Junk','junkTitle'],['Totaled','totaled'],['Salvage','salvage'],['Former Rental','formerRental']] },
              { title: 'Title History Checks', items: [['Prior Taxi','priorTaxi'],['Odometer Not Actual','odometerNotActual'],['Vandalism','vandalism'],['Rebuilt','rebuilt'],['Dismantled','dismantled'],['Collision','collision'],['Prior Police','priorPolice']] },
              { title: 'Warranty & Status Checks', items: [['Warranty Return','warrantyReturn'],['Parts Only','partsOnly'],['Recovered Theft','recoveredTheft'],['Undisclosed Lien','undisclosedLien'],['Antique / Classic','antiqueClassic'],['Agricultural Vehicle','agriculturalVehicle'],['Reissued VIN','reissuedVIN']] },
              { title: 'Safety & Defect Checks', items: [['Manufacturer Buy Back','manufacturerBuyBack'],['Salvage / Stolen','salvageStolen'],['Crushed','crushed'],['Inoperable Vehicle','inoperableVehicle'],['Hazardous','hazardous'],['Export Only Vehicle','exportOnlyVehicle'],['Odometer Tampering','odometerTampering'],['Gray Market','grayMarket']] },
              { title: 'Odometer & Discrepancy Checks', items: [['Odometer Exceeds Limits','odometerExceedsLimits'],['Odometer Altered','odometerAltered'],['Odometer Replaced','odometerReplaced'],['Odometer Discrepancy','odometerDiscrepancy'],['Pending Junk','pendingJunk'],['Junk Automobile','junkAutomobile']] },
            ].map(({ title, items }) => (
              <div
                key={title}
                className={title === 'Warranty & Status Checks' ? 'report-editor-page-break-before' : undefined}
                style={{ marginBottom: 22 }}
              >
                <SubHeader title={title} color={C} />
                <div className="report-editor-problem-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                  {(items as [string, keyof ReportData][]).map(([lbl, k]) => (
                    <EBool key={k} label={lbl} value={data[k] as boolean} onChange={(v) => set(k, v as any)} />
                  ))}
                </div>
              </div>
            ))}

            {/* Recalls callout */}
            <div style={{ borderLeft: `4px solid ${C}`, borderRadius: '0 12px 12px 0', background: 'linear-gradient(90deg, #fafafa, white)', padding: '16px 20px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} color="#f59e0b" />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Recalls Section</span>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', width: 'fit-content' }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5L8.5 2" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                No Active Campaigns Found
              </span>
              <p style={{ fontSize: 13, color: '#7a7a7a', margin: 0, lineHeight: 1.6 }}>
                <E value={data.recallsMessage} onChange={(v) => set('recallsMessage', v)} multiline style={{ color: '#7a7a7a' }} />
              </p>
            </div>
          </div>

          {/* ══ SAFETY FEATURES ══ */}
          <div className="report-editor-section report-editor-page-break-before" style={{ ...sectionBox }}>
            <SectionHeader icon={ShieldCheck} title="Safety Features" color={C} />
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
              {([
                [['Front Airbags','frontAirbags'],['Side Airbags','sideAirbags'],['Side Curtain Airbags','sideCurtainAirbags']],
                [['ABS','abs'],['Braking Assist','brakingAssist'],['Electronic Brakeforce Distribution','electronicBrakeforceDistribution']],
                [['Active Head Restraints','activeHeadRestraints'],['Child Safety Door Locks','childSafetyDoorLocks'],['Child Seat Anchors','childSeatAnchors']],
                [['Crumple Zones','crumpleZones'],['Emergency Interior Trunk Release','emergencyInteriorTrunkRelease'],['','']],
              ] as [string, keyof ReportData][][]).map((row, ri) => (
                <div key={ri} className="report-editor-safety-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: ri < 3 ? '1px solid #f0f4f8' : 'none' }}>
                  {row.map(([lbl, k], ci) => (
                    <div key={ci} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', paddingRight: ci < 2 ? 20 : 0, paddingLeft: ci > 0 ? 20 : 0, borderRight: ci < 2 ? '1px solid #f0f4f8' : 'none', gap: 8 }}>
                      {lbl && k ? (
                        <>
                          <span style={{ fontSize: 13, color: '#7a7a7a', flex: 1, whiteSpace: 'nowrap' }}>{lbl}</span>
                          <EToggle value={data[k] as 'Equipped' | 'Not Equipped'} onChange={(v) => set(k as any, v)} color={C} />
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ══ SECURITY FEATURES ══ */}
          <div className="report-editor-section" style={{ ...sectionBox }}>
            <SectionHeader icon={Lock} title="Security Features" color={C} />
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
              {([
                [['Hill Holder Control','hillHolderControl'],['Stability Control','stabilityControl']],
                [['Traction Control','tractionControl'],['Anti-Theft System','antiTheftSystem']],
                [['Power Door Locks','powerDoorLocks'],['Front Seatbelts','frontSeatbelts']],
                [['Rear Seatbelts','rearSeatbelts'],['Seatbelt Pretensioners','seatbeltPretensioners']],
                [['Seatbelt Warning Sensor','seatbeltWarningSensor'],['','']],
              ] as [string, keyof ReportData][][]).map((row, ri) => (
                <div key={ri} className="report-editor-security-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: ri < 4 ? '1px solid #f0f4f8' : 'none' }}>
                  {row.map(([lbl, k], ci) => (
                    <div key={ci} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', paddingRight: ci === 0 ? 28 : 0, paddingLeft: ci > 0 ? 28 : 0, borderRight: ci === 0 ? '1px solid #f0f4f8' : 'none', gap: 8 }}>
                      {lbl && k ? (
                        <>
                          <span style={{ fontSize: 13, color: '#7a7a7a' }}>{lbl}</span>
                          <EToggle value={data[k] as 'Equipped' | 'Not Equipped'} onChange={(v) => set(k as any, v)} color={C} />
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ══ AUDITING SUMMARY ══ */}
          <div className="report-editor-section report-editor-page-break-before" style={{ ...sectionBox }}>
            <SectionHeader icon={CheckSquare} title="Auditing Summary & Conclusion" color={C} />

            <div style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 42, background: 'linear-gradient(180deg, #22c55e, #16a34a)', borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.7 }}>
                  <strong>Clean Bill of Health</strong> —{' '}
                  <E value={data.auditSummaryText} onChange={(v) => set('auditSummaryText', v)} multiline style={{ color: '#374151' }} />
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 14 }}>
                <span style={{ fontSize: 16, color: C }}>£</span>
                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.7 }}>
                  <E value={data.marketValueSummary} onChange={(v) => set('marketValueSummary', v)} multiline style={{ color: '#374151' }} />
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
              <AlertCircle size={13} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 11, color: '#7a7a7a', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
                <span style={{ fontWeight: 600 }}>Disclaimer: </span>
                <E value={data.disclaimerText} onChange={(v) => set('disclaimerText', v)} multiline style={{ color: '#7a7a7a' }} />
              </p>
            </div>

            {/* Contact */}
            <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 11, color: '#7a7a7a', margin: 0 }}>
                Email: <E value={data.email} onChange={(v) => set('email', v)} style={{ color: '#3b82f6', textDecoration: 'underline' }} /> &nbsp;|&nbsp; Website:{' '}
                <E value={data.website} onChange={(v) => set('website', v)} style={{ color: '#3b82f6', textDecoration: 'underline' }} />
              </p>
            </div>
          </div>

          {/* ══ FOOTER ══ */}
          <div className="report-editor-footer" style={{ padding: '18px 36px', background: brandTheme.footer, borderTop: `2px solid ${brandTheme.base}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <div style={{ background: 'white', borderRadius: 12, padding: '6px 12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 60, minHeight: 42, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {report.logo_url
                ? <img src={report.logo_url} alt="Logo" style={{ maxHeight: 32, maxWidth: 80, objectFit: 'contain' }} />
                : <Car size={18} color={C} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#7a7a7a' }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2L7 1" stroke="#7a7a7a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
              <E value={data.tagline} onChange={(v) => set('tagline', v)} style={{ color: '#7a7a7a' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: C }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${C}60`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2L7 1" stroke={C} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
              <E value={data.securedBy} onChange={(v) => set('securedBy', v)} style={{ color: C }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
