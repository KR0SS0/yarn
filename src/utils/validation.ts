import { Load, TimingItem, ValidationStatus } from "../types";

export const validateLoad = (
  start: number | null,
  end: number | null,
  allLoads: Load[],
  currentIndex: number,
  runStart: number | null,
  runEnd: number | null
): ValidationStatus => {
  if (start === null || end === null) {
    return { isInvalidDuration: false, isOutsideRun: false, isOverlapping: false, hasError: false };
  }

  const isInvalidDuration = end <= start;
  let isOutsideRun = false;
  if (runStart !== null && runEnd !== null) {
    isOutsideRun = start < runStart || end > runEnd;
  }

  const isOverlapping = allLoads.some((l, idx) => {
    if (idx === currentIndex || l.startTime === null || l.endTime === null) return false;
    return start < l.endTime && end > l.startTime;
  });

  return {
    isInvalidDuration,
    isOutsideRun,
    isOverlapping,
    hasError: isInvalidDuration || isOutsideRun || isOverlapping,
  };
};

export const getItemValidationStatus = (
  item: TimingItem,
  overlapping: Set<number>,
  invalidDuration: Set<number>,
  outsideRun: Set<number>
): ValidationStatus => {
  if (item.type === "run" || item.loadIndex === undefined) {
    return { isOverlapping: false, isInvalidDuration: false, isOutsideRun: false, hasError: false };
  }

  const idx = item.loadIndex;
  const isOverlapping = overlapping.has(idx);
  const isInvalidDuration = invalidDuration.has(idx);
  const isOutsideRun = outsideRun.has(idx);

  return {
    isOverlapping,
    isInvalidDuration,
    isOutsideRun,
    hasError: isOverlapping || isInvalidDuration || isOutsideRun,
  };
};