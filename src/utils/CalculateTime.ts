/*
 * Convert seconds to frames using a fixed FPS.
 * Rounds to the nearest frame.
 */
export const secondsToFrames = (seconds: number, fps: number): number => {
  return Math.round(seconds * fps);
};

// Convert frames to a formatted HH:MM:SS.mmm string.

export const framesToHMSMs = (frames: number, fps: number) => {
  const totalMs = Math.round((frames / fps) * 1000);

  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const milliseconds = totalMs % 1000;

  return {
    frames,
    formatted:
      `${hours.toString().padStart(2, "0")}:` +
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}.` +
      `${milliseconds.toString().padStart(3, "0")}`,
  };
};
