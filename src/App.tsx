import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Header from "./components/Header";
import VideoInput from "./components/VideoInput";
import TimingSummary from "./components/TimingSummary";
import VideoPlayer from "./components/VideoPlayer";
import TimingList from "./components/TimingList";
import ValidationWarnings from "./components/ValidationWarnings";
import {
  Load,
  RunMarker,
  ValidationWarning,
  TimingItem,
  VerifierSettings,
} from "./types";
import { extractVideoId } from "./utils/youtube";
import { secondsToFrames } from "./utils/timing";
import { validateLoad } from "./utils/validation";
import { usePersistentState } from "./hooks/usePersistanceState";

const DEFAULT_TEST_VIDEO_ID = "IfFfdSRMpQs";

const App = () => {
  // Persistent States
  const [fps, setFps] = usePersistentState<number>("yt_fps", 30);
  const [runStart, setRunStart] = usePersistentState<RunMarker>(
    "yt_run_start",
    {
      time: null,
      offset: 0,
    }
  );
  const [runEnd, setRunEnd] = usePersistentState<RunMarker>("yt_run_end", {
    time: null,
    offset: 0,
  });
  const [loads, setLoads] = usePersistentState<Load[]>("yt_loads", []);
  const [videoUrl, setVideoUrl] = usePersistentState<string>(
    "yt_video_url",
    ""
  );
  const [videoId, setVideoId] = usePersistentState<string | null>(
    "yt_video_id",
    null
  );
  const [currentSelectedIndex, setCurrentSelectedIndex] =
    usePersistentState<number>("yt_selected_index", 0);

  const [verifierSettings, setVerifierSettings] =
    usePersistentState<VerifierSettings>("yt_verifier_settings", {
      checkBeforeStart: true,
      checkAfterStart: false,
      checkBeforeEnd: true,
      checkAfterEnd: false,
    });

  // Non-Persistent States
  const [mode, setMode] = useState<"runner" | "verifier">("runner");
  const [urlError, setUrlError] = useState("");
  const [showFpsHelp, setShowFpsHelp] = useState(false);
  const [isAutoLoadSelecting, setIsAutoLoadSelecting] = useState(true);

  const [activeOffsetLabel, setActiveOffsetLabel] = useState<string>("");

  // ytPlayerRef stores the actual YouTube API instance
  const ytPlayerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
        message:
          "One or more loads occur before the Run Start or after the Run End.",
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

  // Logic to jump to specific verification points
  const jumpToVerify = useCallback(
    (time: number | null, frameOffset: number, label?: string) => {
      if (time === null || !ytPlayerRef.current) return;
      const targetTime = time + frameOffset / fps;
      ytPlayerRef.current.seekTo(targetTime, true);
      ytPlayerRef.current.pauseVideo();

      // Set the label so the UI knows what we are looking at
      if (label) setActiveOffsetLabel(label);
    },
    [fps]
  );

  // --- Handlers ---
  const handleLoadVideo = useCallback(() => {
    const trimmedUrl = videoUrl?.trim();

    // Clear error immediately
    setUrlError("");

    if (!trimmedUrl) {
      setVideoId(DEFAULT_TEST_VIDEO_ID);
      return;
    }

    const id = extractVideoId(trimmedUrl);
    if (id) {
      // If it's the same ID already loaded, just seek to start
      if (id === videoId && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(0);
        return;
      }

      setVideoId(id);
    } else {
      setVideoId(null);
      setUrlError("Invalid YouTube URL");
    }
  }, [videoUrl, videoId, setVideoId, setUrlError]);

  const handleMarkTime = (type: "start" | "end") => {
    const player = ytPlayerRef.current;

    // Log this to see if the player is actually accessible
    console.log("Player Instance:", player);

    if (!player || typeof player.getCurrentTime !== "function") {
      console.warn("YouTube Player is not ready to provide time.");
      return;
    }
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
    // Capture the index from the CURRENT timingItems before any state changes
    const indexToDelete = timingItems.findIndex((item) => item.id === id);
    if (indexToDelete === -1) return;

    // Adjust currentSelectedIndex if necessary
    if (indexToDelete === currentSelectedIndex) {
      const newLastIndex = Math.max(0, loads.length - 1);
      setCurrentSelectedIndex(newLastIndex);
    } else if (indexToDelete < currentSelectedIndex) {
      setCurrentSelectedIndex((prev) => prev - 1);
    }

    setLoads((prev) => prev.filter((l) => l.id.toString() !== id));
  };

  const handleJumpToTime = (time: number, itemId: string) => {
    // Video Actions
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(time, true);
      ytPlayerRef.current.pauseVideo();
    }

    // Selection Logic
    const itemIndex = timingItems.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1) {
      setCurrentSelectedIndex(itemIndex);
    }
  };

  const handleCycleVerifier = useCallback(
    (direction: "next" | "prev") => {
      // Helper to generate a label for the checkpoint
      const getPointLabel = (offset: number, isStart: boolean) => {
        const type = isStart ? "Start" : "End";
        if (offset === -1) return `${type} -1f`;
        if (offset === 1) return `${type} +1f`;
        return `Exact ${type}`;
      };

      const getActivePoints = (item: TimingItem) =>
        [
          {
            time: item.startTime,
            offset: -1,
            active: verifierSettings.checkBeforeStart,
            isStart: true,
          },
          { time: item.startTime, offset: 0, active: true, isStart: true },
          {
            time: item.startTime,
            offset: 1,
            active: verifierSettings.checkAfterStart,
            isStart: true,
          },
          {
            time: item.endTime,
            offset: -1,
            active: verifierSettings.checkBeforeEnd,
            isStart: false,
          },
          { time: item.endTime, offset: 0, active: true, isStart: false },
          {
            time: item.endTime,
            offset: 1,
            active: verifierSettings.checkAfterEnd,
            isStart: false,
          },
        ].filter((p) => p.time !== null && p.active);

      const currentTime = ytPlayerRef.current?.getCurrentTime() || 0;

      // Current item navigation
      const currentItem = timingItems[currentSelectedIndex];
      if (currentItem) {
        const activePoints = getActivePoints(currentItem);

        if (direction === "next") {
          const targetPoint = activePoints.find(
            (p) => p.time! + p.offset / fps > currentTime + 0.001
          );
          if (targetPoint) {
            jumpToVerify(
              targetPoint.time,
              targetPoint.offset,
              getPointLabel(targetPoint.offset, targetPoint.isStart)
            );
            return; // Exit early, we found a point in the current item
          }
        } else {
          const targetPoint = [...activePoints]
            .reverse()
            .find((p) => p.time! + p.offset / fps < currentTime - 0.001);
          if (targetPoint) {
            jumpToVerify(
              targetPoint.time,
              targetPoint.offset,
              getPointLabel(targetPoint.offset, targetPoint.isStart)
            );
            return; // Exit early
          }
        }
      }

      // Cross item navigation (skipping empty items)
      let nextIdx = currentSelectedIndex + (direction === "next" ? 1 : -1);

      // Keep looking until we find an item with active points or hit the bounds
      while (nextIdx >= 0 && nextIdx < timingItems.length) {
        const nextItemPoints = getActivePoints(timingItems[nextIdx]);

        if (nextItemPoints.length > 0) {
          setCurrentSelectedIndex(nextIdx);
          // If going next, grab first point. If going prev, grab last point.
          const p =
            direction === "next"
              ? nextItemPoints[0]
              : nextItemPoints[nextItemPoints.length - 1];
          jumpToVerify(p.time, p.offset, getPointLabel(p.offset, p.isStart));
          return;
        }
        nextIdx += direction === "next" ? 1 : -1;
      }
    },
    [
      timingItems,
      currentSelectedIndex,
      verifierSettings,
      fps,
      setCurrentSelectedIndex,
      jumpToVerify,
    ]
  );

  const handleControlAction = (
    type: "seek" | "frame" | "togglePause",
    value: number
  ) => {
    if (!ytPlayerRef.current) return;

    const currentTime = ytPlayerRef.current.getCurrentTime();

    switch (type) {
      case "seek":
        ytPlayerRef.current.seekTo(currentTime + value, true);
        break;
      case "frame":
        // Move by (1 / fps) * number of frames
        ytPlayerRef.current.pauseVideo();
        ytPlayerRef.current.seekTo(currentTime + value / fps, true);
        break;
      case "togglePause":
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1)
          ytPlayerRef.current.pauseVideo(); // 1 is playing
        else ytPlayerRef.current.playVideo();
        break;
    }
  };

  const handleSelectAndVerify = (id: string) => {
    const itemIndex = timingItems.findIndex((i) => i.id === id);
    if (itemIndex === -1) return;

    setCurrentSelectedIndex(itemIndex);
    const item = timingItems[itemIndex];

    if (mode === "verifier") {
      const activePoints = [
        {
          time: item.startTime,
          offset: -1,
          active: verifierSettings.checkBeforeStart,
          label: "Start -1f",
        },
        { time: item.startTime, offset: 0, active: true, label: "Exact Start" },
        {
          time: item.startTime,
          offset: 1,
          active: verifierSettings.checkAfterStart,
          label: "Start +1f",
        },
        {
          time: item.endTime,
          offset: -1,
          active: verifierSettings.checkBeforeEnd,
          label: "End -1f",
        },
        { time: item.endTime, offset: 0, active: true, label: "Exact End" },
        {
          time: item.endTime,
          offset: 1,
          active: verifierSettings.checkAfterEnd,
          label: "End +1f",
        },
      ].filter((p) => p.time !== null && p.active);

      if (activePoints.length > 0) {
        const firstPoint = activePoints[0];
        jumpToVerify(firstPoint.time, firstPoint.offset, firstPoint.label);
      }
    } else {
      // Runner mode
      if (item.startTime !== null) {
        ytPlayerRef.current?.seekTo(item.startTime, true);
      }
    }
  };

  const handleExportToJson = () => {
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
    // Clear the videoId first to "blink" the component
    setVideoId(null);

    // Use a tiny timeout to let React process the "null" before setting the new one
    setTimeout(() => {
      if (data.videoId) {
        setVideoUrl(`https://www.youtube.com/watch?v=${data.videoId}`);
        setVideoId(data.videoId);
      }
      if (data.fps) setFps(data.fps);
      if (data.runStart) setRunStart(data.runStart);
      if (data.runEnd) setRunEnd(data.runEnd);
      if (data.loads) setLoads(data.loads);
      setCurrentSelectedIndex(0);
    }, 10);
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This cannot be undone."
      )
    ) {
      setVideoUrl("");
      setVideoId(null);
      setRunStart({ time: null, offset: 0 });
      setRunEnd({ time: null, offset: 0 });
      setLoads([]);
      setCurrentSelectedIndex(0);
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (
      document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    )
      return;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log("YouTube API Ready");
    };
  }, []);

  // Inputs / Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input
      const active = document.activeElement;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;
      if (
        !ytPlayerRef.current ||
        typeof ytPlayerRef.current.getCurrentTime !== "function"
      )
        return;

      const player = ytPlayerRef.current;
      const currentTime = player.getCurrentTime();

      switch (e.key.toLowerCase()) {
        case " ": // Spacebar
        case "k":
          e.preventDefault();
          player.getPlayerState() === 1
            ? player.pauseVideo()
            : player.playVideo();
          break;

        // Arrow Keys (Standard 5s)
        case "arrowleft":
          e.preventDefault();
          player.seekTo(currentTime - 5, true);
          break;
        case "arrowright":
          e.preventDefault();
          player.seekTo(currentTime + 5, true);
          break;

        // J, L (Standard YouTube skips)
        case "j": // Back 10s
          e.preventDefault();
          player.seekTo(currentTime - 10, true);
          break;
        case "l": // Forward 10s
          e.preventDefault();
          player.seekTo(currentTime + 10, true);
          break;

        // Frame Stepping
        case ",":
          player.pauseVideo();
          player.seekTo(currentTime - 1 / fps, true);
          break;
        case ".":
          player.pauseVideo();
          player.seekTo(currentTime + 1 / fps, true);
          break;

        // Mute / Unmute
        case "m":
          if (player.isMuted()) {
            player.unMute();
          } else {
            player.mute();
          }
          break;

        // Fullscreen
        case "f":
          const iframe = player.getIframe();
          if (iframe) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              iframe.requestFullscreen?.() ||
                iframe.mozRequestFullScreen?.() ||
                iframe.webkitRequestFullscreen?.() ||
                iframe.msRequestFullscreen?.();
            }
          }
          break;
        case "z":
          e.preventDefault();
          handleCycleVerifier("prev");
          break;
        case "x":
          e.preventDefault();
          handleCycleVerifier("next");
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fps, handleCycleVerifier]);

  // YouTube Player Initialization Logic
  // Using useCallback so it can be used inside the Callback Ref
  const initializeYouTubePlayer = useCallback(
    (element: HTMLDivElement) => {
      const checkAPIAndBuild = () => {
        if (!(window as any).YT || !(window as any).YT.Player) {
          setTimeout(checkAPIAndBuild, 100);
          return;
        }

        // Cleanup existing player to prevent memory leaks or double-renders
        if (
          ytPlayerRef.current &&
          typeof ytPlayerRef.current.destroy === "function"
        ) {
          ytPlayerRef.current.destroy();
        }

        new (window as any).YT.Player(element, {
          width: "100%",
          height: "100%",
          videoId,
          playerVars: {
            controls: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event: any) => {
              ytPlayerRef.current = event.target;
            },
            onStateChange: (event: any) => {
              const playing =
                event.data === (window as any).YT.PlayerState.PLAYING ||
                event.data === (window as any).YT.PlayerState.BUFFERING;
              setIsPlaying(playing);
            },
          },
        });
      };

      checkAPIAndBuild();
    },
    [videoId]
  );

  // Callback Ref: This fires the moment the VideoPlayer's container div enters the DOM
  const playerRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (node !== null && videoId) {
        initializeYouTubePlayer(node);
      }
    },
    [videoId, initializeYouTubePlayer]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <Header
          mode={mode}
          setMode={setMode}
          onDownload={handleExportToJson}
          onImport={handleImport}
          canExport={canExport}
          onReset={handleResetAll}
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
              key={videoId}
              playerRef={playerRefCallback}
              mode={mode}
              currentItem={timingItems[currentSelectedIndex]}
              onMarkTime={handleMarkTime}
              overlappingLoadIndices={overlappingIndices}
              invalidDurationIndices={invalidDurationIndices}
              outsideRunIndices={outsideRunIndices}
              fps={fps}
              onJumpToTime={handleJumpToTime}
              onControlAction={handleControlAction}
              isPlaying={isPlaying}
              verifierSettings={verifierSettings}
              setVerifierSettings={setVerifierSettings}
              jumpToVerify={jumpToVerify}
              onCycle={handleCycleVerifier}
              activeOffsetLabel={activeOffsetLabel}
            />

            <TimingList
              items={timingItems}
              currentIndex={currentSelectedIndex}
              mode={mode}
              onJumpToTime={handleJumpToTime}
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
              onSelectItem={handleSelectAndVerify}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
