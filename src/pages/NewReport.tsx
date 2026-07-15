import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  Car,
  Upload,
  Palette,
  Package,
  FileText,
  Hash,
  Calendar,
  Gauge,
  MapPin,
} from 'lucide-react';
import type { Brand, ReportType, PackageType } from '../types';

export function NewReport() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form fields
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [brandColor, setBrandColor] = useState('#3B82F6');
  const [brandEmail, setBrandEmail] = useState('info@example.com');
  const [brandWebsite, setBrandWebsite] = useState('https://example.com/');
  const [reportType, setReportType] = useState<ReportType>('VIN');
  const [packageType, setPackageType] = useState<PackageType>('Standard');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Vehicle details
  const [vinNumber, setVinNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [marketValue, setMarketValue] = useState('');

  useEffect(() => {
    if (!authLoading) {
      fetchBrands();
    }
  }, [authLoading]);

  useEffect(() => {
    if (selectedBrand && brands.length > 0) {
      const brand = brands.find((b) => b.id === selectedBrand);
      if (brand) {
        setBrandColor(brand.default_color);
        setBrandEmail(brand.email || 'info@example.com');
        setBrandWebsite(brand.website || 'https://example.com/');
      }
    }
  }, [selectedBrand, brands]);

  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;

      const brandList: Brand[] = [...(data || [])];
      const hasAutoScanOra = brandList.some(
        (brand) => brand.name.toLowerCase() === 'autoscanora'
      );

      if (!hasAutoScanOra) {
        brandList.push({
          id: 'autoscanora',
          name: 'AutoScanOra',
          slug: 'autoscanora',
          default_color: '#2563EB',
          email: 'info@autoscanora.com',
          website: 'https://autoscanora.com/',
          created_at: new Date().toISOString(),
        });
      }

      setBrands(brandList);

      if (brandList.length > 0) {
        setSelectedBrand(brandList[0].id);
        setBrandColor(brandList[0].default_color);
        setBrandEmail(brandList[0].email || 'info@example.com');
        setBrandWebsite(brandList[0].website || 'https://example.com/');
      } else {
        setSelectedBrand('');
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
      setSelectedBrand('');
    } finally {
      setBrandsLoading(false);
    }
  };

  const uploadLogoFile = async (file: File) => {
    try {
      const filePath = `logos/${Date.now()}_${file.name}`;
      const bucket = 'brand-logos';
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return null;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data?.publicUrl || null;
    } catch (err) {
      console.error('Upload failed', err);
      return null;
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    if (!selectedBrand) {
      setErrorMessage('Please select a brand');
      return;
    }

    if (!make.trim() || !model.trim()) {
      setErrorMessage('Make and model are required');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage('You must be logged in');
        return;
      }

      const selectedBrandObj = brands.find((b) => b.id === selectedBrand);
      if (!selectedBrandObj) {
        setErrorMessage('Selected brand not found');
        return;
      }

      const isUuid = (value: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
      const resolvedBrandId = isUuid(selectedBrand)
        ? selectedBrand
        : brands.find((b) => isUuid(b.id))?.id || null;

      if (!resolvedBrandId) {
        setErrorMessage('No valid brand available for this report');
        return;
      }

      const brandName = selectedBrandObj?.name || 'Vehicle Inspector';

      // Create normal report
      const reportData = {
        securedBy: `Secured by ${brandName}`,
        tagline: 'One VIN. Complete History.',
        email: brandEmail,
        website: brandWebsite,
        marketValue: marketValue || '---',
        marketValueSummary: `Market value is estimated at ${marketValue || '---'} with a Clear / Valid MOT.`,
      };

      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          brand_id: resolvedBrandId,
          report_type: reportType,
          package_type: packageType,
          vin_number: reportType === 'VIN' ? vinNumber : null,
          plate_number: reportType === 'Plate' ? plateNumber : null,
          make,
          model,
          year: year ? parseInt(year) : null,
          mileage: mileage ? parseInt(mileage) : null,
          brand_color: brandColor,
          logo_url: logoUrl || null,
          report_data: reportData,
          vehicle_name: make && model ? `${make} ${model}` : null,
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        console.error('Report creation error:', error);
        throw new Error(error.message || 'Failed to create report');
      }
      navigate(`/dashboard/report/${data.id}`);
    } catch (error) {
      console.error('Error creating report:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create report';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Report</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Create a new inspection report with dynamic branding
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Brand Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-500" />
            Brand Selection
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brand Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                disabled={brandsLoading || brands.length === 0}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  {brandsLoading
                    ? 'Loading brands...'
                    : brands.length === 0
                      ? 'No brands available'
                      : 'Select a brand'}
                </option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Palette className="w-4 h-4 inline mr-1" />
                Brand Color
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-full sm:w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-200 dark:border-slate-600 shrink-0"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-full min-w-0 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white uppercase"
                />
              </div>
            </div>
          </div>

          {/* Brand Contact Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Brand Email
              </label>
              <input
                type="email"
                value={brandEmail}
                onChange={(e) => setBrandEmail(e.target.value)}
                placeholder="info@example.com"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Brand Website
              </label>
              <input
                type="url"
                value={brandWebsite}
                onChange={(e) => setBrandWebsite(e.target.value)}
                placeholder="https://example.com/"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              Brand Logo (Optional)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">
                  {logoFile ? logoFile.name : 'Click to upload logo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {logoUrl && (
                <div className="w-full sm:w-16 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Configuration */}
        <>
          {/* Report Type & Package */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Report Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Report Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['VIN', 'Plate'] as ReportType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setReportType(type)}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        reportType === type
                          ? 'text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                      style={reportType === type ? { backgroundColor: brandColor } : undefined}
                    >
                      {type} Report
                    </button>
                  ))}
                </div>
              </div>

              {/* Package Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Package Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['Basic', 'Standard', 'Premium'] as PackageType[]).map((pkg) => (
                    <button
                      key={pkg}
                      onClick={() => setPackageType(pkg)}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        packageType === pkg
                          ? 'text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                      style={packageType === pkg ? { backgroundColor: brandColor } : undefined}
                    >
                      {pkg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              Vehicle Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportType === 'VIN' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    VIN Number
                  </label>
                  <input
                    type="text"
                    value={vinNumber}
                    onChange={(e) => setVinNumber(e.target.value)}
                    placeholder="Enter VIN number"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Plate Number
                  </label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="Enter plate number"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Make
                </label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="e.g., Toyota"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., Camry"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g., 2023"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Gauge className="w-4 h-4 inline mr-1" />
                  Mileage
                </label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g., 50000"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Market Value
                </label>
                <input
                  type="text"
                  value={marketValue}
                  onChange={(e) => setMarketValue(e.target.value)}
                  placeholder="e.g., £12,500"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={loading || !selectedBrand || !make.trim() || !model.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4 text-sm sm:text-base text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl"
          style={{ backgroundColor: brandColor }}
        >
          {loading ? (
            'Creating...'
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
