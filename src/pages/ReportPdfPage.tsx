import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  ArrowLeft,
  Download,
  Car,
  Calendar,
  Gauge,
  Tag,
  AlertTriangle,
  RotateCcw,
  FileText,
  AlertCircle,
  ShieldCheck,
  CheckSquare,
  Info,
  Cog,
  Fuel,
  ClipboardList,
  Scale,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createDefaultReportData } from '../lib/defaultReportData';
import type { MOTRecord, Report, ReportData } from '../types';

function SectionTitle({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-slate-200 bg-white"
        style={{ backgroundColor: `${color}10`, borderColor: `${color}24` }}
      >
        <Icon size={17} color={color} />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-none text-slate-900 dark:text-white">{title}</h2>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: React.ReactNode; icon: React.ElementType; color: string }) {
  return (
    <div className="border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        <Icon size={12} color={color} />
        {label}
      </div>
      <div className="text-xl font-extrabold tracking-[-0.02em] text-slate-900">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-slate-200 py-4 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="max-w-[62%] text-right text-sm font-semibold leading-6 text-slate-900">{value}</span>
    </div>
  );
}

function StatusChip({ value }: { value: string }) {
  const ok = value.toLowerCase().includes('clear') || value.toLowerCase().includes('no records');
  return (
    <span
      className="inline-flex items-end gap-1 px-3 py-1 text-xs font-bold whitespace-nowrap"
      style={{
        color: ok ? '#15803d' : '#dc2626',
      }}
    >
      {ok ? <CheckSquare size={10} /> : <AlertTriangle size={10} />}
      {value}
    </span>
  );
}

function BoolChip({ value }: { value: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
      style={{
        backgroundColor: value ? '#dcfce7' : '#e2e8f0',
        color: value ? '#15803d' : '#64748b',
      }}
    >
      {value ? 'Yes' : 'No'}
    </span>
  );
}

function EquipChip({ value }: { value: 'Equipped' | 'Not Equipped' }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
      style={{
        backgroundColor: value === 'Equipped' ? '#ecfeff' : '#f1f5f9',
        color: value === 'Equipped' ? '#0891b2' : '#64748b',
      }}
    >
      {value}
    </span>
  );
}

function FeatureLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="pdf-card flex min-h-12 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <span className="text-sm leading-5 text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold leading-5 text-slate-900">{value}</span>
    </div>
  );
}

function GroupCard({ title, items }: { title: string; items: Array<[string, boolean]> }) {
  return (
    <div className="pdf-card rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">
        <span className="h-2 w-2 flex-shrink-0 bg-[currentColor]" style={{ color: '#f59e0b' }} />
        {title}
      </div>
      <div className="grid pdf-grid-2 gap-3">
        {items.map(([label, value]) => (
          <FeatureLine key={label} label={label} value={<BoolChip value={value} />} />
        ))}
      </div>
    </div>
  );
}

