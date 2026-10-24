import React, { useState, useEffect } from 'react';
import {
  Database,
  UploadCloud,
  FileCheck,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Layers,
  CheckCircle2,
  XCircle,
  Info,
  Check
} from 'lucide-react';
import { DataSource, ImportSummaryResponse } from '../types';
import { api } from '../services/api';

export const DataSourcesView: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetType, setDatasetType] = useState<'rainfall' | 'geojson'>('rainfall');
  const [uploading, setUploading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportSummaryResponse | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoading(true);
        const res = await api.getDataSources();
        setSources(res);
      } catch (err) {
        console.error('Failed to load data sources:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSources();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setImportResult(null);

      let res: ImportSummaryResponse;
      if (datasetType === 'geojson' || selectedFile.name.endsWith('.geojson') || selectedFile.name.endsWith('.json')) {
        res = await api.importGeoJSON(selectedFile);
      } else {
        res = await api.importCSV(selectedFile, 'rainfall');
      }

      setImportResult(res);
    } catch (err: any) {
      console.error('Upload validation error:', err);
      setImportResult({
        import_id: 'err_client',
        filename: selectedFile.name,
        file_type: datasetType,
        total_records: 0,
        accepted_records: 0,
        rejected_records: 1,
        status: 'failed',
        errors: [{ row: 0, field: 'upload', value: null, message: err.message || 'File processing failed' }]
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-soft space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Data Sources, Reliability &amp; File Ingestion</h2>
            <p className="text-xs text-slate-500">
              Transparent provenance of all rainfall observations, river gauging stations, and historical flood incident records
            </p>
          </div>
        </div>
      </div>

      {/* Dataset Provenance Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>Cataloged Sources &amp; Providers</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Source agencies, geographic coverage, observation units, and known limitations
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {sources.length} sources registered
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Dataset Name</th>
                <th className="py-2.5 px-3">Provider Agency</th>
                <th className="py-2.5 px-3">Data Status</th>
                <th className="py-2.5 px-3">Coverage &amp; Range</th>
                <th className="py-2.5 px-3">Units &amp; Cadence</th>
                <th className="py-2.5 px-3">Limitations</th>
                <th className="py-2.5 px-3">Source URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <div>{s.name}</div>
                    <div className="text-[10px] font-mono text-teal-800">{s.id}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {s.provider}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === 'Live' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      s.status === 'Historical' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                      'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-[11px]">
                    <div>{s.coverage}</div>
                    <div className="text-[10px] font-mono text-slate-400">{s.date_range}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 text-[11px]">
                    <div>{s.units}</div>
                    <div className="text-[10px] text-slate-500">{s.update_frequency}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                    {s.limitations}
                  </td>
                  <td className="py-3 px-3">
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:text-teal-800 flex items-center gap-1 font-medium text-[11px]"
                    >
                      <span>Agency</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Import Workflow & Validation Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-teal-700" />
              <span>Import Community Datasets</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload local CSV rainfall observations or GeoJSON drainage boundary polygons for validation.
            </p>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Choose Dataset Type
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDatasetType('rainfall')}
                  className={`p-2.5 rounded-xl border font-semibold text-center transition-all ${
                    datasetType === 'rainfall'
                      ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Rainfall CSV
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetType('geojson')}
                  className={`p-2.5 rounded-xl border font-semibold text-center transition-all ${
                    datasetType === 'geojson'
                      ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  GeoJSON Polygons
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="cursor-pointer block">
                <span className="text-xs text-teal-700 hover:text-teal-800 font-semibold block">
                  Click to choose a file from your computer
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Supported: .csv (rainfall observations) or .geojson (FeatureCollection)
                </span>
                <input
                  type="file"
                  accept=".csv,.geojson,.json"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <div className="mt-3 p-2.5 bg-white rounded-xl text-xs font-mono text-slate-800 border border-slate-200 flex items-center justify-between shadow-xs">
                  <span className="truncate max-w-[200px] font-semibold">{selectedFile.name}</span>
                  <span className="text-slate-500 text-[11px]">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validating File Records...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Validate and Ingest Dataset</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Validation Report & Rules (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Validation Result Box */}
          {importResult && (
            <div className={`p-4 rounded-2xl border space-y-3 text-xs ${
              importResult.status === 'completed'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : importResult.status === 'partially_valid'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {importResult.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <h4 className="font-bold text-sm">
                    Validation Status: {importResult.status.toUpperCase()}
                  </h4>
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  ID: {importResult.import_id}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs">
                <div>Total Records: <strong className="text-slate-900">{importResult.total_records}</strong></div>
                <div>Accepted: <strong className="text-emerald-700">{importResult.accepted_records}</strong></div>
                <div>Rejected: <strong className="text-rose-700">{importResult.rejected_records}</strong></div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-700">
                    Validation Error Details:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] text-rose-800">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-rose-100">
                        Row {err.row} [{err.field}]: {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Guidelines */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Automated File Integrity Standards</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-teal-800 block">Rainfall CSV Requirements</span>
                <p>&bull; Required: `location_id`, `timestamp`, `rainfall_mm`</p>
                <p>&bull; Known location check in database</p>
                <p>&bull; Numeric range check: 0.0 to 1500.0 mm</p>
                <p>&bull; Duplicate observation protection</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-teal-800 block">GeoJSON Requirements</span>
                <p>&bull; Root element: `FeatureCollection`</p>
                <p>&bull; Coords: Lat [-90, +90], Lon [-180, +180]</p>
                <p>&bull; Closed polygon ring check (&ge;4 points)</p>
                <p>&bull; Max file upload size: 5MB</p>
              </div>
            </div>
          </div>

          {/* Meteorological Benchmark */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600" />
              <span>IMD Standard 24-Hour Rainfall Intensity Scale</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-sky-800 font-bold block">Light</span>
                <span className="text-slate-600 font-mono text-[11px]">2.5 – 15.5 mm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-teal-800 font-bold block">Moderate</span>
                <span className="text-slate-600 font-mono text-[11px]">15.6 – 64.4 mm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-amber-800 font-bold block">Heavy</span>
                <span className="text-slate-600 font-mono text-[11px]">64.5 – 115.5 mm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-rose-800 font-bold block">Very Heavy+</span>
                <span className="text-slate-600 font-mono text-[11px]">&gt; 115.5 mm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
