import React from "react";

interface VideoInputProps {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  urlError: string;
  setUrlError: (error: string) => void;
  fps: number;
  setFps: (fps: number) => void;
  showFpsHelp: boolean;
  setShowFpsHelp: (show: boolean) => void;
  onLoadVideo: () => void;
}

const VideoInput: React.FC<VideoInputProps> = ({
  videoUrl,
  setVideoUrl,
  urlError,
  setUrlError,
  fps,
  setFps,
  showFpsHelp,
  setShowFpsHelp,
  onLoadVideo,
}) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              if (urlError) setUrlError("");
            }}
            className={`flex-1 px-4 py-2 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 text-white placeholder-slate-400 transition ${
              urlError ? "ring-2 ring-red-500" : "focus:ring-blue-500"
            }`}
          />
          <button
            onClick={onLoadVideo}
            disabled={!videoUrl}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            Load Video
          </button>
        </div>
        <div className="bg-slate-750 border border-slate-700 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <label className="text-slate-300 font-semibold">Video FPS:</label>
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
                  The number after the @ symbol is the FPS (e.g., @30 or @60).
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoInput;