export function ReportPdfPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: row, error } = await supabase.from('reports').select('*, brand:brands(*)').eq('id', id).single();
        if (error) throw error;
        if (row) {
          setReport(row);
          const def = createDefaultReportData(
            row.make ?? undefined,
            row.model ?? undefined,
            row.year ?? undefined,
            row.mileage ?? undefined,
            row.plate_number ?? undefined,
            row.vin_number ?? undefined
          );
          setData({ ...def, ...row.report_data });
        }
      } catch (error) {
        console.error(error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    void fetchReport();
  }, [id, navigate]);

  const handleDownload = useCallback(async () => {
    if (!reportRef.current || !report || !data) return;

    setDownloading(true);
    try {
      const active = document.activeElement as HTMLElement | null;
      active?.blur();
      await new Promise((resolve) => window.setTimeout(resolve, 0));

      const el = reportRef.current;
      const noPrint = Array.from(el.querySelectorAll<HTMLElement>('.no-print'));
      const originalDisplays = noPrint.map((node) => node.style.display);
      noPrint.forEach((node) => {
        node.dataset.pdfDisplay = node.style.display;
        node.style.display = 'none';
      });

      const exportWidth = el.scrollWidth;
      const exportHeight = el.scrollHeight;
      const scale = 3;
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        logging: false,
        width: exportWidth,
        height: exportHeight,
        windowWidth: exportWidth,
        windowHeight: exportHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        onclone: (doc) => {
          const clonedRoot = doc.querySelector<HTMLElement>('[data-pdf-root="true"]');
          clonedRoot?.classList.add('pdf-export-clone');
        },
      });

      noPrint.forEach((node, index) => {
        node.style.display = originalDisplays[index];
        if (node.dataset.pdfDisplay === undefined) {
          delete node.dataset.pdfDisplay;
        }
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageHeightPx = Math.floor((pageHeight * canvas.width) / pageWidth);
      const breakElements = Array.from(el.querySelectorAll<HTMLElement>('.pdf-page-break'));
      const breakPositions = breakElements
        .map((breakEl) => {
          const rect = breakEl.getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          return Math.round((rect.top - containerRect.top) * scale);
        })
        .filter((pos) => pos > 0 && pos < canvas.height)
        .sort((a, b) => a - b);

      const pageStarts = [0];
      let currentTop = 0;

      for (const breakPos of breakPositions) {
        if (breakPos <= currentTop + 1) continue;
        if (breakPos <= currentTop + pageHeightPx) {
          pageStarts.push(breakPos);
          currentTop = breakPos;
        } else {
          while (currentTop + pageHeightPx < breakPos) {
            currentTop += pageHeightPx;
            pageStarts.push(Math.round(currentTop));
          }
          if (currentTop < breakPos) {
            pageStarts.push(breakPos);
            currentTop = breakPos;
          }
        }
      }

      while (currentTop + pageHeightPx < canvas.height) {
        currentTop += pageHeightPx;
        pageStarts.push(Math.round(currentTop));
      }
      if (pageStarts[pageStarts.length - 1] < canvas.height) {
        pageStarts.push(canvas.height);
      }

      for (let i = 0; i < pageStarts.length - 1; i += 1) {
        const top = pageStarts[i];
        const height = pageStarts[i + 1] - top;
        if (height <= 0) continue;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = height;
        const context = pageCanvas.getContext('2d');
        if (context) {
          context.drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height);
        }

        const pageData = pageCanvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(pageData, 'PNG', 0, 0, pageWidth, (height * pageWidth) / canvas.width);
      }

      const fileName = `${report.make || 'Vehicle'}_${report.model || 'Report'}_${id?.slice(0, 8)}.pdf`;
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error(error);
    } finally {
      setDownloading(false);
    }
  }, [data, id, report]);

  useEffect(() => {
    if (!loading && report && data && searchParams.get('download') === '1') {
      const timer = window.setTimeout(() => {
        void handleDownload();
      }, 350);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [data, handleDownload, loading, report, searchParams]);

  if (loading || !report || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  const C = report.brand_color;
  const fileTitle = `${report.make || 'Vehicle'} ${report.model || 'Report'}`.trim();
  const searchDate = data.searchDate || new Date(report.created_at).toLocaleDateString('en-GB');
  const vehicleTitle = data.vehicleDisplay || fileTitle || 'Vehicle Report';

  const titleGroups: Array<{ title: string; items: Array<[string, boolean]> }> = [
    {
      title: 'Damage and Salvage',
      items: [
        ['Flood Damage', data.floodDamage],
        ['Fire Damage', data.fireDamage],
        ['Hail Damage', data.hailDamage],
        ['Junk Title', data.junkTitle],
        ['Totaled', data.totaled],
        ['Salvage', data.salvage],
        ['Former Rental', data.formerRental],
      ],
    },
    {
      title: 'Title History',
      items: [
        ['Prior Taxi', data.priorTaxi],
        ['Odometer Not Actual', data.odometerNotActual],
        ['Vandalism', data.vandalism],
        ['Rebuilt', data.rebuilt],
        ['Dismantled', data.dismantled],
        ['Collision', data.collision],
        ['Prior Police', data.priorPolice],
      ],
    },
    {
      title: 'Warranty and Status',
      items: [
        ['Warranty Return', data.warrantyReturn],
        ['Parts Only', data.partsOnly],
        ['Recovered Theft', data.recoveredTheft],
        ['Undisclosed Lien', data.undisclosedLien],
        ['Antique / Classic', data.antiqueClassic],
        ['Agricultural Vehicle', data.agriculturalVehicle],
        ['Reissued VIN', data.reissuedVIN],
      ],
    },
    {
      title: 'Safety and Defect',
      items: [
        ['Manufacturer Buy Back', data.manufacturerBuyBack],
        ['Salvage / Stolen', data.salvageStolen],
        ['Crushed', data.crushed],
        ['Inoperable Vehicle', data.inoperableVehicle],
        ['Hazardous', data.hazardous],
        ['Export Only Vehicle', data.exportOnlyVehicle],
        ['Odometer Tampering', data.odometerTampering],
        ['Gray Market', data.grayMarket],
      ],
    },
    {
      title: 'Odometer and Discrepancy',
      items: [
        ['Odometer Exceeds Limits', data.odometerExceedsLimits],
        ['Odometer Altered', data.odometerAltered],
        ['Odometer Replaced', data.odometerReplaced],
        ['Odometer Discrepancy', data.odometerDiscrepancy],
        ['Pending Junk', data.pendingJunk],
        ['Junk Automobile', data.junkAutomobile],
      ],
    },
  ];

  const safetyGroups: Array<{ title: string; items: Array<[string, 'Equipped' | 'Not Equipped']> }> = [
    {
      title: 'Safety Features',
      items: [
        ['Front Airbags', data.frontAirbags],
        ['Side Airbags', data.sideAirbags],
        ['Side Curtain Airbags', data.sideCurtainAirbags],
        ['ABS', data.abs],
        ['Braking Assist', data.brakingAssist],
        ['Electronic Brakeforce Distribution', data.electronicBrakeforceDistribution],
        ['Active Head Restraints', data.activeHeadRestraints],
        ['Child Safety Door Locks', data.childSafetyDoorLocks],
        ['Child Seat Anchors', data.childSeatAnchors],
        ['Crumple Zones', data.crumpleZones],
        ['Emergency Interior Trunk Release', data.emergencyInteriorTrunkRelease],
      ],
    },
    {
      title: 'Security Features',
      items: [
        ['Hill Holder Control', data.hillHolderControl],
        ['Stability Control', data.stabilityControl],
        ['Traction Control', data.tractionControl],
        ['Anti-Theft System', data.antiTheftSystem],
        ['Power Door Locks', data.powerDoorLocks],
        ['Front Seatbelts', data.frontSeatbelts],
        ['Rear Seatbelts', data.rearSeatbelts],
        ['Seatbelt Pretensioners', data.seatbeltPretensioners],
        ['Seatbelt Warning Sensor', data.seatbeltWarningSensor],
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-6">
      <div className="no-print mx-auto mb-5 flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/dashboard/report/${id}`)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">PDF Preview</div>
            <div className="truncate text-xs text-slate-500">{fileTitle}</div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:from-rose-600 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      <div
        ref={reportRef}
        data-pdf-root="true"
        className="pdf-document mx-auto overflow-hidden border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.10)]"
      >
        <div
          className="relative overflow-hidden border-b border-slate-200 px-5 py-6 text-white sm:px-8 sm:py-8"
          style={{ background: `linear-gradient(135deg, ${C} 0%, ${C}dd 100%)` }}
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 bg-black/10" />
          <div className="absolute right-20 top-8 h-20 w-20 bg-black/10" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center border border-white/30 bg-white shadow-lg shadow-black/10">
                {report.logo_url ? (
                  <img src={report.logo_url} alt="Logo" className="h-12 w-12 object-contain" />
                ) : (
                  <Car className="h-8 w-8" style={{ color: C }} />
                )}
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">Report ID</div>
                <div className="font-mono text-lg font-bold tracking-wide">CR-{report.id.slice(0, 6).toUpperCase()}</div>
              </div>
            </div>

            <div className="max-w-xl text-left md:text-right">
              <div className="mb-2 inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
                <CheckSquare className="h-3 w-3" />
                Official Vehicle History Audit Report
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">{vehicleTitle}</h1>
              <div className="mt-2 text-sm font-medium text-white/85">{report.brand?.name || 'Vehicle Inspector'} | {searchDate}</div>
            </div>
          </div>
        </div>

        <div className="grid pdf-grid-stats gap-px bg-slate-200">
          <StatCard label="Year / Model" icon={Calendar} color={C} value={report.year || '---'} />
          <StatCard label="Current Mileage" icon={Gauge} color={C} value={data.currentMileage} />
          <StatCard label="Market Value" icon={Tag} color={C} value={data.marketValue} />
          <StatCard label="Search Date" icon={Calendar} color={C} value={searchDate} />
          <StatCard label="Accidents" icon={AlertTriangle} color={C} value={data.accidentsCount} />
          <StatCard label="Problem Checks" icon={AlertCircle} color={C} value={data.problemChecksCount} />
        </div>

        <div className="space-y-8 p-5 sm:p-8">
          <section className="pdf-page">
            <SectionTitle icon={ClipboardList} title="Executive Summary" color={C} />
            <div className="grid pdf-grid-2 gap-4">
              <div className="pdf-card rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
                <InfoRow label="Vehicle" value={data.vehicleDisplay} />
                <InfoRow label="Plate Number" value={<span className="font-mono tracking-[0.08em]">{data.plateNumber}</span>} />
                <InfoRow label="Current Mileage" value={data.currentMileage} />
                <InfoRow label="Vehicle Class" value={data.vehicleClass} />
                <InfoRow label="Wheel Plan" value={data.wheelPlan} />
              </div>
              <div className="pdf-card rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
                <InfoRow label="Accidents" value={<StatusChip value={data.accidentsStatus} />} />
                <InfoRow label="Total Loss" value={<StatusChip value={data.totalLossStatus} />} />
                <InfoRow label="Recalls" value={<StatusChip value={data.recallsStatus} />} />
                <InfoRow label="Title Records" value={<StatusChip value={data.titleRecordsStatus} />} />
                <InfoRow label="Junk / Salvage" value={<StatusChip value={data.junkSalvageStatus} />} />
                <InfoRow label="Problem Checks" value={<StatusChip value={data.problemChecksStatus} />} />
              </div>
            </div>
          </section>

          <section className="pdf-page">
            <SectionTitle icon={Car} title="Vehicle Overview" color={C} />
            <div className="grid pdf-grid-4 gap-4">
              <FeatureLine label="Colour" value={data.colour} />
              <FeatureLine label="Engine" value={data.engine} />
              <FeatureLine label="Gear Box" value={data.gearbox} />
              <FeatureLine label="Fuel Type" value={data.fuelType} />
              <FeatureLine label="Max Torque" value={data.maxTorque} />
              <FeatureLine label="Top Speed" value={data.topSpeed} />
              <FeatureLine label="MOT Status" value={<StatusChip value={data.motStatus} />} />
              <FeatureLine label="Estimated Mileage" value={data.estimatedMileage} />
            </div>
          </section>

          <section className="pdf-page">
            <SectionTitle icon={Cog} title="Engine & Transmission Technical Details" color={C} />
            <div className="grid pdf-grid-2 gap-4">
              <FeatureLine label="Cylinders" value={data.cylinders} />
              <FeatureLine label="Cam Type" value={data.camType} />
              <FeatureLine label="Fuel Induction" value={data.fuelInduction} />
              <FeatureLine label="Fuel Type" value={data.fuelType} />
              <FeatureLine label="Valves" value={data.valves} />
              <FeatureLine label="Max Horsepower" value={data.maxHorsepower} />
              <FeatureLine label="Total Max Torque" value={data.totalMaxTorque} />
              <FeatureLine label="Transmission" value={data.transmissionEngine} />
            </div>
          </section>

          <section className="pdf-page">
            <SectionTitle icon={Fuel} title="Fuel Efficiency (EPA MPG Estimates)" color={C} />
            <div className="grid pdf-grid-2 gap-4">
              <FeatureLine label="Fuel Grade" value={data.fuelGrade} />
              <FeatureLine label="City Economy" value={data.cityEconomy} />
              <FeatureLine label="Highway Economy" value={data.highwayEconomy} />
              <FeatureLine label="Combined Economy" value={data.combinedEconomy} />
            </div>
          </section>

          <section className="pdf-page">
            <SectionTitle icon={Scale} title="Legal Checks" color={C} />
            <div className="grid pdf-grid-2 gap-4">
              <FeatureLine label="Financial & Legal Status" value={<StatusChip value={data.financialLegalStatus} />} />
              <FeatureLine label="Insurance Write-off" value={<StatusChip value={data.insuranceWriteoffStatus} />} />
              <FeatureLine label="Accident Records" value={<StatusChip value={data.accidentRecordsStatus} />} />
              <FeatureLine label="Theft / Stolen Markers" value={<StatusChip value={data.theftStolenStatus} />} />
            </div>
          </section>

          <section className="pdf-page">
            <SectionTitle icon={RotateCcw} title="MOT History" color={C} />
            <div className="space-y-6">
              {data.motHistory.map((record: MOTRecord, index: number) => (
                <div key={`${record.year}-${index}`} className="pdf-card rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="text-sm font-bold text-slate-900">Record {index + 1}</div>
                    <div className="inline-flex items-center border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
                      {record.result || 'Unknown'}
                    </div>
                  </div>
                  <div className="grid pdf-grid-5 gap-3">
                    <FeatureLine label="Year" value={record.year || '---'} />
                    <FeatureLine label="Date of Test" value={record.dateOfTest || '---'} />
                    <FeatureLine label="Expiry Date" value={record.expiryDate || '---'} />
                    <FeatureLine label="Mileage" value={record.mileage || '---'} />
                    <FeatureLine label="Test Number" value={record.testNumber || '---'} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pdf-page">
            <SectionTitle icon={FileText} title="Title Brand and Problem Checks" color={C} />
            <div className="grid pdf-grid-2 gap-6">
              {titleGroups.map((group) => (
                <GroupCard key={group.title} title={group.title} items={group.items} />
              ))}
            </div>
          </section>

          <section className="pdf-page">
            <SectionTitle icon={ShieldCheck} title="Safety and Security" color={C} />
            <div className="grid pdf-grid-2 gap-6">
              {safetyGroups.map((group) => (
                <div key={group.title} className="pdf-card rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">
                    <span className="h-2 w-2 flex-shrink-0 bg-[currentColor]" style={{ color: C }} />
                    {group.title}
                  </div>
                  <div className="grid pdf-grid-2 gap-4">
                    {group.items.map(([label, value]) => (
                      <FeatureLine key={label} label={label} value={<EquipChip value={value} />} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pdf-page">
            <SectionTitle icon={CheckSquare} title="Audit Summary" color={C} />
            <div className="grid pdf-grid-2 gap-6">
              <div className="pdf-card rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">
                  <Info size={14} color={C} />
                  Summary
                </div>
                <p className="text-sm leading-7 text-slate-600">{data.auditSummaryText}</p>
                <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  {data.marketValueSummary}
                </div>
              </div>
              <div className="pdf-card rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">
                  <AlertCircle size={14} color="#94a3b8" />
                  Disclaimer
                </div>
                <p className="text-sm leading-7 text-slate-500">{data.disclaimerText}</p>
                <div className="mt-4 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div>Email: {data.email}</div>
                  <div>Website: {data.website}</div>
                  <div className="mt-2 font-semibold">{data.securedBy}</div>
                </div>
              </div>
            </div>
          </section>

          <footer className="pdf-page pdf-card rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-6 sm:p-7">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold tracking-[0.08em] text-slate-900 uppercase">Vehicle Inspector Report</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  Generated for {report.brand?.name || 'Vehicle Inspector'} on {searchDate}
                </div>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{data.securedBy}</div>
            </div>
            <div className="mt-5 grid gap-4 text-xs text-slate-500 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="font-semibold uppercase tracking-[0.12em] text-slate-400">Email</div>
                <div className="mt-1 text-slate-700">{data.email}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="font-semibold uppercase tracking-[0.12em] text-slate-400">Website</div>
                <div className="mt-1 text-slate-700">{data.website}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="font-semibold uppercase tracking-[0.12em] text-slate-400">Report ID</div>
                <div className="mt-1 font-mono text-slate-700">CR-{report.id.slice(0, 6).toUpperCase()}</div>
              </div>
            </div>
          </footer>

          <div className="no-print flex items-center justify-end gap-3 pb-2">
            <button
              onClick={() => navigate(`/dashboard/report/${id}`)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back to Editor
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:from-rose-600 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
