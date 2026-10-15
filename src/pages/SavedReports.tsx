import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Car, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { deleteLocalReport, getLocalReports } from '../lib/localReports';
import type { Report } from '../types';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function SavedReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>(getLocalReports);

  const handleDelete = (report: Report) => {
    const vehicleName = report.report_data?.vehicleDisplay || report.vehicle_name || `${report.make || ''} ${report.model || ''}`.trim();
    if (!window.confirm(`Delete the saved report for ${vehicleName || 'this vehicle'}?`)) return;

    deleteLocalReport(report.id);
    setReports(getLocalReports());
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saved Reports</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Reports are saved on this device and can be reopened for editing.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Report
        </Link>
      </header>

      {reports.length === 0 ? (
        <section className="flex flex-col items-center border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
          <FileText className="mb-3 h-9 w-9 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No saved reports yet</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Create a report and it will appear here for later editing.
          </p>
        </section>
      ) : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-700 dark:border-slate-700">
          {reports.map((report) => {
            const vehicleName = report.report_data?.vehicleDisplay || report.vehicle_name || `${report.make || ''} ${report.model || ''}`.trim() || 'Untitled vehicle';
            const identifier = report.report_type === 'VIN' ? report.vin_number : report.plate_number;

            return (
              <li key={report.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/report/${report.id}`)}
                  className="min-w-0 text-left"
                  aria-label={`Edit report for ${vehicleName}`}
                >
                  <span className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                    <Car className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate">{vehicleName}</span>
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{report.brand?.name || 'Vehicle Inspector'} · {report.package_type}</span>
                    {identifier && <span>{report.report_type}: {identifier}</span>}
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Updated {formatDate(report.updated_at || report.created_at)}
                    </span>
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    report.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  }`}>
                    {report.status === 'completed' ? 'Completed' : 'Draft'}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/report/${report.id}`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(report)}
                    aria-label={`Delete report for ${vehicleName}`}
                    title="Delete report"
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}