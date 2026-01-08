import React from "react";
import { Trash2 } from "lucide-react";
import { Load } from "../types";

interface LoadListProps {
  loads: Load[];
  currentLoadIndex: number;
  mode: "runner" | "verifier";
  overlappingLoadIndices: Set<number>;
  invalidDurationIndices: Set<number>;
  outsideRunIndices: Set<number>;
  onAddLoad: () => void;
  onDeleteLoad: (index: number) => void;
  onJumpToTime: (time: number, index: number) => void;
  onSelectLoad: (index: number) => void;
  isAutoLoadSelecting: boolean;
  onAutoSelectLoad: () => void;
}

const LoadList: React.FC<LoadListProps> = ({
  loads,
  currentLoadIndex,
  mode,
  overlappingLoadIndices,
  invalidDurationIndices,
  outsideRunIndices,
  onAddLoad,
  onDeleteLoad,
  onJumpToTime,
  onSelectLoad,
  isAutoLoadSelecting,
  onAutoSelectLoad,
}) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 lg:col-span-1 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Marked Loads</h2>
        {mode === "runner" && (
          <div className="flex items-center gap-4">
            {/* Pill Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative group">
                <div className="flex items-center gap-2 cursor-help">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Auto
                  </span>
                  <button
                    onClick={onAutoSelectLoad}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      isAutoLoadSelecting ? "bg-green-500" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        isAutoLoadSelecting ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                
                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 z-50 w-max max-w-xs border border-slate-700 shadow-xl pointer-events-none">
                  Auto-advance to next load on completion.
                </div>
              </div>
            </div>

            <button
              onClick={onAddLoad}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm font-semibold text-white"
            >
              + Add Load
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {loads.map((load, index) => {
          const isOverlapping = overlappingLoadIndices.has(index);
          const isInvalidDuration = invalidDurationIndices.has(index);
          const isOutsideRun = outsideRunIndices.has(index);
          const hasError = isOverlapping || isInvalidDuration || isOutsideRun;
          const isSelected = currentLoadIndex === index;

          return (
            <div
              key={load.id}
              onClick={() => onSelectLoad(index)}
              className={`p-3 rounded-lg transition cursor-pointer border-2 mx-1 ${
                isSelected
                  ? hasError
                    ? "bg-red-900/40 border-red-500 shadow-lg shadow-red-500/20"
                    : "bg-blue-900/40 border-blue-500 shadow-lg shadow-blue-500/20"
                  : hasError
                    ? "bg-red-900/20 border-red-900/50"
                    : "bg-slate-700/50 hover:bg-slate-700 border-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-semibold text-sm text-white shrink-0">
                  Load #{index + 1}
                </span>

                <div className="flex flex-row-reverse flex-wrap gap-1 items-center max-w-[75%]">
                  {mode === "runner" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLoad(index);
                      }}
                      className="text-slate-400 hover:text-red-400 transition p-1 ml-1 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {/* Error badges */}
                  {isOutsideRun && (
                    <span className="px-1.5 py-0.5 rounded bg-yellow-900/50 text-yellow-400 text-[10px] border border-yellow-500/50 whitespace-nowrap">
                      Outside Run
                    </span>
                  )}
                  {isInvalidDuration && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-900/50 text-orange-400 text-[10px] border border-orange-500/50 whitespace-nowrap">
                      Invalid Duration
                    </span>
                  )}
                  {isOverlapping && (
                    <span className="px-1.5 py-0.5 rounded bg-red-900/50 text-red-400 text-[10px] border border-red-500/50 whitespace-nowrap">
                      Overlapping
                    </span>
                  )}
                </div>
              </div>

              {/* Start and End Times */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400 text-xs font-medium">
                    Start:
                  </span>
                  {load.startTime !== null ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToTime(load.startTime!, index);
                      }}
                      className="text-blue-400 hover:underline font-mono text-xs"
                    >
                      {load.startTime.toFixed(3)}s
                    </button>
                  ) : (
                    <span className="text-slate-600 italic text-xs">--</span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400 text-xs font-medium">
                    End:
                  </span>
                  {load.endTime !== null ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToTime(load.endTime!, index);
                      }}
                      className="text-blue-400 hover:underline font-mono text-xs"
                    >
                      {load.endTime.toFixed(3)}s
                    </button>
                  ) : (
                    <span className="text-slate-600 italic text-xs">--</span>
                  )}
                </div>
              </div>

              {/* Duration */}
              {load.startTime !== null && load.endTime !== null && (
                <div className="mt-2 pt-2 border-t border-slate-600/30 flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Duration
                  </span>
                  <span className="text-xs font-mono text-yellow-500/90">
                    {(load.endTime - load.startTime).toFixed(3)}s
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LoadList;
