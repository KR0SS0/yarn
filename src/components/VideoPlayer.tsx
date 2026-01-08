import React from "react";
import { TimingItem } from "../types";
import { getItemValidationStatus } from "../utils/Validation";
import Badge from "./ui/WarningBadge";
import { framesToHMSMs, secondsToFrames } from "../utils/Timing";
import { Play, Pause } from "lucide-react";

interface VideoPlayerProps {
  playerRef: React.RefObject<HTMLDivElement | null>;
  mode: "runner" | "verifier";
  currentItem: TimingItem | undefined;
  onMarkTime: (type: "start" | "end") => void;
  onJumpToTime: (time: number, id: string) => void;
  onControlAction: (
    type: "seek" | "frame" | "togglePause",
    value: number
  ) => void;
  overlappingLoadIndices: Set<number>;
  invalidDurationIndices: Set<number>;
  outsideRunIndices: Set<number>;
  fps: number;
  isPlaying: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playerRef,
  mode,
  currentItem,
  onMarkTime,
  onJumpToTime,
  onControlAction,
  overlappingLoadIndices,
  invalidDurationIndices,
  outsideRunIndices,
  fps,
  isPlaying,
}) => {
  if (!currentItem) return null;

  const isRun = currentItem.type === "run";
  const status = getItemValidationStatus(
    currentItem,
    overlappingLoadIndices,
    invalidDurationIndices,
    outsideRunIndices
  );

  const formatTime = (time: number | null) => {
    if (time === null) return "--";
    return framesToHMSMs(secondsToFrames(time, fps), fps).smart;
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 lg:col-span-2 flex flex-col border border-slate-700">
      <div
        ref={playerRef}
        className="aspect-video bg-black rounded-lg mb-4"
      ></div>

      {mode === "runner" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-300">
                Editing{" "}
                <span className="font-semibold text-white">
                  {isRun
                    ? currentItem.label
                    : `Load #${currentItem.loadIndex! + 1}`}
                </span>
              </span>

              {/* Timestamp Readouts */}
              <div className="flex items-center gap-3 border-l border-slate-700 pl-4 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium opacity-60 text-[11px] uppercase tracking-tight">
                    Start:
                  </span>
                  <button
                    disabled={currentItem.startTime === null}
                    onClick={() =>
                      onJumpToTime(currentItem.startTime!, currentItem.id)
                    }
                    onMouseDown={(e) => e.preventDefault()}
                    className={`font-mono transition-colors ${
                      currentItem.startTime !== null
                        ? "text-white hover:text-blue-400 cursor-pointer underline decoration-white/20 underline-offset-2"
                        : "text-slate-500 cursor-default"
                    }`}
                  >
                    {formatTime(currentItem.startTime)}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-medium opacity-60 text-[11px] uppercase tracking-tight">
                    End:
                  </span>
                  <button
                    disabled={currentItem.endTime === null}
                    onClick={() =>
                      onJumpToTime(currentItem.endTime!, currentItem.id)
                    }
                    onMouseDown={(e) => e.preventDefault()}
                    className={`font-mono transition-colors ${
                      currentItem.endTime !== null
                        ? "text-white hover:text-blue-400 cursor-pointer underline decoration-white/20 underline-offset-2"
                        : "text-slate-500 cursor-default"
                    }`}
                  >
                    {formatTime(currentItem.endTime)}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {status.isOverlapping && <Badge type="overlap" />}
              {status.isInvalidDuration && <Badge type="invalid-duration" />}
              {status.isOutsideRun && <Badge type="outside-run" />}
            </div>
          </div>

          {/* Playback Controls Row */}
          <div className="flex flex-col gap-2 bg-slate-900/30 p-2 rounded-lg border border-slate-700/50">
            <div className="flex gap-1 items-center justify-between">
              <ControlButton
                label="-30s"
                onClick={() => onControlAction("seek", -30)}
              />
              <ControlButton
                label="-5s"
                onClick={() => onControlAction("seek", -5)}
              />
              <ControlButton
                label="-1s"
                onClick={() => onControlAction("seek", -1)}
              />
              <ControlButton
                label="-5f"
                onClick={() => onControlAction("frame", -5)}
              />
              <ControlButton
                label="-1f"
                onClick={() => onControlAction("frame", -1)}
              />

              <button
                type="button"
                onClick={() => onControlAction("togglePause", 0)}
                onMouseDown={(e) => e.preventDefault()}
                className="flex-[1.5] py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-all active:scale-95 border border-slate-600 flex justify-center items-center"
              >
                <div className="flex items-center justify-center w-5 h-5">
                  {isPlaying ? (
                    <Pause
                      size={18}
                      fill="currentColor"
                      className="translate-x-0.5"
                    />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </div>
              </button>

              <ControlButton
                label="+1f"
                onClick={() => onControlAction("frame", 1)}
              />
              <ControlButton
                label="+5f"
                onClick={() => onControlAction("frame", 5)}
              />
              <ControlButton
                label="+1s"
                onClick={() => onControlAction("seek", 1)}
              />
              <ControlButton
                label="+5s"
                onClick={() => onControlAction("seek", 5)}
              />
              <ControlButton
                label="+30s"
                onClick={() => onControlAction("seek", 30)}
              />
            </div>
          </div>

          {/* Mark Time Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onMarkTime("start")}
              onMouseDown={(e) => e.preventDefault()}
              className="flex-1 px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition font-bold text-white shadow-lg active:scale-95"
            >
              {currentItem.startTime !== null ? "Re-mark Start" : "Mark Start"}
            </button>
            <button
              onClick={() => onMarkTime("end")}
              onMouseDown={(e) => e.preventDefault()}
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

const ControlButton: React.FC<{
  label: string;
  onClick: () => void;
  className?: string;
}> = ({ label, onClick, className = "" }) => (
  <button
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
    className={`flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded border border-slate-700 transition-all active:scale-90 ${className}`}
  >
    {label}
  </button>
);

export default VideoPlayer;
