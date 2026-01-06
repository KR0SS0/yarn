// App.tsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import Header from "./components/Header";
import VideoInput from "./components/VideoInput";
import TimingSummary from "./components/TimingSummary";
import VideoPlayer from "./components/VideoPlayer";
import LoadList from "./components/LoadList";
import { Load, RunMarker } from "./types";
import { extractVideoId } from "./utils/Youtube";
import { secondsToFrames } from "./utils/CalculateTime";

const App = () => {
  const [mode, setMode] = useState<"runner" | "verifier">("runner");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [urlError, setUrlError] = useState("");
  const [fps, setFps] = useState<number>(30);
  const [showFpsHelp, setShowFpsHelp] = useState(false);

  const [loads, setLoads] = useState<Load[]>([]);
  const [currentLoadIndex, setCurrentLoadIndex] = useState(0);
  const [player, setPlayer] = useState<any>(null);

  const [runStart, setRunStart] = useState<RunMarker>({
    time: null,
    offset: 0,
  });
  const [runEnd, setRunEnd] = useState<RunMarker>({
    time: null,
    offset: 0,
  });

  const [runTimingOpen, setRunTimingOpen] = useState(true);
  const playerRef = useRef<HTMLDivElement | null>(null);

  // Total load time in frames
  const totalLoadFrames = useMemo(() => {
    return loads.reduce((sum, load) => {
      if (load.startTime !== null && load.endTime !== null) {
        const start = secondsToFrames(load.startTime, fps);
        const end = secondsToFrames(load.endTime, fps);
        return sum + (end - start);
      }
      return sum;
    }, 0);
  }, [loads, fps]);

  const handleLoadVideo = () => {
    const id = extractVideoId(videoUrl);
    if (!id) {
      setVideoId("");
      setUrlError("Invalid YouTube URL");
      return;
    }

    setVideoId(id);
    setUrlError("");

    if (loads.length === 0) {
      setLoads([{ id: Date.now(), startTime: null, endTime: null }]);
    }
  };

  const markLoadStart = () => {
    if (!player?.getCurrentTime) return;
    const time = player.getCurrentTime();
    const updated = [...loads];
    updated[currentLoadIndex].startTime = time;
    setLoads(updated);
  };

  const markLoadEnd = () => {
    if (!player?.getCurrentTime) return;
    const time = player.getCurrentTime();
    const updated = [...loads];
    updated[currentLoadIndex].endTime = time;
    setLoads(updated);
  };

  const addNewLoad = () => {
    setLoads([...loads, { id: Date.now(), startTime: null, endTime: null }]);
    setCurrentLoadIndex(loads.length);
  };

  const deleteLoad = (index: number) => {
    const updated = loads.filter((_, i) => i !== index);
    setLoads(updated);
    setCurrentLoadIndex(Math.max(0, updated.length - 1));
  };

  const jumpToTime = (time: number, index: number) => {
    player?.seekTo?.(time, true);
    setCurrentLoadIndex(index);
  };

  const markRunStart = () => {
    if (!player?.getCurrentTime) return;
    setRunStart({ ...runStart, time: player.getCurrentTime() });
  };

  const markRunEnd = () => {
    if (!player?.getCurrentTime) return;
    setRunEnd({ ...runEnd, time: player.getCurrentTime() });
  };

  const adjustedRunStartFrames = useMemo(() => {
    if (runStart.time === null) return null;
    return (
      secondsToFrames(runStart.time, fps) +
      secondsToFrames(runStart.offset, fps)
    );
  }, [runStart, fps]);

  const adjustedRunEndFrames = useMemo(() => {
    if (runEnd.time === null) return null;
    return (
      secondsToFrames(runEnd.time, fps) + secondsToFrames(runEnd.offset, fps)
    );
  }, [runEnd, fps]);

  const rtaFrames = useMemo(() => {
    if (adjustedRunStartFrames === null || adjustedRunEndFrames === null)
      return null;
    return adjustedRunEndFrames - adjustedRunStartFrames;
  }, [adjustedRunStartFrames, adjustedRunEndFrames]);

  const lrtFrames = useMemo(() => {
    if (rtaFrames === null) return null;
    return rtaFrames - totalLoadFrames;
  }, [rtaFrames, totalLoadFrames]);

  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  useEffect(() => {
    if (videoId && (window as any).YT && playerRef.current) {
      setPlayer(
        new (window as any).YT.Player(playerRef.current, {
          width: "100%",
          videoId,
          playerVars: { controls: 1 },
        })
      );
    }
  }, [videoId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <Header mode={mode} setMode={setMode} />

        <VideoInput
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          urlError={urlError}
          setUrlError={setUrlError}
          fps={fps}
          setFps={setFps}
          showFpsHelp={showFpsHelp}
          setShowFpsHelp={setShowFpsHelp}
          onLoadVideo={handleLoadVideo}
        />

        <TimingSummary rtaFrames={rtaFrames} lrtFrames={lrtFrames} fps={fps} />

        {videoId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <VideoPlayer
              playerRef={playerRef}
              mode={mode}
              runStart={runStart}
              setRunStart={setRunStart}
              runEnd={runEnd}
              setRunEnd={setRunEnd}
              runTimingOpen={runTimingOpen}
              setRunTimingOpen={setRunTimingOpen}
              onMarkRunStart={markRunStart}
              onMarkRunEnd={markRunEnd}
              onMarkLoadStart={markLoadStart}
              onMarkLoadEnd={markLoadEnd}
            />

            <LoadList
              loads={loads}
              currentLoadIndex={currentLoadIndex}
              mode={mode}
              onAddLoad={addNewLoad}
              onDeleteLoad={deleteLoad}
              onJumpToTime={jumpToTime}
              onSelectLoad={setCurrentLoadIndex}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
