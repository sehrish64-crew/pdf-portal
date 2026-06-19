import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  PlusCircle,
  TrendingUp,
  Car,
  Calendar,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import type { Report, Brand } from '../types';

interface DashboardStats {
  totalReports: number;
  thisMonth: number;
  draftReports: number;
  completedReports: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<(Report & { brand?: Brand })[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    thisMonth: 0,
    draftReports: 0,
    completedReports: 0,
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch brands
      const { data: brandsData } = await supabase.from('brands').select('*').order('name');
      setBrands(brandsData || []);

      // Fetch reports with brand info
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*, brand:brands(*)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentReports(reportsData || []);

      // Fetch all reports for stats
      const { data: allReports } = await supabase.from('reports').select('status, created_at');
      if (allReports) {
        const now = new Date();
        const thisMonthCount = allReports.filter((r) => {
          const date = new Date(r.created_at);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;

        setStats({
          totalReports: allReports.length,
          thisMonth: thisMonthCount,
          draftReports: allReports.filter((r) => r.status === 'draft').length,
          completedReports: allReports.filter((r) => r.status === 'completed').length,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'This Month',
      value: stats.thisMonth,
      icon: Calendar,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Draft',
      value: stats.draftReports,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Completed',
      value: stats.completedReports,
      icon: TrendingUp,
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back! Manage your vehicle inspection reports.
          </p>
        </div>
        <Link
          to="/dashboard/new-report"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Create New Report
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bgColor }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${bgColor}`}>
                <Icon className={`w-6 h-6 bg-gradient-to-r ${color} bg-clip-text`} style={{ color: color.includes('blue') ? '#3b82f6' : color.includes('emerald') ? '#10b981' : color.includes('amber') ? '#f59e0b' : '#8b5cf6' }} />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent Reports</h2>
            <Link
              to="/dashboard/reports"
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {recentReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No reports yet</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Create your first inspection report
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: report.brand_color + '20' }}
                    >
                      <Car className="w-6 h-6" style={{ color: report.brand_color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {report.vehicle_name || report.make || 'Unknown Vehicle'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {report.vin_number || report.plate_number || 'No ID'} •{' '}
                        {report.brand?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          report.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}
                      >
                        {report.status === 'completed' ? 'Completed' : 'Draft'}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Brands Sidebar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-900 dark:text-white">Available Brands</h2>
          </div>
          <div className="p-4 space-y-2">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: brand.default_color + '20' }}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: brand.default_color }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
