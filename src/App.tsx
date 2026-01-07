import React, { useState, useRef, useEffect, useMemo } from "react";
import Header from "./components/Header";
import VideoInput from "./components/VideoInput";
import TimingSummary from "./components/TimingSummary";
import VideoPlayer from "./components/VideoPlayer";
import LoadList from "./components/LoadList";
import ValidationWarnings from "./components/ValidationWarnings";
import { Load, RunMarker, ValidationWarning } from "./types";
import { extractVideoId } from "./utils/Youtube";
import { secondsToFrames } from "./utils/CalculateTime";

const DEFAULT_TEST_VIDEO_ID = "IfFfdSRMpQs";

const App = () => {
  const [mode, setMode] = useState<"runner" | "verifier">("runner");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState("");
  const [fps, setFps] = useState<number>(30);
  const [showFpsHelp, setShowFpsHelp] = useState(false);

  const [loads, setLoads] = useState<Load[]>([]);
  const [currentLoadIndex, setCurrentLoadIndex] = useState(0);

  const playerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const [runStart, setRunStart] = useState<RunMarker>({
    time: null,
    offset: 0,
  });

  const [runEnd, setRunEnd] = useState<RunMarker>({
    time: null,
    offset: 0,
  });

  const [runTimingOpen, setRunTimingOpen] = useState(true);

  // Detect overlapping loads
  const { overlappingIndices, warnings } = useMemo(() => {
    const overlapping = new Set<number>();
    const validationWarnings: ValidationWarning[] = [];

    // Only check complete loads
    const completeLoads = loads
      .map((load, index) => ({ load, index }))
      .filter(({ load }) => load.startTime !== null && load.endTime !== null);

    for (let i = 0; i < completeLoads.length; i++) {
      for (let j = i + 1; j < completeLoads.length; j++) {
        const load1 = completeLoads[i].load;
        const load2 = completeLoads[j].load;
        const idx1 = completeLoads[i].index;
        const idx2 = completeLoads[j].index;

        // Check if ranges overlap
        const start1 = load1.startTime!;
        const end1 = load1.endTime!;
        const start2 = load2.startTime!;
        const end2 = load2.endTime!;

        const hasOverlap =
          (start1 <= start2 && end1 > start2) ||
          (start2 <= start1 && end2 > start1);

        if (hasOverlap) {
          overlapping.add(idx1);
          overlapping.add(idx2);

          // Add warning if not already added for this pair
          const existingWarning = validationWarnings.find(
            (w) =>
              w.affectedLoads.includes(idx1) && w.affectedLoads.includes(idx2)
          );

          if (!existingWarning) {
            validationWarnings.push({
              type: "overlap",
              message: `Load #${idx1 + 1} and Load #${idx2 + 1} have overlapping time ranges. Please adjust the timestamps.`,
              affectedLoads: [idx1, idx2],
            });
          }
        }
      }
    }

    return { overlappingIndices: overlapping, warnings: validationWarnings };
  }, [loads]);

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
    if (!videoUrl.trim()) {
      setVideoId(DEFAULT_TEST_VIDEO_ID);
      setUrlError("");
      return;
    }

    const id = extractVideoId(videoUrl);

    if (!id) {
      setVideoId(null);
      setUrlError("Invalid YouTube URL");
      return;
    }

    setVideoId(id);
    setUrlError("");
  };

  const markLoadStart = () => {
    if (!ytPlayerRef.current?.getCurrentTime) return;
    const time = ytPlayerRef.current.getCurrentTime();
    const updated = [...loads];
    updated[currentLoadIndex].startTime = time;
    setLoads(updated);
  };

  const markLoadEnd = () => {
    if (!ytPlayerRef.current?.getCurrentTime) return;
    const time = ytPlayerRef.current.getCurrentTime();
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
    ytPlayerRef.current?.seekTo?.(time, true);
    setCurrentLoadIndex(index);
  };

  const markRunStart = () => {
    if (!ytPlayerRef.current?.getCurrentTime) return;
    setRunStart({ ...runStart, time: ytPlayerRef.current.getCurrentTime() });
  };

  const markRunEnd = () => {
    if (!ytPlayerRef.current?.getCurrentTime) return;
    setRunEnd({ ...runEnd, time: ytPlayerRef.current.getCurrentTime() });
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
    if (!videoId || !(window as any).YT) return;

    if (ytPlayerRef.current?.loadVideoById) {
      ytPlayerRef.current.loadVideoById(videoId);
      return;
    }

    if (!playerRef.current) return;

    ytPlayerRef.current = new (window as any).YT.Player(playerRef.current, {
      width: "100%",
      videoId,
      playerVars: {
        controls: 1,
      },
    });

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
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

        <ValidationWarnings warnings={warnings} />

        {videoId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <VideoPlayer
              playerRef={playerRef}
              mode={mode}
              fps={fps}
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
              overlappingLoadIndices={overlappingIndices}
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