export interface Load {
  id: number;
  startTime: number | null;
  endTime: number | null;
}

export interface RunMarker {
  time: number | null;
  offset: number;
}

export interface ValidationWarning {
  type: "overlap" | "invalid-duration" | "outside-run" | "error";
  message: string;
  affectedLoads: number[];
}