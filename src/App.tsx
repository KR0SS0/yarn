import React, { useState, useRef, useEffect, useMemo } from "react";
import Header from "./components/Header";
import VideoInput from "./components/VideoInput";
import TimingSummary from "./components/TimingSummary";
import VideoPlayer from "./components/VideoPlayer";
import LoadList from "./components/LoadList";
import { Load, RunMarker } from "./types";
import { extractVideoId } from "./utils/youtube";

const App = () => {
  const [mode, setMode] = useState<"runner" | "verifier">("runner");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [urlError, setUrlError] = useState("");
  const [fps, setFps] = useState<number>(30);
  const [showFpsHelp, setShowFpsHelp] = useState<boolean>(false);

  const [loads, setLoads] = useState<Load[]>([]);
  const [currentLoadIndex, setCurrentLoadIndex] = useState(0);
  const [player, setPlayer] = useState<any>(null);

  const [runStart, setRunStart] = useState<RunMarker>({
    time: null,
    offset: 0,
  });
  const [runEnd, setRunEnd] = useState<RunMarker>({ time: null, offset: 0 });
  const [runTimingOpen, setRunTimingOpen] = useState(true);

  const playerRef = useRef<HTMLDivElement | null>(null);

  const handleLoadVideo = () => {
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      setUrlError("");
      if (loads.length === 0) {
        setLoads([{ id: Date.now(), startTime: null, endTime: null }]);
      }
    } else {
      setVideoId("");
      setUrlError("Invalid YouTube URL");
    }
  };

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

  const deleteLoad = (index: number) => {
    const newLoads = loads.filter((_, i) => i !== index);
    setLoads(newLoads);
    if (currentLoadIndex >= newLoads.length && newLoads.length > 0) {
      setCurrentLoadIndex(newLoads.length - 1);
    } else if (newLoads.length === 0) {
      setCurrentLoadIndex(0);
    }
  };

  const jumpToTime = (time: number, index: number) => {
    if (player && player.seekTo) {
      player.seekTo(time, true);
      setCurrentLoadIndex(index);
    }
  };

  const markRunStart = () => {
    if (player && player.getCurrentTime) {
      setRunStart({
        ...runStart,
        time: player.getCurrentTime(),
      });
    }
  };

  const markRunEnd = () => {
    if (player && player.getCurrentTime) {
      setRunEnd({
        ...runEnd,
        time: player.getCurrentTime(),
      });
    }
  };

  const totalLoadTime = useMemo(() => {
    return loads.reduce((sum, load) => {
      if (load.startTime !== null && load.endTime !== null) {
        return sum + (load.endTime - load.startTime);
      }
      return sum;
    }, 0);
  }, [loads]);

  const adjustedRunStart = useMemo(() => {
    if (runStart.time === null) return null;
    return runStart.time + runStart.offset;
  }, [runStart]);

  const adjustedRunEnd = useMemo(() => {
    if (runEnd.time === null) return null;
    return runEnd.time + runEnd.offset;
  }, [runEnd]);

  const rtaTime = useMemo(() => {
    if (adjustedRunStart === null || adjustedRunEnd === null) return null;
    return adjustedRunEnd - adjustedRunStart;
  }, [adjustedRunStart, adjustedRunEnd]);

  const lrtTime = useMemo(() => {
    if (rtaTime === null) return null;
    return rtaTime - totalLoadTime;
  }, [rtaTime, totalLoadTime]);

  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  useEffect(() => {
    if (videoId && (window as any).YT && playerRef.current) {
      const newPlayer = new (window as any).YT.Player(playerRef.current, {
        height: "100%",
        width: "100%",
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

        <TimingSummary rtaTime={rtaTime} lrtTime={lrtTime} />

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
