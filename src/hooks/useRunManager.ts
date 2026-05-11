import { useState, useMemo, useCallback } from "react";
import { Load, RunMarker, RunSession, VerifierSettings } from "../types";
import { usePersistentState } from "./usePersistanceState";

const DEFAULT_RUN_MARKER: RunMarker = { time: null, offset: 0 };

const DEFAULT_VERIFIER_SETTINGS: VerifierSettings = {
  checkBeforeStart: true,
  checkAfterStart: false,
  checkBeforeEnd: true,
  checkAfterEnd: false,
};

export function useRunManager() {
  const [fps, setFps] = usePersistentState<number>("yt_fps", 30);
  const [runStart, setRunStart] = usePersistentState<RunMarker>("yt_run_start", DEFAULT_RUN_MARKER);
  const [runEnd, setRunEnd] = usePersistentState<RunMarker>("yt_run_end", DEFAULT_RUN_MARKER);
  const [loads, setLoads] = usePersistentState<Load[]>("yt_loads", []);
  const [videoUrl, setVideoUrl] = usePersistentState<string>("yt_video_url", "");
  const [videoId, setVideoId] = usePersistentState<string | null>("yt_video_id", null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = usePersistentState<number>("yt_selected_index", 0);
  const [verifierSettings, setVerifierSettings] = usePersistentState<VerifierSettings>("yt_verifier_settings", DEFAULT_VERIFIER_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);

  const canExport = runStart.time !== null && runEnd.time !== null;

  const currentSessionData = useMemo<RunSession>(
    () => ({ videoId, fps, runStart, runEnd, loads, verifierSettings }),
    [videoId, fps, runStart, runEnd, loads, verifierSettings],
  );

  const updateFps = useCallback((newFps: number) => {
    setFps(newFps);
    setIsDirty(true);
  }, [setFps]);

  const addLoad = useCallback(() => {
    const newLoad: Load = { id: Date.now(), startTime: null, endTime: null };
    // loads.length + 1 because timingItems[0] is the run marker, so loads map to indices 1..n
    const nextIndex = loads.length + 1;
    setLoads((prev) => [...prev, newLoad]);
    setCurrentSelectedIndex(nextIndex);
    setIsDirty(true);
  }, [loads.length, setLoads, setCurrentSelectedIndex]);

  const importRun = useCallback((data: Partial<RunSession>) => {
    // Blink the player by clearing videoId first so useYouTubePlayer re-initializes
    setVideoId(null);
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
  }, [setVideoId, setVideoUrl, setFps, setRunStart, setRunEnd, setLoads, setCurrentSelectedIndex]);

  const resetRun = useCallback((beforeReset?: () => void) => {
    beforeReset?.();
    setVideoUrl("");
    setVideoId(null);
    setRunStart(DEFAULT_RUN_MARKER);
    setRunEnd(DEFAULT_RUN_MARKER);
    setLoads([]);
    setCurrentSelectedIndex(0);
    setIsDirty(false);
  }, [setVideoUrl, setVideoId, setRunStart, setRunEnd, setLoads, setCurrentSelectedIndex]);

  return {
    fps, setFps,
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
  };
}
