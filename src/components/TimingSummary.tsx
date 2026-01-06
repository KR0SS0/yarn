import React from "react";

interface TimingSummaryProps {
  rtaTime: number | null;
  lrtTime: number | null;
}

const TimingSummary: React.FC<TimingSummaryProps> = ({ rtaTime, lrtTime }) => {
  if (rtaTime === null || lrtTime === null) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
      <div className="text-sm space-y-3">
        {/* LRT */}
        <div className="relative group">
          <div className="cursor-help">
            <strong>LRT:</strong> {lrtTime.toFixed(3)}s
          </div>
          <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 z-50 w-max max-w-xs">
            Load Removed Time (Removed all loading screens)
          </div>
        </div>

        {/* RTA */}
        <div className="relative group">
          <div className="cursor-help">
            <strong>RTA:</strong> {rtaTime.toFixed(3)}s
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
