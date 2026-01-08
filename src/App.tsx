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
import { Load, RunMarker, ValidationWarning, TimingItem } from "./types";
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

  // Non-Persistent States
  const [mode, setMode] = useState<"runner" | "verifier">("runner");
  const [urlError, setUrlError] = useState("");
  const [showFpsHelp, setShowFpsHelp] = useState(false);
  const [isAutoLoadSelecting, setIsAutoLoadSelecting] = useState(true);
  const playerRef = useRef<HTMLDivElement | null>(null);
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

  // --- Handlers ---
  const handleLoadVideo = useCallback(() => {
    const trimmedUrl = videoUrl?.trim();
    if (!trimmedUrl) {
      setVideoId(DEFAULT_TEST_VIDEO_ID);
      setUrlError("");
      return;
    }

    const id = extractVideoId(trimmedUrl);
    if (id) {
      setVideoId(id);
      setUrlError("");
    } else {
      setVideoId(null);
      setUrlError("Invalid YouTube URL");
    }
  }, [videoUrl, setVideoId, setUrlError]);

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
    setLoads((prev) => prev.filter((l) => l.id.toString() !== id));
    setCurrentSelectedIndex(0);
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

    // Define the global callback so we can trigger a re-render when the API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      // This empty function just forces the component to know YT is now available
      // because we have videoId in the dependency array of the player effect.
      console.log("YouTube API Ready");
    };
  }, []);

  // Automatically trigger the video load if we restored a URL from storage
  useEffect(() => {
    if (videoUrl && !videoId) {
      handleLoadVideo();
    }
  }, [videoUrl, videoId, handleLoadVideo]);

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
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fps]);

  // YouTube Player
  useEffect(() => {
    if (!videoId) return;

    const initializePlayer = () => {
      // Check if YT API is loaded
      if (!(window as any).YT || !(window as any).YT.Player) {
        setTimeout(initializePlayer, 100);
        return;
      }

      // If a player already exists and is working, just swap the video
      if (
        ytPlayerRef.current &&
        typeof ytPlayerRef.current.loadVideoById === "function"
      ) {
        try {
          ytPlayerRef.current.loadVideoById(videoId);
          return;
        } catch (e) {
          console.warn("Existing player failed to load new ID, recreating...");
        }
      }

      // Create a fresh player instance
      new (window as any).YT.Player(playerRef.current, {
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

    initializePlayer();
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
              playerRef={playerRef}
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
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
