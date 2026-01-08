import React from "react";
import { Trash2, Flag } from "lucide-react";
import { TimingItem } from "../types";
import { getItemValidationStatus } from "../utils/Validation";
import { framesToHMSMs, secondsToFrames } from "../utils/Timing";
import Badge from "./ui/WarningBadge";

interface TimingListProps {
  items: TimingItem[];
  currentIndex: number;
  mode: "runner" | "verifier";
  onAddLoad: () => void;
  onDeleteItem: (id: string) => void;
  onJumpToTime: (time: number, id: string) => void;
  onSelectItem: (id: string) => void;
  overlappingLoadIndices: Set<number>;
  invalidDurationIndices: Set<number>;
  outsideRunIndices: Set<number>;
  isAutoLoadSelecting: boolean;
  onAutoSelectLoad: () => void;
  fps: number;
}

const TimingList: React.FC<TimingListProps> = ({
  items,
  currentIndex,
  mode,
  onAddLoad,
  onDeleteItem,
  onJumpToTime,
  onSelectItem,
  overlappingLoadIndices,
  invalidDurationIndices,
  outsideRunIndices,
  isAutoLoadSelecting,
  onAutoSelectLoad,
  fps,
}) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 lg:col-span-1 border border-slate-700 flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-xl font-bold text-white">Timing Markers</h2>
        {mode === "runner" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                Auto
              </span>
              <button
                onClick={onAutoSelectLoad}
                onMouseDown={(e) => e.preventDefault()}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${isAutoLoadSelecting ? "bg-green-500" : "bg-slate-600"}`}
              >
                <span
                  className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${isAutoLoadSelecting ? "translate-x-4" : "translate-x-1"}`}
                />
              </button>
            </div>
            <button
              onClick={onAddLoad}
              onMouseDown={(e) => e.preventDefault()}
              className="px-3 py-1.5 bg-blue-600 rounded-md hover:bg-blue-700 transition text-xs font-semibold text-white shadow-lg shadow-blue-900/20"
            >
              + Add
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-slate-600">
        {items.map((item, index) => {
          const isSelected = currentIndex === index;
          const status = getItemValidationStatus(
            item,
            overlappingLoadIndices,
            invalidDurationIndices,
            outsideRunIndices
          );

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`p-3 rounded-lg transition cursor-pointer border-2 mx-1 ${
                isSelected
                  ? status.hasError
                    ? "bg-red-900/40 border-red-500"
                    : item.type === "run"
                      ? "bg-green-900/20 border-green-500"
                      : "bg-blue-900/40 border-blue-500"
                  : status.hasError
                    ? "bg-red-900/20 border-red-900/50"
                    : "bg-slate-700/50 hover:bg-slate-700 border-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-semibold text-sm flex items-center text-white">
                  {item.type === "run" ? (
                    <div className="flex items-center gap-2">
                      <Flag size={14} className="text-purple-400" />
                      <span>{item.label}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span>Load</span>
                      <span>&nbsp;#{item.loadIndex! + 1}</span>
                    </div>
                  )}
                </span>
                <div className="flex flex-row-reverse flex-wrap gap-1 items-center max-w-[50%]">
                  {mode === "runner" && item.isDeletable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {status.isOutsideRun && <Badge type="outside-run" />}
                  {status.isOverlapping && <Badge type="overlap" />}
                  {status.isInvalidDuration && (
                    <Badge type="invalid-duration" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <TimeAction
                  label="Start"
                  time={item.startTime}
                  fps={fps}
                  onClick={() => onJumpToTime(item.startTime!, item.id)}
                />
                <TimeAction
                  label="End"
                  time={item.endTime}
                  fps={fps}
                  onClick={() => onJumpToTime(item.endTime!, item.id)}
                />
                <div className="flex flex-col">
                  <span className="text-slate-500 uppercase font-bold text-[9px]">
                    Duration
                  </span>
                  <span
                    className={`font-mono mt-0.5 ${item.startTime !== null && item.endTime !== null ? "text-yellow-500/90" : "text-slate-600"}`}
                  >
                    {item.startTime !== null && item.endTime !== null
                      ? framesToHMSMs(
                          secondsToFrames(item.endTime - item.startTime, fps),
                          fps
                        ).smart
                      : "--"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimeAction: React.FC<{
  label: string;
  time: number | null;
  fps: number;
  onClick: () => void;
}> = ({ label, time, fps, onClick }) => (
  <div className="flex flex-col">
    <span className="text-slate-500 uppercase font-bold text-[9px]">
      {label}
    </span>
    {time !== null ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseDown={(e) => e.preventDefault()}
        className="text-blue-400 hover:text-blue-300 text-left font-mono underline decoration-blue-400/30 underline-offset-2 mt-0.5 transition-colors"
      >
        {framesToHMSMs(secondsToFrames(time, fps), fps).smart}
      </button>
    ) : (
      <span className="text-slate-600 italic mt-0.5">--</span>
    )}
  </div>
);

export default TimingList;
