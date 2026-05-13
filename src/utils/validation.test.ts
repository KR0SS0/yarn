import { validateLoad, getItemValidationStatus } from "./validation";
import { Load, TimingItem } from "../types";

// --- Helpers ---

const makeLoad = (id: number, startTime: number | null, endTime: number | null): Load => ({
  id,
  startTime,
  endTime,
});

const makeTimingItem = (loadIndex: number): TimingItem => ({
  id: String(loadIndex),
  type: "load",
  label: `Load #${loadIndex + 1}`,
  startTime: 10,
  endTime: 20,
  loadIndex,
  isDeletable: true,
});

// --- validateLoad ---

describe("validateLoad", () => {
  const noOtherLoads: Load[] = [];

  it("returns no errors when both times are null", () => {
    const result = validateLoad(null, null, noOtherLoads, 0, null, null);
    expect(result.hasError).toBe(false);
  });

  it("returns no errors for a valid load inside the run", () => {
    const result = validateLoad(10, 20, noOtherLoads, 0, 0, 60);
    expect(result).toEqual({
      isInvalidDuration: false,
      isOutsideRun: false,
      isOverlapping: false,
      hasError: false,
    });
  });

  it("flags invalid duration when end is before start", () => {
    const result = validateLoad(20, 10, noOtherLoads, 0, null, null);
    expect(result.isInvalidDuration).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("flags invalid duration when end equals start", () => {
    const result = validateLoad(10, 10, noOtherLoads, 0, null, null);
    expect(result.isInvalidDuration).toBe(true);
  });

  it("flags outside-run when load starts before run start", () => {
    const result = validateLoad(5, 20, noOtherLoads, 0, 10, 60);
    expect(result.isOutsideRun).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("flags outside-run when load ends after run end", () => {
    const result = validateLoad(10, 70, noOtherLoads, 0, 0, 60);
    expect(result.isOutsideRun).toBe(true);
  });

  it("does not flag outside-run when run bounds are null", () => {
    const result = validateLoad(10, 20, noOtherLoads, 0, null, null);
    expect(result.isOutsideRun).toBe(false);
  });

  it("flags overlapping when loads intersect", () => {
    const others = [makeLoad(0, 5, 15), makeLoad(1, 25, 35)];
    // Load at index 2 overlaps with load 0 (5–15)
    const result = validateLoad(10, 20, others, 2, null, null);
    expect(result.isOverlapping).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("does not flag overlap against itself", () => {
    const loads = [makeLoad(0, 10, 20)];
    const result = validateLoad(10, 20, loads, 0, null, null);
    expect(result.isOverlapping).toBe(false);
  });

  it("does not flag overlap against loads with null times", () => {
    const loads = [makeLoad(0, null, null), makeLoad(1, 10, 20)];
    const result = validateLoad(10, 20, loads, 1, null, null);
    expect(result.isOverlapping).toBe(false);
  });

  it("adjacent loads (touching boundary) are not overlapping", () => {
    const loads = [makeLoad(0, 5, 10)];
    const result = validateLoad(10, 20, loads, 1, null, null);
    expect(result.isOverlapping).toBe(false);
  });
});

// --- getItemValidationStatus ---

describe("getItemValidationStatus", () => {
  const runItem: TimingItem = {
    id: "run",
    type: "run",
    label: "Full Run",
    startTime: 0,
    endTime: 100,
    isDeletable: false,
  };

  it("always returns no errors for run items", () => {
    const sets = {
      overlapping: new Set([0]),
      invalidDuration: new Set([0]),
      outsideRun: new Set([0]),
    };
    const result = getItemValidationStatus(runItem, sets.overlapping, sets.invalidDuration, sets.outsideRun);
    expect(result.hasError).toBe(false);
  });

  it("returns no errors when sets are empty", () => {
    const result = getItemValidationStatus(makeTimingItem(0), new Set(), new Set(), new Set());
    expect(result).toEqual({
      isOverlapping: false,
      isInvalidDuration: false,
      isOutsideRun: false,
      hasError: false,
    });
  });

  it("flags overlapping from set", () => {
    const result = getItemValidationStatus(makeTimingItem(1), new Set([1]), new Set(), new Set());
    expect(result.isOverlapping).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("flags invalid duration from set", () => {
    const result = getItemValidationStatus(makeTimingItem(2), new Set(), new Set([2]), new Set());
    expect(result.isInvalidDuration).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("flags outside-run from set", () => {
    const result = getItemValidationStatus(makeTimingItem(3), new Set(), new Set(), new Set([3]));
    expect(result.isOutsideRun).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("does not flag item at different index", () => {
    const result = getItemValidationStatus(makeTimingItem(0), new Set([1, 2]), new Set([3]), new Set([4]));
    expect(result.hasError).toBe(false);
  });
});
