import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import VideoInput from "./components/VideoInput";
import TimingSummary from "./components/TimingSummary";
import VideoPlayer from "./components/VideoPlayer";
import TimingList from "./components/TimingList";
import ValidationWarnings from "./components/ValidationWarnings";
import { TimingItem } from "./types";
import { extractVideoId } from "./utils/youtube";
import { getActiveLabel } from "./utils/timing";
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
            : load,
        ),
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
          adjustedRunEnd,
        );
        if (!hasError) addLoad();
      }
    }
    setIsDirty(true);
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
    setIsDirty(true);
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
      const label = getActiveLabel(time, timingItems[itemIndex], fps);
      setActiveOffsetLabel(label);
    }
  };

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
    [fps, updateLabelAutomatically],
  );

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
            (p) => p.time! + p.offset / fps > currentTime + 0.001,
          );
          if (targetPoint) {
            handleJumpToVerify(
              targetPoint.time,
              targetPoint.offset,
              getPointLabel(targetPoint.offset, targetPoint.isStart),
            );
            return; // Exit early, we found a point in the current item
          }
        } else {
          const targetPoint = [...activePoints]
            .reverse()
            .find((p) => p.time! + p.offset / fps < currentTime - 0.001);
          if (targetPoint) {
            handleJumpToVerify(
              targetPoint.time,
              targetPoint.offset,
              getPointLabel(targetPoint.offset, targetPoint.isStart),
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
          handleJumpToVerify(
            p.time,
            p.offset,
            getPointLabel(p.offset, p.isStart),
          );
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
      handleJumpToVerify,
    ],
  );

  const handleControlAction = (
    type: "seek" | "frame" | "togglePause",
    value: number,
  ) => {
    if (!ytPlayerRef.current) return;

    const player = ytPlayerRef.current;
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
      case "togglePause":
        const state = player.getPlayerState();
        state === 1 ? player.pauseVideo() : player.playVideo();
        return;
    }

    // Automating the label update after the move
    updateLabelAutomatically(newTime);
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
        handleJumpToVerify(
          firstPoint.time,
          firstPoint.offset,
          firstPoint.label,
        );
      }
    } else {
      // Runner mode
      if (item.startTime !== null) {
        ytPlayerRef.current?.seekTo(item.startTime, true);
      }
    }
  };

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

  const handleResetAll = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? A backup will be created, but backups do NOT last forever.",
      )
    ) {
      performReset();
    }
  };

  const performReset = useCallback(() => resetRun(createBackup), [resetRun, createBackup]);

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
  }, []);

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
};;

export default App;
