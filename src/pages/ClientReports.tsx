import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Search,
  PlusCircle,
  Eye,
  Edit3,
  Download,
  Trash2,
  X,
  AlertCircle,
  FileText,
  Calendar,
  Car,
  Filter,
} from 'lucide-react';
import type { Report, Brand } from '../types';

export function ClientReports() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<(Report & { brand?: Brand })[]>([]);
  const [filteredReports, setFilteredReports] = useState<(Report & { brand?: Brand })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewReport, setViewReport] = useState<Report & { brand?: Brand } | null>(null);

  useEffect(() => {
    fetchReports();
    fetchBrands();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchQuery, brandFilter, reports]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, brand:brands(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
      setFilteredReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    const { data } = await supabase.from('brands').select('*').order('name');
    setBrands(data || []);
  };

  const filterReports = () => {
    let filtered = reports;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.vin_number?.toLowerCase().includes(q) ||
          r.plate_number?.toLowerCase().includes(q) ||
          r.vehicle_name?.toLowerCase().includes(q) ||
          r.brand?.name.toLowerCase().includes(q) ||
          r.make?.toLowerCase().includes(q) ||
          r.model?.toLowerCase().includes(q) ||
          r.report_data?.plateNumber?.toLowerCase().includes(q)
      );
    }

    if (brandFilter) {
      filtered = filtered.filter((r) => r.brand_id === brandFilter);
    }

    setFilteredReports(filtered);
  };

  const handleDelete = async (reportId: string) => {
    try {
      const { error } = await supabase.from('reports').delete().eq('id', reportId);
      if (error) throw error;
      setReports(reports.filter((r) => r.id !== reportId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Client Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and search all vehicle inspection reports
          </p>
        </div>
        <Link
          to="/dashboard/new-report"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          New Report
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by VIN, Plate, Vehicle, or Brand..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="pl-12 pr-10 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery || brandFilter ? 'No reports found matching your search' : 'No reports yet'}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Create your first inspection report to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {['Date', 'Brand', 'Vehicle', 'VIN / Plate', 'Package', 'Report Type', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: report.brand_color + '20' }}
                        >
                          <Car className="w-4 h-4" style={{ color: report.brand_color }} />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {report.brand?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {report.report_data?.vehicleDisplay || `${report.make || ''} ${report.model || ''}`.trim() || '---'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {report.year} {report.mileage ? `• ${report.mileage.toLocaleString()} mi` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-600 dark:text-slate-300">
                        {report.vin_number || report.plate_number || report.report_data?.plateNumber || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full text-white"
                        style={{ backgroundColor: report.brand_color }}
                      >
                        {report.package_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {report.report_type} Report
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          report.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}
                      >
                        {report.status === 'completed' ? 'Completed' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewReport(report)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/report/${report.id}`)}
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/report/${report.id}?export=1`)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Download PDF (open editor)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(report.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Report</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete this report? All data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {viewReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Report Summary</h3>
              <button onClick={() => setViewReport(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Header */}
              <div className="rounded-xl p-4 text-white" style={{ backgroundColor: viewReport.brand_color }}>
                <div className="flex items-center gap-3 mb-2">
                  {viewReport.logo_url && (
                    <img src={viewReport.logo_url} alt="Logo" className="h-8 w-auto bg-white rounded p-0.5 object-contain" />
                  )}
                  <span className="font-bold text-lg">{viewReport.brand?.name}</span>
                </div>
                <p className="text-2xl font-black">{viewReport.report_data?.vehicleDisplay}</p>
                <p className="font-mono mt-1 opacity-80">{viewReport.report_data?.plateNumber}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Accidents', val: viewReport.report_data?.accidentsCount ?? 0 },
                  { label: 'Recalls', val: viewReport.report_data?.recallsCount ?? 0 },
                  { label: 'Total Loss', val: viewReport.report_data?.totalLossCount ?? 0 },
                ].map(({ label, val }) => (
                  <div key={label} className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{val}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Report Type', `${viewReport.report_type} Report`],
                  ['Package', viewReport.package_type],
                  ['Market Value', viewReport.report_data?.marketValue || '---'],
                  ['Mileage', viewReport.report_data?.currentMileage || '---'],
                  ['MOT Status', viewReport.report_data?.motStatus || '---'],
                  ['Financial Status', viewReport.report_data?.financialLegalStatus || '---'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{val}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 text-center">
                Created {new Date(viewReport.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewReport(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { navigate(`/dashboard/report/${viewReport.id}`); setViewReport(null); }}
                className="flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-colors"
                style={{ backgroundColor: viewReport.brand_color }}
              >
                Open Editor & Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
