import { TimingItem, VerificationPoint, VerifierSettings } from "../types";

/*
 * Convert seconds to frames using a fixed FPS.
 * Rounds to the nearest frame.
 */
export const secondsToFrames = (seconds: number, fps: number): number => {
  return Math.round(seconds * fps);
};

/**
 * Strips leading 00: segments from a time string.
 * Example: 00:00:05.200 -> 05.200
 * Example: 00:01:05.200 -> 01:05.200
 */
export const formatSmartTime = (timeStr: string): string => {
  const parts = timeStr.split(":");
  if (parts[0] === "00") {
    parts.shift();
    if (parts[0] === "00") {
      parts.shift();
    }
  }
  return parts.join(":");
};

/**
 * Convert frames to a formatted HH:MM:SS.mmm string and a smart version.
 */
export const framesToHMSMs = (frames: number, fps: number) => {
  const totalMs = Math.round((frames / fps) * 1000);

  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const milliseconds = totalMs % 1000;

  const fullFormatted =
    `${hours.toString().padStart(2, "0")}:` +
    `${minutes.toString().padStart(2, "0")}:` +
    `${seconds.toString().padStart(2, "0")}.` +
    `${milliseconds.toString().padStart(3, "0")}`;

  return {
    frames,
    formatted: fullFormatted,
    smart: formatSmartTime(fullFormatted),
  };
};
  
export const getVerificationPoints = (
  item: TimingItem,
  settings: VerifierSettings,
): VerificationPoint[] => {
  const makeLabel = (offset: number, isStart: boolean): string => {
    const side = isStart ? "Start" : "End";
    if (offset === -1) return `${side} -1f`;
    if (offset === 1) return `${side} +1f`;
    return `Exact ${side}`;
  };

  return [
    { time: item.startTime, offset: -1, active: settings.checkBeforeStart, isStart: true },
    { time: item.startTime, offset:  0, active: true,                       isStart: true },
    { time: item.startTime, offset:  1, active: settings.checkAfterStart,   isStart: true },
    { time: item.endTime,   offset: -1, active: settings.checkBeforeEnd,    isStart: false },
    { time: item.endTime,   offset:  0, active: true,                       isStart: false },
    { time: item.endTime,   offset:  1, active: settings.checkAfterEnd,     isStart: false },
  ]
    .filter((p): p is typeof p & { time: number } => p.time !== null && p.active)
    .map((p) => ({ time: p.time, offset: p.offset, isStart: p.isStart, label: makeLabel(p.offset, p.isStart) }));
};

export const getActiveLabel = (
  currentTime: number,
  item: TimingItem,
  fps: number,
): string => {
  const checkPoint = (targetTime: number | null, label: string) => {
    if (targetTime === null) return null;
    const diffFrames = Math.round((currentTime - targetTime) * fps);

    if (diffFrames === 0) return `Exact ${label}`;
    if (diffFrames === -1) return `${label} -1f`;
    if (diffFrames === 1) return `${label} +1f`;
    return null;
  };

  return (
    checkPoint(item.startTime, "Start") || checkPoint(item.endTime, "End") || ""
  );
};