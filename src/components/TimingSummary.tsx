import React from "react";
import { framesToHMSMs } from "../utils/timing";
import Tooltip from "./ui/Tooltip";
import { Clock } from "lucide-react"; // Optional: adding an icon for the header

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
  if (rtaFrames === null || lrtFrames === null) return null;

  const rta = framesToHMSMs(rtaFrames, fps);
  const lrt = framesToHMSMs(lrtFrames, fps);

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-5 mb-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-700/50 pb-3">
        <Clock size={16} className="text-blue-400" />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Time Summary
        </h3>
      </div>

      <div className="grid grid-cols-2">
        {/* LRT Column */}
        <div className="flex flex-col">
          <Tooltip
            text="Load Removed Time (Excludes loading screens)"
            className="w-fit"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                LRT (Loadless)
              </span>
              <span className="text-2xl font-mono text-white leading-tight">
                {lrt.formatted}
              </span>
              <span className="text-[10px] font-medium text-slate-500 font-mono mt-1">
                {lrt.frames.toLocaleString()} frames @ {fps}fps
              </span>
            </div>
          </Tooltip>
        </div>

        {/* RTA Column */}
        <div className="flex flex-col border-l border-slate-700/50 pl-8">
          <Tooltip
            text="Real Time Attack (Total elapsed time)"
            className="w-fit"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                RTA (With Loads)
              </span>
              <span className="text-2xl font-mono text-white leading-tight">
                {rta.formatted}
              </span>
              <span className="text-[10px] font-medium text-slate-500 font-mono mt-1">
                {rta.frames.toLocaleString()} frames @ {fps}fps
              </span>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default TimingSummary;
