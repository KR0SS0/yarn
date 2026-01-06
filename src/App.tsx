import React, { useState, useRef, useEffect } from "react";

interface Load {
  id: number;
  startTime: number | null;
  endTime: number | null;
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

  // Mark load start and end times
  const markLoadStart = () => {
    if (player && player.getCurrentTime) {
      const currentTime = player.getCurrentTime();
      const newLoads = [...loads];
      newLoads[currentLoadIndex].startTime = currentTime;
      setLoads(newLoads);
    }
  };

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
                    className={`p-4 rounded-lg cursor-pointer transition ${
                      currentLoadIndex === index
                        ? "bg-blue-900 ring-2 ring-blue-500"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                    onClick={() => setCurrentLoadIndex(index)}
                  >
                    <div className="font-semibold mb-2">Load #{index + 1}</div>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">Start:</span>
                        <span>
                          {load.startTime !== null
                            ? `${load.startTime.toFixed(3)}s`
                            : "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">End:</span>
                        <span>
                          {load.endTime !== null
                            ? `${load.endTime.toFixed(3)}s`
                            : "Not set"}
                        </span>
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
