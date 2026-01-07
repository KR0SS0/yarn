import React from "react";
import RunTiming from "./RunTiming";
import { RunMarker } from "../types";

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
}) => {
  const runTimingSet = runStart.time !== null && runEnd.time !== null;

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
            />
          )}

          {/* Load marking buttons with tooltip */}
          <div className="flex gap-2 relative group">
            <button
              onClick={onMarkLoadStart}
              disabled={!runTimingSet}
              className="flex-1 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark Load Start
            </button>
            <button
              onClick={onMarkLoadEnd}
              disabled={!runTimingSet}
              className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark Load End
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
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoPlayer;