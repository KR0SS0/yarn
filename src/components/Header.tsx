import React from "react";

interface HeaderProps {
  mode: "runner" | "verifier";
  setMode: (mode: "runner" | "verifier") => void;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode }) => {
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
      </div>
    </div>
  );
};

export default Header;
