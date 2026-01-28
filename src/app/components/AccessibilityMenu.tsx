import { useState, useEffect } from 'react';
import { Settings, Type, Eye, Palette, Zap, Monitor, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  fontFamily: 'default' | 'dyslexic' | 'mono';
  highContrast: boolean;
  reduceMotion: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'medium',
  fontFamily: 'default',
  highContrast: false,
  reduceMotion: false,
  colorBlindMode: 'none',
};

const STORAGE_KEY = 'accessibility_preferences';

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) {
        console.error('Failed to parse accessibility settings:', e);
      }
    }
  }, []);

  // Apply settings to document
  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    root.setAttribute('data-font-size', newSettings.fontSize);
    
    // Font family
    root.setAttribute('data-font-family', newSettings.fontFamily);
    
    // High contrast
    if (newSettings.highContrast) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }
    
    // Reduce motion
    if (newSettings.reduceMotion) {
      root.setAttribute('data-reduce-motion', 'true');
    } else {
      root.removeAttribute('data-reduce-motion');
    }
    
    // Color blind mode
    root.setAttribute('data-color-blind-mode', newSettings.colorBlindMode);
  };

  // Update a specific setting
  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Floating Accessibility Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center border border-primary-foreground/20"
        aria-label="Open accessibility settings menu. Press Alt plus A to open anytime."
        title="Accessibility Settings (Alt+A)"
      >
        <Settings className="w-6 h-6" aria-hidden="true" />
        <span className="sr-only">Accessibility Settings</span>
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsOpen(false)}
        >
          <Card
            className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="accessibility-title"
            aria-modal="true"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="accessibility-title" className="text-lg font-semibold uppercase tracking-tight">
                    Accessibility Settings
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Customize your experience
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center transition-colors"
                  aria-label="Close accessibility settings"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Settings Content */}
            <div className="p-4 sm:p-6 space-y-6">
              
              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Label className="text-sm font-semibold uppercase tracking-wide">Font Size</Label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['small', 'medium', 'large', 'x-large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateSetting('fontSize', size)}
                      className={`px-3 py-2 border text-xs uppercase tracking-wide transition-all ${
                        settings.fontSize === size
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                      aria-pressed={settings.fontSize === size}
                    >
                      {size === 'x-large' ? 'X-Large' : size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Label className="text-sm font-semibold uppercase tracking-wide">Font Style</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => updateSetting('fontFamily', 'default')}
                    className={`px-3 py-2 border text-xs uppercase tracking-wide transition-all ${
                      settings.fontFamily === 'default'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                    aria-pressed={settings.fontFamily === 'default'}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => updateSetting('fontFamily', 'dyslexic')}
                    className={`px-3 py-2 border text-xs uppercase tracking-wide transition-all ${
                      settings.fontFamily === 'dyslexic'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                    aria-pressed={settings.fontFamily === 'dyslexic'}
                  >
                    Dyslexia-Friendly
                  </button>
                  <button
                    onClick={() => updateSetting('fontFamily', 'mono')}
                    className={`px-3 py-2 border text-xs uppercase tracking-wide transition-all font-mono ${
                      settings.fontFamily === 'mono'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                    aria-pressed={settings.fontFamily === 'mono'}
                  >
                    Monospace
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Dyslexia-friendly font improves readability for users with dyslexia
                </p>
              </div>

              {/* Color Blind Mode */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Label className="text-sm font-semibold uppercase tracking-wide">Color Vision</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { value: 'none', label: 'Normal Vision' },
                    { value: 'protanopia', label: 'Protanopia (Red-Blind)' },
                    { value: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
                    { value: 'tritanopia', label: 'Tritanopia (Blue-Blind)' },
                    { value: 'monochrome', label: 'Monochrome' },
                  ] as const).map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => updateSetting('colorBlindMode', mode.value)}
                      className={`px-3 py-2 border text-xs uppercase tracking-wide transition-all text-left ${
                        settings.colorBlindMode === mode.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                      aria-pressed={settings.colorBlindMode === mode.value}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Adjusts colors to improve visibility for different types of color blindness
                </p>
              </div>

              {/* High Contrast */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Label className="text-sm font-semibold uppercase tracking-wide">High Contrast Mode</Label>
                  </div>
                  <button
                    onClick={() => updateSetting('highContrast', !settings.highContrast)}
                    className={`relative inline-flex h-6 w-11 items-center border-2 transition-colors ${
                      settings.highContrast
                        ? 'bg-primary border-primary'
                        : 'bg-muted border-border'
                    }`}
                    role="switch"
                    aria-checked={settings.highContrast}
                    aria-label="Toggle high contrast mode"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform bg-white transition-transform ${
                        settings.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Increases contrast between text and background for better readability
                </p>
              </div>

              {/* Reduce Motion */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Label className="text-sm font-semibold uppercase tracking-wide">Reduce Motion</Label>
                  </div>
                  <button
                    onClick={() => updateSetting('reduceMotion', !settings.reduceMotion)}
                    className={`relative inline-flex h-6 w-11 items-center border-2 transition-colors ${
                      settings.reduceMotion
                        ? 'bg-primary border-primary'
                        : 'bg-muted border-border'
                    }`}
                    role="switch"
                    aria-checked={settings.reduceMotion}
                    aria-label="Toggle reduce motion"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform bg-white transition-transform ${
                        settings.reduceMotion ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Minimizes animations and transitions to prevent motion sensitivity issues
                </p>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={resetSettings}
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Monitor className="w-4 h-4 mr-2" aria-hidden="true" />
                  Reset to Default Settings
                </Button>
              </div>

              {/* Keyboard Shortcuts Info */}
              <div className="p-3 bg-muted/30 border border-border">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2">Keyboard Navigation</p>
                <ul className="text-xs text-muted-foreground font-mono space-y-1">
                  <li>• <kbd className="px-1 py-0.5 bg-background border border-border">Tab</kbd> - Navigate between elements</li>
                  <li>• <kbd className="px-1 py-0.5 bg-background border border-border">Enter</kbd> / <kbd className="px-1 py-0.5 bg-background border border-border">Space</kbd> - Activate buttons</li>
                  <li>• <kbd className="px-1 py-0.5 bg-background border border-border">Esc</kbd> - Close dialogs</li>
                  <li>• <kbd className="px-1 py-0.5 bg-background border border-border">Alt</kbd> + <kbd className="px-1 py-0.5 bg-background border border-border">A</kbd> - Open accessibility menu</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}