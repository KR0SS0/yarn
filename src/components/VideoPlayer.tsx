import React, { useEffect, useState } from "react";
import { TimingItem, VerifierSettings } from "../types";
import { getItemValidationStatus } from "../utils/validation";
import Badge from "./ui/WarningBadge";
import { framesToHMSMs, secondsToFrames } from "../utils/timing";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import Tooltip from "./ui/Tooltip";
import PillToggle from "./ui/PillToggle";
import VerifierJumpButton from "./ui/VerifierJumpButton";
import { blue } from "../utils/theme";

interface VideoPlayerProps {
  playerRef: (node: HTMLDivElement | null) => void;
  mode: "runner" | "verifier";
  currentItem: TimingItem | undefined;
  onMarkTime: (type: "start" | "end") => void;
  onJumpToTime: (time: number, id: string, label: string) => void;
  onControlAction: (
    type: "seek" | "frame" | "togglePause",
    value: number,
  ) => void;
  overlappingLoadIndices: Set<number>;
  invalidDurationIndices: Set<number>;
  outsideRunIndices: Set<number>;
  fps: number;
  isPlaying: boolean;
  // Verifier Specific Props
  verifierSettings: VerifierSettings;
  setVerifierSettings: (settings: VerifierSettings) => void;
  onJumpToVerify: (time: number | null, offset: number, label: string) => void;
  onCycle: (direction: "next" | "prev") => void;
  activeOffsetLabel?: string;
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
  onJumpToVerify,
  onCycle,
  activeOffsetLabel,
}) => {

  const [isLabelDismissed, setIsLabelDismissed] = useState(false);

  useEffect(() => {
    setIsLabelDismissed(false);
  }, [activeOffsetLabel]);

  if (!currentItem) return null;

  const isRun = currentItem.type === "run";
  const status = getItemValidationStatus(
    currentItem,
    overlappingLoadIndices,
    invalidDurationIndices,
    outsideRunIndices,
  );

  const formatTime = (time: number | null) => {
    if (time === null) return "--";
    return framesToHMSMs(secondsToFrames(time, fps), fps).smart;
  };

  const isVerifier = mode === "verifier";

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 lg:col-span-2 flex flex-col border border-slate-700">
      {/* Video Container*/}
      <div className="relative w-full aspect-video bg-black overflow-hidden mb-4 shadow-inner ring-1 ring-slate-700">
        <div
          ref={playerRef}
          className="absolute top-0 left-0 w-full h-full"
        ></div>
        {/* Dismissable Active Offset Label */}
        {isVerifier && activeOffsetLabel && !isLabelDismissed && (
          <div
            key={activeOffsetLabel}
            onClick={() => setIsLabelDismissed(true)} 
            className="absolute top-4 left-4 z-10 cursor-pointer group animate-in fade-in slide-in-from-left-4 duration-300"
          >
            <div className={`flex items-center gap-2.5 ${blue.labelOffset} ${blue.bg600hover} backdrop-blur-md px-4 py-2 rounded-md border ${blue.border400} shadow-xl transition-colors`}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_#fff]" />
              <span className="text-white font-black text-sm uppercase tracking-widest font-mono">
                {activeOffsetLabel}
              </span>
              <span className={`${blue.text200} text-[10px] ml-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                ✕
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Header Section: Dynamically switches text based on mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-300">
              {isVerifier ? "Cycle Verifying" : "Editing"}{" "}
              <span className="font-semibold text-white">
                {isRun
                  ? currentItem.label
                  : `Load #${currentItem.loadIndex! + 1}`}
              </span>
              {isVerifier && activeOffsetLabel && (
                <span className={`${blue.text400} ml-2 text-xs font-medium italic`}>
                  ({activeOffsetLabel.toLowerCase()})
                </span>
              )}
            </span>

            <div className="flex items-center gap-3 border-l border-slate-700 pl-4 text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="font-medium opacity-60 text-[11px] uppercase tracking-tight">
                  Start:
                </span>
                <button
                  disabled={currentItem.startTime === null}
                  onClick={() =>
                    onJumpToTime(
                      currentItem.startTime!,
                      currentItem.id,
                      "exact start",
                    )
                  }
                  onMouseDown={(e) => e.preventDefault()}
                  className={`font-mono transition-colors ${
                    currentItem.startTime !== null
                      ? `text-white ${blue.hoverText400} underline decoration-white/20`
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
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    onJumpToTime(
                      currentItem.endTime!,
                      currentItem.id,
                      "exact end",
                    )
                  }
                  className={`font-mono transition-colors ${
                    currentItem.endTime !== null
                      ? `text-white ${blue.hoverText400} underline decoration-white/20`
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

        {/* Custom Playback Controls Section */}
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
                onMouseDown={(e) => e.preventDefault()}
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

        {isVerifier ? (
          <div className={`flex flex-col gap-4 ${blue.bgFaint} p-4 rounded-lg border ${blue.borderFaint}`}>
            {/* Top Row: Navigation & Jump Actions */}
            <div className="flex items-center gap-6">
              {/* Cycle Navigation */}
              <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700 shadow-sm shrink-0">
                <Tooltip text="Z">
                  <button
                    onClick={() => onCycle("prev")}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`p-2 hover:bg-slate-800 ${blue.text400} rounded transition`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                </Tooltip>
                <div className="px-3 text-center border-x border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Cycle
                  </span>
                </div>
                <Tooltip text="X">
                  <button
                    onClick={() => onCycle("next")}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`p-2 hover:bg-slate-800 ${blue.text400} rounded transition`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </Tooltip>
              </div>

              {/* Action Buttons Grid */}
              <div className="flex gap-4 flex-1">
                {/* START JUMPS */}
                <div className="flex-1 grid grid-cols-3 gap-1 bg-slate-900/40 p-1 rounded-md border border-slate-700/30">
                  <VerifierJumpButton
                    label="Start -1f"
                    offset={-1}
                    time={currentItem.startTime}
                    onClick={(t, o) => onJumpToVerify(t, o, "Start -1f")}
                  />
                  <VerifierJumpButton
                    label="Exact Start"
                    offset={0}
                    time={currentItem.startTime}
                    onClick={(t, o) => onJumpToVerify(t, o, "Exact Start")}
                    primary
                  />
                  <VerifierJumpButton
                    label="Start +1f"
                    offset={1}
                    time={currentItem.startTime}
                    onClick={(t, o) => onJumpToVerify(t, o, "Start +1f")}
                  />
                </div>

                {/* END JUMPS */}
                <div className="flex-1 grid grid-cols-3 gap-1 bg-slate-900/40 p-1 rounded-md border border-slate-700/30">
                  <VerifierJumpButton
                    label="End -1f"
                    offset={-1}
                    time={currentItem.endTime}
                    onClick={(t, o) => onJumpToVerify(t, o, "End -1f")}
                  />
                  <VerifierJumpButton
                    label="Exact End"
                    offset={0}
                    time={currentItem.endTime}
                    onClick={(t, o) => onJumpToVerify(t, o, "Exact End")}
                    primary
                  />
                  <VerifierJumpButton
                    label="End +1f"
                    offset={1}
                    time={currentItem.endTime}
                    onClick={(t, o) => onJumpToVerify(t, o, "End +1f")}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row: Cycle Rules (Pill Toggles) */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 rounded-full border border-slate-700/50">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Always cycle between:
              </span>

              <div className="flex items-center gap-6">
                <ToggleGroup
                  label="Start -1f"
                  checked={verifierSettings.checkBeforeStart}
                  onChange={(v) =>
                    setVerifierSettings({
                      ...verifierSettings,
                      checkBeforeStart: v,
                    })
                  }
                />
                <ToggleGroup
                  label="Start +1f"
                  checked={verifierSettings.checkAfterStart}
                  onChange={(v) =>
                    setVerifierSettings({
                      ...verifierSettings,
                      checkAfterStart: v,
                    })
                  }
                />
                <div className="w-px h-4 bg-slate-700 mx-1" /> {/* Divider */}
                <ToggleGroup
                  label="End -1f"
                  checked={verifierSettings.checkBeforeEnd}
                  onChange={(v) =>
                    setVerifierSettings({
                      ...verifierSettings,
                      checkBeforeEnd: v,
                    })
                  }
                />
                <ToggleGroup
                  label="End +1f"
                  checked={verifierSettings.checkAfterEnd}
                  onChange={(v) =>
                    setVerifierSettings({
                      ...verifierSettings,
                      checkAfterEnd: v,
                    })
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          /* Runner Controls: Mark Buttons */
          <>
            <div className="flex gap-2">
              <button
                onClick={() => onMarkTime("start")}
                onMouseDown={(e) => e.preventDefault()}
                className="flex-1 px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition font-bold text-white shadow-lg active:scale-95"
              >
                {currentItem.startTime !== null
                  ? "Re-mark Start"
                  : "Mark Start"}
              </button>
              <button
                onClick={() => onMarkTime("end")}
                onMouseDown={(e) => e.preventDefault()}
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
};;

// Internal Helper Component
const ControlButton: React.FC<{
  label: string;
  onClick: () => void;
  shortcut?: string;
}> = ({ label, onClick, shortcut }) => {
  const btn = (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
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

const ToggleGroup: React.FC<{
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <span
      className={`text-[10px] font-medium transition-colors ${checked ? blue.text300 : "text-slate-500"}`}
    >
      {label}
    </span>
    <PillToggle checked={checked} onChange={onChange} checkedColor={blue.bg500} />
  </div>
);

export default VideoPlayer;