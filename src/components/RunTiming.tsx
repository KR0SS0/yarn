import React from "react";
import { RunMarker } from "../types";

interface RunTimingProps {
  runStart: RunMarker;
  setRunStart: (marker: RunMarker) => void;
  runEnd: RunMarker;
  setRunEnd: (marker: RunMarker) => void;
  runTimingOpen: boolean;
  setRunTimingOpen: (open: boolean) => void;
  onMarkRunStart: () => void;
  onMarkRunEnd: () => void;
}

const RunTiming: React.FC<RunTimingProps> = ({
  runStart,
  setRunStart,
  runEnd,
  setRunEnd,
  runTimingOpen,
  setRunTimingOpen,
  onMarkRunStart,
  onMarkRunEnd,
}) => {
  return (
    <div className="mb-4 p-3 bg-slate-700 rounded-lg">
      <h2
        onClick={() => setRunTimingOpen(!runTimingOpen)}
        className="text-sm font-bold mb-2 cursor-pointer select-none flex justify-between items-center"
      >
        Run Timing
        <span className="text-slate-400">{runTimingOpen ? "▾" : "▸"}</span>
      </h2>

      {runTimingOpen && (
        <>
          {(runStart.time === null || runEnd.time === null) && (
            <div className="flex gap-2 mb-2">
              <button
                onClick={onMarkRunStart}
                className="flex-1 px-3 py-2 bg-green-700 rounded hover:bg-green-800 transition"
              >
                Mark Run Start
              </button>
              <button
                onClick={onMarkRunEnd}
                className="flex-1 px-3 py-2 bg-red-700 rounded hover:bg-red-800 transition"
              >
                Mark Run End
              </button>
            </div>
          )}

          <div className="text-xs text-slate-300 space-y-2">
            <div>
              <strong>Start:</strong>{" "}
              {runStart.time !== null ? (
                <>
                  <input
                    type="number"
                    step="0.001"
                    value={runStart.time}
                    onChange={(e) =>
                      setRunStart({
                        ...runStart,
                        time: Number(e.target.value),
                      })
                    }
                    className="w-24 bg-slate-900 border border-slate-600 rounded px-1 ml-1"
                  />
                  s<span className="ml-2 text-slate-400">Offset:</span>
                  <input
                    type="number"
                    step="0.001"
                    value={runStart.offset}
                    onChange={(e) =>
                      setRunStart({
                        ...runStart,
                        offset: Number(e.target.value),
                      })
                    }
                    className="w-20 bg-slate-900 border border-slate-600 rounded px-1 ml-1"
                  />
                  s
                </>
              ) : (
                "Not set"
              )}
            </div>

            <div>
              <strong>End:</strong>{" "}
              {runEnd.time !== null ? (
                <>
                  <input
                    type="number"
                    step="0.001"
                    value={runEnd.time}
                    onChange={(e) =>
                      setRunEnd({
                        ...runEnd,
                        time: Number(e.target.value),
                      })
                    }
                    className="w-24 bg-slate-900 border border-slate-600 rounded px-1 ml-1"
                  />
                  s<span className="ml-2 text-slate-400">Offset:</span>
                  <input
                    type="number"
                    step="0.001"
                    value={runEnd.offset}
                    onChange={(e) =>
                      setRunEnd({
                        ...runEnd,
                        offset: Number(e.target.value),
                      })
                    }
                    className="w-20 bg-slate-900 border border-slate-600 rounded px-1 ml-1"
                  />
                  s
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
