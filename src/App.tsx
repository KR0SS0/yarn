import React, { useState, useRef, useEffect } from "react";

const App = () => {
  const [mode, setMode] = useState<"runner" | "verifier">("runner");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [urlError, setUrlError] = useState("")
  // FPS State
  const [fps, setFps] = useState<number>(30);
  const [showFpsHelp, setShowFpsHelp] = useState<boolean>(false);

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
    } else {
      setVideoId("");
      setUrlError("Invalid YouTube URL");
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
      new (window as any).YT.Player(playerRef.current, {
        videoId: videoId,
        playerVars: {
          controls: 1,
        },
      });
    }
  }, [videoId]);

  // Calculate frame duration
  const frameDuration = 1 / fps;

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
                      Select <strong>"Stats for nerds"</strong>.
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

          {/* YouTube Player */}
          {videoId && (
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6">
              <div
                ref={playerRef}
                className="aspect-video bg-black rounded-lg"
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
