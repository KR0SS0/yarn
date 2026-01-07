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

  const [isAutoLoadSelecting, setIsAutoLoadSelecting] = useState(true);
  const toggleAutoLoadSelectMode = () => setIsAutoLoadSelecting(!isAutoLoadSelecting);
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

  // Calculate adjusted run boundaries
  const adjustedRunStart = useMemo(() => {
    if (runStart.time === null) return null;
    return runStart.time + runStart.offset;
  }, [runStart]);

  const adjustedRunEnd = useMemo(() => {
    if (runEnd.time === null) return null;
    return runEnd.time + runEnd.offset;
  }, [runEnd]);

  // ** Comprehensive validation **
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

    // Check if run end is before run start
    if (adjustedRunStart !== null && adjustedRunEnd !== null) {
      if (adjustedRunEnd <= adjustedRunStart) {
        validationWarnings.push({
          type: "error",
          message: `The run end (${adjustedRunEnd.toFixed(3)}s) cannot be earlier than or equal to the run start (${adjustedRunStart.toFixed(3)}s).`,
          affectedLoads: [],
        });
      }
    }

    const completeLoads = loads
      .map((load, index) => ({ load, index }))
      .filter(({ load }) => load.startTime !== null && load.endTime !== null);

    // Check for invalid durations (0 or negative)
    completeLoads.forEach(({ load, index }) => {
      const duration = load.endTime! - load.startTime!;
      if (duration <= 0) {
        invalidDuration.add(index);
        validationWarnings.push({
          type: "invalid-duration",
          message: `Load #${index + 1} has ${
            duration === 0 ? "zero" : "negative"
          } duration (${duration.toFixed(
            3
          )}s). End time must be after start time.`,
          affectedLoads: [index],
        });
      }
    });

    // Check if loads are outside run boundaries
    if (adjustedRunStart !== null && adjustedRunEnd !== null) {
      completeLoads.forEach(({ load, index }) => {
        const start = load.startTime!;
        const end = load.endTime!;

        const beforeRun = end <= adjustedRunStart;
        const afterRun = start >= adjustedRunEnd;
        const partiallyOutside =
          start < adjustedRunStart || end > adjustedRunEnd;

        if (beforeRun || afterRun || partiallyOutside) {
          outsideRun.add(index);
          let message = "";

          if (beforeRun) {
            message = `Load #${
              index + 1
            } is entirely before the run start (${adjustedRunStart.toFixed(
              3
            )}s).`;
          } else if (afterRun) {
            message = `Load #${
              index + 1
            } is entirely after the run end (${adjustedRunEnd.toFixed(3)}s).`;
          } else if (start < adjustedRunStart) {
            message = `Load #${
              index + 1
            } starts before the run start (${adjustedRunStart.toFixed(3)}s).`;
          } else if (end > adjustedRunEnd) {
            message = `Load #${
              index + 1
            } ends after the run end (${adjustedRunEnd.toFixed(3)}s).`;
          }

          validationWarnings.push({
            type: "outside-run",
            message,
            affectedLoads: [index],
          });
        }
      });
    }

    // Check for overlaps
    for (let i = 0; i < completeLoads.length; i++) {
      for (let j = i + 1; j < completeLoads.length; j++) {
        const load1 = completeLoads[i].load;
        const load2 = completeLoads[j].load;
        const idx1 = completeLoads[i].index;
        const idx2 = completeLoads[j].index;

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

          const existingWarning = validationWarnings.find(
            (w) =>
              w.type === "overlap" &&
              w.affectedLoads.includes(idx1) &&
              w.affectedLoads.includes(idx2)
          );

          if (!existingWarning) {
            validationWarnings.push({
              type: "overlap",
              message: `Load #${idx1 + 1} and Load #${
                idx2 + 1
              } have overlapping time ranges. Please adjust the timestamps.`,
              affectedLoads: [idx1, idx2],
            });
          }
        }
      }
    }

    return {
      overlappingIndices: overlapping,
      invalidDurationIndices: invalidDuration,
      outsideRunIndices: outsideRun,
      warnings: validationWarnings,
    };
  }, [loads, adjustedRunStart, adjustedRunEnd]);

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

  const markLoadStart = () => handleMarkLoad("start");
  const markLoadEnd = () => handleMarkLoad("end");

  const handleMarkLoad = (type: "start" | "end") => {
    if (!ytPlayerRef.current?.getCurrentTime) return;
    const time = ytPlayerRef.current.getCurrentTime();

    // If no loads exist, create one first
    let currentLoads = loads;
    let activeIndex = currentLoadIndex;

    if (loads.length === 0) {
      const newLoad: Load = { id: Date.now(), startTime: null, endTime: null };
      currentLoads = [newLoad];
      activeIndex = 0;
    }

    // Apply the timestamp
    const updated = [...currentLoads];
    updated[activeIndex] = {
      ...updated[activeIndex],
      [type === "start" ? "startTime" : "endTime"]: time,
    };

    // Update state
    setLoads(updated);
    if (loads.length === 0) setCurrentLoadIndex(0);

    // Try to auto-advance if valid
    tryAddNewLoad(updated, activeIndex);
  };

  const tryAddNewLoad = (updatedLoads: Load[], index: number) => {
    if (!isAutoLoadSelecting) return;

    const isValid = isLoadValid(index, updatedLoads);
    if (isValid) {
      // We use a functional update to avoid closure staleness
      const newLoad: Load = { id: Date.now(), startTime: null, endTime: null };
      setLoads([...updatedLoads, newLoad]);
      setCurrentLoadIndex(updatedLoads.length);
    }
  };

  const addNewLoad = () => {
    const newLoad: Load = { id: Date.now(), startTime: null, endTime: null };
    const updated = [...loads, newLoad];
    setLoads(updated);
    setCurrentLoadIndex(updated.length - 1);
    return updated;
  };

  const deleteLoad = (index: number) => {
    const updated = loads.filter((_, i) => i !== index);
    setLoads(updated);
    setCurrentLoadIndex(Math.max(0, updated.length - 1));
  };

