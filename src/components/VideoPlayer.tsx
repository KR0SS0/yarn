import React from "react";
import { TimingItem, VerifierSettings } from "../types";
import { getItemValidationStatus } from "../utils/validation";
import Badge from "./ui/WarningBadge";
import { framesToHMSMs, secondsToFrames } from "../utils/timing";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import Tooltip from "./ui/Tooltip";

interface VideoPlayerProps {
  playerRef: (node: HTMLDivElement | null) => void;
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
  // Verifier Specific Props
  verifierSettings: VerifierSettings;
  setVerifierSettings: (settings: VerifierSettings) => void;
  jumpToVerify: (time: number | null, offset: number) => void;
  onCycle: (direction: "next" | "prev") => void;
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
  verifierSettings,
  setVerifierSettings,
  jumpToVerify,
  onCycle,
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

  const isVerifier = mode === "verifier";

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 lg:col-span-2 flex flex-col border border-slate-700">
      <div className="relative w-full aspect-video bg-black overflow-hidden mb-4 shadow-inner ring-1 ring-slate-700">
        <div
          ref={playerRef}
          className="absolute top-0 left-0 w-full h-full"
        ></div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Header Section: Dynamically switches text based on mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-300">
              {isVerifier ? "Verifying" : "Editing"}{" "}
              <span className="font-semibold text-white">
                {isRun
                  ? currentItem.label
                  : `Load #${currentItem.loadIndex! + 1}`}
              </span>
            </span>

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
                  className={`font-mono transition-colors ${
                    currentItem.startTime !== null
                      ? "text-white hover:text-blue-400 underline decoration-white/20"
                      : "text-slate-500"
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
                  className={`font-mono transition-colors ${
                    currentItem.endTime !== null
                      ? "text-white hover:text-blue-400 underline decoration-white/20"
                      : "text-slate-500"
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

        {isVerifier ? (
          /* VERIFIER CONTROLS: Replaces Playback & Mark buttons */
          <div className="flex flex-col gap-3 bg-blue-900/10 p-4 rounded-lg border border-blue-500/30">
            <div className="flex items-center justify-between gap-4">
              {/* Cycle Controls */}
              <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700 shadow-sm">
                <Tooltip text="[">
                  <button
                    onClick={() => onCycle("prev")}
                    className="p-2 hover:bg-slate-800 text-blue-400 rounded transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </Tooltip>
                <div className="px-4 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Cycle Point
                  </span>
                </div>
                <Tooltip text="]">
                  <button
                    onClick={() => onCycle("next")}
                    className="p-2 hover:bg-slate-800 text-blue-400 rounded transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                </Tooltip>
              </div>

              {/* Checkpoint Jump Grid */}
              <div className="grid grid-cols-4 gap-2 flex-1">
                {[
                  {
                    label: "-1f Start",
                    offset: -1,
                    time: currentItem.startTime,
                    key: "checkBeforeStart" as const,
                  },
                  {
                    label: "+1f Start",
                    offset: 1,
                    time: currentItem.startTime,
                    key: "checkAfterStart" as const,
                  },
                  {
                    label: "-1f End",
                    offset: -1,
                    time: currentItem.endTime,
                    key: "checkBeforeEnd" as const,
                  },
                  {
                    label: "+1f End",
                    offset: 1,
                    time: currentItem.endTime,
                    key: "checkAfterEnd" as const,
                  },
                ].map((btn) => (
                  <div key={btn.label} className="flex flex-col gap-1.5">
                    <button
                      onClick={() => jumpToVerify(btn.time, btn.offset)}
                      disabled={btn.time === null}
                      className="py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded border border-slate-600 transition-all disabled:opacity-30"
                    >
                      {btn.label}
                    </button>
                    <label className="flex items-center justify-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={verifierSettings[btn.key]}
                        onChange={(e) =>
                          setVerifierSettings({
                            ...verifierSettings,
                            [btn.key]: e.target.checked,
                          })
                        }
                        className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-400 uppercase font-medium group-hover:text-slate-200">
                        Auto
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* RUNNER CONTROLS: Original Playback & Mark Buttons */
          <>
            <div className="flex flex-col gap-2 bg-slate-900/30 p-2 rounded-lg border border-slate-700/50">
              <div className="flex gap-1 items-center justify-between">
                <ControlButton
                  label="-10s"
                  onClick={() => onControlAction("seek", -10)}
                  shortcut="J"
                />
                <ControlButton
                  label="-5s"
                  onClick={() => onControlAction("seek", -5)}
                  shortcut="←"
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
                  shortcut=","
                />

                <Tooltip text="Space" className="flex-[1.5]">
                  <button
                    onClick={() => onControlAction("togglePause", 0)}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-all active:scale-95 border border-slate-600 flex justify-center items-center"
                  >
                    {isPlaying ? (
                      <Pause size={18} fill="currentColor" />
                    ) : (
                      <Play
                        size={18}
                        fill="currentColor"
                        className="translate-x-0.5"
                      />
                    )}
                  </button>
                </Tooltip>

                <ControlButton
                  label="+1f"
                  onClick={() => onControlAction("frame", 1)}
                  shortcut="."
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
                  shortcut="→"
                />
                <ControlButton
                  label="+10s"
                  onClick={() => onControlAction("seek", 10)}
                  shortcut="L"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onMarkTime("start")}
                className="flex-1 px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition font-bold text-white shadow-lg active:scale-95"
              >
                {currentItem.startTime !== null
                  ? "Re-mark Start"
                  : "Mark Start"}
              </button>
              <button
                onClick={() => onMarkTime("end")}
                className="flex-1 px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition font-bold text-white shadow-lg active:scale-95"
              >
                {currentItem.endTime !== null ? "Re-mark End" : "Mark End"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Internal Helper Component
const ControlButton: React.FC<{
  label: string;
  onClick: () => void;
  shortcut?: string;
}> = ({ label, onClick, shortcut }) => {
  const btn = (
    <button
      onClick={onClick}
      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded border border-slate-700 transition-all active:scale-90"
    >
      {label}
    </button>
  );
  return shortcut ? (
    <Tooltip text={shortcut}>{btn}</Tooltip>
  ) : (
    <div className="flex-1">{btn}</div>
  );
};

export default VideoPlayer;
