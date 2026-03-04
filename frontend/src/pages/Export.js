import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import apiClient from '@/utils/api';
import Navigation from '@/components/Navigation';
import { toast } from 'sonner';
import { Download, FileText, Database } from 'lucide-react';

const Export = () => {
  const [exporting, setExporting] = useState(false);

  const downloadCSV = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadJSON = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportSessions = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get('/export/sessions');
      downloadCSV(response.data.filename, response.data.content);
      toast.success('Sessions exported successfully');
    } catch (error) {
      toast.error('Failed to export sessions');
    } finally {
      setExporting(false);
    }
  };

  const exportStats = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get('/export/stats');
      const filename = `studymax_stats_${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(filename, response.data);
      toast.success('Statistics exported successfully');
    } catch (error) {
      toast.error('Failed to export statistics');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <Download className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter" data-testid="export-title">
            EXPORT DATA
          </h1>
        </div>

        <div className="stat-card p-8 rounded-sm mb-6">
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Download your study data for backup, analysis, or personal records. All exports include your complete session history and performance metrics.
          </p>
        </div>

        {/* Export Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sessions CSV */}
          <div className="stat-card p-8 rounded-sm hover:bg-zinc-800/60 transition-colors duration-100">
            <FileText className="h-12 w-12 text-primary mb-4" strokeWidth={1.5} />
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-3">SESSION HISTORY</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Export all completed sessions with timestamps, phases, and notes in CSV format.
            </p>
            <Button
              onClick={exportSessions}
              disabled={exporting}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-none uppercase tracking-widest font-semibold py-4 border-0 transition-colors duration-100"
              data-testid="export-sessions-btn"
            >
              <Download className="mr-2 h-4 w-4" />
              EXPORT CSV
            </Button>
          </div>

          {/* Stats JSON */}
          <div className="stat-card p-8 rounded-sm hover:bg-zinc-800/60 transition-colors duration-100">
            <Database className="h-12 w-12 text-primary mb-4" strokeWidth={1.5} />
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-3">STATISTICS</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Export complete statistics including discipline score, streaks, badges, and daily performance in JSON format.
            </p>
            <Button
              onClick={exportStats}
              disabled={exporting}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-none uppercase tracking-widest font-semibold py-4 border-0 transition-colors duration-100"
              data-testid="export-stats-btn"
            >
              <Download className="mr-2 h-4 w-4" />
              EXPORT JSON
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 stat-card p-6 rounded-sm">
          <h3 className="font-heading text-lg uppercase tracking-wider font-semibold mb-3">FILE FORMATS</h3>
          <div className="space-y-2 text-sm">
            <p className="text-zinc-400">
              <strong className="text-zinc-300">CSV:</strong> Compatible with Excel, Google Sheets, and data analysis tools.
            </p>
            <p className="text-zinc-400">
              <strong className="text-zinc-300">JSON:</strong> Complete data structure for developers and advanced users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Export;
