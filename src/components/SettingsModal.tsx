import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FilePlus2,
} from 'lucide-react';
import { CookieRecipe, PantryItem } from '../types/bakery';
import {
  createBackupPayload,
  getStorageByteSize,
} from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: CookieRecipe[];
  pantry: PantryItem[];
  lastSavedIso: string | null;
  onClearAllAndRestoreDefaults: () => void;
  onClearAllToBlankSlate: () => void;
  onImportBackup: (pantry: PantryItem[], recipes: CookieRecipe[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  recipes,
  pantry,
  lastSavedIso,
  onClearAllAndRestoreDefaults,
  onClearAllToBlankSlate,
  onImportBackup,
}) => {
  const [confirmMode, setConfirmMode] = useState<'none' | 'defaults' | 'blank'>(
    'none'
  );
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const storageSize = getStorageByteSize();
  const formattedLastSaved = lastSavedIso
    ? new Date(lastSavedIso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Just now';

  const handleExportJson = () => {
    const payload = createBackupPayload(pantry, recipes);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookiecalc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (
          !parsed ||
          !Array.isArray(parsed.pantry) ||
          !Array.isArray(parsed.recipes) ||
          parsed.recipes.length === 0
        ) {
          setImportError(
            'Invalid backup file. Must contain valid "pantry" and "recipes" arrays.'
          );
          return;
        }
        onImportBackup(parsed.pantry, parsed.recipes);
        onClose();
      } catch {
        setImportError('Could not parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#332D27] bg-[#181614] pb-safe shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        {/* Mobile Bottom Sheet Pill Indicator */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[#36302A]" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2520] px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="text-base font-bold text-[#F5F2EB]"
              >
                Application Settings & Local Data
              </h2>
              <p className="text-xs text-[#9E9589]">
                100% Standalone Browser Storage • Zero External Servers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9E9589] transition hover:bg-[#24201C] hover:text-[#F5F2EB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {/* LocalStorage Status Card */}
          <div className="rounded-xl border border-emerald-500/30 bg-[#131F19] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <HardDrive className="h-4 w-4 text-emerald-400" />
                <span>Browser localStorage Auto-Save Active</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-xs text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> {storageSize} used
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#A6B8AE]">
              Your customized ingredients, bulk prices, and created cookie recipes are automatically saved to this browser and preserved across page reloads.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-emerald-500/20 pt-2.5 text-center font-mono text-xs">
              <div>
                <div className="text-[#8CA396]">Saved Recipes</div>
                <div className="font-bold text-[#F5F2EB]">{recipes.length}</div>
              </div>
              <div>
                <div className="text-[#8CA396]">Supply Book Items</div>
                <div className="font-bold text-[#F5F2EB]">{pantry.length}</div>
              </div>
              <div>
                <div className="text-[#8CA396]">Last Synced</div>
                <div className="font-bold text-emerald-300">{formattedLastSaved}</div>
              </div>
            </div>
          </div>

          {/* Export / Import Standalone JSON Backup */}
          <div className="rounded-xl border border-[#2E2924] bg-[#141210] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#D5CFC2]">
              Standalone Backup File (.JSON)
            </div>
            <p className="mt-1 text-xs text-[#8C8275]">
              Download a copy of your recipes and ingredient prices to your computer or restore from a file.
            </p>
            {importError && (
              <div className="mt-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
                {importError}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#332D27] bg-[#181614] px-3.5 py-2 text-xs font-semibold text-[#F5F2EB] transition hover:border-amber-500/50"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                <span>Download Backup (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#332D27] bg-[#181614] px-3.5 py-2 text-xs font-semibold text-[#F5F2EB] transition hover:border-amber-500/50"
              >
                <Upload className="h-3.5 w-3.5 text-amber-400" />
                <span>Import Backup (.json)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Clear All Data / Reset Cache Section */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/15 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-300">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Clear Local Browser Cache & Reset</span>
            </div>
            <p className="mt-1 text-xs text-[#B89E9E]">
              Wipe all saved data from your browser’s <code className="font-mono text-rose-200">localStorage</code> cache to start fresh.
            </p>

            {confirmMode === 'none' ? (
              <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setConfirmMode('defaults')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear All Data (Restore Defaults)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmMode('blank')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#3A2828] bg-[#181212] px-3.5 py-2.5 text-xs font-semibold text-[#D5B8B8] transition hover:border-rose-500/40 hover:text-rose-200"
                >
                  <FilePlus2 className="h-3.5 w-3.5" />
                  <span>Wipe All Recipes (Blank Slate)</span>
                </button>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-rose-500/50 bg-[#1F1214] p-3">
                <p className="text-xs font-semibold text-rose-200">
                  {confirmMode === 'defaults'
                    ? 'Are you sure? This will wipe your local browser cache and reset all recipes & ingredient prices to factory defaults.'
                    : 'Are you sure? This will wipe all saved recipes and start with 1 empty recipe.'}
                </p>
                <div className="mt-2.5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmMode('none')}
                    className="rounded-lg px-3 py-1.5 text-xs text-[#A69C8E] hover:text-[#F5F2EB]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmMode === 'defaults') {
                        onClearAllAndRestoreDefaults();
                      } else {
                        onClearAllToBlankSlate();
                      }
                      setConfirmMode('none');
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Yes, Clear All Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#2A2520] bg-[#141210] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-semibold text-[#0F0E0C] transition hover:bg-amber-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
