import React from "react";
import { Download } from "lucide-react";

interface HeaderProps {
  mode: "runner" | "verifier";
  setMode: (mode: "runner" | "verifier") => void;
  onDownload: () => void;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode, onDownload }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Yarn Load Timer
      </h1>
      <p className="text-slate-400 mb-4">Speedrun load verification tool</p>

      <div className="flex gap-4">
        <button
          onClick={() => setMode("runner")}
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
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            mode === "verifier"
              ? "bg-purple-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Verifier Mode
        </button>
        <div className="h-8 w-[1px] bg-slate-700 mx-2 hidden md:block" />

        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition shadow-lg active:transform active:scale-95"
          title="Export session to JSON"
        >
          <Download size={18} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
