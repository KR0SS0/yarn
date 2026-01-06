import React, { useState, useRef, useEffect, useMemo } from "react";
import { Trash2 } from "lucide-react";

interface Load {
  id: number;
  startTime: number | null;
  endTime: number | null;
}

interface RunMarker {
  time: number | null;
  offset: number;
}

const App = () => {
  const [mode, setMode] = useState<"runner" | "verifier">("runner");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [urlError, setUrlError] = useState("");

  // FPS
  const [fps, setFps] = useState<number>(30);
  const [showFpsHelp, setShowFpsHelp] = useState<boolean>(false);

  // Load tracking state
  const [loads, setLoads] = useState<Load[]>([]);
  const [currentLoadIndex, setCurrentLoadIndex] = useState(0);
  const [player, setPlayer] = useState<any>(null);

  // Track run start/end times
  const [runStart, setRunStart] = useState<RunMarker>({
    time: null,
    offset: 0,
  });
  const [runEnd, setRunEnd] = useState<RunMarker>({ time: null, offset: 0 });

  const playerRef = useRef<HTMLDivElement>(null);

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string => {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : "";
  };

  const handleLoadVideo = () => {
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      setUrlError("");
      // Initialize with first load when video is loaded
      if (loads.length === 0) {
        setLoads([{ id: Date.now(), startTime: null, endTime: null }]);
      }
    } else {
      setVideoId("");
      setUrlError("Invalid YouTube URL");
    }
  };

  // Mark load start
  const markLoadStart = () => {
    if (player && player.getCurrentTime) {
      const currentTime = player.getCurrentTime();
      const newLoads = [...loads];
      newLoads[currentLoadIndex].startTime = currentTime;
      setLoads(newLoads);
    }
  };

  // Mark load end
  const markLoadEnd = () => {
    if (player && player.getCurrentTime) {
      const currentTime = player.getCurrentTime();
      const newLoads = [...loads];
      newLoads[currentLoadIndex].endTime = currentTime;
      setLoads(newLoads);
    }
  };

  const addNewLoad = () => {
    setLoads([...loads, { id: Date.now(), startTime: null, endTime: null }]);
    setCurrentLoadIndex(loads.length);
  };

  const deleteLoad = (index: number) => {
    const newLoads = loads.filter((_, i) => i !== index);
    setLoads(newLoads);
    if (currentLoadIndex >= newLoads.length && newLoads.length > 0) {
      setCurrentLoadIndex(newLoads.length - 1);
    } else if (newLoads.length === 0) {
      setCurrentLoadIndex(0);
    }
  };

  // Total load time
  const totalLoadTime = useMemo(() => {
    return loads.reduce((sum, load) => {
      if (load.startTime !== null && load.endTime !== null) {
        return sum + (load.endTime - load.startTime);
      }
      return sum;
    }, 0);
  }, [loads]);

  // Mark run start
  const markRunStart = () => {
    if (player && player.getCurrentTime) {
      setRunStart({
        ...runStart,
        time: player.getCurrentTime(),
      });
    }
  };

  // Mark run end
  const markRunEnd = () => {
    if (player && player.getCurrentTime) {
      setRunEnd({
        ...runEnd,
        time: player.getCurrentTime(),
      });
    }
  };

  // Adjusted run start / end (time + offset)
  const adjustedRunStart = useMemo(() => {
    if (runStart.time === null) return null;
    return runStart.time + runStart.offset;
  }, [runStart]);

  const adjustedRunEnd = useMemo(() => {
    if (runEnd.time === null) return null;
    return runEnd.time + runEnd.offset;
  }, [runEnd]);

  // RTA = end - start
  const rtaTime = useMemo(() => {
    if (adjustedRunStart === null || adjustedRunEnd === null) return null;
    return adjustedRunEnd - adjustedRunStart;
  }, [adjustedRunStart, adjustedRunEnd]);

  // LRT = RTA - total loads
  const lrtTime = useMemo(() => {
    if (rtaTime === null) return null;
    return rtaTime - totalLoadTime;
  }, [rtaTime, totalLoadTime]);

  const jumpToTime = (time: number, index: number) => {
    if (player && player.seekTo) {
      player.seekTo(time, true);
      setCurrentLoadIndex(index);
    }
  };

  // Load YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  // Create player when videoId changes
  useEffect(() => {
    if (videoId && (window as any).YT && playerRef.current) {
      const newPlayer = new (window as any).YT.Player(playerRef.current, {
        videoId: videoId,
        playerVars: {
          controls: 1,
        },
      });
      setPlayer(newPlayer);
    }
  }, [videoId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Yarn Load Timer
          </h1>
          <p className="text-slate-400 mb-4">Speedrun load verification tool</p>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode("runner")}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                mode === "runner"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Runner Mode
            </button>
            <button
              onClick={() => setMode("verifier")}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                mode === "verifier"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Verifier Mode
            </button>
          </div>

          {/* Video URL Input */}
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (urlError) setUrlError(""); // Reset error when user starts typing again
                }}
                className={`flex-1 px-4 py-2 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 text-white placeholder-slate-400 transition ${
                  urlError ? "ring-2 ring-red-500" : "focus:ring-blue-500"
                }`}
              />
              <button
                onClick={handleLoadVideo}
                disabled={!videoUrl}
                className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Load Video
              </button>
            </div>
            <div className="bg-slate-750 border border-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <label className="text-slate-300 font-semibold">
                  Video FPS:
                </label>
                <input
                  type="number"
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-20 px-3 py-1 bg-slate-900 border border-slate-600 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={() => setShowFpsHelp(!showFpsHelp)}
                  className="text-xs text-blue-400 underline hover:text-blue-300"
                >
                  How do I find this?
                </button>
              </div>

              {/* FPS Help Instructions */}
              {showFpsHelp && (
                <div className="mt-3 text-sm text-slate-400 bg-slate-900/50 p-3 rounded border border-slate-700">
                  <p className="mb-1 font-bold text-slate-300">
                    To find the exact FPS:
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Right-click on the YouTube video player.</li>
                    <li>
                      Select <strong>"ⓘ Stats for nerds"</strong>.
                    </li>
                    <li>
                      Look for the line that says{" "}
                      <strong>Current / Optimal Res</strong>.
                    </li>
                    <li>
                      The number after the @ symbol is the FPS (e.g., @30 or
                      @60).
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
          {rtaTime !== null && lrtTime !== null && (
            <div className="mb-3 text-sm bg-slate-700 p-3 rounded">
              <div className="relative group block">
                <div className="cursor-help">
                  <strong>RTA:</strong> {rtaTime.toFixed(3)}s
                </div>
                <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 z-50 w-max max-w-xs">
                  Real Time Attack (Total time including loading screens)
                </div>
              </div>
              <div className="relative group inline-block mt-1">
                <div className="cursor-help">
                  <strong>LRT:</strong> {lrtTime.toFixed(3)}s
                </div>
                <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 z-50 w-max max-w-xs">
                  Load Removed Time (Removed all loading screens)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* YouTube Player */}
        {videoId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Player Section */}
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6">
              <div
                ref={playerRef}
                className="aspect-video bg-black rounded-lg mb-4"
              ></div>
              {mode === "runner" && (
                <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                  <h2 className="text-sm font-bold mb-2">Run Timing</h2>
                  {(runStart.time === null || runEnd.time === null) && (
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={markRunStart}
                        className="flex-1 px-3 py-2 bg-green-700 rounded hover:bg-green-800 transition"
                      >
                        Mark Run Start
                      </button>

                      <button
                        onClick={markRunEnd}
                        className="flex-1 px-3 py-2 bg-red-700 rounded hover:bg-red-800 transition"
                      >
                        Mark Run End
                      </button>
                    </div>
                  )}

                  <div className="text-xs text-slate-300 space-y-2">
                    {/* Run Start */}
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

                    {/* Run End */}
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
                </div>
              )}
              {/* Mark Load Buttons - Only show in runner mode */}
              {mode === "runner" && (
                <div className="flex gap-2">
                  <button
                    onClick={markLoadStart}
                    className="flex-1 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
                  >
                    Mark Load Start
                  </button>
                  <button
                    onClick={markLoadEnd}
                    className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    Mark Load End
                  </button>
                </div>
              )}
            </div>

            {/* Load List Section */}
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Marked Loads</h2>
                {mode === "runner" && (
                  <button
                    onClick={addNewLoad}
                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    + Add Load
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {loads.map((load, index) => (
                  <div
                    key={load.id}
                    className={`p-4 rounded-lg transition ${
                      currentLoadIndex === index
                        ? "bg-blue-900 ring-2 ring-blue-500"
                        : "bg-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">Load #{index + 1}</span>
                      {mode === "runner" && (
                        <button
                          onClick={() => deleteLoad(index)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">Start:</span>
                        {load.startTime !== null ? (
                          <button
                            onClick={() => jumpToTime(load.startTime!, index)}
                            className="text-blue-400 hover:underline"
                          >
                            {load.startTime.toFixed(3)}s
                          </button>
                        ) : (
                          <span className="text-slate-500">Not set</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">End:</span>
                        {load.endTime !== null ? (
                          <button
                            onClick={() => jumpToTime(load.endTime!, index)}
                            className="text-blue-400 hover:underline"
                          >
                            {load.endTime.toFixed(3)}s
                          </button>
                        ) : (
                          <span className="text-slate-500">Not set</span>
                        )}
                      </div>
                      {load.startTime !== null && load.endTime !== null && (
                        <div className="text-yellow-400 font-semibold mt-2">
                          Duration: {(load.endTime - load.startTime).toFixed(3)}
                          s
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
