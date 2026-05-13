import { secondsToFrames, formatSmartTime, framesToHMSMs, getVerificationPoints, getActiveLabel } from "./timing";
import { TimingItem, VerifierSettings } from "../types";

// --- Helpers ---

const makeLoad = (startTime: number | null, endTime: number | null): TimingItem => ({
  id: "1",
  type: "load",
  label: "Load #1",
  startTime,
  endTime,
  loadIndex: 0,
  isDeletable: true,
});

const allChecksOn: VerifierSettings = {
  checkBeforeStart: true,
  checkAfterStart: true,
  checkBeforeEnd: true,
  checkAfterEnd: true,
};

const allChecksOff: VerifierSettings = {
  checkBeforeStart: false,
  checkAfterStart: false,
  checkBeforeEnd: false,
  checkAfterEnd: false,
};

// --- secondsToFrames ---

describe("secondsToFrames", () => {
  it("converts whole seconds", () => {
    expect(secondsToFrames(1, 30)).toBe(30);
    expect(secondsToFrames(60, 30)).toBe(1800);
  });

  it("rounds to nearest frame", () => {
    expect(secondsToFrames(1 / 3, 30)).toBe(10);
    expect(secondsToFrames(0.5, 30)).toBe(15);
  });

  it("returns 0 for 0 seconds", () => {
    expect(secondsToFrames(0, 30)).toBe(0);
  });

  it("works with 60fps", () => {
    expect(secondsToFrames(1, 60)).toBe(60);
  });
});

// --- formatSmartTime ---

describe("formatSmartTime", () => {
  it("strips leading hours and minutes when both are zero", () => {
    expect(formatSmartTime("00:00:05.200")).toBe("05.200");
  });

  it("strips leading hours only when minutes are non-zero", () => {
    expect(formatSmartTime("00:01:05.200")).toBe("01:05.200");
  });

  it("keeps full string when hours are non-zero", () => {
    expect(formatSmartTime("01:05:30.000")).toBe("01:05:30.000");
  });

  it("handles zero time", () => {
    expect(formatSmartTime("00:00:00.000")).toBe("00.000");
  });
});

// --- framesToHMSMs ---

describe("framesToHMSMs", () => {
  it("returns zero time for 0 frames", () => {
    const result = framesToHMSMs(0, 30);
    expect(result.formatted).toBe("00:00:00.000");
    expect(result.smart).toBe("00.000");
    expect(result.frames).toBe(0);
  });

  it("converts frames to seconds correctly", () => {
    const result = framesToHMSMs(30, 30);
    expect(result.formatted).toBe("00:00:01.000");
    expect(result.smart).toBe("01.000");
  });

  it("converts frames to minutes", () => {
    const result = framesToHMSMs(1800, 30);
    expect(result.formatted).toBe("00:01:00.000");
    expect(result.smart).toBe("01:00.000");
  });

  it("converts frames to hours", () => {
    const result = framesToHMSMs(108000, 30);
    expect(result.formatted).toBe("01:00:00.000");
    expect(result.smart).toBe("01:00:00.000");
  });

  it("preserves the original frame count", () => {
    expect(framesToHMSMs(42, 30).frames).toBe(42);
  });

  it("works with 60fps", () => {
    const result = framesToHMSMs(60, 60);
    expect(result.formatted).toBe("00:00:01.000");
  });
});

// --- getVerificationPoints ---

describe("getVerificationPoints", () => {
  it("returns 6 points when all checks are enabled", () => {
    const item = makeLoad(10, 20);
    const points = getVerificationPoints(item, allChecksOn);
    expect(points).toHaveLength(6);
  });

  it("returns only exact start and end when all optional checks are off", () => {
    const item = makeLoad(10, 20);
    const points = getVerificationPoints(item, allChecksOff);
    expect(points).toHaveLength(2);
    expect(points.every(p => p.offset === 0)).toBe(true);
  });

  it("excludes start points when startTime is null", () => {
    const item = makeLoad(null, 20);
    const points = getVerificationPoints(item, allChecksOn);
    expect(points.every(p => !p.isStart)).toBe(true);
  });

  it("excludes end points when endTime is null", () => {
    const item = makeLoad(10, null);
    const points = getVerificationPoints(item, allChecksOn);
    expect(points.every(p => p.isStart)).toBe(true);
  });

  it("returns empty array when both times are null", () => {
    const item = makeLoad(null, null);
    expect(getVerificationPoints(item, allChecksOn)).toHaveLength(0);
  });

  it("generates correct labels", () => {
    const item = makeLoad(10, 20);
    const points = getVerificationPoints(item, allChecksOn);
    const labels = points.map(p => p.label);
    expect(labels).toEqual(["Start -1f", "Exact Start", "Start +1f", "End -1f", "Exact End", "End +1f"]);
  });

  it("attaches correct times to each point", () => {
    const item = makeLoad(10, 20);
    const points = getVerificationPoints(item, allChecksOn);
    points.filter(p => p.isStart).forEach(p => expect(p.time).toBe(10));
    points.filter(p => !p.isStart).forEach(p => expect(p.time).toBe(20));
  });
});

// --- getActiveLabel ---

describe("getActiveLabel", () => {
  const item = makeLoad(10, 20);
  const fps = 30;

  it("returns 'Exact Start' when exactly on startTime", () => {
    expect(getActiveLabel(10, item, fps)).toBe("Exact Start");
  });

  it("returns 'Start -1f' when one frame before startTime", () => {
    expect(getActiveLabel(10 - 1 / fps, item, fps)).toBe("Start -1f");
  });

  it("returns 'Start +1f' when one frame after startTime", () => {
    expect(getActiveLabel(10 + 1 / fps, item, fps)).toBe("Start +1f");
  });

  it("returns 'Exact End' when exactly on endTime", () => {
    expect(getActiveLabel(20, item, fps)).toBe("Exact End");
  });

  it("returns 'End -1f' when one frame before endTime", () => {
    expect(getActiveLabel(20 - 1 / fps, item, fps)).toBe("End -1f");
  });

  it("returns empty string when not near any marker", () => {
    expect(getActiveLabel(15, item, fps)).toBe("");
  });

  it("returns empty string when item has no times", () => {
    expect(getActiveLabel(10, makeLoad(null, null), fps)).toBe("");
  });
});
