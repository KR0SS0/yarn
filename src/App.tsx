import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import VideoInput from "./components/VideoInput";
import TimingSummary from "./components/TimingSummary";
import VideoPlayer from "./components/VideoPlayer";
import TimingList from "./components/TimingList";
import ValidationWarnings from "./components/ValidationWarnings";
import { extractVideoId } from "./utils/youtube";
import { getActiveLabel, getVerificationPoints } from "./utils/timing";
import { validateLoad } from "./utils/validation";
import { saveRunToCloud, fetchRunFromCloud } from "./services/runService";
import { useRunManager } from "./hooks/useRunManager";
import { useBackups } from "./hooks/useBackups";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useValidation } from "./hooks/useValidation";
import { useYouTubePlayer } from "./hooks/useYouTubePlayer";
import { useTiming } from "./hooks/useTiming";

const DEFAULT_TEST_VIDEO_ID = "IfFfdSRMpQs";

const App = () => {
  const {
    fps,
    runStart, setRunStart,
    runEnd, setRunEnd,
    loads, setLoads,
    videoUrl, setVideoUrl,
    videoId, setVideoId,
    currentSelectedIndex, setCurrentSelectedIndex,
    verifierSettings, setVerifierSettings,
    isDirty, setIsDirty,
    canExport,
    currentSessionData,
    updateFps,
    addLoad,
    importRun,
    resetRun,
  } = useRunManager();

  const [mode, setMode] = useState<"runner" | "verifier">("runner");
  const [urlError, setUrlError] = useState("");
  const [showFpsHelp, setShowFpsHelp] = useState(false);
  const [isAutoLoadSelecting, setIsAutoLoadSelecting] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [activeOffsetLabel, setActiveOffsetLabel] = useState<string>("");

  const {
    overlappingIndices,
    invalidDurationIndices,
    outsideRunIndices,
    warnings,
    adjustedRunStart,
    adjustedRunEnd,
  } = useValidation({ loads, runStart, runEnd });

  const { timingItems, rtaFrames, lrtFrames, totalLoadFrames } = useTiming({
    loads,
    runStart,
    runEnd,
    fps,
    adjustedRunStart,
    adjustedRunEnd,
  });

  const { ytPlayerRef, isPlaying, playerRefCallback, videoData } =
    useYouTubePlayer({
      videoId,
    });

  const currentAuthor = videoData?.author || "unknown";

  const { backups, createBackup } = useBackups(
    currentSessionData,
    currentAuthor,
    isDirty,
    setIsDirty,
  );

  const updateLabelAutomatically = useCallback(
    (time: number) => {
      const currentItem = timingItems[currentSelectedIndex];
      if (currentItem) {
        const label = getActiveLabel(time, currentItem, fps);
        setActiveOffsetLabel(label);
      }
    },
    [timingItems, currentSelectedIndex, fps],
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
  }, [videoUrl, videoId, setVideoId, setUrlError, ytPlayerRef]);

  const handleMarkTime = useCallback((type: "start" | "end") => {
    const player = ytPlayerRef.current;
    if (!player || typeof player.getCurrentTime !== "function") return;

    const time = player.getCurrentTime();
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
            : load,
        ),
      );
    }

    // Auto-Advance Logic
    const isLastItem = currentSelectedIndex === timingItems.length - 1;
    if (isAutoLoadSelecting && isLastItem) {
      const isCompleting =
        type === "start" ? currentItem.endTime !== null : currentItem.startTime !== null;
      if (isCompleting) {
        const start = type === "start" ? time : currentItem.startTime;
        const end = type === "end" ? time : currentItem.endTime;
        const { hasError } = validateLoad(
          start, end, loads, currentItem.loadIndex ?? -1, adjustedRunStart, adjustedRunEnd,
        );
        if (!hasError) addLoad();
      }
    }
    setIsDirty(true);
  }, [timingItems, currentSelectedIndex, isAutoLoadSelecting, loads, adjustedRunStart, adjustedRunEnd, setRunStart, setRunEnd, setLoads, setIsDirty, addLoad, ytPlayerRef]);

  const handleDeleteItem = useCallback((id: string) => {
    const indexToDelete = timingItems.findIndex((item) => item.id === id);
    if (indexToDelete === -1) return;

    if (indexToDelete === currentSelectedIndex) {
      setCurrentSelectedIndex(Math.max(0, loads.length - 1));
    } else if (indexToDelete < currentSelectedIndex) {
      setCurrentSelectedIndex((prev) => prev - 1);
    }

    setLoads((prev) => prev.filter((l) => l.id.toString() !== id));
    setIsDirty(true);
  }, [timingItems, currentSelectedIndex, loads.length, setCurrentSelectedIndex, setLoads, setIsDirty]);

  const handleJumpToTime = useCallback((time: number, itemId: string) => {
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(time, true);
      ytPlayerRef.current.pauseVideo();
    }

    const itemIndex = timingItems.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1) {
      setCurrentSelectedIndex(itemIndex);
      setActiveOffsetLabel(getActiveLabel(time, timingItems[itemIndex], fps));
    }
  }, [timingItems, fps, setCurrentSelectedIndex, ytPlayerRef]);

  // Logic to jump to specific verification points
  const handleJumpToVerify = useCallback(
    (time: number | null, frameOffset: number, label?: string) => {
      if (time === null || !ytPlayerRef.current) return;

      const targetTime = time + frameOffset / fps;
      ytPlayerRef.current.seekTo(targetTime, true);
      ytPlayerRef.current.pauseVideo();

      if (label) {
        setActiveOffsetLabel(label);
      } else {
        updateLabelAutomatically(targetTime);
      }
    },
    [fps, updateLabelAutomatically, ytPlayerRef],
  );

  const handleCycleVerifier = useCallback(
    (direction: "next" | "prev") => {
      const currentTime = ytPlayerRef.current?.getCurrentTime() || 0;
      const step = direction === "next" ? 1 : -1;
      const threshold = direction === "next" ? 0.001 : -0.001;

      // Current item navigation
      const currentItem = timingItems[currentSelectedIndex];
      if (currentItem) {
        const points = getVerificationPoints(currentItem, verifierSettings);
        const candidates = direction === "next" ? points : [...points].reverse();
        const target = candidates.find(
          (p) => p.time + p.offset / fps > currentTime + threshold,
        );
        if (target) {
          handleJumpToVerify(target.time, target.offset, target.label);
          return;
        }
      }

      // Cross item navigation (skipping empty items)
      let nextIdx = currentSelectedIndex + (direction === "next" ? 1 : -1);

      // Keep looking until we find an item with active points or hit the bounds
      while (nextIdx >= 0 && nextIdx < timingItems.length) {
        const points = getVerificationPoints(timingItems[nextIdx], verifierSettings);
        if (points.length > 0) {
          setCurrentSelectedIndex(nextIdx);
          const p = direction === "next" ? points[0] : points[points.length - 1];
          handleJumpToVerify(p.time, p.offset, p.label);
          return;
        }
        nextIdx += step;
      }
    },
    [timingItems, currentSelectedIndex, verifierSettings, fps, setCurrentSelectedIndex, handleJumpToVerify, ytPlayerRef],
  );

  const handleControlAction = useCallback((
    type: "seek" | "frame" | "togglePause",
    value: number,
  ) => {
    const player = ytPlayerRef.current;
    if (!player) return;

    const currentTime = player.getCurrentTime();
    let newTime = currentTime;

    switch (type) {
      case "seek":
        newTime = currentTime + value;
        player.seekTo(newTime, true);
        break;
      case "frame":
        player.pauseVideo();
        newTime = currentTime + value / fps;
        player.seekTo(newTime, true);
        break;
      case "togglePause": {
        const state = player.getPlayerState();
        state === 1 ? player.pauseVideo() : player.playVideo();
        return;
      }
    }

    updateLabelAutomatically(newTime);
  }, [fps, updateLabelAutomatically, ytPlayerRef]);

  const handleSelectAndVerify = useCallback((id: string) => {
    const itemIndex = timingItems.findIndex((i) => i.id === id);
    if (itemIndex === -1) return;

    setCurrentSelectedIndex(itemIndex);
    const item = timingItems[itemIndex];

    if (mode === "verifier") {
      const points = getVerificationPoints(item, verifierSettings);
      if (points.length > 0) {
        handleJumpToVerify(points[0].time, points[0].offset, points[0].label);
      }
    } else {
      // Runner mode
      if (item.startTime !== null) {
        ytPlayerRef.current?.seekTo(item.startTime, true);
      }
    }
  }, [timingItems, mode, verifierSettings, setCurrentSelectedIndex, handleJumpToVerify, ytPlayerRef]);

  const handleExportToJson = () => {
    // Get non-empty loads
    const validLoads = loads.filter(
      (l) => l.startTime !== null || l.endTime !== null,
    );
    const loadCount = validLoads.length;

    // Get Channel Name (fallback to "Unknown" if not loaded)
    const channelName =
      (ytPlayerRef.current as any)
        ?.getVideoData()
        ?.author?.replace(/\s+/g, "-") || "unknown";

    // Construct Filename
    const fileName = `yarn-[${channelName}]-${videoId}-${loadCount}loads.json`;

    const data = {
      videoId,
      channelName,
      fps,
      runStart,
      runEnd,
      loads: validLoads,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const performReset = useCallback(() => resetRun(createBackup), [resetRun, createBackup]);

  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to clear all data? A backup will be created, but backups do NOT last forever.")) {
      performReset();
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

  // Cloud - Load
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const runId = queryParams.get("run");

    if (runId) {
      const loadCloudData = async () => {
        try {
          const data = await fetchRunFromCloud(runId);
          importRun(data);

          // Clean the URL to avoid re-importing if the user refreshes
          // We want the use the localStorage when refreshed not the url save
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (err) {
          console.error("Failed to load shared run:", err);
        }
      };
      loadCloudData();
    }
  }, [importRun]);

  useKeyboardShortcuts({
    ytPlayerRef,
    fps,
    onCycleVerifier: handleCycleVerifier,
    onControlAction: handleControlAction,
  });

  const handleShare = async () => {
    if (!canExport) return;

    setIsSharing(true);
    try {
      const data = {
        videoId,
        fps,
        runStart,
        runEnd,
        loads,
        summary: { totalLoadFrames, rtaFrames, lrtFrames },
      };

      const id = await saveRunToCloud(data);
      const shareUrl = `${window.location.origin}${window.location.pathname}?run=${id}`;

      await navigator.clipboard.writeText(shareUrl);
      alert(
        "Link copied to clipboard! Anyone with this link can view your timing data.",
      );
    } catch (error) {
      alert("Failed to generate share link. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <Header
          mode={mode}
          setMode={setMode}
          onDownload={handleExportToJson}
          onShare={handleShare}
          isSharing={isSharing}
          backups={backups}
          onManualBackup={createBackup}
          onImport={importRun}
          canExport={canExport}
          onReset={handleResetAll}
        />
        <VideoInput
          mode={mode}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          urlError={urlError}
          setUrlError={setUrlError}
          fps={fps}
          setFps={updateFps}
          showFpsHelp={showFpsHelp}
          setShowFpsHelp={setShowFpsHelp}
          onLoadVideo={handleLoadVideo}
          onReset={performReset}
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
              onJumpToVerify={handleJumpToVerify}
              onCycle={handleCycleVerifier}
              activeOffsetLabel={activeOffsetLabel}
            />

            <TimingList
              items={timingItems}
              currentIndex={currentSelectedIndex}
              mode={mode}
              onJumpToTime={handleJumpToTime}
              onAddLoad={addLoad}
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
