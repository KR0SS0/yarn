import React, { useState, useEffect } from "react";
import { RunMarker } from "../types";
import { Eye, EyeOff } from "lucide-react";

interface RunTimingProps {
  runStart: RunMarker;
  setRunStart: (marker: RunMarker) => void;
  runEnd: RunMarker;
  setRunEnd: (marker: RunMarker) => void;
  fps: number;
  runTimingOpen: boolean;
  setRunTimingOpen: (open: boolean) => void;
  onMarkRunStart: () => void;
  onMarkRunEnd: () => void;
  onJumpToTime: (time: number) => void;
}

const RunTiming: React.FC<RunTimingProps> = ({
  runStart,
  setRunStart,
  runEnd,
  setRunEnd,
  fps,
  runTimingOpen,
  setRunTimingOpen,
  onMarkRunStart,
  onMarkRunEnd,
  onJumpToTime,
}) => {
  const [startFramesStr, setStartFramesStr] = useState(
    Math.round(runStart.offset * fps).toString()
  );
  const [endFramesStr, setEndFramesStr] = useState(
    Math.round(runEnd.offset * fps).toString()
  );

  // Sync local state if external offset changes
  useEffect(() => {
    setStartFramesStr(Math.round(runStart.offset * fps).toString());
  }, [runStart.offset, fps]);

  useEffect(() => {
    setEndFramesStr(Math.round(runEnd.offset * fps).toString());
  }, [runEnd.offset, fps]);

  const framesToSecondsDisplay = (frames: number) => {
    const seconds = frames / fps;
    return `${seconds.toFixed(3)}s`;
  };

  const handleChangeFrames = (
    value: string,
    setter: (marker: RunMarker) => void,
    marker: RunMarker,
    setStr: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setStr(value); // allow user to type freely
    let frames = parseInt(value, 10);
    if (isNaN(frames)) frames = 0; // empty field defaults to 0
    setter({ ...marker, offset: frames / fps });
  };

  return (
    <div
      className={`mb-4 bg-slate-700 rounded-lg transition-all ${
        runTimingOpen ? "p-3" : "px-3 py-2"
      }`}
    >
      <div
        onClick={() => setRunTimingOpen(!runTimingOpen)}
        className={`text-sm font-bold cursor-pointer select-none flex justify-between items-center group ${
          runTimingOpen ? "mb-2" : "mb-0"
        }`}
        title={runTimingOpen ? "Hide" : "Show"}
      >
        <span>Start / End Run Timing</span>
        <span className="text-slate-400 group-hover:text-white transition-colors">
          {runTimingOpen ? <Eye size={18} /> : <EyeOff size={18} />}
        </span>
      </div>

      {runTimingOpen && (
        <>
          <div className="flex gap-2 mb-3">
            <button
              onClick={onMarkRunStart}
              className="flex-1 px-3 py-2 bg-green-700 rounded hover:bg-green-800 transition"
            >
              {runStart.time === null ? "Mark Run Start" : "Re-mark Run Start"}
            </button>
            <button
              onClick={onMarkRunEnd}
              className="flex-1 px-3 py-2 bg-red-700 rounded hover:bg-red-800 transition"
            >
              {runEnd.time === null ? "Mark Run End" : "Re-mark Run End"}
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-3">
            {/* START */}
            <div>
              <strong>Start:</strong>{" "}
              {runStart.time !== null ? (
                <>
                  {/* Raw Time Jump */}
                  <button
                    onClick={() => onJumpToTime(runStart.time!)}
                    className="ml-1 text-blue-400 hover:underline hover:text-blue-300 transition"
                    title="Jump to raw start"
                  >
                    {runStart.time.toFixed(3)}s
                  </button>

                  <span className="ml-3 text-slate-400">Offset (frames):</span>
                  <input
                    type="number"
                    step={1}
                    value={startFramesStr}
                    onChange={(e) =>
                      handleChangeFrames(
                        e.target.value,
                        setRunStart,
                        runStart,
                        setStartFramesStr
                      )
                    }
                    className="w-20 bg-slate-900 border border-slate-600 rounded px-1 ml-1 text-white"
                  />

                  {/* Offset Adjusted Jump */}
                  <button
                    onClick={() =>
                      onJumpToTime(runStart.time! + runStart.offset)
                    }
                    className="ml-2 text-slate-400 hover:text-blue-400 hover:underline transition font-mono"
                    title="Jump to adjusted start (Time + Offset)"
                  >
                    ({framesToSecondsDisplay(parseInt(startFramesStr) || 0)})
                  </button>
                </>
              ) : (
                "Not set"
              )}
            </div>

            {/* END */}
            <div>
              <strong>End:</strong>{" "}
              {runEnd.time !== null ? (
                <>
                  {/* Raw Time Jump */}
                  <button
                    onClick={() => onJumpToTime(runEnd.time!)}
                    className="ml-1 text-blue-400 hover:underline hover:text-blue-300 transition"
                    title="Jump to raw end"
                  >
                    {runEnd.time.toFixed(3)}s
                  </button>

                  <span className="ml-3 text-slate-400">Offset (frames):</span>
                  <input
                    type="number"
                    step={1}
                    value={endFramesStr}
                    onChange={(e) =>
                      handleChangeFrames(
                        e.target.value,
                        setRunEnd,
                        runEnd,
                        setEndFramesStr
                      )
                    }
                    className="w-20 bg-slate-900 border border-slate-600 rounded px-1 ml-1 text-white"
                  />

                  {/* Offset Adjusted Jump */}
                  <button
                    onClick={() => onJumpToTime(runEnd.time! + runEnd.offset)}
                    className="ml-2 text-slate-400 hover:text-blue-400 hover:underline transition font-mono"
                    title="Jump to adjusted end (Time + Offset)"
                  >
                    ({framesToSecondsDisplay(parseInt(endFramesStr) || 0)})
                  </button>
                </>
              ) : (
                "Not set"
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RunTiming;
