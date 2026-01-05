import React, { useState } from 'react';

const App = () => {
  const [mode, setMode] = useState<'runner' | 'verifier'>('runner');
  const [videoUrl, setVideoUrl] = useState('');

  const handleLoadVideo = () => {
    // Later
    console.log('Loading video:', videoUrl);
  };

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
              onClick={() => setMode('runner')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                mode === 'runner'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Runner Mode
            </button>
            <button
              onClick={() => setMode('verifier')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                mode === 'verifier'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Verifier Mode
            </button>
          </div>

          {/* Video URL Input */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
              />
              <button
                onClick={handleLoadVideo}
                disabled={!videoUrl}
                className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Load Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;