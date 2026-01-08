import React from "react";
import { framesToHMSMs } from "../utils/Timing";
import Tooltip from "./ui/Tooltip";

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
        <Tooltip text="Load Removed Time (Removed all loading screens)">
          <div className="relative group">
            <div className="cursor-help">
              <strong className="text-green-400">LRT:</strong> {lrt.formatted}
              <div className="text-xs opacity-70">
                {lrt.frames}f @ {fps}fps
              </div>
            </div>
          </div>
        </Tooltip>

        {/* RTA */}
        <Tooltip text="Real Time Attack (Total time including loading screens)">
          <div className="relative group">
            <div className="cursor-help">
              <strong>RTA:</strong> {rta.formatted}
              <div className="text-xs opacity-70">
                {rta.frames}f @ {fps}fps
              </div>
            </div>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default TimingSummary;
