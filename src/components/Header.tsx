import React, { useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import Tooltip from "./ui/Tooltip";

interface HeaderProps {
  mode: "runner" | "verifier";
  setMode: (mode: "runner" | "verifier") => void;
  onDownload: () => void;
  onImport: (json: any) => void;
  canExport: boolean;
  onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  onDownload,
  onImport,
  canExport,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImport(json);

        // Reset input so the same file can be uploaded again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Yarn Load Timer
      </h1>
      <p className="text-slate-400 mb-4">Speedrun load verification tool</p>

      <div className="flex items-center gap-4">
        {/* Mode Toggles */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode("runner")}
            onMouseDown={(e) => e.preventDefault()}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              mode === "runner"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Runner Mode
          </button>
          <button
            onClick={() => setMode("verifier")}
            onMouseDown={(e) => e.preventDefault()}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              mode === "verifier"
                ? "bg-purple-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Verifier Mode
          </button>
        </div>

        <div className="h-8 w-[1px] bg-slate-700 mx-2 hidden md:block" />

        {/* IMPORT BUTTON */}
        <div className="relative group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <Tooltip text="Load session from JSON">
            <button
              onClick={() => fileInputRef.current?.click()}
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition shadow-lg border border-slate-500"
            >
              <Upload size={18} />
              <span>Import</span>
            </button>
          </Tooltip>
        </div>

        {/* EXPORT BUTTON */}
        <div className="relative group">
          <Tooltip
            text={
              canExport
                ? "Export session to JSON"
                : "Must have a run start and end marked"
            }
          >
            <button
              onClick={onDownload}
              onMouseDown={(e) => e.preventDefault()}
              disabled={!canExport}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition shadow-lg active:transform active:scale-95 ${
                canExport
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed opacity-50"
              }`}
            >
              <Download size={18} />
              <span>Export/Save</span>
            </button>
          </Tooltip>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-red-900/40 text-slate-300 hover:text-red-400 rounded-lg transition-colors border border-slate-600"
          title="Clear all data"
        >
          <Trash2 size={18} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
