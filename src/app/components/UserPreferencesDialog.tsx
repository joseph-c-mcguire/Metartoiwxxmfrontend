import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Settings, Loader2, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { IcaoAutocomplete } from './IcaoAutocomplete';

interface UserPreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onPreferencesSaved?: () => void;
}

type IWXXMVersion = '2025-2' | '2023-1';
type ValidationLevel = 'basic' | 'schema' | 'schematron' | 'icao_opmet' | 'comprehensive';

interface UserPreferences {
  displayName: string;
  email: string;
  bulletinIdExample: string;
  issuingCenter: string;
  iwxxmVersion: IWXXMVersion;
  validateOutput: boolean;
  validationLevel: ValidationLevel;
  stopOnError: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: '',
  email: '',
  bulletinIdExample: 'SAAA00',
  issuingCenter: 'KWBC',
  iwxxmVersion: '2025-2',
  validateOutput: true,
  validationLevel: 'comprehensive',
  stopOnError: false,
};

const STORAGE_KEY = 'metar_converter_preferences';

export function UserPreferencesDialog({ isOpen, onClose, userEmail, onPreferencesSaved }: UserPreferencesDialogProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
          email: userEmail,
          displayName: parsed.displayName || userEmail.split('@')[0],
        });
      } catch (error) {
        console.error('Load preferences error:', error);
        setPreferences({
          ...DEFAULT_PREFERENCES,
          email: userEmail,
          displayName: userEmail.split('@')[0],
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, userEmail]);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    if (!preferences) {
      return;
    }
    setPreferences({ ...preferences, [key]: value });
  };

  const handleSave = () => {
    if (!preferences) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setSaveStatus('success');
      toast.success('Preferences saved successfully');
      onPreferencesSaved?.();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save preferences error:', error);
      setSaveStatus('error');
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('Reset preferences to defaults?')) {
      return;
    }

    const resetPrefs = {
      ...DEFAULT_PREFERENCES,
      email: userEmail,
      displayName: userEmail.split('@')[0],
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetPrefs));
    setPreferences(resetPrefs);
    toast.success('Preferences reset to defaults');
    onPreferencesSaved?.();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-dialog-title"
    >
      <Card
        className="bg-white dark:bg-gray-800 dark:border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
            <h2 id="preferences-dialog-title" className="text-2xl font-semibold text-gray-900 dark:text-white">
              User Preferences
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isLoading || isSaving}
            className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            aria-label="Reset preferences to defaults"
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            Reset to Defaults
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" aria-hidden="true" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading preferences...</span>
          </div>
        ) : preferences ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Account Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display-name" className="dark:text-white">Display Name</Label>
                  <Input
                    id="display-name"
                    value={preferences.displayName}
                    onChange={(event) => updatePreference('displayName', event.target.value)}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="dark:text-white">Email</Label>
                  <Input
                    id="email"
                    value={preferences.email}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Conversion Defaults</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulletin-id" className="dark:text-white">Bulletin ID</Label>
                  <Input
                    id="bulletin-id"
                    value={preferences.bulletinIdExample}
                    onChange={(event) => updatePreference('bulletinIdExample', event.target.value.toUpperCase().slice(0, 6))}
                    placeholder="SAAA00"
                    maxLength={6}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <div>
                  <IcaoAutocomplete
                    label="Issuing Center (ICAO)"
                    id="issuing-center"
                    value={preferences.issuingCenter}
                    onChange={(value) => updatePreference('issuingCenter', value)}
                    placeholder="KWBC"
                    maxLength={4}
                    helperText="4-letter ICAO code"
                  />
                </div>
                <div>
                  <Label htmlFor="iwxxm-version" className="dark:text-white">IWXXM Version</Label>
                  <select
                    id="iwxxm-version"
                    value={preferences.iwxxmVersion}
                    onChange={(event) => updatePreference('iwxxmVersion', event.target.value as IWXXMVersion)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="2025-2">2025-2</option>
                    <option value="2023-1">2023-1</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="validation-level" className="dark:text-white">Validation Level</Label>
                  <select
                    id="validation-level"
                    value={preferences.validationLevel}
                    onChange={(event) => updatePreference('validationLevel', event.target.value as ValidationLevel)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="basic">Basic</option>
                    <option value="schema">Schema</option>
                    <option value="schematron">Schematron</option>
                    <option value="icao_opmet">ICAO OPMET</option>
                    <option value="comprehensive">Comprehensive</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="validate-output"
                    type="checkbox"
                    checked={preferences.validateOutput}
                    onChange={(event) => updatePreference('validateOutput', event.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <Label htmlFor="validate-output" className="dark:text-white">Validate output</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="stop-on-error"
                    type="checkbox"
                    checked={preferences.stopOnError}
                    onChange={(event) => updatePreference('stopOnError', event.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <Label htmlFor="stop-on-error" className="dark:text-white">Stop on first error</Label>
                </div>
              </div>
            </div>

            {saveStatus === 'success' && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                <p className="text-sm text-green-700 dark:text-green-300">Preferences saved successfully!</p>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                <p className="text-sm text-red-700 dark:text-red-300">Failed to save preferences. Please try again.</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
                className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
