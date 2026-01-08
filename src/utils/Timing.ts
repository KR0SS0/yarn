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
  const parts = timeStr.split(':');
  if (parts[0] === '00') {
    parts.shift();
    if (parts[0] === '00') {
      parts.shift();
    }
  }
  return parts.join(':');
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
    smart: formatSmartTime(fullFormatted)
  };
};