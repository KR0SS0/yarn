import React from "react";
import { framesToHMSMs } from "../utils/Timing";

interface TimingSummaryProps {
  rtaFrames: number | null;
  lrtFrames: number | null;
  fps: number;
}

const TimingSummary: React.FC<TimingSummaryProps> = ({
  rtaFrames,
  lrtFrames,
  fps,
}) => {
  if (rtaFrames === null || lrtFrames === null) {
    return null;
  }

  const rta = framesToHMSMs(rtaFrames, fps);
  const lrt = framesToHMSMs(lrtFrames, fps);

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
      <div className="text-sm space-y-4">
        {/* LRT */}
        <div className="relative group">
          <div className="cursor-help">
            <strong className="text-green-400">LRT:</strong> {lrt.formatted}
            <div className="text-xs opacity-70">
              {lrt.frames}f @ {fps}fps
            </div>
          </div>
          <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 z-50 w-max max-w-xs">
            Load Removed Time (Removed all loading screens)
          </div>
        </div>

        {/* RTA */}
        <div className="relative group">
          <div className="cursor-help">
            <strong>RTA:</strong> {rta.formatted}
            <div className="text-xs opacity-70">
              {rta.frames}f @ {fps}fps
            </div>
          </div>
          <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 z-50 w-max max-w-xs">
            Real Time Attack (Total time including loading screens)
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimingSummary;
