import React from "react";
import { TimingItem, VALIDATION_CONFIG, ValidationType } from "../types";
import { getItemValidationStatus } from "../utils/Validation";

interface VideoPlayerProps {
  playerRef: React.RefObject<HTMLDivElement | null>;
  mode: "runner" | "verifier";
  currentItem: TimingItem | undefined;
  onMarkTime: (type: "start" | "end") => void;
  overlappingLoadIndices: Set<number>;
  invalidDurationIndices: Set<number>;
  outsideRunIndices: Set<number>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playerRef,
  mode,
  currentItem,
  onMarkTime,
  overlappingLoadIndices,
  invalidDurationIndices,
  outsideRunIndices,
}) => {
  if (!currentItem) return null;

  const isRun = currentItem.type === "run";
  const status = getItemValidationStatus(
    currentItem,
    overlappingLoadIndices,
    invalidDurationIndices,
    outsideRunIndices
  );

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 lg:col-span-2 flex flex-col">
      <div
        ref={playerRef}
        className="aspect-video bg-black rounded-lg mb-4"
      ></div>

      {mode === "runner" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-300">
              Editing{" "}
              <span className="font-semibold text-white">
                {isRun
                  ? currentItem.label
                  : `Load #${currentItem.loadIndex! + 1}`}
              </span>
            </span>

            {/* Render badges using the preferred styling */}
            <div className="flex gap-2">
              {status.isOverlapping && <Badge type="overlap" />}
              {status.isInvalidDuration && <Badge type="invalid-duration" />}
              {status.isOutsideRun && <Badge type="outside-run" />}
            </div>
          </div>

          {/* Contextual Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onMarkTime("start")}
              className="flex-1 px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition font-bold text-white shadow-lg active:scale-95"
            >
              {currentItem.startTime !== null ? "Re-mark Start" : "Mark Start"}
            </button>
            <button
              onClick={() => onMarkTime("end")}
              className="flex-1 px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition font-bold text-white shadow-lg active:scale-95"
            >
              {currentItem.endTime !== null ? "Re-mark End" : "Mark End"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Badge styling adjusted to match your VideoPlayer preference
 */
const Badge: React.FC<{ type: ValidationType }> = ({ type }) => {
  const style = VALIDATION_CONFIG[type];
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs border border-opacity-50 whitespace-nowrap ${style.bg} ${style.border} ${style.text}`}
    >
      {style.label}
    </span>
  );
};

export default VideoPlayer;
