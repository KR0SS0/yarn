import React, { useRef, useState } from "react";
import { Download, Trash2, Upload, Share2, Loader2, History } from "lucide-react";
import Tooltip from "./ui/Tooltip";
import Logo from "./ui/Logo";

interface HeaderProps {
  mode: "runner" | "verifier";
  setMode: (mode: "runner" | "verifier") => void;
  onDownload: () => void;
  onShare: () => void;
  isSharing: boolean;
  backups: any[];
  onManualBackup: () => void;
  onImport: (json: any) => void;
  canExport: boolean;
  onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  onDownload,
  onShare,
  isSharing,
  backups,
  onManualBackup,
  onImport,
  canExport,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBackups, setShowBackups] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImport(json);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const getModeClass = (targetMode: "runner" | "verifier") => {
    const isActive = mode === targetMode;
    return `h-10 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
      isActive
        ? "bg-blue-600 text-white ring-2 ring-white ring-offset-2 ring-offset-slate-800 shadow-lg"
        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
    }`;
  };

  // Base class for all action buttons to ensure identical height/padding
  const actionBtnBase =
    "h-10 px-4 flex items-center gap-2 rounded-lg font-semibold transition-all shadow-lg active:transform active:scale-95 border-none";

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 text-blue-400 shrink-0">
          <Logo className="w-9 h-9 shrink-0" />
        </div>
        <h1 className="text-3xl font-bold text-blue-400 leading-none tracking-tight">
          Yarn
        </h1>
      </div>
      <p className="text-slate-400 mb-6">Speedrun load verification tool</p>

      {/* Main Action Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* GROUP 1: MODES */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode("runner")}
            className={getModeClass("runner")}
          >
            Runner
          </button>
          <button
            onClick={() => setMode("verifier")}
            className={getModeClass("verifier")}
          >
            Verifier
          </button>
        </div>

        <div className="h-8 w-[1px] bg-slate-700 mx-1" />

        {/* GROUP 2: CLOUD & BACKUPS */}
        <div className="flex gap-2">
          <Tooltip
            text={
              canExport ? "Generate shareable cloud link" : "Need run start/end"
            }
          >
            <button
              onClick={onShare}
              disabled={!canExport || isSharing}
              className={`${actionBtnBase} ${
                canExport
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-700 text-slate-500 opacity-50"
              }`}
            >
              {isSharing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Share2 size={18} />
              )}
              <span>Save to Link</span>
            </button>
          </Tooltip>

          <div className="relative">
            <Tooltip text="View auto-saved backups">
              <button
                onClick={() => setShowBackups(!showBackups)}
                className={`${actionBtnBase} bg-slate-700 hover:bg-slate-600 text-slate-300 ${showBackups ? "ring-1 ring-blue-400" : ""}`}
              >
                <History size={18} />
                <span>Backups</span>
              </button>
            </Tooltip>
            {showBackups && (
              <div className="absolute top-full mt-2 left-0 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="p-2 text-[10px] font-bold text-slate-500 uppercase bg-slate-800/50">
                  Recent Backups
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {backups.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 italic">
                      No backups yet...
                    </div>
                  ) : (
                    backups.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          onImport(b.data);
                          setShowBackups(false);
                        }}
                        className="w-full text-left p-3 hover:bg-blue-600/20 border-b border-slate-800 last:border-0"
                      >
                        <div className="text-xs font-mono text-blue-400">
                          {b.timestamp}
                        </div>
                        <div className="text-sm text-slate-200 line-clamp-1">
                          {b.label}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-8 w-[1px] bg-slate-700 mx-1" />

        {/* GROUP 3: LOCAL IO */}
        <div className="flex gap-2">
          <Tooltip text={canExport ? "Save to JSON" : "Need run start/end"}>
            <button
              onClick={onDownload}
              disabled={!canExport}
              className={`${actionBtnBase} ${
                canExport
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-700 text-slate-500 opacity-50"
              }`}
            >
              <Download size={18} />
              <span>Export</span>
            </button>
          </Tooltip>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <Tooltip text="Load from JSON">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`${actionBtnBase} bg-slate-700 hover:bg-slate-600 text-white`}
            >
              <Upload size={18} />
              <span>Import</span>
            </button>
          </Tooltip>
        </div>

        <div className="h-8 w-[1px] bg-slate-700 mx-1" />

        {/* GROUP 4: RESET */}
        <div className="flex">
          <Tooltip text="Permanently clear all data">
            <button
              onClick={onReset}
              className={`${actionBtnBase} bg-slate-700 hover:bg-red-600 hover:text-white text-slate-300`}
            >
              <Trash2 size={18} />
              <span>Reset</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Header;
