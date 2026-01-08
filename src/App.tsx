import React, { useState, useRef, useEffect, useMemo } from "react";
import Header from "./components/Header";
import VideoInput from "./components/VideoInput";
import TimingSummary from "./components/TimingSummary";
import VideoPlayer from "./components/VideoPlayer";
import TimingList from "./components/TimingList";
import ValidationWarnings from "./components/ValidationWarnings";
import { Load, RunMarker, ValidationWarning, TimingItem } from "./types";
import { extractVideoId } from "./utils/Youtube";
import { secondsToFrames } from "./utils/Timing";
import { validateLoad } from "./utils/Validation";

const DEFAULT_TEST_VIDEO_ID = "IfFfdSRMpQs";

const App = () => {
  const [mode, setMode] = useState<"runner" | "verifier">("runner");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState("");
  const [fps, setFps] = useState<number>(30);
  const [showFpsHelp, setShowFpsHelp] = useState(false);

  const [isAutoLoadSelecting, setIsAutoLoadSelecting] = useState(true);
  const [loads, setLoads] = useState<Load[]>([]);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(0);

  const playerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const [runStart, setRunStart] = useState<RunMarker>({
    time: null,
    offset: 0,
  });
  const [runEnd, setRunEnd] = useState<RunMarker>({ time: null, offset: 0 });

  const timingItems: TimingItem[] = useMemo(() => {
    return [
      {
        id: "full-run",
        type: "run",
        label: "Full Run",
        startTime: runStart.time,
        endTime: runEnd.time,
        isDeletable: false,
      },
      ...loads.map((load, index) => ({
        id: load.id.toString(),
        type: "load" as const,
        label: `Load ${index + 1}`,
        startTime: load.startTime,
        endTime: load.endTime,
        loadIndex: index,
        isDeletable: true,
      })),
    ];
  }, [loads, runStart, runEnd]);

  const canExport = runStart.time !== null && runEnd.time !== null;

  // --- Validation Logic ---
  const adjustedRunStart =
    runStart.time !== null ? runStart.time + runStart.offset : null;
  const adjustedRunEnd =
    runEnd.time !== null ? runEnd.time + runEnd.offset : null;

  const {
    overlappingIndices,
    invalidDurationIndices,
    outsideRunIndices,
    warnings,
  } = useMemo(() => {
    const overlapping = new Set<number>();
    const invalidDuration = new Set<number>();
    const outsideRun = new Set<number>();
    const validationWarnings: ValidationWarning[] = [];

    // Run Logic Validation
    if (
      adjustedRunStart !== null &&
      adjustedRunEnd !== null &&
      adjustedRunEnd <= adjustedRunStart
    ) {
      validationWarnings.push({
        type: "error",
        message: "Run duration must be greater than 0.",
        affectedLoads: [],
      });
    }

    // Load Logic Validation
    loads.forEach((_, index) => {
      const status = validateLoad(
        loads[index].startTime,
        loads[index].endTime,
        loads,
        index,
        adjustedRunStart,
        adjustedRunEnd
      );

      if (status.isOverlapping) overlapping.add(index);
      if (status.isInvalidDuration) invalidDuration.add(index);
      if (status.isOutsideRun) outsideRun.add(index);
    });

    // Generate Global Warning Messages for the Top Bar
    if (overlapping.size > 0) {
      validationWarnings.push({
        type: "overlap",
        message: `Loads ${Array.from(overlapping)
          .map((i) => i + 1)
          .join(", ")} have overlapping timeframes.`,
        affectedLoads: Array.from(overlapping),
      });
    }
    if (invalidDuration.size > 0) {
      validationWarnings.push({
        type: "invalid-duration",
        message: "One or more loads have a negative or zero duration.",
        affectedLoads: Array.from(invalidDuration),
      });
    }
    if (outsideRun.size > 0) {
      validationWarnings.push({
        type: "outside-run",
        message: "Some loads occur before the Run Start or after the Run End.",
        affectedLoads: Array.from(outsideRun),
      });
    }

    return {
      overlappingIndices: overlapping,
      invalidDurationIndices: invalidDuration,
      outsideRunIndices: outsideRun,
      warnings: validationWarnings,
    };
  }, [loads, adjustedRunStart, adjustedRunEnd]);

  // --- Frame Calculations ---
  const totalLoadFrames = useMemo(() => {
    return loads.reduce((sum, load) => {
      if (load.startTime !== null && load.endTime !== null) {
        return (
          sum +
          (secondsToFrames(load.endTime, fps) -
            secondsToFrames(load.startTime, fps))
        );
      }
      return sum;
    }, 0);
  }, [loads, fps]);

  const adjustedRunStartFrames =
    adjustedRunStart !== null ? secondsToFrames(adjustedRunStart, fps) : null;
  const adjustedRunEndFrames =
    adjustedRunEnd !== null ? secondsToFrames(adjustedRunEnd, fps) : null;
  const rtaFrames =
    adjustedRunStartFrames !== null && adjustedRunEndFrames !== null
      ? adjustedRunEndFrames - adjustedRunStartFrames
      : null;
  const lrtFrames = rtaFrames !== null ? rtaFrames - totalLoadFrames : null;

  // --- Handlers ---
  const handleLoadVideo = () => {
    if (!videoUrl.trim()) {
      setVideoId(DEFAULT_TEST_VIDEO_ID);
      setUrlError("");
      return;
    }
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      setUrlError("");
    } else {
      setVideoId(null);
      setUrlError("Invalid YouTube URL");
    }
  };

  const handleMarkTime = (type: "start" | "end") => {
    if (!ytPlayerRef.current?.getCurrentTime) return;
    const time = ytPlayerRef.current.getCurrentTime();
    const currentItem = timingItems[currentSelectedIndex];
    if (!currentItem) return;

    if (currentItem.type === "run") {
      if (type === "start") setRunStart((prev) => ({ ...prev, time }));
      else setRunEnd((prev) => ({ ...prev, time }));
    } else {
      setLoads((prev) =>
        prev.map((load, idx) =>
          idx === currentItem.loadIndex
            ? { ...load, [type === "start" ? "startTime" : "endTime"]: time }
            : load
        )
      );
    }

    // Auto-Advance Logic
    const isLastItem = currentSelectedIndex === timingItems.length - 1;
    if (isAutoLoadSelecting && isLastItem) {
      const isCompleting =
        type === "start"
          ? currentItem.endTime !== null
          : currentItem.startTime !== null;
      if (isCompleting) {
        const start = type === "start" ? time : currentItem.startTime;
        const end = type === "end" ? time : currentItem.endTime;

        const { hasError } = validateLoad(
          start,
          end,
          loads,
          currentItem.loadIndex ?? -1,
          adjustedRunStart,
          adjustedRunEnd
        );
        if (!hasError) handleAddLoad();
      }
    }
  };

  const handleAddLoad = () => {
    const newLoad: Load = { id: Date.now(), startTime: null, endTime: null };
    setLoads((prev) => [...prev, newLoad]);
    setCurrentSelectedIndex(loads.length + 1);
  };

  const handleDeleteItem = (id: string) => {
    setLoads((prev) => prev.filter((l) => l.id.toString() !== id));
    setCurrentSelectedIndex(0);
  };

  const exportToJson = () => {
    const data = {
      videoId,
      fps,
      runStart,
      runEnd,
      loads,
      exportedAt: new Date().toISOString(),
      summary: { totalLoadFrames, rtaFrames, lrtFrames },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `timing-${videoId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleImport = (data: any) => {
    if (data.videoId) {
      setVideoUrl(`https://www.youtube.com/watch?v=${data.videoId}`);
      setTimeout(handleLoadVideo, 100);
    }
    if (data.fps) setFps(data.fps);
    if (data.runStart) setRunStart(data.runStart);
    if (data.runEnd) setRunEnd(data.runEnd);
    if (data.loads) {
      setLoads(data.loads);
      setCurrentSelectedIndex(0);
    }
  };

  // --- Effects ---
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;
      if (!ytPlayerRef.current) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          ytPlayerRef.current.getPlayerState() === 1
            ? ytPlayerRef.current.pauseVideo()
            : ytPlayerRef.current.playVideo();
          break;
        case "ArrowLeft":
          e.preventDefault();
          ytPlayerRef.current.seekTo(
            ytPlayerRef.current.getCurrentTime() - 5,
            true
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          ytPlayerRef.current.seekTo(
            ytPlayerRef.current.getCurrentTime() + 5,
            true
          );
          break;
        case ",":
          ytPlayerRef.current.pauseVideo();
          ytPlayerRef.current.seekTo(
            ytPlayerRef.current.getCurrentTime() - 1 / fps,
            true
          );
          break;
        case ".":
          ytPlayerRef.current.pauseVideo();
          ytPlayerRef.current.seekTo(
            ytPlayerRef.current.getCurrentTime() + 1 / fps,
            true
          );
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fps]);

  useEffect(() => {
    if (!videoId || !(window as any).YT) return;
    if (ytPlayerRef.current?.loadVideoById) {
      ytPlayerRef.current.loadVideoById(videoId);
      return;
    }
    ytPlayerRef.current = new (window as any).YT.Player(playerRef.current, {
      width: "100%",
      videoId,
      playerVars: { controls: 1 },
    });
  }, [videoId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <Header
          mode={mode}
          setMode={setMode}
          onDownload={exportToJson}
          onImport={handleImport}
          canExport={canExport}
        />
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
              currentItem={timingItems[currentSelectedIndex]}
              onMarkTime={handleMarkTime}
              overlappingLoadIndices={overlappingIndices}
              invalidDurationIndices={invalidDurationIndices}
              outsideRunIndices={outsideRunIndices}
            />

            <TimingList
              items={timingItems}
              currentIndex={currentSelectedIndex}
              mode={mode}
              onSelectItem={(id) =>
                setCurrentSelectedIndex(
                  timingItems.findIndex((i) => i.id === id)
                )
              }
              onJumpToTime={(time, itemId) => {
                // Video Actions
                if (ytPlayerRef.current) {
                  ytPlayerRef.current.seekTo(time, true);
                  ytPlayerRef.current.pauseVideo();
                }

                // Selection Logic
                if (itemId === "full-run") {
                  setCurrentSelectedIndex(0);
                } else {
                  const loadIdx = loads.findIndex(
                    (l) => l.id.toString() === itemId
                  );
                  if (loadIdx !== -1) {
                    setCurrentSelectedIndex(loadIdx + 1);
                  }
                }
              }}
              onAddLoad={handleAddLoad}
              onDeleteItem={handleDeleteItem}
              overlappingLoadIndices={overlappingIndices}
              invalidDurationIndices={invalidDurationIndices}
              outsideRunIndices={outsideRunIndices}
              isAutoLoadSelecting={isAutoLoadSelecting}
              onAutoSelectLoad={() =>
                setIsAutoLoadSelecting(!isAutoLoadSelecting)
              }
              fps={fps}
            />
          </div>
        )}
      </div>
    </div>
  );
};;

export default App;
