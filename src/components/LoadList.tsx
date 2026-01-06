import React from "react";
import { Trash2 } from "lucide-react";
import { Load } from "../types";

interface LoadListProps {
  loads: Load[];
  currentLoadIndex: number;
  mode: "runner" | "verifier";
  onAddLoad: () => void;
  onDeleteLoad: (index: number) => void;
  onJumpToTime: (time: number, index: number) => void;
  onSelectLoad: (index: number) => void;
}

const LoadList: React.FC<LoadListProps> = ({
  loads,
  currentLoadIndex,
  mode,
  onAddLoad,
  onDeleteLoad,
  onJumpToTime,
  onSelectLoad,
}) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 lg:col-span-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Marked Loads</h2>
        {mode === "runner" && (
          <button
            onClick={onAddLoad}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            + Add Load
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {loads.map((load, index) => (
          <div
            key={load.id}
            onClick={() => onSelectLoad(index)}
            className={`p-3 rounded-lg transition cursor-pointer ${
              currentLoadIndex === index
                ? "bg-blue-900 ring-2 ring-blue-500"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm">Load #{index + 1}</span>
              {mode === "runner" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLoad(index);
                  }}
                  className="text-red-400 hover:text-red-300 transition"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-400">Start:</span>
                {load.startTime !== null ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpToTime(load.startTime!, index);
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    {load.startTime.toFixed(3)}s
                  </button>
                ) : (
                  <span className="text-slate-500">Not set</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400">End:</span>
                {load.endTime !== null ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpToTime(load.endTime!, index);
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    {load.endTime.toFixed(3)}s
                  </button>
                ) : (
                  <span className="text-slate-500">Not set</span>
                )}
              </div>
              {load.startTime !== null && load.endTime !== null && (
                <div className="text-yellow-400 text-sm mt-1">
                  Duration: {(load.endTime - load.startTime).toFixed(3)}s
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadList;
