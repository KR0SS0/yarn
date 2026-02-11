import { useMemo } from "react";
import { Load, RunMarker, ValidationWarning } from "../types";
import { validateLoad } from "../utils/validation";

interface ValidationProps {
  loads: Load[];
  runStart: RunMarker;
  runEnd: RunMarker;
}

export const useValidation = ({ loads, runStart, runEnd }: ValidationProps) => {
  return useMemo(() => {
    const overlapping = new Set<number>();
    const invalidDuration = new Set<number>();
    const outsideRun = new Set<number>();
    const validationWarnings: ValidationWarning[] = [];

    const adjustedRunStart = runStart.time !== null ? runStart.time + runStart.offset : null;
    const adjustedRunEnd = runEnd.time !== null ? runEnd.time + runEnd.offset : null;

    // Run Logic Validation
    if (
      adjustedRunStart !== null &&
      adjustedRunEnd !== null &&
      adjustedRunEnd <= adjustedRunStart
    ) {
      validationWarnings.push({
        type: "error",
        message: "Run duration must be greater than 0.",
        affectedLoads: [],
      });
    }

    // Load Logic Validation
    loads.forEach((_, index) => {
      const status = validateLoad(
        loads[index].startTime,
        loads[index].endTime,
        loads,
        index,
        adjustedRunStart,
        adjustedRunEnd
      );

      if (status.isOverlapping) overlapping.add(index);
      if (status.isInvalidDuration) invalidDuration.add(index);
      if (status.isOutsideRun) outsideRun.add(index);
    });

    // Generate Global Warning Messages
    if (overlapping.size > 0) {
      validationWarnings.push({
        type: "overlap",
        message: `Loads ${Array.from(overlapping).map((i) => i + 1).join(", ")} have overlapping timeframes.`,
        affectedLoads: Array.from(overlapping),
      });
    }
    if (invalidDuration.size > 0) {
      validationWarnings.push({
        type: "invalid-duration",
        message: "One or more loads have a negative or zero duration.",
        affectedLoads: Array.from(invalidDuration),
      });
    }
    if (outsideRun.size > 0) {
      validationWarnings.push({
        type: "outside-run",
        message: "One or more loads occur before the Run Start or after the Run End.",
        affectedLoads: Array.from(outsideRun),
      });
    }

    return {
      overlappingIndices: overlapping,
      invalidDurationIndices: invalidDuration,
      outsideRunIndices: outsideRun,
      warnings: validationWarnings,
      adjustedRunStart,
      adjustedRunEnd
    };
  }, [loads, runStart, runEnd]);
};