const isLoadValid = (index: number, allLoads: Load[]) => {
  const load = allLoads[index];
  if (load.startTime === null || load.endTime === null) return false;

  // Check Duration
  if (load.endTime <= load.startTime) return false;

  // Check Run Boundaries (using the same logic as your useMemo)
  if (
    adjustedRunStart !== null &&
    (load.startTime < adjustedRunStart || load.endTime > adjustedRunEnd!)
  ) {
    return false;
  }

  // Check Overlaps with ALL other loads
  const hasOverlap = allLoads.some((otherLoad, otherIdx) => {
    if (
      index === otherIdx ||
      otherLoad.startTime === null ||
      otherLoad.endTime === null
    )
      return false;
    return (
      load.startTime! < otherLoad.endTime! &&
      load.endTime! > otherLoad.startTime!
    );
  });

  return !hasOverlap;
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

  // Input consumption
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if the user is typing in an input or textarea
      const activeElem = document.activeElement;
      const isTyping =
        activeElem?.tagName === "INPUT" || activeElem?.tagName === "TEXTAREA";

      // Allow Space to work even if focused on a button, but NOT if typing in an input
      if (isTyping) return;

      if (!ytPlayerRef.current) return;

      switch (e.key) {
        case " ": // Space to Toggle Play/Pause
          e.preventDefault(); // Prevent page scroll
          const state = ytPlayerRef.current.getPlayerState();
          if (state === 1) ytPlayerRef.current.pauseVideo();
          else ytPlayerRef.current.playVideo();
          break;

        case "ArrowLeft": // Seek Back 5s
          e.preventDefault();
          ytPlayerRef.current.seekTo(
            ytPlayerRef.current.getCurrentTime() - 5,
            true
          );
          break;

        case "ArrowRight": // Seek Forward 5s
          e.preventDefault();
          ytPlayerRef.current.seekTo(
            ytPlayerRef.current.getCurrentTime() + 5,
            true
          );
          break;

        case ",": // Frame Back (1/FPS)
          ytPlayerRef.current.pauseVideo();
          ytPlayerRef.current.seekTo(
            ytPlayerRef.current.getCurrentTime() - 1 / fps,
            true
          );
          break;

        case ".": // Frame Forward (1/FPS)
          ytPlayerRef.current.pauseVideo();
          ytPlayerRef.current.seekTo(
            ytPlayerRef.current.getCurrentTime() + 1 / fps,
            true
          );
          break;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [fps]); // Re-bind if FPS changes to keep frame stepping accurate

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
              onJumpToTime={(time) => ytPlayerRef.current?.seekTo?.(time, true)}
              currentLoadIndex={currentLoadIndex}
              loads={loads}
              overlappingLoadIndices={overlappingIndices}
              invalidDurationIndices={invalidDurationIndices}
              outsideRunIndices={outsideRunIndices} 
            />

            <LoadList
              loads={loads}
              currentLoadIndex={currentLoadIndex}
              mode={mode}
              overlappingLoadIndices={overlappingIndices}
              invalidDurationIndices={invalidDurationIndices}
              outsideRunIndices={outsideRunIndices}
              onAddLoad={addNewLoad}
              onDeleteLoad={deleteLoad}
              onJumpToTime={jumpToTime}
              onSelectLoad={setCurrentLoadIndex}
              onAutoSelectLoad={toggleAutoLoadSelectMode}
              isAutoLoadSelecting={isAutoLoadSelecting}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
