import React from "react";
import RunTiming from "./RunTiming";
import { RunMarker } from "../types";

interface VideoPlayerProps {
  playerRef: React.RefObject<HTMLDivElement | null>;
  mode: "runner" | "verifier";
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
  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 lg:col-span-2">
      <div
        ref={playerRef}
        className="aspect-video bg-black rounded-lg mb-4"
      ></div>

      {mode === "runner" && (
        <>
          <RunTiming
            runStart={runStart}
            setRunStart={setRunStart}
            runEnd={runEnd}
            setRunEnd={setRunEnd}
            runTimingOpen={runTimingOpen}
            setRunTimingOpen={setRunTimingOpen}
            onMarkRunStart={onMarkRunStart}
            onMarkRunEnd={onMarkRunEnd}
          />

          <div className="flex gap-2">
            <button
              onClick={onMarkLoadStart}
              className="flex-1 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              Mark Load Start
            </button>
            <button
              onClick={onMarkLoadEnd}
              className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
            >
              Mark Load End
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
