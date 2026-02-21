import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, X, Download, Copy, FileText, Loader2, Database, Settings, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { ThemeToggle } from './ThemeToggle';
import { DatabaseUploadDialog } from './DatabaseUploadDialog';
import { UserPreferencesDialog } from './UserPreferencesDialog';
import { IcaoAutocomplete } from './IcaoAutocomplete';
import { projectId } from '/utils/supabase/info';
import {
  convertMetarToIwxxm as convertMetarToIwxxmApi,
  ConversionApiError,
} from '@/utils/api';

interface ConvertedFile {
  id: string;
  originalName: string;
  originalContent: string;
  convertedContent: string;
  timestamp: number;
}

interface PendingFile {
  id: string;
  name: string;
  content: string;
  file?: File;
}

interface FileConverterProps {
  onLogout: () => void;
  userEmail: string;
  accessToken?: string;
  onSwitchToAdmin?: () => void;
}

type IWXXMVersion = "2.1" | "3.0" | "2023-1";
type OnErrorBehavior = "skip" | "fail" | "warn";
type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface ConversionParams {
  bulletinId: string;
  issuingCenter: string;
  iwxxmVersion: IWXXMVersion;
  strictValidation: boolean;
  includeNilReasons: boolean;
  onError: OnErrorBehavior;
  logLevel: LogLevel;
}

export function FileConverter({ onLogout, userEmail, accessToken, onSwitchToAdmin }: FileConverterProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isPreferencesDialogOpen, setIsPreferencesDialogOpen] = useState(false);
  const [isParamsExpanded, setIsParamsExpanded] = useState(false);
  const [conversionParams, setConversionParams] = useState<ConversionParams>({
    bulletinId: '',
    issuingCenter: '',
    iwxxmVersion: '3.0',
    strictValidation: true,
    includeNilReasons: true,
    onError: 'warn',
    logLevel: 'INFO',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check admin access and switch to admin view
  const handleAdminAccess = async () => {
    if (!onSwitchToAdmin) return;

    try {
      // Verify admin status with backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2e3cda33/admin/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        // User has admin access
        onSwitchToAdmin();
      } else if (response.status === 403) {
        // User is authenticated but not an admin
        toast.error('Sorry, you don\'t have permissions for that.', {
          description: 'Admin access is required to view the dashboard.'
        });
      } else {
        // Other error
        toast.error('Unable to verify admin access');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Failed to verify admin permissions');
    }
  };

  // Load user preferences on mount from localStorage
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem('metar_converter_preferences');
        if (stored) {
          const prefs = JSON.parse(stored);
          setConversionParams({
            bulletinId: prefs.bulletinIdExample || 'SAAA00',
            issuingCenter: prefs.issuingCenter || 'KWBC',
            iwxxmVersion: prefs.iwxxmVersion || '3.0',
            strictValidation: prefs.strictValidation ?? true,
            includeNilReasons: prefs.includeNilReasons ?? true,
            onError: prefs.onError || 'warn',
            logLevel: prefs.logLevel || 'INFO',
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  const handlePreferencesSaved = () => {
    // Reload preferences after saving in the dialog
    try {
      const stored = localStorage.getItem('metar_converter_preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        setConversionParams({
          bulletinId: prefs.bulletinIdExample || 'SAAA00',
          issuingCenter: prefs.issuingCenter || 'KWBC',
          iwxxmVersion: prefs.iwxxmVersion || '3.0',
          strictValidation: prefs.strictValidation ?? true,
          includeNilReasons: prefs.includeNilReasons ?? true,
          onError: prefs.onError || 'warn',
          logLevel: prefs.logLevel || 'INFO',
        });
        toast.info('Conversion parameters updated from preferences');
      }
    } catch (error) {
      console.error('Error reloading preferences:', error);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPendingFiles: PendingFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await file.text();
        newPendingFiles.push({
          id: `${file.name}-${Date.now()}-${i}`,
          name: file.name,
          content: content,
          file,
        });
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
        toast.error(`Failed to read ${file.name}`);
      }
    }
    
    setPendingFiles(prev => [...prev, ...newPendingFiles]);
    toast.success(`${newPendingFiles.length} file(s) added to queue`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConvert = async () => {
    if (pendingFiles.length === 0 && !manualInput.trim()) {
      toast.error('Please add files or enter manual input');
      return;
    }

    setIsConverting(true);
    
    try {
      const queuedFiles = pendingFiles
        .map((pendingFile) => pendingFile.file)
        .filter((file): file is File => Boolean(file));

      const response = await convertMetarToIwxxmApi({
        manualText: manualInput,
        files: queuedFiles,
        iwxxmVersion: conversionParams.iwxxmVersion,
        validateOutput: conversionParams.strictValidation,
        accessToken,
      });

      const sourceContentLookup = new Map<string, string>();
      pendingFiles.forEach((pendingFile) => {
        sourceContentLookup.set(pendingFile.name, pendingFile.content);
      });
      if (manualInput.trim()) {
        sourceContentLookup.set('manual_text', manualInput);
      }

      const newConvertedFiles: ConvertedFile[] = response.results.map((result, index) => {
        const sourceName = result.source || result.name || `converted_${index + 1}.xml`;
        return {
          id: `converted-${Date.now()}-${index}`,
          originalName: sourceName,
          originalContent: sourceContentLookup.get(sourceName) || '',
          convertedContent: result.content,
          timestamp: Date.now(),
        };
      });

      setConvertedFiles((prev) => [...newConvertedFiles, ...prev]);
      setPendingFiles([]);
      setManualInput('');

      if (response.issues && response.issues.length > 0) {
        const warningCount = response.issues.filter((issue) => issue.severity === 'warning').length;
        const errorCount = response.issues.filter((issue) => issue.severity === 'error').length;
        if (errorCount > 0) {
          toast.error(`Conversion completed with ${errorCount} error issue(s)`);
        } else if (warningCount > 0) {
          toast.warning(`Conversion completed with ${warningCount} warning(s)`);
        }
      }

      toast.success(`Successfully converted ${response.successful} file(s)`);
    } catch (error) {
      if (error instanceof ConversionApiError) {
        const detailMessage = error.errors?.[0] || error.message;
        toast.error('Backend conversion failed', {
          description: detailMessage,
        });
      } else {
        toast.error('Unable to reach backend conversion API', {
          description: error instanceof Error ? error.message : 'Unknown conversion error',
        });
      }
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadSingle = (file: ConvertedFile) => {
    const blob = new Blob([file.convertedContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.originalName.replace(/\.(txt|metar)$/i, '.xml');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  const handleDownloadAll = async () => {
    if (convertedFiles.length === 0) return;

    const zip = new JSZip();
    
    convertedFiles.forEach(file => {
      const filename = file.originalName.replace(/\.(txt|metar)$/i, '.xml');
      zip.file(filename, file.convertedContent);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_files_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('All files downloaded as ZIP');
  };

  const handleCopy = (content: string) => {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content)
        .then(() => {
          toast.success('Copied to clipboard');
        })
        .catch(() => {
          // Fallback to older method
          fallbackCopy(content);
        });
    } else {
      // Fallback for browsers without clipboard API
      fallbackCopy(content);
    }
  };

  const fallbackCopy = (content: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        toast.success('Copied to clipboard');
      } else {
        toast.error('Failed to copy. Please copy manually.');
      }
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeConvertedFile = (id: string) => {
    setConvertedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClear = () => {
    setPendingFiles([]);
    setManualInput('');
    toast.info('Queue cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">METAR → IWXXM Converter</h1>
            <div className="flex items-center gap-3">
              {onSwitchToAdmin && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  <select
                    value="converter"
                    onChange={(e) => {
                      if (e.target.value === 'admin') {
                        handleAdminAccess();
                      }
                    }}
                    className="px-3 py-1.5 text-sm font-medium bg-purple-600 text-white border-0 rounded-md hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                    aria-label="Switch view"
                  >
                    <option value="converter" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">File Converter</option>
                    <option value="admin" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">Admin Dashboard</option>
                  </select>
                </div>
              )}
              <Button
                onClick={() => setIsPreferencesDialogOpen(true)}
                variant="outline"
                size="sm"
                className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500"
                aria-label="Open user preferences"
              >
                <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
                Preferences
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
                <ThemeToggle />
              </div>
              <Button 
                variant="outline" 
                className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 border-0"
                aria-label="Logout from application"
                onClick={onLogout}
              >
                Logout
              </Button>
            </div>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-300">
            Drag & drop one or more METAR TAC files, or type a METAR manually below. Click Convert to produce IWXXM XML (downloadable as XML).
          </p>
        </div>

        {/* Drop Zone */}
        <Card
          className={`mb-6 p-12 border-2 border-dashed transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950' 
              : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          aria-label="File drop zone - Drop files here or click to select files"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" aria-hidden="true" />
            <p className="text-lg mb-2 text-gray-900 dark:text-white">Drop files here or click to select</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Supports multiple files</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.metar"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              aria-label="Select METAR files to upload"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Browse and select files"
            >
              Select Files
            </Button>
          </div>
        </Card>

        {/* Manual Input */}
        <div className="mb-6">
          <label htmlFor="manual-input" className="block mb-2 text-base font-medium text-gray-900 dark:text-white">
            Manual METAR Input
          </label>
          <Textarea
            id="manual-input"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="SPECI BGSF 282350Z 10RMF50MT 9999 SCT110 BKN130 0RN130 NN7/N11 Q1021"
            className="min-h-[120px] text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
            aria-label="Enter METAR data manually"
          />
        </div>

        {/* Conversion Parameters */}
        <Card className="mb-6 p-6 bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Conversion Parameters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsParamsExpanded(!isParamsExpanded)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
              aria-label={isParamsExpanded ? 'Collapse parameters' : 'Expand parameters'}
            >
              {isParamsExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              )}
            </Button>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isParamsExpanded ? '' : 'hidden'}`}>
            {/* Bulletin ID */}
            <div>
              <Label htmlFor="param-bulletin-id" className="dark:text-white mb-2">Bulletin ID</Label>
              <Input
                id="param-bulletin-id"
                value={conversionParams.bulletinId}
                onChange={(e) => setConversionParams(prev => ({ ...prev, bulletinId: e.target.value.toUpperCase() }))}
                placeholder="SAAA00"
                maxLength={6}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format: 4 letters + 2 digits
              </p>
            </div>

            {/* Issuing Center */}
            <IcaoAutocomplete
              label="Issuing Center (ICAO)"
              id="param-issuing-center"
              value={conversionParams.issuingCenter}
              onChange={(value) => setConversionParams(prev => ({ ...prev, issuingCenter: value }))}
              placeholder="KWBC"
              maxLength={4}
              helperText="4-letter ICAO code"
            />

            {/* IWXXM Version */}
            <div>
              <Label htmlFor="param-iwxxm-version" className="dark:text-white mb-2">IWXXM Version</Label>
              <select
                id="param-iwxxm-version"
                value={conversionParams.iwxxmVersion}
                onChange={(e) => setConversionParams(prev => ({ ...prev, iwxxmVersion: e.target.value as IWXXMVersion }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="2.1">2.1</option>
                <option value="3.0">3.0 (Default)</option>
                <option value="2023-1">2023-1</option>
              </select>
            </div>

            {/* On Error */}
            <div>
              <Label htmlFor="param-on-error" className="dark:text-white mb-2">On Error Behavior</Label>
              <select
                id="param-on-error"
                value={conversionParams.onError}
                onChange={(e) => setConversionParams(prev => ({ ...prev, onError: e.target.value as OnErrorBehavior }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="skip">Skip - Continue, skip invalid</option>
                <option value="fail">Fail - Stop on first error</option>
                <option value="warn">Warn - Continue with warnings</option>
              </select>
            </div>

            {/* Log Level */}
            <div>
              <Label htmlFor="param-log-level" className="dark:text-white mb-2">Log Level</Label>
              <select
                id="param-log-level"
                value={conversionParams.logLevel}
                onChange={(e) => setConversionParams(prev => ({ ...prev, logLevel: e.target.value as LogLevel }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO (Default)</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            {/* Validation Options */}
            <div className="flex flex-col gap-3">
              <Label className="dark:text-white">Validation Options</Label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={conversionParams.strictValidation}
                  onChange={(e) => setConversionParams(prev => ({ ...prev, strictValidation: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Strict Validation
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={conversionParams.includeNilReasons}
                  onChange={(e) => setConversionParams(prev => ({ ...prev, includeNilReasons: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Include Nil Reasons
                </span>
              </label>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 bg-[rgba(0,0,0,0)]">
          <Button
            onClick={handleConvert}
            disabled={isConverting || (pendingFiles.length === 0 && !manualInput.trim())}
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-base disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={isConverting ? 'Converting files, please wait' : 'Convert METAR files to IWXXM XML'}
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Converting...
              </>
            ) : (
              'Convert'
            )}
          </Button>
          <Button
            onClick={() => setIsUploadDialogOpen(true)}
            disabled={convertedFiles.length === 0}
            variant="outline"
            className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-base disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label={`Upload ${convertedFiles.length} converted files to database`}
          >
            <Database className="w-4 h-4 mr-2" aria-hidden="true" />
            Upload to Database {convertedFiles.length > 0 && `(${convertedFiles.length})`}
          </Button>
          <Button
            onClick={handleDownloadAll}
            disabled={convertedFiles.length === 0}
            variant="outline"
            className="bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-base disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label={`Download all ${convertedFiles.length} converted files as ZIP`}
          >
            Download ZIP {convertedFiles.length > 0 && `(${convertedFiles.length})`}
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-base focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Clear all pending files and manual input"
          >
            Clear
          </Button>
        </div>

        {/* Pending Files */}
        {pendingFiles.length > 0 && (
          <div className="mb-8" role="region" aria-label="Pending files queue">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Pending Files</h2>
            <div className="space-y-2">
              {pendingFiles.map((file) => (
                <Card key={file.id} className="p-4 bg-white dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                      <div>
                        <p className="text-base font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {file.content.split('\n').length} line(s)
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePendingFile(file.id)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-red-500"
                      aria-label={`Remove ${file.name} from queue`}
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {convertedFiles.length > 0 && (
          <div role="region" aria-label="Conversion results">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Results</h2>
            <div className="space-y-4">
              {convertedFiles.map((file) => (
                <Card key={file.id} className="p-4 bg-white dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <p className="text-base font-medium text-gray-900 dark:text-white">{file.originalName}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSingle(file)}
                        className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm border-0 focus:ring-2 focus:ring-blue-500"
                        aria-label={`Download ${file.originalName} as XML`}
                      >
                        <Download className="w-4 h-4 mr-1" aria-hidden="true" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(file.convertedContent)}
                        className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm border-0 focus:ring-2 focus:ring-blue-500"
                        aria-label={`Copy ${file.originalName} content to clipboard`}
                      >
                        <Copy className="w-4 h-4 mr-1" aria-hidden="true" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConvertedFile(file.id)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-red-500"
                        aria-label={`Remove ${file.originalName} from results`}
                      >
                        <X className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <div 
                    className="bg-gray-900 dark:bg-gray-950 text-green-400 dark:text-green-300 p-4 rounded text-sm overflow-x-auto"
                    role="region"
                    aria-label={`Converted XML content for ${file.originalName}`}
                  >
                    <pre className="whitespace-pre-wrap break-all font-mono">
                      {file.convertedContent}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Conversion powered by GIFS library Outputs.java raw IWXXM XML serialized to .txt for convenience.
          </p>
        </div>
      </div>

      {/* Database Upload Dialog */}
      <DatabaseUploadDialog
        convertedFiles={convertedFiles}
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        accessToken={accessToken}
      />

      {/* User Preferences Dialog */}
      <UserPreferencesDialog
        isOpen={isPreferencesDialogOpen}
        onClose={() => setIsPreferencesDialogOpen(false)}
        userEmail={userEmail}
        onPreferencesSaved={handlePreferencesSaved}
      />
    </div>
  );
}