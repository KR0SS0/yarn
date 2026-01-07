import React from "react";
import RunTiming from "./RunTiming";
import { RunMarker, Load } from "../types";

interface VideoPlayerProps {
  playerRef: React.RefObject<HTMLDivElement | null>;
  mode: "runner" | "verifier";
  fps: number;
  runStart: RunMarker;
  setRunStart: (marker: RunMarker) => void;
  runEnd: RunMarker;
  setRunEnd: (marker: RunMarker) => void;
  runTimingOpen: boolean;
  setRunTimingOpen: (open: boolean) => void;
  onMarkRunStart: () => void;
  onMarkRunEnd: () => void;
  onMarkLoadStart: () => void;
  onMarkLoadEnd: () => void;
  onJumpToTime: (time: number) => void;
  currentLoadIndex: number;
  loads: Load[];
  overlappingLoadIndices: Set<number>;
  invalidDurationIndices: Set<number>;
  outsideRunIndices: Set<number>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playerRef,
  mode,
  fps,
  runStart,
  setRunStart,
  runEnd,
  setRunEnd,
  runTimingOpen,
  setRunTimingOpen,
  onMarkRunStart,
  onMarkRunEnd,
  onMarkLoadStart,
  onMarkLoadEnd,
  onJumpToTime,
  currentLoadIndex,
  loads,
  overlappingLoadIndices,
  invalidDurationIndices,
  outsideRunIndices,
}) => {
  const runTimingSet = runStart.time !== null && runEnd.time !== null;
  const activeLoad = loads[currentLoadIndex];

  // Validation status for current load
  const isOverlapping = overlappingLoadIndices.has(currentLoadIndex);
  const isInvalidDuration = invalidDurationIndices.has(currentLoadIndex);
  const isOutsideRun = outsideRunIndices.has(currentLoadIndex);

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 lg:col-span-2 flex flex-col">
      <div
        ref={playerRef}
        className="aspect-video bg-black rounded-lg mb-4"
      ></div>

      {mode === "runner" && (
        <>
          {/* Run Timing at top when open, bottom when closed */}
          {runTimingOpen && (
            <RunTiming
              runStart={runStart}
              setRunStart={setRunStart}
              runEnd={runEnd}
              setRunEnd={setRunEnd}
              fps={fps}
              runTimingOpen={runTimingOpen}
              setRunTimingOpen={setRunTimingOpen}
              onMarkRunStart={onMarkRunStart}
              onMarkRunEnd={onMarkRunEnd}
              onJumpToTime={onJumpToTime}
              currentLoadIndex={currentLoadIndex}
              loads={loads}
            />
          )}

          {/* Current load indicator */}
          <div className="mb-2 flex items-center gap-2 text-sm">
            {loads.length === 0 ? (
              <span className="italic text-slate-500">No loads added yet</span>
            ) : (
              <>
                <span className="text-slate-300 mr-1">
                  Marking{" "}
                  <span className="font-semibold text-white">
                    Load #{currentLoadIndex + 1}
                  </span>
                </span>

                {/* Error Badges */}
                <div className="flex gap-2">
                  {isOverlapping && (
                    <span className="px-2 py-0.5 rounded bg-red-900/50 text-red-400 text-xs border border-red-500/50">
                      Overlapping
                    </span>
                  )}
                  {isInvalidDuration && (
                    <span className="px-2 py-0.5 rounded bg-orange-900/50 text-orange-400 text-xs border border-orange-500/50">
                      Invalid Duration
                    </span>
                  )}
                  {isOutsideRun && (
                    <span className="px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-400 text-xs border border-yellow-500/50">
                      Outside Run
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Load marking buttons */}
          <div className="flex gap-2 relative group">
            <button
              onClick={onMarkLoadStart}
              disabled={!runTimingSet}
              className="flex-1 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeLoad && activeLoad.startTime !== null
                ? "Re-mark Load Start"
                : "Mark Load Start"}
            </button>
            <button
              onClick={onMarkLoadEnd}
              disabled={!runTimingSet}
              className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeLoad && activeLoad.endTime !== null
                ? "Re-mark Load End"
                : "Mark Load End"}
            </button>

            {/* Tooltip when buttons are disabled */}
            {!runTimingSet && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded px-3 py-2 z-50 whitespace-nowrap">
                Set run start and end time first
              </div>
            )}
          </div>

          {/* Run Timing at bottom when closed */}
          {!runTimingOpen && (
            <div className="mt-4">
              <RunTiming
                runStart={runStart}
                setRunStart={setRunStart}
                runEnd={runEnd}
                setRunEnd={setRunEnd}
                fps={fps}
                runTimingOpen={runTimingOpen}
                setRunTimingOpen={setRunTimingOpen}
                onMarkRunStart={onMarkRunStart}
                onMarkRunEnd={onMarkRunEnd}
                onJumpToTime={onJumpToTime}
                currentLoadIndex={currentLoadIndex}
                loads={loads}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
