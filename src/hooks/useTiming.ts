import { useMemo } from "react";
import { Load, RunMarker, TimingItem } from "../types";
import { secondsToFrames } from "../utils/timing";

interface UseTimingProps {
  loads: Load[];
  runStart: RunMarker;
  runEnd: RunMarker;
  fps: number;
  adjustedRunStart: number | null;
  adjustedRunEnd: number | null;
}

export const useTiming = ({
  loads,
  runStart,
  runEnd,
  fps,
  adjustedRunStart,
  adjustedRunEnd,
}: UseTimingProps) => {
  // Create the list that shows in the UI
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

  // Calculate total amount of frames for all loads
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

  // Calculate RTA (Real Time Attack) and LRT (Load Removed Time)
  const stats = useMemo(() => {
    const startFrames =
      adjustedRunStart !== null ? secondsToFrames(adjustedRunStart, fps) : null;
    const endFrames =
      adjustedRunEnd !== null ? secondsToFrames(adjustedRunEnd, fps) : null;

    const rtaFrames =
      startFrames !== null && endFrames !== null
        ? endFrames - startFrames
        : null;

    const lrtFrames = rtaFrames !== null ? rtaFrames - totalLoadFrames : null;

    return {
      rtaFrames,
      lrtFrames,
      totalLoadFrames,
    };
  }, [adjustedRunStart, adjustedRunEnd, totalLoadFrames, fps]);

  return {
    timingItems,
    ...stats,
  };
};
